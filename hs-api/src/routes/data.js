import express from 'express';
import jwt from 'jsonwebtoken';

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

data.get('/measurement', (req, res) => {
    const query = 'SELECT * FROM measurements LIMIT 50';
    db.execute(query)
        .then((response) => {
            res.json(f.formatResponse(true, response.results));
        })
        .catch((error) => {
            res.json(f.formatResponse(false));
        });
});

const supportedData = [
    'temperature',
    'light'
];

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
