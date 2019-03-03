
const apiKey = 'api_key'
const requestToken


var KiteConnect = require("kiteconnect").KiteConnect;

const apiKey = 'apiKey';
const requestToken = 'requestToken';
const apiSecret = 'apiSecret';

module.exports = (async function(apiKey, requestToken, apiSecret, callback){
    const kc = new KiteConnect({
        api_key: apiKey
    });
    await kc.generateSession(requestToken, apiSecret);
   return kc;
})(apiKey, requestToken, apiSecret);