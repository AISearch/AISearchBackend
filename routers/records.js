var express = require('express');
var router = express.Router();
var auth = require('./auth');

var mongoUtil = require( './../mongoConfig' );
var db = mongoUtil.getDb();
var records = db.collection('records');

// middleware that is specific to this router
router.use(function timeLog (req, res, next) {
  console.log(req.method, 'Records query at: ', Date.now(), req.ip);
  if(req.method !== "GET"){
    auth.isApiKeyValid( req, res, next );
  }else{
    next();
  }
})

// define the home page route
router.get('/', function (req, res) {
  var query = req.query.query ? JSON.parse(req.query.query) : {};
  var sort = req.query.sort ? JSON.parse(req.query.sort) : {};
  var limit = req.query.limit ? parseInt(req.query.limit) : 10;
  var skip = req.query.skip ? parseInt(req.query.skip) : 0;
  records.find(query).sort(sort).skip(skip).limit(limit).toArray((err, docs)=>{
    res.jsonp(docs);
  });
})
router.post('/', function(req,res){
  var entry = req.body;
  records.insertOne(entry, (err, r)=>{
    assert.equal(err, null);
    res.send("ok");
  });
});
// define the about route
router.get('/avg', (req, res)=>{
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
    res.jsonp(data);
  });
});

module.exports = router;
