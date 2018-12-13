//load enviroment variables from the file stteings.env
require('dotenv').load();

var express = require('express'),
    app = express(),
    bodyParser = require('body-parser'),
    assert = require('assert'),
    mongoConfig = require("./mongoConfig");


// app.set('view engine', 'pug');
app.set('port', (process.env.PORT || 5000));

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
app.use(bodyParser.json())

// allowing cros
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

mongoConfig.connectToServer( ( err )=>{
  assert.equal(null, err);
  //console.log(list);

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

  var server = app.listen(app.get('port'), ()=>{
    var port = server.address().port;
    console.log('Express server is lisening at port ', port);
  });

});
