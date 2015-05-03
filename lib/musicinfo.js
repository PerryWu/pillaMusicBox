var mp3info = require('./mp3info');
var path = require('path');

var musicinfo = {};

musicinfo.getMusicInfo = function(req, res) {
	console.log(req.query);
	mp3info(req.query.path, function(err, data) {
		res.json({
			name: path.basename(req.query.path),
			path: req.query.path,
			audio: data.bitrate + 'kbps,' + data.sampling + 'kHz',
			length: data.length
		});
	});
}


module.exports = musicinfo;
