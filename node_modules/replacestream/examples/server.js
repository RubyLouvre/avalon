var http = require('http')
  , fs = require('fs')
  , path = require('path')
  , replaceStream = require('replacestream');

var app = function (req, res) {
  if (req.url.match(/^\/happybirthday\.txt$/)) {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    fs.createReadStream(path.join(__dirname, 'happybirthday.txt'))
      .pipe(replaceStream('birthday', 'earthday'))
      .pipe(res);
  } else {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('File not found');
  }
};
var port = parseInt(process.argv[2], 10) || process.env.PORT || 3000;
var server = http.createServer(app).listen(port);
console.log('Listening on port ' + port);
