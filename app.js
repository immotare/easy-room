require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();
const { v4: uuidv4 } = require('uuid');
const DB = require('./modules/pgs_db');
const CredentialInfo = require('./modules/credential')

app.use(express.static(__dirname + '/public'));
app.set("view engine", "ejs");
app.set("views", "./views");

let req_count = 0;
const slackSecretKey = process.env.SLACK_SECRET;
const slackClientId = process.env.SLACK_CLIENT;

const skywaySecretKey = process.env.SKYWAY_SECRET;
const skywayApiKey = process.env.SKYWAY_API_KEY;

const credentialTTL = 3600;

const db = new DB(process.env.DATABASE_URL);

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

function checkSession () {
}

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

    const getUserIdRes = await axios.post('https://slack.com/api/oauth.v2.access', getUserIdParams);
    const userIdData = getUserIdRes.data;
    console.log(userIdData);
    const userId = userIdData.authed_user.id;
    const token = userIdData.access_token;

    if (!userIdData.ok || !userId || !token) {
      throw "Invalid user accessing or format."
    }
    
    const getUserProfileParams = new URLSearchParams(
      {
        token: token,
        user: userId
      }
    );

    const getUserProfileRes = await axios.post('https://slack.com/api/users.profile.get', getUserProfileParams);
    const userProfileData = getUserProfileRes.data;
    console.log(userProfileData);
    let userName = userProfileData.profile.display_name;
    if (!userName) {
      userName = userProfileData.profile.real_name;
    }

    const uuid = uuidv4();
    const credentialInfo = CredentialInfo(userName, uuid, credentialTTL);
    const clientData = { 
      username: userName, 
      credential: credentialInfo.credential,
      peerId: credentialInfo.peerId
    };
    console.log(clientData);
    res.render("./authenticated_client.ejs", { clientData: clientData , apiKey:skywayApiKey });
  }
  catch (e) {
    console.error(e)
  }
})

app.get('/testclient', function (req, res) {
  const credentialInfo = makeCredentialInfo(`sample_user${req_count}`);
  const clientData = {
    username: `sample_user${req_count}`,
    credential: credentialInfo.credential,
    peerId: credentialInfo.peerId
  };
  res.render("./authenticated_client.ejs", { clientdata: clientData, apikey:skywayApiKey });
  req_count++;
});

app.set('port', (process.env.PORT || 5000));

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'))
})