var MongoClient = require( 'mongodb' ).MongoClient;

var mongoUrl = process.env.MONGO_URL || "mongodb://localhost/metaheuristics"
var _db;

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
