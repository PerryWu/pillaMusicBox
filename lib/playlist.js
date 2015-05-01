var fs = require('fs-extra');
var path = require('path');
var _ = require('lodash');

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
	savePlaylist();
	res.json({status: 'done'});
};



playlist.addSongsToPlaylist = function(req, res) {
	//console.log(req.body);
	var items = req.body.items;
	var name = req.body.playlist;

	//console.log(items);

	for(var item in items) {
		playlist.db[name].songs.push({name: items[item].name, path:items[item].path, mp3len:items[item].mp3len, mp3valid:items[item].mp3valid, type: items[item].type, count: items[item].count});
	}
	console.log(playlist.db[name].songs);
	savePlaylist();
	res.json({status: 'done'});
};

playlist.removeSongFromPlaylist = function(req, res) {

	console.log(req.query);
	var name = req.query.playlist;

	if(req.query.index > playlist.db[name].songs.length - 1) {
		res.statusCode = 500;
		return res.json({status: 'error', message: 'index is wrong!'});
	}
	_.pullAt(playlist.db[name].songs, req.query.index)
	res.json({status: 'done'});
};

playlist.getSongsFromPlaylist = function(req, res) {
	console.log(req.query);
	var name = req.query.name;
	var songs = playlist.db[name].songs;

	res.json({
		name: req.query.name,
		items: songs
	});
};

module.exports = playlist;
