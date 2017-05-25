var express = require('express'),
    app = express(),
    // pug = require('pug'),
    MongoClient = require('mongodb').MongoClient,
    assert = require('assert');

// app.set('view engine', 'pug');

MongoClient.connect("mongodb://guess:guess@ds131340.mlab.com:31340/metaheuristics", (err, db)=>{
  assert.equal(null, err);

  var list = db.collection('list');
  var records = db.collection('records')
  //console.log(list);

  app.get('/', (req, res)=>{
    res.send("Welcome to the api.")
  });

  app.get('/:number/skip/:skip', (req, res)=>{
    //console.log(req);
    list.find({}).sort({year:1}).skip(parseInt(req.params.skip)).limit(parseInt(req.params.number)).toArray((err, docs)=>{
      res.json(docs);
    });
  });

  app.get('/acronym/:acronym', (req, res)=>{
    //console.log(list)
    list.find({acronym:req.params.acronym}).toArray((err, docs)=>{
      res.json( docs );
    });
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
