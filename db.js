module.exports = function (options) {
  var item = require('./item');
  var URI = require('uri-js');
  var db = null;

  if ('undefined' != typeof options){
    if('undefined' != typeof options.database){
      var components = URI.parse(options.database);
      if('undefined' != typeof components.host){
        //remote access
        db = require('./dbRemote')(options);
      }else{
        //local access
        db = require('./dbLocal')(options);
      }
    }
    
    if('undefined' != typeof options.newServerPort){
      //create server
      require('./server').start(db, options.newServerPort);
    }
  }

  
  /**
  * exposed API
  */
  return {
    
    "configure": db._set_options_,

    "dumpDb" : db.dumpDb,

    "getNewItem" : item.getNewItem,

    "save": db.save,

    "fetchItemsSharingTags": db.fetchItemsSharingTags,

    "fetchAllTags": db.fetchAllTags,

    "fetchAllByFilter": db.fetchAllByFilter,

    "fetchOneByFilter": db.fetchOneByFilter,

    "fetchOne":  db.fetchOne,

    "fetchAll":  db.fetchAll,
    
    "deleteOne": db.deleteOne,
    
    "deleteAll": db.deleteAll,

    "cloneDb": db.cloneDb,

    "diffDb": db.diffDb

  };
 
};
