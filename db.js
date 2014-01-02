module.exports = function (options) {
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

    "save": db.save,

    "fetchItemsSharingTags": db.fetchItemsSharingTags,

    "fetchAllTags": db.fetchAllTags,

    "fetchOneByFilter": db.fetchOneByFilter,

    "fetchOne":  db.fetchOne,

    "fetchAll":  db.fetchAll,
    
    "deleteOne": db.deleteOne,
    
    "deleteAll": db.deleteAll

  };
 
};
