const express = require('express');
const router = express.Router();
const axios = require('axios');
const xml2js = require('xml2js');
const parseString = new xml2js.Parser({explicitArray : false}).parseString;

var mongoUtil = require( './../mongoConfig' );
var db = mongoUtil.getDb();
var papers = db.collection('papers');
var list = db.collection('list');

// middleware that is specific to this router
router.use(function timeLog (req, res, next) {
  console.log(req.method, 'Papers query at: ', Date.now(), req.ip);
  if(req.method !== "GET"){
    auth.isApiKeyValid( req, res, next );
  }else{
    next();
  }
})
// define the home page route
router.get('/name/:AlgorithmName', function (req, res) {
  if ( req.params.AlgorithmName){
    list.findOne({title:req.params.AlgorithmName}, function(err, data){
      if(data){
        papers.find({AlgorithmName:req.params.AlgorithmName}).limit(100).toArray((err, docs)=>{
          if(docs.length != 0){
            res.json( docs );
          }else{
            res.send("We don't have this algorithm information, try again in 2 minutes.")
            fetchFromIEEE(req.params.AlgorithmName);
          }
        });
      }
      else{
        res.send("Error: This name do not match with any algorithm register");
      }
    });
  }
  else{
    res.send("Error: No name included");
  }
});

router.get('/titles/:AlgorithmName', function (req, res) {
  var query = {AlgorithmName:req.params.AlgorithmName};
  var project = { title: 1, AlgorithmName:1 };
  var sort = req.query.sort ? JSON.parse(req.query.sort) : {};
  var limit = req.query.limit ? parseInt(req.query.limit) : 10;
  var skip = req.query.skip ? parseInt(req.query.skip) : 0;
  papers.find(query, project).sort(sort).skip(skip).limit(limit).toArray((err, docs)=>{
    res.jsonp(docs);
  });
});

router.get('/count', function (req, res) {
  var agregateArray = [];
  agregateArray.push({$group:
    {
      _id: {AlgorithmName:"$AlgorithmName", py :"$py"},
      count: { $sum: 1 }
    }
  });
  agregateArray.push({$group:
    {
      _id: {AlgorithmName:"$_id.AlgorithmName"},
      countYears: {$push: { year:"$_id.py", count:"$count"  }},
      count: { $sum: "$count" }
    }
  });
  agregateArray.push({ $sort: { count: -1 } });
  papers.aggregate(agregateArray, (err, data)=>{
    res.jsonp(data);
  });
});

let fetchFromIEEE = function(AlgorithmName) {
  let webRes = "";
  let NoArtPerPage = 1000; //default
  let pageNumber = 0;
  let rs = NoArtPerPage * pageNumber;
  let totalFound = 0;
  let urlApi = "http://ieeexplore.ieee.org/gateway/ipsSearch.jsp";
  let sortParams = "&sortfield=py&sortorder=desc";
  let allPapers = [];

  axios.get(urlApi + "?ab=" + AlgorithmName + "&hc=1")
    .then(response => {
      parseString(response.data, (err, result)=>{
        totalFound = result.root.totalfound;
        console.log("Number of Articles Found: ", totalFound);
        getNextBatch();
      })
    }).catch(error => {
      console.log(error);
    });

  let getNextBatch = function(){
    rs = NoArtPerPage * pageNumber + 1;
    axios.get(urlApi + "?ab=" + AlgorithmName + "&rs=" + rs + sortParams + "&hc=" + NoArtPerPage)
      .then(response => {
        parseString(response.data, (err, result)=>{
          if (err) console.log(err);
          result.root.document.forEach( a =>{
            a.AlgorithmName = AlgorithmName;
          });
          papers.insertMany(result.root.document, (err, r)=>{
            console.log((NoArtPerPage * pageNumber + result.root.document.length) + " papers were succesfully added", AlgorithmName);
            pageNumber += 1
            if (NoArtPerPage * pageNumber + 1< totalFound){
              getNextBatch();
            }
          });
        })
      }).catch(error => {
        console.log(error);
      });
  }
}


module.exports = router;
