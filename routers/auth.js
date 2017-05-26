var mongoUtil = require( './../mongoConfig' );
var db = mongoUtil.getDb();
var usersApi = db.collection('usersApi');

module.exports = {
  isApiKeyValid: ( req, res, next )=>{
    if(req.query.apiKey){
      usersApi.findOne({key:req.query.apiKey}, (err, doc)=>{
        if(err == null && doc != null){
          req.body.user = doc.user;
          next();
        }else{
          res.send("This API Key is not valid.");
        }
      });
    }else{
      res.send("Not valid apiKey param was given.");
    }
  }
};
