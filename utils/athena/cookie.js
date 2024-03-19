const proxying = require('../http/proxying');

var cookie = {
    fetchTime : 1,
    value: ''
}

module.exports = async function() {
    if(Date.now() - cookie.fetchTime < 1000 * 60 * 3) {
        return cookie.value
    }

    const endpoint = `https://yfadisk.azurewebsites.net/athena/bridge.txt`;   
    const method      = 'GET';
    let header      =  {};
    let param       = {};
    let body        = null;

    const response = (await proxying(method, endpoint, header, param, body, true));
    // console.log(response.status);
    // console.log(response.data)
    // var value = null
    if(response.status == 200 ) {
        // console.log(response.data)
        // value = JSON.parse(response.data);
        // return JSON.parse(response.data).value
        cookie.value = JSON.parse(response.data).value;
        cookie.fetchTime = Date.now();
    }

    // console.log(response.status)
    console.log(`fetch cookie... ${cookie.value}`)

    return cookie.value
 }

// process.env.SECRET_TT
