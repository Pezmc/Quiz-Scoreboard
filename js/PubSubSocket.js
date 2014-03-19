function PushSocket(address) {
  
  var _scriptIncluded = false;
  var _connected = false;
  var _socket = null;
  var _channelID = "None";
  var _address = address;
  
  // Validate our address
  var http = "http://";
  if(_address.substr(0, http.length) != http)
    _address = http + _address;
  
  this.connect = function(callback) {
    if(_connected) return typeof callback === 'function' && callback();
    
    this.includeSocketIO(function() {
      _connected = true;
      _socket = io.connect(address);  
      typeof callback === 'function' && callback();
    });
  }
  
  this.includeSocketIO = function(callback) {
    if(_scriptIncluded) return typeof callback === 'function' && callback();
    
    $.getScript(_address + '/socket.io/socket.io.js', function() { 
      _scriptIncluded = true;

      if(window.io) {
        typeof callback === 'function' && callback();
      }
    });
  }
  
  this.subscribe = function(channelID, callback) {
    _socket.emit('subscribe', { channel: channelID }, callback);  
    _channelID = channelID;
  }
  
  this.bindPush = function(callback) {
    _socket.on('event', callback);
  }
  
  this.bindEvent = function(eventName, callback) {
    _socket.on(eventName, callback); 
  }
  
  this.push = function(data, callback) {
    _socket.emit('publish', { channel: _channelID, data: data }, callback);
  }
}