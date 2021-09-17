require('dotenv').config();
const express = require('express');

const axios = require('axios');
const app = express();
const { v4: uuidv4 } = require('uuid');
const cookieSession = require('cookie-session');
const CryptoJS = require('crypto-js');

const slackSecretKey = process.env.SLACK_SECRET;
const slackClientId = process.env.SLACK_CLIENT;
const slackBotToken = process.env.SLACK_BOT_USER_TOKEN;

const skywaySecretKey = process.env.SKYWAY_SECRET;
const skywayApiKey = process.env.SKYWAY_API_KEY;
const credentialTTL = 3600; // s

const cookieMaxAge =  60000; // ms
const cookieSecret = process.env.COOKIE_SECRET;

app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/dist'));
app.set("view engine", "ejs");
app.set("views", "./views");

app.set('trust proxy', 1);
app.use(cookieSession({
  name: 'session',
  keys: [cookieSecret],
  secure: true,
  httpOnly: true,
  maxAge: cookieMaxAge
}));

let req_count = 0;

function forceHttps(req, res, next){
  if (!process.env.PORT) {
    return next();
  };

  if (req.headers['x-forwarded-proto'] && req.headers['x-forwarded-proto'] === "http") {
    res.redirect('https://' + req.headers.host + req.url);
  } else {
    return next();
  }
};

app.all('*', forceHttps); 

app.get('/', function (req, res)  {
  if (req.session && req.session.userName && req.session.userId) {
      const uuid = uuidv4();
      const credentialInfo = makeCredentialInfo(req.session.userName, uuid);
      const clientData = { 
          username: req.session.userName, 
          credential: credentialInfo.credential,
          peerId: credentialInfo.peerId
      };
      console.log(clientData);
      res.render("./authenticated_client.ejs", { clientdata: clientData, apikey: skywayApiKey });
  }
  else {
      res.sendFile(__dirname + '/public/index1.html');
  }
});

// fetch userdata from SlackApi and set to client.
app.get('/auth', setUserDatatoCookie);

app.get('/testclient', function (req, res) {
  const uuid = uuidv4();
  const credentialInfo = makeCredentialInfo(`sample_user${req_count}`, uuid);
  const clientData = {
    username: `sample_user${req_count}`,
    credential: credentialInfo.credential,
    peerId: credentialInfo.peerId,
  };
  const  userImgUrl = `${req_count % 3 + 1}.png`
  res.render("./authenticated_client.ejs", { clientdata: clientData, apikey:skywayApiKey, userimgurl:  userImgUrl});
  req_count++;
});


app.set('port', (process.env.PORT || 5000));

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'))
});

function makeCredentialInfo (userName, uuid) {
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

async function setUserDatatoCookie () {
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
    
    if (!userIdData.ok) {
      res.send("Invalid accessing.");
      return;
    }

    if (!userIdData.authed_user.id) {
      res.send("Format Error.");
      return;
    }

    const userId = userIdData.authed_user.id;

    const getUserProfileParams = new URLSearchParams(
      {
        token: slackBotToken,
        user: userId
      }
    );

    const getUserProfileRes = await axios.post('https://slack.com/api/users.profile.get', getUserProfileParams);
    const userProfileData = getUserProfileRes.data;
    console.log(userProfileData);

    if (!userProfileData.ok) {
      res.send("Failed to fetch user data.");
      return;
    }

    const userName = userProfileData.profile.display_name || userProfileData.profile.real_name;
    
    req.session.userName = userName;
    req.session.userId = userId;

    res.redirect('/');
  }
  catch (e) {
    res.send("Some error has occured.")
    console.error(e)
  }
}