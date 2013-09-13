var db = require('../db')({database:'./test.nosql'})
var async = require('async')

var S_OK = 'SUCCEEDED'
var E_FAIL = 'FAILED'


function exit(){
  db.deleteAll(function(){
    process.exit()  
  })
}

var MAX_TIME = 1000
setTimeout(
  function(){
    console.log('killed in max time')
    exit()
  }, 
  MAX_TIME)


console.log('start db test')

var item1 = {
  uuid : '52c124e0-cbcd-11e2-b635-597c8217dfaf',
  name: 'item1'
}

var item2 = {    
  name: 'item2'
}

function testSave(iItem, iCallback){
  db.save(iItem, function(err, dbItem, created){
    if(err || !dbItem){
      iCallback(err, null)
    }else{
      iCallback(null, {dbItem: dbItem, created:created})
    }
  })
}

function testFetchOne(iUuid, iCallback){
  db.fetchOne(iUuid, function(err, dbItem){
    if(err || !dbItem){
      iCallback(err, null)
    }else{
      iCallback(null, dbItem)
    }
  }) 
}

function testSaveItem1(iCallback){
  testSave(item1, function(err, result){
    if(err){iCallback(null, S_OK)}
    else{iCallback(E_FAIL, E_FAIL)}
  })
}

function testFetchOneItem1(iCallback){
  testFetchOne(item1.uuid, function(err, result){
    if(err){iCallback(null, S_OK)}
    else{iCallback(E_FAIL, E_FAIL)}
  })
}

function testSaveItem2(iCallback){
  testSave(item2, function(err, result){
    if(err){iCallback(err, E_FAIL)}
    else{
      item2 = result.dbItem
      if(result.created){iCallback(null, S_OK)}
      else{iCallback('not created but expected to...', E_FAIL)}
    }
  })
}

function testFetchOneItem2(iCallback){
  testFetchOne(item2.uuid, function(err, result){
    if(err){iCallback(err, E_FAIL)}
    else{
      if(result){iCallback(null, S_OK)}
      else{iCallback('no result but one expected...', E_FAIL)}
    }
  })
}



async.series(
  {
    saveItem1: function(callback){return testSaveItem1(callback)},
    readItem1: function(callback){return testFetchOneItem1(callback)},
    saveItem2: function(callback){return testSaveItem2(callback)},
    readItem2: function(callback){return testFetchOneItem2(callback)}
  },

  function finishCallback(err, results){
    console.log('test results:'+JSON.stringify(results))
    exit()
  })



