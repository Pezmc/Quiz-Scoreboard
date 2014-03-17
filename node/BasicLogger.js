var colors = require('colors');

// Very basic info/debug/error messages
exports.error = function(message, data) {
  printMessage("[ERROR]\t".red + message, data);
}

exports.info = function(message, data) {
  printMessage("[INFO]\t".cyan + message, data);
}

exports.debug = function(message, data) {
  printMessage("[DEBUG]\t".green + message, data);
}

var printMessage = function(message, data) {
  if(typeof data != 'undefined')
    console.log(message, data);
  else
    console.log(message); 
}