const ac = require('axios');
// const http = require('http');
// const https = require('https');

const axios = ac.create({
    //60 sec timeout
    timeout: 60000,

    //keepAlive pools and reuses TCP connections, so it's faster
    // httpAgent: new http.Agent({ keepAlive: true }),
    // httpsAgent: new https.Agent({ keepAlive: true }),

    //follow up to 10 HTTP 3xx redirects
    maxRedirects: 10,

    //cap the maximum content length we'll accept to 50MBs, just in case
    maxContentLength: 50 * 1000 * 1000
  });

module.exports = async function  proxying(method, endpoint, req_headers, params, body, need_raw = false) {
    try{
        let option = {
            method: method,
            url: endpoint,
            params: params,
            headers: Object.assign(req_headers, { 'User-Agent': '-' }),
            data: body,
            responseType: "text",
            validateStatus: false
        }
        if (need_raw) {
            option.transformResponse = (r) => r
        }

        const response = await axios(option);
        return response;
        /**
        {
            // `data` is the response that was provided by the server
            data: {},

            // `status` is the HTTP status code from the server response
            status: 200,

            // `statusText` is the HTTP status message from the server response
            statusText: 'OK',

            // `headers` the HTTP headers that the server responded with
            // All header names are lowercase and can be accessed using the bracket notation.
            // Example: `response.headers['content-type']`
            headers: {},

            // `config` is the config that was provided to `axios` for the request
            config: {},

            // `request` is the request that generated this response
            // It is the last ClientRequest instance in node.js (in redirects)
            // and an XMLHttpRequest instance in the browser
            request: {}
          }
          */
    } catch ( e) {
        console.log('exception for axios')
    }
}

