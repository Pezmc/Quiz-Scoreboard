var colors = require('colors');

// Very basic info/debug/error messages
exports.error = function(message, data) {
  var message = "[ERROR]\t".red + message;
  if(typeof data != undefined)
    console.log(message, data);
  else
    console.log(message);
}

exports.info = function(message, data) {
  var message = "[INFO]\t".cyan + message;
  if(typeof data != 'undefined')
    console.log(message, data);
  else
    console.log(message);  
}