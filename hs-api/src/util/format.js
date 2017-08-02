const formatResponse = (success, data = undefined) => {
    return {
        success,
        data
    };
};

export default {
    formatResponse
};
