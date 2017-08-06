import moment from 'moment';

const log = (req, res, next) => {
    // Log the request.
    const m = moment();
    console.log(m.format('Y-MM-DD HH:mm:ss') + ' ---- CALL: ' + req.method + ' ' + req.originalUrl);
    next();
};

export default log;
