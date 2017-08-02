import mysql from 'mysql';

import config from '../config/dbconfig.json';

const pool  = mysql.createPool({
    host     :  config.hostname,
    user     :  config.username,
    password :  config.password,
    database :  config.db,
});

export default {
    execute (query, values = undefined) {
        return new Promise((resolve, reject) => {
            pool.getConnection((error, connection) => {
                if (error) {
                    reject(error);
                    return;
                } else {
                    connection.query(query, [values], (error, results, fields) => {
                        connection.release();
                        if (error) {
                            reject(error);
                            return;
                        }
                        resolve({results, fields});
                    });
                }
            });
        });
    },

    format (query, data) {
        return mysql.format(query, data);
    }
};
