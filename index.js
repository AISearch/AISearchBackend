var express = require('express'),
    app = express(),
    // pug = require('pug'),
    MongoClient = require('mongodb').MongoClient,
    assert = require('assert'),
    dbCalls = require('./dbCalls'),
    mongoConfig = require("./mongoConfig")


// app.set('view engine', 'pug');
app.set('port', (process.env.PORT || 5000));

MongoClient.connect(mongoConfig.uri, (err, db)=>{
  assert.equal(null, err);

  var list = db.collection('list');
  var records = db.collection('records')
  //console.log(list);

  app.get('/', (req, res)=>{
    res.send("Welcome to the metaheuristic api.")
  });

  app.get("/list", (req, res)=>{
    var query = req.query.query ? JSON.parse(req.query.query) : {};
    var sort = req.query.sort ? JSON.parse(req.query.sort) : {};
    var limit = req.query.limit ? parseInt(req.query.limit) : 0;
    var skip = req.query.skip ? parseInt(req.query.skip) : 0;
    dbCalls.getList(list, res, query, sort, limit, skip);
  });

  app.get('/acronym/:acronym', (req, res)=>{
    //console.log(list)
    list.find({acronym:req.params.acronym}).toArray((err, docs)=>{
      res.json( docs );
    });
  });

  app.get('/records', (req, res)=>{
    var query = req.query.query ? JSON.parse(req.query.query) : {};
    var sort = req.query.sort ? JSON.parse(req.query.sort) : {};
    var limit = req.query.limit ? parseInt(req.query.limit) : 0;
    var skip = req.query.skip ? parseInt(req.query.skip) : 0;
    dbCalls.getList(records, res, query, sort, limit, skip);
  });

  app.get('/records/avg', (req, res)=>{
    var agregateArray = [];
    if(req.query.acronym){
      agregateArray.push({$match: { algorithm: req.query.acronym }})
    }
    if(req.query.benchmark){
      agregateArray.push({$match: { benchmark: req.query.benchmark }})
    }
    if(req.query.dimensions){
      agregateArray.push({$match: { dimensions: parseInt(req.query.dimensions) }})
    }
    agregateArray.push({$group:
      {
        _id: {benchmark:"$benchmark", dimensions:"$dimensions", algorithm:"$algorithm"},
        fitnessAvg: { $avg: "$bestFitness" },
        bestFitness: { $min: "$bestFitness" },
        bestSolutions: { $push: "$bestSolution" },
        count: { $sum: 1 }
      }
    });
    records.aggregate(agregateArray, (err, data)=>{
      res.send(JSON.stringify(data));
    });
  });

  app.use((req,res)=>{
    res.sendStatus(404);
  });

  var server = app.listen(app.get('port'), ()=>{
    var port = server.address().port;
    console.log('Express server is lisening at port ', port);
  });

});
