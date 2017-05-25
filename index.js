var express = require('express'),
    app = express(),
    // pug = require('pug'),
    MongoClient = require('mongodb').MongoClient,
    assert = require('assert');
    dbCalls = require('./dbCalls');

// app.set('view engine', 'pug');

MongoClient.connect("mongodb://guess:guess@ds131340.mlab.com:31340/metaheuristics", (err, db)=>{
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

  app.get('/records/:acronym', (req, res)=>{
    records.find({algorithm:req.params.acronym}).toArray((err,docs)=>{
      var items = docs.reduce((res,item)=>{
        if (!res.hasOwnProperty(item.algorithm)){
          res[item.algorithm] = {};
        }
        if (!res[item.algorithm].hasOwnProperty(item.benchmark)){
          res[item.algorithm][item.benchmark] = [];
        }
        res[item.algorithm][item.benchmark].push(item);
        return res;
      }, {});
      console.log(items);
      res.render(items);
    });
  });

  app.use((req,res)=>{
    res.sendStatus(404);
  });

  var server = app.listen(3000, ()=>{
    var port = server.address().port;
    console.log('Express server is lisening at port ', port);
  });

});
