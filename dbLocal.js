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
  
  function _uuidFilter_(uuid){
    return function(dbItem){
      return uuid == dbItem.uuid;
    };
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

  function save (item, callback) {
    var isCreation = ('undefined' == typeof item.uuid);
    if( isCreation ){
      item.uuid = uuid.v1();
      nosql.insert(item, function(){
        callback(undefined, item, true);
      });
    }else{
      this.fetchOne(item.uuid, function(err, dbItem){
        if(err){ return callback(err); }
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
    nosql.all(null, function(dbItems){
      var tagsList=[];
      for(var itemIdx in dbItems){
        var itemTags = dbItems[itemIdx].tags;
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

  function fetchAllByFilter(filter, callback){
    if(!filter){
      if(callback) {callback('no filter');}
    }

    var objFilter = {};
    try{
      objFilter = JSON.parse(filter);
    }catch(e){
      if(callback) {callback('bad filter');} 
      return;
    }

    var areMatching = function(itemFilter, itemToTest){
      var isMatching = true;
      for(var prop in itemFilter){
        
        if( !itemToTest.hasOwnProperty(prop)){
          isMatching = false;
          break;
        }

        if( typeof(itemFilter[prop]) == 'object' ){
          isMatching = areMatching(itemFilter[prop], itemToTest[prop]);
          if(!isMatching) break;
        }else if( (itemToTest[prop] != itemFilter[prop]) ){
          isMatching = false;
          break;
        }
      }
      return isMatching;    
    }

    fetchAll(function(err, items){
      if(err){
        if(callback) {callback(err);}
      }
      var matchingItems = [];
      for(var itemIdx in items){
        var currentItem = items[itemIdx];
        if( areMatching(objFilter, currentItem) ){
          matchingItems.push(currentItem);
        }
      }
      callback(undefined, matchingItems);
    });
  }

  function fetchOneByFilter(filter, callback){
    fetchAllByFilter(filter, function(err, items){
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
    nosql.one(_uuidFilter_(uuid), function(dbItem){
      if(!dbItem){
        callback('not found !');
      }
      else{
        callback(undefined, Item.getNewItem(dbItem));
      }
    });
  }

  function deleteOne (uuid, callback) {
    nosql.remove(_uuidFilter_(uuid), function(removedCount){
      callback(undefined, removedCount);
    });
  }
  
  function deleteAll (callback) {
    nosql.clear(function(){
      if(callback) callback(undefined, null);
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
  
  /**
  * exposed API
  */
  return {
    
    "configure": _set_options_,

    "dumpDb" : dumpDb,

    "save": save,

    "fetchItemsSharingTags": fetchItemsSharingTags,

    "fetchAllTags": fetchAllTags,

    "fetchAllByFilter": fetchAllByFilter,
    
    "fetchOneByFilter": fetchOneByFilter,

    "fetchOne":  fetchOne,

    "fetchAll":  fetchAll,
    
    "deleteOne": deleteOne,
    
    "deleteAll": deleteAll,

    "cloneDb": cloneDb

  };
 
};
