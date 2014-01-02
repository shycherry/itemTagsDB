var fs = require('fs');
var async = require('async');
var https = require('https');

var S_OK = 'SUCCEEDED';
var E_FAIL = 'FAILED';
var DB_PATH = './temp-rest-test.nosql';
var DB_PORT = 1337;

var db = null;
var createdItem1 = null;


function loadDb(iCallback){
  //open it and create the rest server
   db = require('../db')({
    database:DB_PATH,
    newServerPort: DB_PORT
  });
  iCallback();
}

function exit(){
  fs.unlinkSync(DB_PATH);
}

console.log('start rest test');


function testGetItems(iCallback){
  db.save({'truc':'machin'}, function(err, item){
    createdItem1 = item;
  });
  var req = https.request(
    {
      hostname: 'localhost',
      port: DB_PORT,
      path: '/items',
      method: 'GET',
      rejectUnauthorized: false,
      requestCert: true,
      agent: false
    },
    function(res){
      var body = [];
      res.on('data', function(data){
        body.push(data);
      });
      res.on('end', function(){
        if(body.join('') !== '')
          iCallback(null, S_OK);
        else
          iCallback('emptybody', E_FAIL);
      });
    }
  );
  req.end();
  req.on('error', function(err){
    iCallback(err, E_FAIL);
  });
}

function testDeleteItem(iCallback){
 var req = https.request(
    {
      hostname: 'localhost',
      port: DB_PORT,
      path: '/items/item/'+createdItem1.uuid,
      method: 'DELETE',
      rejectUnauthorized: false,
      requestCert: true,
      agent: false
    },
    function(res){
      var body = [];
      res.on('data', function(data){
        body.push(data);
      });
      res.on('end', function(){
        if(body.join('') !== '1')
          iCallback('bad delete count', E_FAIL);
        else
          iCallback(null, S_OK);
      });
    }
  );
  req.end();
  req.on('error', function(err){
    iCallback(err, E_FAIL);
  });
}

async.series(
  {
    copyDb : function(callback){return copyFile('./rest-test.nosql', DB_PATH, callback);},
    loadDb : function(callback){return loadDb(callback);},
    getItems: function(callback){return testGetItems(callback);},
    deleteItem: function(callback){return testDeleteItem(callback);}
  },

  function finishCallback(err, results){
    console.log('erreurs: '+JSON.stringify(err));
    console.log('test results:'+JSON.stringify(results));
    exit();
  }
);




//
//utilities 
//

function copyFile(source, target, cb) {
  //create a copy of db
  if(fs.existsSync(target)){
    fs.unlinkSync(target);
  }

  var cbCalled = false;

  var rd = fs.createReadStream(source);
  rd.on("error", function(err) {
    done(err);
  });
  var wr = fs.createWriteStream(target);
  wr.on("error", function(err) {
    done(err);
  });
  wr.on("close", function(ex) {
    done();
  });
  rd.pipe(wr);

  function done(err) {
    if (!cbCalled) {
      cb(err);
      cbCalled = true;
    }
  }
}
