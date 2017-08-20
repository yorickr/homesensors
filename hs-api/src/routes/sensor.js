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
        if (userId && mac) {
            const query = db.format('INSERT INTO sensors(user_id, mac) VALUES(?, ?) ON DUPLICATE KEY UPDATE user_id = VALUES(user_id), mac = VALUES(mac)', [userId, mac]);
            db.execute(query)
                .then((response) => {
                    const idQuery = db.format('SELECT sensor_id FROM sensors WHERE mac = ?', [mac]);
                    return db.execute(idQuery);
                })
                .then((response) => {
                    res.json(f.formatResponse(true, {sensorId: response.results[0].sensor_id}));
                })
                .catch((error) => {
                    console.log(error);
                    if (error.errno === 1062) {
                        res.json(f.formatResponse(false, 'This sensor is already registered in the database.'));
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
