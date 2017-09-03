const formatResponse = (success, code, data = undefined) => {
    const ret = {};
    ret.success = success;
    if (typeof code === 'number') {
        // if number it's the code.
        ret.code = code;
        // data will be the actual data.
        ret.data = data;
    } else {
        // treat as the data object.
        ret.data = code;
    }
    return ret;
};

export default {
    formatResponse
};
