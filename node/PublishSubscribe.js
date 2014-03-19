
// channel list and subscribers
var clients = {},
    channels = {};
      
exports.register = function(clientID, client) {
    clients[clientID] = client;
};
      
exports.remove = function(clientID) {
  delete clients[clientID];

  var removedCount = 0;
  for(var channelID in channels)
    removedCount += exports.unsubscribe(channelID, clientID); 

  return removedCount;
};
      
exports.subscribe = function(channelID, clientID) {

  var channel = exports.getChannel(channelID);
  if(!channel) {
    channels[channelID] = [];
    channel = channels[channelID];
  }

  if(channel.indexOf(clientID) != -1) {
    return false;
  }

  channel.push(clientID);
  
  return true;
};
      
exports.unsubscribe = function(channelID, clientID) {
  var channel = channels[channelID];
  if(typeof channel == 'undefined') {
    return false;
  }

  var index = channel.indexOf(clientID);

  if(index != -1) {
    channel.splice(index, 1);
    return 1;
  }

  return 0;
};
      
exports.publish = function(channelID, fromClientID, publishMethod) {

  var channel = channels[channelID];
  if(typeof channel == 'undefined') {
    return false;
  }

  var clientCount = 0;

  for (var i=0;i<channel.length;i++) {
    var clientID = channel[i];

    var client = clients[clientID];

    if(clientID != fromClientID) {
      publishMethod(client);
      clientCount++;
    }
  }

  return clientCount;
};
      
exports.getClientCount = function() {
  return objectLength(clients);
};
           
exports.getChannelCount = function() {
  return objectLength(channels);
};

exports.getClientCountInChannel = function(channelName) {
  if(exports.getChannel(channelName))
    return channelName.length;
  
  return 0;
};

exports.getChannel = function(channelName) {
  var channel = channels[channelName];
  if(typeof channel == 'undefined') {
    return false;
  }
  
  return channel;
};

// Count object attributes
var objectLength = function(object) {
  var keys = [];
  for(var k in object) keys.push(k);
  return keys.length;
}