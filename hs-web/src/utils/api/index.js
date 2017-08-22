import config from '../../config/api.json';

var tkn = null;

const _formHeaders = () => {
    const headers = {
        'Content-Type': 'application/json',
    };
    if (tkn) {
        headers['X-Access-Token'] = tkn;
    }
    return headers;
};

const formBaseUrl = () => {
    return "" + config.protocol + "://" + config.hostname + ":" + config.port + "/api";
}

export default {

    post (url, body) {
        return fetch(formBaseUrl() + url, {
            method: 'POST',
            headers: _formHeaders(),
            body: JSON.stringify(body)
        })
        .then((response) => response.json())
        .then((responseJson) => {
            return responseJson;
        })
        .catch((error) => {
            console.error('Something went wrong while POSTing to ' + url);
        });
    },
    get (url) {
        return fetch(formBaseUrl() + url, {
            method: 'GET',
            headers: _formHeaders()
        })
        .then((response) => response.json())
        .then((responseJson) => {
            return responseJson;
        })
        .catch((error) => {
            console.error('Something went wrong while GETing from ' + url);
        });
    },
    setToken (token) {
        tkn = token;
    }
};
