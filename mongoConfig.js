var MongoClient = require( 'mongodb' ).MongoClient;

var user = "heroku"
var psw = process.env.MLABPSW
var _db;

module.exports = {
  connectToServer: function( callback ) {
    MongoClient.connect( "mongodb://" + user + ":" + psw + "@ds131340.mlab.com:31340/metaheuristics" , function( err, db ) {
      _db = db;
      return callback( err );
    } );
  },

  getDb: function() {
    return _db;
  }
};
