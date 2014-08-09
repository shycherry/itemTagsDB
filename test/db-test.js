var db = require('../db')({database:'./test.nosql'})
var async = require('async')

var S_OK = 'SUCCEEDED'
var E_FAIL = 'FAILED'


function exit(){
  db.deleteAll(function(){
    process.exit()  
  })
}

// var MAX_TIME = 1000
// setTimeout(
//   function(){
//     console.log('killed in max time')
//     exit()
//   }, 
//   MAX_TIME)


console.log('start db test')

var item1 = {
  uuid : '52c124e0-cbcd-11e2-b635-597c8217dfaf',
  name: 'item1'
}

var item2 = {    
  name: 'item2'
}

var item3 = {
  name: 'item3'
}

function testSave(iItem, iCallback){
  db.save(
    iItem,
    (function(iItem){
      return function(err, dbItem, created){
        if(err || !dbItem){
          iCallback(err, null)
        }else if(dbItem.name != iItem.name){
          iCallback('wrong name ! got '+dbItem.name+' expected '+iItem.name, null)
        }else{
          iCallback(null, {dbItem: dbItem, created:created})
        }
      }
    })(iItem))
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

function testFetchAll(iCallback){
  db.fetchAll(function(err, dbItems){
    if(err){iCallback('error fechtingAll', E_FAIL)}
    else{iCallback(null, S_OK)}
  })
}

function testSaveItem1(iCallback){
  testSave(item1, function(err, result){
    if(err){iCallback(E_FAIL, E_FAIL)}
    else{iCallback(null, S_OK)}
  })
}

function testFetchOneItem1(iCallback){
  testFetchOne(item1.uuid, function(err, result){
    if(err){iCallback(E_FAIL, E_FAIL)}
    else{iCallback(null, S_OK)}
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

function testSaveItem3(iCallback){
  testSave(item3, function(err, result){
    if(err){iCallback(err, E_FAIL)}
    else{
      item3 = result.dbItem
      if(result.created){iCallback(null, S_OK)}
      else{iCallback('not created but expected to...', E_FAIL)}
    }
  }) 
}

function testUpdateItem2(iCallback){
  item2.name = item2.name+'_updated'
  testSave(item2, function(err, result){
    if(err){iCallback(err, E_FAIL)}
    else{
      item2 = result.dbItem
      iCallback(null, S_OK)      
    }
  })  
}


function testUpdateItem3(iCallback){
  item3.name = item3.name+'_updated'
  testSave(item3, function(err, result){
    if(err){iCallback(err, E_FAIL)}
    else{
      item3 = result.dbItem
      iCallback(null, S_OK)      
    }
  })  
}

function testRemoveItem1(iCallback){
  db.deleteOne(item1.uuid, function(err, result){
    if(err){iCallback(err, E_FAIL)}
    else if(result != 1){iCallback(E_FAIL, E_FAIL)}
    else(iCallback(null, S_OK))
  })
}

function testRemoveItem2(iCallback){
  db.deleteOne(item2.uuid, function(err, result){
    if(err){iCallback(err, E_FAIL)}
    else if(result != 1){iCallback(E_FAIL, E_FAIL)}
    else(iCallback(null, S_OK))
  })
}

function testUpdateItemsParallel(iCallback){  
  async.parallel(
  {
    updateItem2: function(callback){console.log(JSON.stringify(item2)); return testUpdateItem2(callback)},
    updateItem3: function(callback){console.log(JSON.stringify(item3)); return testUpdateItem3(callback)},
    updateItem2_1: function(callback){console.log(JSON.stringify(item2)); return testUpdateItem2(callback)},
    updateItem3_1: function(callback){console.log(JSON.stringify(item3)); return testUpdateItem3(callback)},
    updateItem2_2: function(callback){console.log(JSON.stringify(item2)); return testUpdateItem2(callback)},
    updateItem3_2: function(callback){console.log(JSON.stringify(item3)); return testUpdateItem3(callback)},
    updateItem2_3: function(callback){console.log(JSON.stringify(item2)); return testUpdateItem2(callback)},
    updateItem3_3: function(callback){console.log(JSON.stringify(item3)); return testUpdateItem3(callback)}
  },
  
  function finishCallback(err, results){
    iCallback(err, results)
  })
}


async.series(
  {
    saveItem1: function(callback){return testSaveItem1(callback)},
    readItem1: function(callback){return testFetchOneItem1(callback)},
    saveItem2: function(callback){return testSaveItem2(callback)},
    readItem2: function(callback){return testFetchOneItem2(callback)},
    saveItem3: function(callback){return testSaveItem3(callback)},
    updateItemsParallel: function(callback){return testUpdateItemsParallel(callback)},
    fetchAll: function(callback){return testFetchAll(callback)},
    removeItem1: function(callback){return testRemoveItem1(callback)},
    removeItem2: function(callback){return testRemoveItem2(callback)},
  },

  function finishCallback(err, results){
    console.log('erreurs: '+JSON.stringify(err))
    console.log('test results:'+JSON.stringify(results))
    exit()
  })

