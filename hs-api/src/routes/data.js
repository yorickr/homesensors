import express from 'express';
import jwt from 'jsonwebtoken';
import moment from 'moment';

// util
import f from '../util/format.js';
import db from '../util/database.js';
import encryption from '../util/encryption.js';

// middleware
import auth from '../middleware/auth.js';

const data = express.Router();

data.use(auth);

data.get('/temperature', (req, res) => {
    res.json(f.formatResponse(true, { temperature: 25.2 }));
});

data.get('/light', (req, res) => {
    res.json(f.formatResponse(true, {light: 25.1}));
});

// get all data types for a sensor
data.get('/measurement/:sensorId/:fromTime/:toTime/:dataType?', (req, res) => {
    const {sensorId, fromTime, toTime, dataType} = req.params;
    const startDateTime = moment(fromTime);
    const endDateTime = moment(toTime);
    console.log('I received the following objects');
    var query;
    if (dataType) {
        query = db.format('SELECT * FROM measurements WHERE insertTime > ? AND insertTime < ? AND sensor_id = ? AND data_kind = ? ORDER BY insertTime ASC', [startDateTime.format(), endDateTime.format(), sensorId, dataType]);
        console.log(query);
    } else {
        query = db.format('SELECT * FROM measurements WHERE insertTime > ? AND insertTime < ? AND sensor_id = ? ORDER BY insertTime ASC', [startDateTime.format(), endDateTime.format(), sensorId]);
        console.log(query);
    }

    db.execute(query)
        .then((response) => {
            const results = response.results.map((row) => {
                row.insertTime = moment(row.insertTime).local().format(); // correct for UTC that sql returns.
                return row;
            });
            res.json(f.formatResponse(true, results));
        })
        .catch((error) => {
            res.json(f.formatResponse(false));
        });
});

// get the available data types in db, e.g. temperature, light.
data.get('/types/:sensorId', (req, res) => {
    const {sensorId} = req.params;
    const query = db.format('SELECT data_kind FROM measurements WHERE sensor_id = ? GROUP BY data_kind', [sensorId]);
    db.execute(query)
        .then((response) => {
            const results = response.results.reduce((prev, nxt) => {
                return prev.concat(nxt['data_kind']);
            }, []);
            res.json(f.formatResponse(true, results));
        })
        .catch((error) => {
            console.log(error);
            res.json(f.formatResponse(false));
        });
});

data.post('/measurement', (req, res) => {
    const body = req.body || null;
    if (body && body.measurements && body.measurements.length > 0) {
        // const query = 'INSERT INTO measurements (temperature, light) VALUES ?';
        // group temperatures, light values.
        const groupByKind = (kind) => {
            // const value = body.measurements.map((measurement) => {
            //     return measurement[kind];
            // });
            const value = body.measurements.reduce((sum, value) => {
                return sum + value[kind];
            }, 0);
            const averageValue = value / body.measurements.length;
            const rounded = averageValue.toFixed(3); // round to 3 decimals.
            const query = db.format('INSERT INTO measurements (value, data_kind, sensor_id) VALUES (?, ?, ?)', [rounded, kind, body.sensorId]);
            console.log(query);
            return db.execute(query);
        };

        const promises = Object.keys(body.measurements[0]).map((dataKind) => {
            return groupByKind(dataKind);
        });

        Promise.all(promises)
            .then((response) => {
                console.log('Data succesfully inserted.');
                res.json(f.formatResponse(true));
            })
            .catch((error) => {
                console.log(error);
                console.log('Something went wrong inserting data.');
                res.json(f.formatResponse(false, 'Something went wrong inserting data'));
            });
    } else {
        res.json(f.formatResponse(false, 'Insufficient data provided'));
    }
});


export default data;
