var log = require('./BasicLogger.js');

var pubSub = require('./PublishSubscribe.js');
          
exports.register = function(socket) {
  pubSub.register(socket.id, socket);

  log.info('Registered client ['+socket.id+'], total clients '+pubSub.getClientCount()+' in '+pubSub.getChannelCount()+' channels.');
};

exports.remove = function(socket) {
  var removedCount = pubSub.remove(socket.id);

  log.info('Removed ['+socket.id+'] from '+removedCount+' channels.');
};

exports.subscribe = function(channelID, socket) {
  var clientID = socket.id;
  var success = pubSub.subscribe(channelID, clientID);  

  if(!success)
    log.info('Client ['+clientID+'] tried to subscribe to "'+channelID+'" more than once, request ignored.');
  else
    log.info('Subscribed ['+clientID+'] to channel "'+channelID+'".');
};

exports.unsubscribe = function(channelID, socket) {
  var clientID = socket.id;
  var status = pubSub.unsubscribe(channelID, clientID);

  if(status === false) {
    log.error('Client ['+clientID+'] tried unsubscribe from an unknown channel "'+channelID+'".'); 
    return { error: "Unknown channel ID: " + channelID };
  }

};

exports.publish = function(channelID, data, fromSocket) {
  var fromSocketID = fromSocket.id;
  var status = pubSub.publish(channelID, fromSocketID, function(socket) {
    socket.emit('event', data);  
  });
  
  if(status === false) {  
    log.error('Client ['+fromSocketID+'] tried to publish to unknown channel "'+channelID+'".'); 
    return { error: "Unknown channel ID: " + channelID };   
  }

  log.info('Published message from ['+fromSocketID+'] to ' + status + ' clients in ' + channelID +'.');
  return { success: 'Published message to ' + status + ' clients.' }; 
};