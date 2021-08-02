require('dotenv').config();
const express = require('express');
const axios = require('axios');
const CryptoJS = require('crypto-js');
const app = express();
const { v4: uuidv4 } = require('uuid');

app.use(express.static(__dirname + '/public'));
app.set("view engine", "ejs");
app.set("views", "./views");

const slackSecretKey = process.env.SLACK_SECRET;
const slackClientId = process.env.SLACK_CLIENT;
const skywaySecretKey = process.env.SKYWAY_SECRET;
const skywayApiKey = process.env.SKYWAY_API_KEY;
const credentialTTL = 3600;

function forceHttps(req, res, next){
  if (!process.env.PORT) {
    return next();
  };

  if (req.headers['x-forwarded-proto'] && req.headers['x-forwarded-proto'] === "http") {
    res.redirect('https://' + req.headers.host + req.url);
  }else {
    return next();
  }
};

app.all('*', forceHttps); 

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/public/index1.html');
});

app.get('/auth', async function(req, res) {
  try {
    const slackCode = req.query.code;
    const getUserIdParams = new URLSearchParams(
      {
        client_id: slackClientId,
        client_secret: slackSecretKey,
        code: slackCode
      }
    );

    // get userid and accesstoken
    const getUserIdRes = await axios.post('https://slack.com/api/oauth.v2.access', getUserIdParams);
    const userIdData = getUserIdRes.data;
    console.log(userIdData);
    const userId = userIdData.authed_user.id;
    const token = userIdData.access_token;

    // if (!userIdData.ok || !userId || !token) {
    //   // TODO:Make Error Message
    // }
    
    const getUserProfileParams = new URLSearchParams(
      {
        token: token,
        user: userId
      }
    );

    // get userid and avator image url
    const getUserProfileRes = await axios.post('https://slack.com/api/users.profile.get', getUserProfileParams);
    const userProfileData = getUserProfileRes.data;
    console.log(userProfileData);
    let userName = userProfileData.profile.display_name;
    if (!userName) {
      userName = userProfileData.profile.real_name;
    }
    // const userImgUrl = userProfileData.profile.image_48;

    // make credential info from secret key
    // only use userName
    const credentialInfo = makeCredentialInfo(userName);
    const clientData = { 
      username: userName, 
      // userimgurl: userImgUrl, 
      credential: credentialInfo.credential,
      peerId: credentialInfo.peerId
    };
    console.log(clientData);
    res.render("./authenticated_client.ejs", { clientData: clientData , apiKey:skywayApiKey });
  }
  catch {
  }
})

app.get('/testclient', function (req, res) {
    const credentialInfo = makeCredentialInfo('sample_user');
    const clientData = {
      username: 'sample_user',
      credential: credentialInfo.credential,
      peerId: credentialInfo.peerId
    };
    res.render("./authenticated_client.ejs", { clientdata: clientData, apikey:skywayApiKey });
});

app.set('port', (process.env.PORT || 5000));

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'))
})


function makeCredentialInfo(userName) {
  const unixTimeStamp = Math.floor(Date.now() / 1000);
  const peerId = userName + uuidv4(); // uuidv4  => ex:'9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d'
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
