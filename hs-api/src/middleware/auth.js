import jwt from 'jsonwebtoken';

// util
import f from '../util/format.js';

import cfg from '../config/config.json';

const authenticate = (req, res, next) => {
    const token = req.headers['x-access-token'] || req.query.token || req.body.token;
    if (token) {
        jwt.verify(token, cfg.secret, (error, decoded) => {
            if (error) {
                console.log('This is invalid tho');
                res.json(f.formatResponse(false, 'Invalid token'));
                return;
            }
            req.authenticated = true;
            req.userId = decoded.userId;
            next();
        });
    } else {
        return res.status(403).json(f.formatResponse(false, 'Missing token.'));
    }
};

export default authenticate;
