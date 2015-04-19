var fs = require('fs-extra');
var path = require('path');

var playlist = {};

var dbPath = __dirname + '/../db';

playlist.db = {};

function loadPlaylist() {
	fs.readFile(dbPath + '/playlist.db', {flag: 'a+'},function (err, data) {
		if (err) throw err;
		console.log(data.toString());

		if(data.length === 0)
			return;
		playlist.db = JSON.parse(data.toString());
	});
};

function savePlaylist() {
	fs.writeFile(dbPath + '/playlist.db', JSON.stringify(playlist.db), function (err) {
		if (err) throw err;
		console.log('it is saved');
	});
};

loadPlaylist();

playlist.getPlaylist = function(req, res) {
	var result = [];
	var playlists = Object.keys(playlist.db);
	for(var i = 0; i < playlists.length; i++) {
		var tmpObj = {};
		tmpObj.name = playlists[i];
		tmpObj.count = playlist.db[playlists[i]].songs.length;
		tmpObj.default = playlist.db[playlists[i]].default;
		result.push(tmpObj);
	}
	//res.json([{name:'item1', count:3, default: 0}, {name:'item2', count: 4, default:1}]);
	res.json(result);
};

playlist.deletePlaylist = function(req, res) {
	console.log(req.body);
	delete playlist.db[req.body.playlist];
	savePlaylist();
	res.json({status: 'done'});
};

playlist.createPlaylist = function(req, res) {
	console.log(req.body);
	playlist.db[req.body.newPlaylistName] = {songs:[], default:0};
	if(Object.keys(playlist.db).length === 1)
		playlist.db[req.body.newPlaylistName].default = 1;
	savePlaylist();
	res.json({status: 'done'});
};



playlist.addSongsToPlaylist = function(req, res) {
	console.log(req.body);
	var items = req.body.items;
	var name = req.body.playlist;

	for(var i = 0; i < items.length; i++) {
		playlist.db[name].songs.push({name: path.basename(items[i]), path:items[i], default: 0});
	}
	savePlaylist();
	res.json({status: 'done'});
};

playlist.removeSongFromPlaylist = function(req, res) {
	console.log(req.query);
	res.json({status: 'done'});
};

playlist.getSongsFromPlaylist = function(req, res) {
	console.log(req.query);
	var name = req.query.name;
	var items = [];
	var songs = playlist.db[name].songs;
	for(var i = 0; i < songs.length; i++) {
		items.push({name: songs[i].name, default:0, length:0, path:songs[i].path});
	}

	res.json({
		name: req.query.name,
		items: items
	});
	//res.json({name:'item1', items: [{name: 'music1', default:0, length:70, path:'f/a/b/xxx.mp3'}, {name: 'music2', default:1, length:90, path:'abc/a.mp3'}, {name: 'music3', default:0, length:121, path:'rew/b.mp3'}]});
};

module.exports = playlist;
