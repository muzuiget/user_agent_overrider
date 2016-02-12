var log = function() { dump(Array.slice(arguments).join(' ') + '\n'); };
var trace = function(error) { log(error); log(error.stack); };
var dirobj = function(obj) { for (let i in obj) { log(i, ':', obj[i]); } };

/* exported log trace dirobj */
