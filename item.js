function Item(iData){
  for(var i in iData){
    this[i] = iData[i];
  }
}

Item.prototype.dump = function(){
  console.log(JSON.stringify(this, 2, 2));
};

Item.prototype.xorHasTags = function(iTags){
  if(iTags){
    var oneTagFound = false;
    for(var tagIdx in iTags){
      if( this.hasOwnProperty('@'+iTags[tagIdx]) ){
        if(!oneTagFound)
          oneTagFound = true;
        else
          return false;
      }
    }
  }else{
    return false;
  }
  return oneTagFound;
};

Item.prototype.hasAllTags = function(iTags){
  if(iTags){
    for(var tagIdx in iTags){
      if(  !this.hasOwnProperty('@'+iTags[tagIdx]) ){
        return false;
      }
    }
  }else{
    return false;
  }
  return true;
};

Item.prototype.orHasTags = function(iTags){
  if(iTags){
    for(var tagIdx in iTags){
      if( this.hasOwnProperty('@'+iTags[tagIdx]) ){
        return true;
      }
    }
  }else{
    return false;
  }
  return false;
};

Item.prototype.addTags = function(iTags){
  if(iTags){
    for(var tagIdx in iTags){
      var currentTag = '@'+iTags[tagIdx];
      if( !this.hasOwnProperty(currentTag) ){
        this[currentTag] = "";
      }
    }
  }
};

Item.prototype.getTags = function(){
  var result = [];
  for(var tag in this){
    if(tag[0] === '@')
      result.push(tag.slice(1));
  }

  return result;
};

Item.prototype.getTagValue = function(iTag){
  return this['@'+iTag];
}

function getNewItem(iData){
  return new Item(iData);
}

function getNewItemCollection(iCollection){
  var resultCollection = [];
  for(var i in iCollection){
    resultCollection[i] = new Item(iCollection[i]);
  }
  return resultCollection;
}

module.exports ={
  "getNewItem": getNewItem,
  "getNewItemCollection": getNewItemCollection
};
