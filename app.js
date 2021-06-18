const express = require('express');
const got = require('got');
const app = express();

app.use(express.static(__dirname + '/public'));

const slackSecretKey = process.env.SLACK_SECRET;
const slackClientId = process.env.SLACK_CLIENT;

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

// ドメインのどのパスにアクセスしてもhttpsにリダイレクトさせる
app.all('*', forceHttps); 

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/public/index1.html');
});

app.get('/auth', function(req, res) {
  res.send(req.query.code)
  // try {
  //   let slackCode = req.query.code;
  //   let slackTokenRequestUrl = `https://slack.com/api/oauth.access?client_id=${slackClientId}&client_secret=${slackSecretKey}&code=${slackCode}`;
  //   let slackTokenResponse = await got(slackTokenRequestUrl, {json:true});
  //   let token = slackTokenResponse.body['access_token'];
  //   if (!token) {
  //     res.send('Oops! Something went wrong.');
  //     return;
  //   }
  // }
  // catch {
  // }
})

app.set('port', (process.env.PORT || 5000));

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'))
})
