var express = require('express'),
    app = express(),
    // pug = require('pug'),
    //MongoClient = require('mongodb').MongoClient,
    mongoUtil = require( './mongoConfig' ),
    assert = require('assert'),
    mongoConfig = require("./mongoConfig");


// app.set('view engine', 'pug');
app.set('port', (process.env.PORT || 5000));

mongoUtil.connectToServer( ( err )=>{
  assert.equal(null, err);
  //console.log(list);

  app.get('/', (req, res)=>{
    res.send("Welcome to the metaheuristic api.")
  });

  app.use("/list", require("./routers/list"));

  app.use('/records', require("./routers/records"));

  app.use('/benchmarks', require("./routers/benchmarks"));

  app.use((req,res)=>{
    res.sendStatus(404);
  });

  var server = app.listen(app.get('port'), ()=>{
    var port = server.address().port;
    console.log('Express server is lisening at port ', port);
  });

});
