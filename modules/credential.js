const CryptoJS = require('crypto-js');

module.exports = function (userName, uuid, credentialTTL, skywaySecretKey) {
  const unixTimeStamp = Math.floor(Date.now() / 1000);
  const peerId = userName + uuid;
  const hash = CryptoJS.HmacSHA256(`${unixTimeStamp}:${credentialTTL}:${peerId}`, skywaySecretKey);
  const hashBase64 = CryptoJS.enc.Base64.stringify(hash);
  const credentialInfo = {
    peerId: peerId,
    credential: {
      peerId: peerId,
      timestamp: unixTimeStamp,
      ttl: credentialTTL,
      authToken: hashBase64
    }
  };
  return credentialInfo;
}