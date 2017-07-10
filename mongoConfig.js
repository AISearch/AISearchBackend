var MongoClient = require( 'mongodb' ).MongoClient;

var user = "heroku"
var psw = process.env.MLABPSW
var apiUrl = process.env.apiUrl
var _db;

module.exports = {
  connectToServer: function( callback ) {
    MongoClient.connect( "mongodb://" + user + ":" + psw + "@" +apiUrl , function( err, db ) {
      _db = db;
      return callback( err );
    } );
  },

  getDb: function() {
    return _db;
  }
};
