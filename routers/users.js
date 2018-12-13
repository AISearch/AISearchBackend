var express = require('express');
var router = express.Router();
var auth = require('./auth');

var mongoUtil = require( './../mongoConfig' );
var db = mongoUtil.getDb();
var records = db.collection('records');

// middleware that is specific to this router
router.use(function timeLog (req, res, next) {
  console.log(req.method, 'Users query at: ', Date.now(), req.ip);
  auth.isApiKeyValid( req, res, next );
})

// Gets in here only if auth pass
router.get('/', function (req, res) {
  res.send('ok')
});

router.post('/', (req, res)=>{
  res.jsonp(req.body);
  console.log(req.body);
});

module.exports = router;
