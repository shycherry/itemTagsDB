function Item(iData){
  for(var i in iData){
    this[i] = iData[i];
  }
}

Item.prototype.dump = function(){
  console.log(JSON.stringify(this, 2, 2));
};

Item.prototype.xorHasTags = function(iTags){
  var ownTags = this.tags;
  if(ownTags && iTags){
    for(var tagIdx in iTags){
      if(ownTags.lastIndexOf(iTags[tagIdx]) == -1){
        return false;
      }
    }
  }else{
    return false;
  }
  return true;
};

Item.prototype.orHasTags = function(iTags){
  var ownTags = this.tags;
  if(ownTags && iTags){
    for(var tagIdx in iTags){
      if(ownTags.lastIndexOf(iTags[tagIdx]) != -1){
        return true;
      }
    }
  }else{
    return false;
  }
  return false;
};

Item.prototype.addTags = function(iTags){
  var ownTags = this.tags;
  if(ownTags && iTags){
    for(var tagIdx in iTags){
      if(ownTags.lastIndexOf(iTags[tagIdx]) == -1){
        ownTags.push(iTags[tagIdx]);
      }
    }
  }
};

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
