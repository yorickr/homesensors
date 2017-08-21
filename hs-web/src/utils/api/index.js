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

export default {

    post (url, body) {
        return fetch(url, {
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
        return fetch(url, {
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
