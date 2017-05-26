var mongoUtil = require( './../mongoConfig' );
var db = mongoUtil.getDb();
var usersApi = db.collection('usersApi');

module.exports = {
  isApiKeyValid: ( req, res, next )=>{
    if(req.query.apikey){
      usersApi.findOne({key:req.query.apikey}, (err, doc)=>{
        if(err == null && doc != null){
          next();
        }else{
          res.send("This API Key is not valid.");
        }
      });
    }else{
      res.send("Not API Key was given.")
    }
  }
};
