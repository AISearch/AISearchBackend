assert = require('assert');

var dbCalls = {};

dbCalls.getList = function(collection, res, query = {}, sort = {}, limit = 0, skip = 0){
  assert.notEqual(collection, null);
  collection.find(query).sort(sort).skip(skip).limit(limit).toArray((err, docs)=>{
    res.json(docs);
  });
}


module.exports = dbCalls;
