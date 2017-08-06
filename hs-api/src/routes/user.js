import express from 'express';
import jwt from 'jsonwebtoken';

import f from '../util/format.js';
import db from '../util/database.js';
import encryption from '../util/encryption.js';

import cfg from '../config/config.json';

const user = express.Router();

user.post('/login', (req, res) => {
    const body = req.body || null;
    if (body) {
        const {username, password} = body;
        if (username && password) {
            // attempt to retrieve hash from db
            const query = db.format('SELECT * FROM users WHERE username = ?', [username]);
            db.execute(query)
                .then((response) => {
                    if (response.results.length > 0) {
                        // user exists.
                        const hash = response.results[0].password;
                        encryption.check(password, hash)
                            .then((matches) => {
                                if (matches === true) {
                                    const userId = response.results[0]['user_id'];
                                    const token = jwt.sign({userId}, cfg.secret, {expiresIn: 86400});
                                    res.json(f.formatResponse(true, {
                                        userId,
                                        token
                                    }));
                                } else {
                                    res.json(f.formatResponse(false, 'Wrong password.'));
                                }
                            })
                            .catch((error) => {
                                console.log(error);
                                res.json(f.formatResponse(false, 'Something went wrong.'));
                            });
                    } else {
                        // user doesn't exist.
                        res.json(f.formatResponse(false, 'User does not exist, please register first.'));
                    }
                })
                .catch((error) => {
                    console.log(error);
                    res.json(f.formatResponse(false));
                });
        } else {
            res.json(f.formatResponse(false, 'Username and password not provided!'));
        }
    } else {
        res.json(f.formatResponse(false, 'Username and password not provided!'));
    }
});

user.post('/register', (req, res) => {
    const body = req.body || null;
    if (body) {
        const {username, password} = body;
        if (username && password) {
            // Username and password provided
            // encrypt password.
            encryption.encrypt(password)
                .then((hash) => {
                // register in database.
                    const query = db.format('INSERT INTO users (username, password) VALUES (?, ?)', [username, hash]);
                    return db.execute(query);
                })
                .then((result) => {
                    console.log(result);
                    res.json(f.formatResponse(true, {userId: result.results.insertId}));
                })
                .catch((error) => {
                    if (error.errno === 1062) {
                        // duplicate, so therefore user already exists as user is unique.
                        res.json(f.formatResponse(false, 'User already exists!'));
                    } else {
                        res.json(f.formatResponse(false));
                    }
                });

        } else {
            res.json(f.formatResponse(false, 'Username and password not provided!'));
        }
    } else {
        res.json(f.formatResponse(false, 'Username and password not provided!'));
    }
});

export default user;
