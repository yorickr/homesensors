import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

// utils
import f from './util/format.js';
import db from './util/database.js';
import encryption from './util/encryption.js';

// routes
import sensor from './routes/sensor.js';
import user from './routes/user.js';
import data from './routes/data.js';

// middleware
import log from './middleware/logger.js';

import cfg from './config/config.json';

const app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.use(log);

app.get('/api', (req, res) => {
    res.send('Hello World! This api is alive and well!');
});

app.use(cors());

// app.use((req, res, next) => {
//     // Set response header
//     res.header('Access-Control-Allow-Origin', '*');
//     res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
//     res.header('Access-Control-Allow-Headers', 'X-Requested-With,Content-Type,Accept,X-Access-Token,X-Key');
//     // Set response contenttype
//     res.contentType('application/json');
//     next();
// });

const router = express.Router();

router.use('/user', user);

router.use('/sensor', sensor);

router.use('/data', data);

app.use('/api', router);

app.listen(3030, () => {
    console.log('Example app listening on port 3000!');
});
