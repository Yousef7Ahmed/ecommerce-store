const axios = require("axios");

const BASE = process.env.PAYPAL_BASE_URL;

const CLIENT = process.env.PAYPAL_CLIENT_ID;

const SECRET = process.env.PAYPAL_SECRET;

const getAccessToken = async () => {

    const response = await axios({

        url: `${BASE}/v1/oauth2/token`,

        method: "post",

        auth: {

            username: CLIENT,

            password: SECRET,

        },

        headers: {

            "Content-Type": "application/x-www-form-urlencoded",

        },

        data: "grant_type=client_credentials",

    });

    return response.data.access_token;

};

module.exports = {

    getAccessToken,

};