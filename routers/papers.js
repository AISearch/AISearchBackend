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
});

router.get('/', function (req, res) {
  var query = req.query.query ? JSON.parse(req.query.query) : {};
  var sort = req.query.sort ? JSON.parse(req.query.sort) : {};
  var limit = req.query.limit ? parseInt(req.query.limit) : 10;
  var skip = req.query.skip ? parseInt(req.query.skip) : 0;
  var tepmF = papers.find(query).sort(sort);
  tepmF.count((err, count)=>{
    var returnData = {
      count:count,
      page: Math.floor(skip/limit),
      totalPages: Math.ceil(count/limit),
    }
    tepmF.skip(skip).limit(limit).toArray((err, docs)=>{
      returnData.docs = docs;
      res.jsonp(returnData);
    });
  })
})

// define the home page route
router.get('/name/:AlgorithmName', function (req, res) {
  if ( req.params.AlgorithmName){
    list.findOne({title:req.params.AlgorithmName}, function(err, data){
      if(data){
        papers.find({algorithmname:req.params.AlgorithmName}).limit(100).toArray((err, docs)=>{
          if(docs.length != 0){
            res.json( docs );
          }else{
            res.send("We don't have this algorithm information, try again in 2 minutes.")
            fetchFromIEEE(req.params.AlgorithmName);
            fetchFromElsevier(req.params.AlgorithmName);
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
  var query = {algorithmname:req.params.AlgorithmName};
  var project = { title: 1, AlgorithmName:1 };
  var sort = req.query.sort ? JSON.parse(req.query.sort) : {};
  var limit = req.query.limit ? parseInt(req.query.limit) : 10;
  var skip = req.query.skip ? parseInt(req.query.skip) : 0;
  papers.find(query, project).sort(sort).skip(skip).limit(limit).toArray((err, docs)=>{
    res.jsonp(docs);
  });
});

router.get('/ownPapers/:AlgorithmName', function (req, res) {
  var query = {"algorithmname":req.params.AlgorithmName, "title":{"$regex":req.params.AlgorithmName, "$options": "i"}};
  var project = { title: 1, AlgorithmName:1 };
  var sort = req.query.sort ? JSON.parse(req.query.sort) : {};
  var limit = req.query.limit ? parseInt(req.query.limit) : 10;
  var skip = req.query.skip ? parseInt(req.query.skip) : 0;
  papers.find(query, project).sort(sort).skip(skip).limit(limit).toArray((err, docs)=>{
    res.jsonp(docs);
  });
});

router.get('/countWords/:AlgorithmName', function (req, res) {
  var query = {"algorithmname":req.params.AlgorithmName, "title":{"$regex":req.params.AlgorithmName, "$options": "i"}};
  var project = { title: 1, AlgorithmName:1 };
  var countWords = {}
  var commondWords = "algorithm algorithms of for using based and on in the with to by an a system problem application method problems research solving it its test non approach " + req.params.AlgorithmName.toLowerCase()
  papers.find(query, project).forEach((doc)=>{
    doc.title.toLowerCase().match(/([a-zA-Z'-]+)\w+/g).reduce((x,r)=>{
      if(commondWords.includes(r)) return x;
      if(x[r]){
        x[r]++;
      }else{
        x[r] = 1;
      }
      return x;
    }, countWords);
  },function(err){
    function sortObject(obj) {
      var arr = [];
      for (var prop in obj) {
          if (obj.hasOwnProperty(prop)) {
              arr.push([ prop, obj[prop] ]);
          }
      }
      arr.sort(function(a, b) { return b[1] - a[1]; });
      //arr.sort(function(a, b) { a.value.toLowerCase().localeCompare(b.value.toLowerCase()); }); //use this to sort as strings
      return arr; // returns array
    }
    var arr = sortObject(countWords);
    if(!req.query.limit){
      arr = arr.slice(0,100);
    }else {
      arr = arr.slice(0,req.query.limit);
    }
    if(!req.query.asText){
      res.jsonp(arr);
    }else{
      r = "";
      max = arr[0][1];
      min = arr[arr.length-1][1];
      arr.forEach(p => {
        for(var i=0; i<Math.floor(p[1]/max * 10); i++) r += p[0] + " ";
      })
      res.send(r);
    }
  });
});

router.get('/count', function (req, res) {
  var countCache = db.collection('countCache');
  countCache.find().toArray((err, docs)=>{
    res.jsonp(docs);
  });
});

router.get('/updateCount', function (req, res) {
  var agregateArray = [];
  agregateArray.push({$group:
    {
      _id: {algorithmname:"$algorithmname", year :"$year"},
      count: { $sum: 1 }
    }
  });
  agregateArray.push({ $sort: { year: 1 } });
  agregateArray.push({$group:
    {
      _id: {algorithmname:"$_id.algorithmname"},
      countYears: {$push: { year:"$_id.year", count:"$count"  }},
      count: { $sum: "$count" }
    }
  });
  agregateArray.push({ $sort: { count: -1 } });
  agregateArray.push({ $out: "countCache" });
  papers.aggregate(agregateArray).toArray().then((data)=>{
    res.jsonp(data);
  });
});

router.get('/papersPerYear', function (req, res) {
  var papersPerYear = db.collection('papersPerYear');
  papersPerYear.find().toArray((err, docs)=>{
    res.jsonp(docs);
  });
});

//this is too computational heavy, it is best to cache the answer.
router.get('/updatePapersPerYear', function (req, res) {
  var agregateArray = [];
  agregateArray.push({$group:
    {
      _id: {algorithmname:"$algorithmname", year:"$year"},
      countReferences: {$sum : 1},
      doi: {$push: "$doi"}
    }
  });
  agregateArray.push({ $unwind : "$doi" });
  agregateArray.push({$group:
    {
      _id: {year:"$_id.year"},
      algorithms: { $addToSet : {
        algorithmname:"$_id.algorithmname",
        countReferences: "$countReferences"
      }},
      doiArray:{$addToSet:"$doi"}
    }
  });
  agregateArray.push({$project:
    {
      year: "$id_year",
      algorithms: 1,
      papers: { $size: "$doiArray" },
    }
  });
  agregateArray.push({ $unwind : "$algorithms" });
  agregateArray.push({ $sort: { "algorithms.countReferences": -1 } })
  agregateArray.push({$group:
    {
      _id: {year:"$_id.year"},
      algorithms: { $push : "$algorithms"},
      papers: {$first: "$papers"}
    }
  });
  agregateArray.push({ $sort: { "_id.year": 1 } });
  agregateArray.push({ $out: "papersPerYear" });

  papers.aggregate(agregateArray).toArray().then((data)=>{
    res.jsonp(data);
  });
});

router.get('/papersPerAuthor/:author', function (req, res) {
  var agregateArray = [];
  agregateArray.push({ $match: { authors: { "$elemMatch" : {"$regex" : req.params.author }}}});
  agregateArray.push({ $unwind : "$authors" });
  agregateArray.push({ $group:
    {
      _id: {authors:"$authors"},
      count: {$sum : 1},
      papers: {$addToSet : "$title"},
    }
  });
  agregateArray.push({ $match: { "_id.authors": {"$regex" : req.params.author }}});
  agregateArray.push({ $sort: { "count": -1 } });
  papers.aggregate(agregateArray, {allowDiskUse : true}).toArray().then((data)=>{
    res.jsonp(data);
  });
});
router.get('/papersPerPub', function (req, res) {
  var agregateArray = [];
  agregateArray.push({ $group:
    {
      _id: {pubtitle:"$pubtitle", doi:"$doi"},
    }
  });
  agregateArray.push({ $group:
    {
      _id: {pubtitle:"$_id.pubtitle"},
      count: {$sum:1},
    }
  });
  agregateArray.push({ $sort: { "count": -1 } });
  papers.aggregate(agregateArray).toArray().then((data)=>{
    res.jsonp(data);
  });
});

router.get('/algorithmAuthors/:algName', function(req, res){
  var agregateArray = [];
  agregateArray.push({ $match: { "algorithmname": req.params.algName }});
  agregateArray.push({ $unwind : "$authors" });
  agregateArray.push({ $group:
    {
      _id: { authors:"$authors" },
      count: {$sum: 1 },
    }
  });
  agregateArray.push({ $sort: { "count": -1 } });
  agregateArray.push({ $limit: 100 });
  papers.aggregate(agregateArray).toArray().then((data)=>{
    res.jsonp(data);
  });
});

router.get('/papersPerPub/:pubtitle', function (req, res) {
  var agregateArray = [];
  agregateArray.push({ $match: { "pubtitle": {"$regex" : req.params.pubtitle }}});
  agregateArray.push({ $group:
    {
      _id: {pubtitle:"$pubtitle", doi:"$doi"},
      title: {$first:"$title"},
    }
  });
  agregateArray.push({ $group:
    {
      _id: {pubtitle:"$_id.pubtitle"},
      count: {$sum:1},
      titles: {$push:"$title"}
    }
  });
  agregateArray.push({ $sort: { "count": -1 } });
  papers.aggregate(agregateArray).toArray().then((data)=>{
    res.jsonp(data);
  });
});


router.get('/fetchThemAll', function(req, res){
  var yearStop = req.query.year || 0;
  list.find({},{title:1}).toArray((err, docs)=>{
    docs.forEach(d => {
      fetchFromIEEE(d.title, yearStop);
      fetchFromElsevier(d.title, yearStop);
    });
  });
});
router.get('/fetchIEEE/:AlgorithmName', function (req, res) {
  var yearStop = req.query.year || 0;
  if ( req.params.AlgorithmName){
    list.findOne({title:req.params.AlgorithmName}, function(err, data){
      if(data){
        fetchFromIEEE(req.params.AlgorithmName, yearStop);
      }
    });
  }
});
router.get('/fetchElsevier/:AlgorithmName', function (req, res) {
  var yearStop = req.query.year || 0;
  if ( req.params.AlgorithmName){
    list.findOne({title:req.params.AlgorithmName}, function(err, data){
      if(data){
        fetchFromElsevier(req.params.AlgorithmName, yearStop);
      }
    });
  }
});

let fetchFromIEEE = function(AlgorithmName, yearStop = 0) {
  let NoArtPerPage = 1000; //default
  let pageNumber = 0;
  let rs = NoArtPerPage * pageNumber;
  let totalFound = 0;
  let urlApi = "http://ieeexplore.ieee.org/gateway/ipsSearch.jsp";
  let sortParams = "&sortfield=py&sortorder=desc";


  axios.get(urlApi + '?querytext="' + AlgorithmName + '"&hc=1')
    .then(response => {
      parseString(response.data, (err, result)=>{
        if(!result.Error){
          totalFound = result.root.totalfound;
          console.log("IEEE Number of Articles Found: ", totalFound);
          getNextBatch();
        }
      })
    }).catch(error => {
      console.log(error);
    });

  let getNextBatch = function(){
    rs = NoArtPerPage * pageNumber + 1;
    console.log("Loading Page:", pageNumber)
    //console.log(urlApi + '?ab="' + AlgorithmName + '"&rs=' + rs + sortParams + "&hc=" + NoArtPerPage)
    axios.get(urlApi + '?querytext="' + AlgorithmName + '"&rs=' + rs + sortParams + "&hc=" + NoArtPerPage)
      .then(response => {
        var papersR = [];
        parseString(response.data, (err, result)=>{
          if (err) console.log(err);
          result.root.document.forEach( a =>{
            try{
              var data = {};
              data.title = a.title.trim();
              data.authors = a.authors.split(";");
              data.authors.forEach((au,ind)=>{
                data.authors[ind] = data.authors[ind].trim();
              });
              data.year = a.py;
              data.pubtitle = a.pubtitle;
              data.doi = a.doi;
              data.link = a.mdurl;
              data.algorithmname = AlgorithmName;
              papersR.push(data);
            }catch(e){
              console.log("Fail parse:", a.title.trim());
            }
          });
          papers.insertMany(papersR, {ordered: false}, (err, r)=>{
            console.log("IEEE: " + (NoArtPerPage * pageNumber + papersR.length) + " papers were succesfully added", AlgorithmName);
            pageNumber += 1
            if (NoArtPerPage * pageNumber + 1 < totalFound){
              if(papersR[papersR.length-1].year > yearStop - 1) getNextBatch();
            }else{
              console.log("IEEE Fetch succesfull");
            }
          });
        });
      }).catch(error => {
        console.log(error);
      });
  }
}

let fetchFromElsevier = function(AlgorithmName, yearStop = 0) {
  let NoArtPerPage = 200; //default
  let pageNumber = 1;
  let rs = 0;
  let totalFound = 0;
  let apiKey = process.env.elsevierKey;
  let urlApi = "http://api.elsevier.com/content/search/scidir?apiKey="+apiKey+"&httpAccept=application/json&content=journals";
  let sortParams = "&sort=+coverDate";
  let DateObj = new Date;
  let thisYear = parseInt(DateObj.getFullYear().toString()) + 1;
  let startYear = yearStop;
  let nextUrl = "";

  axios.get(urlApi + '&query=%22' + AlgorithmName + '%22&count=1' + sortParams)
    .then(response => {
      //console.log(response.data)
      totalFound = parseInt(response.data["search-results"]["opensearch:totalResults"]);
      var date = response.data["search-results"]["entry"][0]["prism:coverDisplayDate"];
      startYear = startYear || parseInt(date.substring(date.length-4));
      console.log("Elsevier " + totalFound + " Articles Found, staring at year " + startYear);
      nextUrl = urlApi + '&query=%22' + AlgorithmName + '%22&count=' + NoArtPerPage + sortParams + "&date=" + startYear;
      if(totalFound) getNextBatch();
    }).catch(error => {
      console.log(error);
    });

  let getNextBatch = function(){
    console.log("Loading Page:" + pageNumber + " of year:" + startYear)
    //console.log(nextUrl);
    axios.get(nextUrl)
      .then(response => {
        var papersR = [];
        if (response.data["search-results"]["opensearch:totalResults"] != "0"){
          response.data["search-results"]["entry"].forEach( a =>{
            try{
              var data = {};
              data.title = a["dc:title"].trim();
              var authors = [];
              if(a.authors){
                a.authors.author.forEach(au => {
                  authors.push(au["given-name"] + " " + au["surname"]);
                })
              }
              data.authors = authors;
              var date = a["prism:coverDisplayDate"];
              data.year = date.substring(date.length-4);
              data.pubtitle = a["prism:publicationName"];
              data.doi = a["prism:doi"];
              data.link = a.link[1]["@href"];
              data.algorithmname = AlgorithmName;
              papersR.push(data);
            }catch(e){
              console.log("Fail parse:", a);
            }
          });
        }
        rs += papersR.length;
        var tempF = function(){
          if(response.data["search-results"]["opensearch:totalResults"]=="0" || response.data["search-results"].link.length < 3){
            startYear++
            nextUrl = urlApi + '&query=%22' + AlgorithmName + '%22&count=' + NoArtPerPage + sortParams + "&date=" + startYear;
            pageNumber = 1;
          }else{
            if(response.data["search-results"].link[2]["@ref"] !== "prev"){
              console.log(response.data["search-results"].link[2]["@ref"]);
              nextUrl = response.data["search-results"].link[2]["@href"];
              pageNumber += 1;
            }else{
              startYear++
              nextUrl = urlApi + '&query=%22' + AlgorithmName + '%22&count=' + NoArtPerPage + sortParams + "&date=" + startYear;
              pageNumber = 1;
            }
          }
          if (startYear <= thisYear){
            getNextBatch();
          }else{
            console.log("Elsevier Fetch succesfull");
          }
        }
        if(papersR.length != 0){
          papers.insertMany(papersR, {ordered: false}, (err, r)=>{
            console.log("Elsevier: " + rs + " papers were succesfully added", AlgorithmName);
            tempF();
          });
        }else{
          tempF();
        }
      }).catch(error => {
        console.log(error);
      });
  }

}


module.exports = router;
