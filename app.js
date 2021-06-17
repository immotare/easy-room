const express = require('express');
const app = express();

app.use(express.static(__dirname + '/public'));

function forceHttps(req, res, next){ // ミドルウェア関数
  if (!process.env.PORT) {
    return next();
  };

  if (req.headers['x-forwarded-proto'] && req.headers['x-forwarded-proto'] === "http") {
    // リクエストURLのプロトコル部分だけhttpsにしてリダイレクトさせる
    res.redirect('https://' + req.headers.host + req.url);
  }else {
    console.log('forceHttps passed.');
    return next();
  }
};

app.all('*', forceHttps); // ドメインのどのパスにアクセスしてもhttpsにリダイレクトさせる

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/public/index1.html');
});

app.get('/auth', function(req, res) {
  console.log(`request:${toString(req)}`)
  console.log(``)
})

app.set('port', (process.env.PORT || 5000));

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'))
})
