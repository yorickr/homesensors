import express from 'express';

import f from '../util/format.js';
import db from '../util/database.js';

// middleware
import auth from '../middleware/auth.js';

const sensor = express.Router();

sensor.use(auth);

sensor.post('/unregister', (req, res) => {
    const body = req.body || null;
    if (body) {
        console.log(body);
        const {mac} = body;
        if (mac) {
            const query = db.format('DELETE FROM sensors WHERE mac = ?', [mac]);
            db.execute(query)
                .then((response) => {
                    console.log(response);
                    res.json(f.formatResponse(true));
                })
                .catch((error) => {
                    console.log(error);
                    res.json(f.formatResponse(false, 'Failed to remove sensor from database.'));
                });
        } else {
            res.json(f.formatResponse(false, 'Information not specified!'));
        }
    } else {
        res.json(f.formatResponse(false, 'Information not specified!'));
    }
});

sensor.post('/register', (req, res) => {
    const body = req.body || null;
    if (body) {
        console.log(body);
        const {userId, type, mac, name, active} = body;
        if (userId && type && mac && name && active !== undefined) {
            const query = db.format('INSERT INTO sensors(user_id, type, mac, name, active) VALUES(?, ?, ?, ?, ?)', [userId, type, mac, name, active]);
            db.execute(query)
                .then((response) => {
                    res.json(f.formatResponse(true, {sensorId: response.results.insertId}));
                })
                .catch((error) => {
                    if (error.errno === 1062) {
                        res.json(f.formatResponse(false, 'This sensor already exists in the database.'));
                    } else {
                        res.json(f.formatResponse(false));
                    }
                });
        } else {
            res.json(f.formatResponse(false, 'Information not specified!'));
        }
    } else {
        res.json(f.formatResponse(false, 'Information not specified!'));
    }
});

export default sensor;
