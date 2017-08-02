import express from 'express';
import bodyParser from 'body-parser';

import f from './util/format.js';
import db from './util/database.js';

const app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.all('*', (req, res, next) => {
    // Log the request.
    console.log('CALL: ' + req.method + ' ' + req.originalUrl);
    next();
});

app.get('/api', (req, res) => {
    res.send('Hello World! This api is alive and well!');
});

app.all('/api*/*', (req, res, next) => {
    // Set response header
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With,Content-type,Accept,X-Access-Token,X-Key');
    // Set response contenttype
    res.contentType('application/json');
    next();
});

const router = express.Router();

router.get('/temperature', (req, res) => {
    res.json(f.formatResponse(true, { temperature: 25.2 }));
});

router.post('/temperature', (req, res) => {
    const body = req.body || null;
    if (body) {
        // all is well.
        console.log('Temperature is ' + body.temperature);
    }
    res.json(f.formatResponse(true));
});

router.get('/light', (req, res) => {
    res.json(f.formatResponse(true, {light: 25.1}));
});

router.post('/light', (req, res) => {
    const body = req.body || null;
    if (body) {
        // body exists, therefore get light intensity.
        console.log('Light intensity is ' + body.light);
    }
    res.json(f.formatResponse(true));
});

router.get('/measurement', (req, res) => {
    const query = 'SELECT * FROM measurements LIMIT 50';
    db.execute(query)
        .then((response) => {
            res.json(f.formatResponse(true, response.results));
        })
        .catch((error) => {
            res.json(f.formatResponse(false));
        });
});

router.post('/measurement', (req, res) => {
    const body = req.body || null;
    if (body) {
        const query = 'INSERT INTO measurements (temperature, light) VALUES ?';
        const values = body.measurements.map((measurement) => {
            return [measurement.temperature, measurement.light];
        });
        db.execute(query, values)
            .then((response) => {
                console.log('Data succesfully inserted.');
                res.json(f.formatResponse(true));
            })
            .catch((error) => {
                console.log('Something went wrong inserting data.');
                res.json(f.formatResponse(false));
            });
    }
});

app.use('/api', router);

app.listen(3030, () => {
    console.log('Example app listening on port 3000!');
});
