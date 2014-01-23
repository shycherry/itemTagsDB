module.exports = function (options) {
   
  /**
   * Module options
   */
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
    nosql.all(null, function(dbItems){
      var itemsSharingTags = [];
      for(var itemIdx in dbItems){
        var item = Item.getNewItem(dbItems[itemIdx]);
        if(item.xorHasTags(tagsList)){
          itemsSharingTags.push(item);
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

  function fetchOneByFilter(filter, callback){
    nosql.one(filter, function(dbItem){
      if(!dbItem){
        callback('no fetch !');
      }
      else{
        callback(undefined, Item.getNewItem(dbItem));
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
  
  /**
  * exposed API
  */
  return {
    
    "configure": _set_options_,

    "dumpDb" : dumpDb,

    "save": save,

    "fetchItemsSharingTags": fetchItemsSharingTags,

    "fetchAllTags": fetchAllTags,

    "fetchOneByFilter": fetchOneByFilter,

    "fetchOne":  fetchOne,

    "fetchAll":  fetchAll,
    
    "deleteOne": deleteOne,
    
    "deleteAll": deleteAll

  };
 
};
