var https = require('https');
var WebSocketServer = require('websocket').server;
var fs = require('fs');
var path = require('path');

module.exports.start = function(serverPort){
  console.log('creating server....');
  if('undefined' == typeof serverPort)
    return;
  
  var credentials = {
    key: fs.readFileSync(path.join(__dirname,'shycherry.fr.key')),
    cert: fs.readFileSync(path.join(__dirname, 'shycherry.fr.cert'))
  };

  var httpsServer = https.createServer(credentials, function(req, res){
    res.writeHead(200);
    res.end("hello world\n");
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
