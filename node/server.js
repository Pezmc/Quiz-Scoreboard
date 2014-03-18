var port = 25565;

var http = require('http').createServer(webRequest);
var io = require('socket.io').listen(http);
var pubSub = require('./SocketPublishSubscribe.js');

// 0 - error, 1 - warn, 2 - info, 3 - debug
io.set('log level', 2); 

// Configure for production
io.enable('browser client minification');  // send minified client
io.enable('browser client etag');          // apply etag caching logic based on version number
io.enable('browser client gzip');          // gzip the file

// initial connection from a client. socket argument = client.
io.sockets.on('connection', function (socket) {

  // connect
  pubSub.register(socket);
  
  // subscribe to a channel
  socket.on('subscribe', function(data, callback) {
    if(typeof callback === 'function')
      callback(pubSub.subscribe(data.channel, socket));
    else
      pubSub.subscribe(data.channel, socket);
  });  
            
  // deregister from a channel
  socket.on('unsubscribe', function(data) {
    pubSub.unsubscribe(data.channel, socket);
  });
            
  // message a channel
  socket.on('publish', function(data, callback) {
    callback(pubSub.publish(data.channel, data.data, socket));
  });
    
  // fired in all cases, when the client-server connection is closed
  socket.on('disconnect', function() {
    pubSub.remove(socket);
  })
    
  //console.log(socket);
});

http.listen(port);
console.log("Listening on port " + port); 

// Web
function webRequest(req, res) {
  res.writeHead(200);
  res.end("Need to connect using web sockets.");
}