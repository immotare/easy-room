var express = require('express');
var app = express();

app.use(express.static(__dirname + '/public'));

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

app.set('port', (process.env.PORT || 5000));

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'))
})
