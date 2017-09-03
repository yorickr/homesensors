import config from '../../config/api.json';

var tkn = localStorage.getItem('token');

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

const checkRequest = (responseJson) => {
    if (responseJson.success === true) {
        // we did it! return.
        return responseJson;
    } else {
        // fail using Promise.reject() with the reason provided in responseJson
        const {data, code} = responseJson;
        return Promise.reject({data, code});
    }
};

export default {

    post (url, body) {
        return fetch(formBaseUrl() + url, {
            method: 'POST',
            headers: _formHeaders(),
            body: JSON.stringify(body)
        })
        .then((response) => response.json())
        .then((responseJson) => {
            return checkRequest(responseJson);
        })
        .catch((error) => {
            console.error('Something went wrong while POSTing to ' + url);
            throw error;
        });
    },
    get (url) {
        return fetch(formBaseUrl() + url, {
            method: 'GET',
            headers: _formHeaders()
        })
        .then((response) => response.json())
        .then((responseJson) => {
            return checkRequest(responseJson);
        })
        .catch((error) => {
            console.error('Something went wrong while GETing from ' + url);
            throw error;
        });
    },
    refreshToken () {
        tkn = localStorage.getItem('token');
    }
};
