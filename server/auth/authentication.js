/*jshint esversion: 6 */
const axios = require('axios');

var auth = (req, res, next) => {

    var token = req.cookies.token || req.body.token || req.header('token');

    axios.post(process.env.AUTH_API_URL + '/authenticate', {
        token
    }).then((response) => {
        req.StatusCode = response.status;
        next();
    }).catch(function (error) {
        console.log(error.message);
        req.StatusCode = error.response.status;
        next();
    });
};

module.exports = { auth };