var fs = require('fs');
var async = require('async');

var S_OK = 'SUCCEEDED';
var E_FAIL = 'FAILED';

var DIFF_DB_PATH_1 = './diff-test-1.nosqltest';
var TMP_DIFF_DB_PATH_1 = './tmp-diff-test-1.nosql';

var DIFF_DB_PATH_2 = './diff-test-2.nosqltest';
var TMP_DIFF_DB_PATH_2 = './tmp-diff-test-2.nosql';

var db1 = null;
var db2 = null;
var watcher = null;

function loadDbs(iCallback){
  console.log('loadDbs test');
  db1 = require('../db')({database:TMP_DIFF_DB_PATH_1});
  db2 = require('../db')({database:TMP_DIFF_DB_PATH_2});

  iCallback(null, S_OK);
}

function rmDB(){
  fs.unlinkSync(TMP_DIFF_DB_PATH_1);
  fs.unlinkSync(TMP_DIFF_DB_PATH_2);
}

function testDiff1(iCallback){
  console.log('testDiff1');
  var filter = {
    "@file":{"uri":"/"} //todo change syntax ?
  };
  
  db1.diffDb(db2, JSON.stringify(filter), function(err, iDiffReport){
    console.log('diff report:');
    console.log(JSON.stringify(iDiffReport,2,2));
    if(err){
      iCallback(err, E_FAIL);
    }else{
      iCallback(null, S_OK);
    }
  });
}

console.log('start diff-test');
async.series(
  {
    copyDb : function(callback){return copyFile(DIFF_DB_PATH_1, TMP_DIFF_DB_PATH_1, callback);},
    copyDb2 : function(callback){return copyFile(DIFF_DB_PATH_2, TMP_DIFF_DB_PATH_2, callback);},
    loadDbs : function(callback){return loadDbs(callback);},
    diff1: function(callback){return testDiff1(callback);}
  },

  function finishCallback(err, results){
    console.log('erreurs: '+JSON.stringify(err));
    console.log('test results:'+JSON.stringify(results, 2, 2));
    rmDB();
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
