var colors = require('colors');

// 0 - error, 1 - warn, 2 - info, 3 - debug
var logLevel = 4;

// Very basic info/debug/error messages
exports.error = function(message, data) {
  if(logLevel >= 0)
    printMessage("[ERROR]\t".red + message, data);
}

exports.warn = function(message, data) {
  if(logLevel >= 1)
    printMessage("[WARN]\t".yellow + message, data);
}

exports.info = function(message, data) {
  if(logLevel >= 2)
    printMessage("[INFO]\t".cyan + message, data);
}

exports.debug = function(message, data) {
  if(logLevel >= 3)
    printMessage("[DEBUG]\t".green + message, data);
}

exports.setLogLevel = function(level) {
  logLevel = level;
}

var printMessage = function(message, data) {
  if(typeof data != 'undefined')
    console.log(message, data);
  else
    console.log(message);
}