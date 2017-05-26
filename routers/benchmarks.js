var express = require('express')
var router = express.Router()

var mongoUtil = require( './../mongoConfig' );
var db = mongoUtil.getDb();
var benchmarks = db.collection('benchmarks');

// middleware that is specific to this router
router.use(function timeLog (req, res, next) {
  console.log(req.method, 'Benchmarks query at: ', Date.now(), req.ip);
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
  benchmarks.find(query).sort(sort).skip(skip).limit(limit).toArray((err, docs)=>{
    res.json(docs);
  });
});

router.get('/:name', (req,res)=>{
  benchmarks.findOne({name: req.params.name}, (err, doc)=>{
    res.json(doc);
  });
});

module.exports = router;
