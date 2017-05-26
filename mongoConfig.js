var user = "heroku"
var psw = process.env.MLABPSW

var mongoConfig = {
  uri: "mongodb://" + user + ":" + psw + "@ds131340.mlab.com:31340/metaheuristics"
}

module.exports = mongoConfig;
