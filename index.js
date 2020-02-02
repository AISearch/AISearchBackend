//load enviroment variables from the file stteings.env
require('dotenv').load();

var express = require('express'),
    app = express(),
    bodyParser = require('body-parser'),
    assert = require('assert'),
    mongoConfig = require("./mongoConfig"),
    fs = require('fs');

var http = require('http');
var https = require('https');
var privateKey  = fs.readFileSync('server.key', 'utf8'); //HTTPS certificate
var certificate = fs.readFileSync('server.cert', 'utf8');
var credentials = {key: privateKey, cert: certificate};

app.set('port', 8080);

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
app.use(bodyParser.json())

// allowing cross-origin, because AISearch is host on a github-page and the server in a private server
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

mongoConfig.connectToServer( ( err )=>{
  assert.equal(null, err);

  //root directory
  app.get('/', (req, res)=>{
    res.send("Welcome to the metaheuristic api.")
  });

  app.use("/list", require("./routers/list"));

  app.use('/records', require("./routers/records"));

  app.use('/benchmarks', require("./routers/benchmarks"));

  app.use('/users', require("./routers/users"));

  app.use('/papers', require("./routers/papers"));

  app.use((req,res)=>{
    res.sendStatus(404);
  });

  //Only executed if MongoDB is connected
  var httpServer = http.createServer(app);
  var httpsServer = https.createServer(credentials, app);
  httpServer.listen(8080);
  httpsServer.listen(8443);

});
