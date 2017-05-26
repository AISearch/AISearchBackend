var express = require('express')
var router = express.Router()

var mongoUtil = require( './../mongoConfig' );
var db = mongoUtil.getDb();
var list = db.collection('list');
// middleware that is specific to this router
router.use(function timeLog (req, res, next) {
  console.log(req.method, 'List query at: ', Date.now(), req.ip);
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
  list.find(query).sort(sort).skip(skip).limit(limit).toArray((err, docs)=>{
    res.json(docs);
  });
})
// define the about route
router.get('/:acronym', (req, res)=>{
  //console.log(list)
  list.find({acronym:req.params.acronym}).toArray((err, docs)=>{
    res.json( docs );
  });
});

module.exports = router;
