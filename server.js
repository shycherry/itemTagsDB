var https = require('https');
var WebSocketServer = require('websocket').server;
var fs = require('fs');
var path = require('path');
var uri = require('uri-js');
var _db = null;

function resOK(response, data){
  response.writeHead(200);
  if (typeof(data) != 'string'){
    data = JSON.stringify(data);
  }
  response.end(data);
}

function resKO(response, data){
  response.writeHead(500);
  if (typeof(data) != 'string'){
    data = JSON.stringify(data);
  }
  response.end(data);
}

function getPOSTData(req, res, iCallback){
  // Check if this is a form post or a stream post via REST client.
  if (req.readable) {
    // REST post.
    var content = '';
    var calledCallback = false;

    req.on('data', function (data) {
      if (content.length > 1e6) {
        // Flood attack or faulty client, nuke request.
        if(!calledCallback){
          iCallback('Request entity too large', null);
          calledCallback = true;
        }
      }
      content += data;
    });

    req.on('end', function () {
      if(!calledCallback){
        try{
          content = JSON.parse(content);
          iCallback(null, content);
        }catch(e){
          iCallback('invalid JSON', null);
        }
      }
    });
  }
  else {
    // Form post.
    iCallback(null, req.body);
  }
}

function handleREST(req, res){
  var uriComponents = uri.parse(req.url);

  switch(req.method){
    case 'GET':
    if(/\/items/.exec(uriComponents.path))
      listAll(req, res);
    else
      resKO(res, 'bad url');
    break;

    case 'POST':
    if(/\/items/.exec(uriComponents.path))
      createItem(req, res);
    else
      resKO(res, 'bad url');
    break;

    case 'DELETE':
    var deleteItemMatches = /\/items\/item\/([^\/]+)/.exec(uriComponents.path);
    if(deleteItemMatches){
      deleteItem(req, res, deleteItemMatches[1]);
    }else{
      resKO(res, 'bad url');
    }
    break;

    default:
    resKO(res, 'unsupported method');
  }

}

function createItem(req, res){
  console.log('create !');
  getPOSTData(req, res, function(err, data){
    if(err){
      resKO(res, 'invalid JSON');
    }
    else{
      _db.save(data, function(err, item){
        if(err)
          resKO(res, 'invalid item');
        else if(!item)
          resKO(res, 'invalid item');
        else if(!item.uuid)
          resKO(res, 'invalid item');
        else
          resOK(res, item.uuid);
      });
    }
    
  });
}

function deleteItem(req, res, itemUuid){
  if(itemUuid){
    _db.deleteOne(itemUuid, function(err, removedCount){
      if(err){
        resKO(res, err);
      }else{
        resOK(res, removedCount);
      }
    });
  }
}

function listAll(req, res){
  _db.fetchAll(function(err, items){
    if(err)
      resKO(res, err);
    else
      resOK(res, items);
  });
}

module.exports.start = function(db, serverPort){
  console.log('creating server....');

  if('undefined' == typeof db)
    return;

  if('undefined' == typeof serverPort)
    return;

  _db = db;
  
  var credentials = {
    key: fs.readFileSync(path.join(__dirname,'shycherry.fr.key')),
    cert: fs.readFileSync(path.join(__dirname, 'shycherry.fr.cert'))
  };

  var httpsServer = https.createServer(credentials, function(req, res){
    handleREST(req, res);
  });

  httpsServer.listen(serverPort, function(){
    console.log('server listening on port ' + serverPort);
  });
  
  var wsClients = [];

  var wsServer = new WebSocketServer({
    httpServer: httpsServer
  });

  wsServer.on('request', function(request){
    console.log((new Date()) + ' Connection from origin ' + request.origin + '.');

    var connexion = request.accept(null, request.origin);
    var clientIdx = wsClients.push(connexion) - 1;

    console.log((new Date()) + ' Connexion accepted.');

    connexion.on('message', function(message){
      console.log(JSON.stringify(message));
      
      for(var idx = 0; idx < wsClients.length; idx++){
        wsClients[idx].sendUTF(JSON.stringify({
          type: 'message',
          data: message.utf8Data
        }));
      }
      
    });

    connexion.on('close', function(connexion){
      console.log((new Date())+' Peer '+connexion.remoteAddress + ' disconnected.');
      wsClients.splice(clientIdx, 1);
    });

  });
};
