var through = require('through');

/*
TODO: replace this.
*/

function stripscript(s) {
    var rs = "";
    for (var i = 0; i < s.length; i++) {
        rs = rs+s.substr(i, 1).replace('\\', '');
    }
    return rs;
}

module.exports = function(path, cb) {
	var spawn = require('child_process').spawn;
	var mp3infoSp = spawn('mp3info', [path, '-p', '{"name":"%f", "path":"%F", "length":"%S", "bitrate":"%r", "sampling":"%q", "artist":"%a", "title":"%t", "v":"%v", "L":"%L"}']);
	var consoleData = '';
	var result = {};
	var tr = through(
			function write(data) {
			//this.queue(data) //data *must* not be null 
			//console.log("data:" + data);
			consoleData += data;
			},
			function end() { //optional 
			//this.emit('end');
			//console.log('done');

			//console.log(consoleData);
			//console.log(JSStringEscape(consoleData, 0));
			result = JSON.parse(stripscript(consoleData));
			cb(null, result);
			});
	mp3infoSp.stdout.pipe(tr);
}
