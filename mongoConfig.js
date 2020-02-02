var MongoClient = require( 'mongodb' ).MongoClient;

var mongoUrl = process.env.MONGO_URL || "mongodb://localhost/metaheuristics"
var _db;

//This custom module is used to connect to the Mongo server once
//when the server is initialed. Then other scripts can ask for the
//db object to use it.
module.exports = {
  connectToServer: function( callback ) {
    MongoClient.connect( mongoUrl , function( err, db ) {
      _db = db;
      return callback( err );
    } );
  },

  getDb: function() {
    return _db;
  }
};
