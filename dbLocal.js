module.exports = function (options) {
   
  /**
   * Module options
   */
  var async = require('async');
  var uuid = require('uuid');
  var nosql = null;
  var Item = require('./item');
  if ('undefined' != typeof options) _set_options_(options);
  
  /**
   * Privates
   */
  function _set_options_(options){
    if('undefined' != typeof options.database){
      nosql = require('nosql').load(options.database);
      console.log(options.database+' db loaded !');
    }
  }
  
  function _uuidNoSqlFilter_(uuid){
    return function(dbItem){
      return uuid == dbItem.uuid;
    };
  }

  function _isTagFilter_(itemFilter){
    var isTagFilter = true;

    for(var filterProp in itemFilter){
      var filterPropValue = itemFilter[filterProp];
      if(filterProp[0] !== '@'){
        isTagFilter = false;
        break;
      }
      if( typeof(filterPropValue) === 'object' ){
        isTagFilter = false;
        break;
      }
    }

    return isTagFilter;
  }

  function _isFilterMatching_(itemFilter, itemToTest){
    var isMatching = true;
    for(var filterProp in itemFilter){
      var filterPropValue = itemFilter[filterProp];

      if(!itemToTest){
        isMatching = false;
        break;
      }
      
      if( typeof(filterPropValue) === 'object' ){
        isMatching = _isFilterMatching_(filterPropValue, itemToTest[filterProp]);
        if(!isMatching) break;
      }      
      else if( (filterPropValue === '/') ){        
        if( !itemToTest.hasOwnProperty(filterProp)){
          isMatching = false;
          break;
        }
      }
      else if( (filterPropValue === "\\" ) ){
        if( itemToTest.hasOwnProperty(filterProp)){
          isMatching = false;
          break;
        }
      }
      else if( (filterPropValue != itemToTest[filterProp]) ){
        isMatching = false;
        break;
      }
    }
    return isMatching;    
  }
  
  /**
   * Protected
   */
  function fetchAll (callback) {
    nosql.all(null, function(dbItems){
      callback(undefined, Item.getNewItemCollection(dbItems));
    });
  }

  function dumpDb(){
    fetchAll(function(err, data){
      console.log(JSON.stringify(data, 2, 2));
    });
  }

  function saveMany(input, callback){
    if(!callback)
      callback = function(){};
    
    if(Array.isArray(input)){
      return async.each(input, save, callback);
    }else{
      return callback('expected array');
    }
  }

  function save (item, callback) {
    if(!callback)
      callback = function(){};

    function _create(item, callback){
      item.uuid = uuid.v1();
      nosql.insert(item, function(){
        callback(undefined, item, true);
      });
    }

    var hasNoUuid = ('undefined' == typeof item.uuid);
    if( hasNoUuid ){
      _create(item, callback);
    }else{
      fetchOne(item.uuid, function(err, dbItem){
        if(err){ 
          _create(item, callback);
        }else{
          if(dbItem){
            nosql.update(
              function(dbItem){
                if(dbItem && (dbItem.uuid == item.uuid)){
                  dbItem = item;
                }
                return dbItem;
              },
              function(){
                callback(undefined, item, false);
              }
            );
          }
        }
        
      });
    }
  }

  function fetchItemsSharingTags(tagsList, callback){
    fetchAll(function(err, items){
      var itemsSharingTags = [];
      for(var itemIdx in items){
        var currentItem = items[itemIdx];
        if(currentItem.hasAllTags(tagsList)){
          itemsSharingTags.push(currentItem);
        }
      }
      callback(undefined, itemsSharingTags);
    });
  }

  function fetchAllTags(callback){
    fetchAll(function(err, items){
      var tagsList=[];
      for(var itemIdx in items){
        var itemTags = items[itemIdx].getTags();
        if(itemTags){
          for(var tagIdx in itemTags){
            if(tagsList.lastIndexOf(itemTags[tagIdx]) == -1){
              tagsList.push(itemTags[tagIdx]);
            }
          }
        }
      }
      callback(undefined, tagsList);
    });
  }

  function createStrictFilter(itemFilter, item){
    var resultFilter = {};
    for(var filterProp in itemFilter){
      var filterPropValue = itemFilter[filterProp];
      if( typeof(filterPropValue) === 'object' ){
        resultFilter[filterProp] = createStrictFilter(filterPropValue, item[filterProp]);
      }else{
        resultFilter[filterProp] = item[filterProp];
      }
    }
    return resultFilter;
  }

  function fetchAllByFilter(iFilter, callback){
    if(!iFilter){
      if(callback) {callback('no filter');}
    }

    var objFilter = iFilter;
    if(typeof(objFilter) !== 'object' ){
      try{
        objFilter = JSON.parse(iFilter);
      }catch(e){
        if(callback) {callback('bad filter');} 
        return;
      }
    }

    fetchAll(function(err, items){
      if(err){
        if(callback) {callback(err);}
      }
      var matchingItems = [];
      for(var itemIdx in items){
        var currentItem = items[itemIdx];
        if( _isFilterMatching_(objFilter, currentItem) ){
          matchingItems.push(currentItem);
        }
      }
      callback(undefined, matchingItems);
    });
  }

  function fetchOneByFilter(iFilter, callback){
    fetchAllByFilter(iFilter, function(err, items){
      if(err){
        if(callback){callback(err);}        
      }

      if(items && items.length >= 1){
        if(callback){callback(undefined, items[0]);}
      }else{
        if(callback){callback('no fetch !');}
      }

    });
  }

  function fetchOne (uuid, callback) {
    nosql.one(_uuidNoSqlFilter_(uuid), function(dbItem){
      if(!dbItem){
        callback('not found !');
      }
      else{
        callback(undefined, Item.getNewItem(dbItem));
      }
    });
  }
  
  function deleteMany (input, callback) {
    if(!callback)
      callback = function(){};

    function _deleteItem(item, callback){
      var uuidToDelete = item;
      if(typeof(item) === 'object'){
        uuidToDelete = item['uuid'];
      }
      nosql.remove(_uuidNoSqlFilter_(uuidToDelete), function(removedCount){
        callback(undefined, removedCount);
      });  
    }

    if(Array.isArray(input)){
      return async.each(input, _deleteItem, callback);
    }else{
      return callback('expected array');
    }
  }
  
  function deleteOne (uuid, callback) {
    nosql.remove(_uuidNoSqlFilter_(uuid), function(removedCount){
      callback(undefined, removedCount);
    });
  }
  
  function deleteAll (callback) {
    nosql.clear(function(){
      if(callback) callback(undefined);
    });
  }

  function cloneDb(iDb, callback) {
    if(!iDb){
      if(callback) callback('no input db !');
    }

    this.deleteAll(function(err){
      iDb.fetchAll(function(err, items){
        if(err){
          if(callback) callback(err);
        }else{

          var insertFunctions = [];

          var getInsertRawItemFn = function(item){
            return function(callback){
              nosql.insert(item, function(){
                callback(undefined);
              });
            }
          };

          for(var itemIdx in items){
            insertFunctions.push(getInsertRawItemFn(items[itemIdx]));
          }

          async.series(insertFunctions, function(err){
            if(err){
              if(callback) callback(err);
            }else{
              if(callback) callback(undefined);
            }
          });
          
        }
        
      });
      
    });
    
  }

  function diffDb (iDb, iFilter, callback) {
    var diffReport = {};
    var newItems = diffReport['onlyDB1'] = [];
    var removedItems = diffReport['onlyDB2'] = [];

    var objFilter = iFilter;
    if(typeof(objFilter) !=='object'){
      try{
        objFilter = JSON.parse(iFilter);
      }catch(e){
        if(callback) {callback('bad filter');} 
        return;
      }  
    }

    if(!iDb){
      if(callback) {callback('no comparison db');}
      return;
    }

    var self = this;
    var isTagFilter = _isTagFilter_(iFilter);

    async.series(
      {
        "matchesDB1" : function(callback){ return self.fetchAllByFilter(objFilter, callback); },
        "matchesDB2" : function(callback){ return iDb.fetchAllByFilter(objFilter, callback); }
      },
      compareMatchs
    );

    function compareMatchs(err, results){
      var matchesDB1 = results["matchesDB1"];
      var matchesDB2 = results["matchesDB2"];
      // console.log('matchesDB1 :'+JSON.stringify(matchesDB1, 2, 2));
      // console.log('matchesDB2 :'+JSON.stringify(matchesDB2, 2, 2));

      var itemDBFilter;
      for(var idxDB1 in matchesDB1){
        if(isTagFilter){
          itemDBFilter = {'uuid':matchesDB1[idxDB1].uuid};
        }else{
          itemDBFilter = createStrictFilter(objFilter, matchesDB1[idxDB1]);
        }

        var onlyDB1 = true;
        for(var idxDB2 in matchesDB2){
          if( _isFilterMatching_(itemDBFilter, matchesDB2[idxDB2]) ){
            onlyDB1 = false;
            break;
          }          
        }
        if(onlyDB1){
          newItems.push(matchesDB1[idxDB1]);
        }
      }

      for(var idxDB2 in matchesDB2){
        if(isTagFilter){
          itemDBFilter = {'uuid':matchesDB2[idxDB2].uuid};
        }else{
          itemDBFilter = createStrictFilter(objFilter, matchesDB2[idxDB2]);
        }
        
        var onlyDB2 = true;
        for(var idxDB1 in matchesDB1){
          if( _isFilterMatching_(itemDBFilter, matchesDB1[idxDB1]) ){
            onlyDB2 = false;
            break;
          }          
        }
        if(onlyDB2){
          removedItems.push(matchesDB2[idxDB2]);
        }
      }

      if(callback) {callback(err, diffReport);}
    }
  }
  
  /**
  * exposed API
  */
  return {
    
    "configure": _set_options_,

    "dumpDb" : dumpDb,

    "saveMany": saveMany,

    "save": save,

    "fetchItemsSharingTags": fetchItemsSharingTags,

    "fetchAllTags": fetchAllTags,

    "fetchAllByFilter": fetchAllByFilter,
    
    "fetchOneByFilter": fetchOneByFilter,

    "fetchOne":  fetchOne,

    "fetchAll":  fetchAll,
    
    "deleteOne": deleteOne,

    "deleteMany": deleteMany,
    
    "deleteAll": deleteAll,

    "cloneDb": cloneDb,

    "diffDb": diffDb

  };
 
};
