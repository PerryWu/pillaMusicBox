var fs = require('fs-extra');
var path = require('path');
var _ = require('lodash');
var async = require('async');
var filelist = require('./filelist');
var playlist = {};

var dbPath = __dirname + '/../db';

playlist.db = {
	musicBox: {
		name: 'musicBox',
		count: 0,
		default: 0,
		songs: []
	}
};


/*
 * Playlist data scheme
 *
 * db[playlist].name	// playlist name
 * db[playlist].count	// how many songs in this playlist
 * db[playlist].default	// default is 1 if this is running playlist
 * db[playlist].songs.name	// music name
 * db[playlist].songs.path	// music path
 * db[playlist].songs.mp3len	// music length, in seconds
 * db[playlist].songs.mp3valid	// whether ihis is valid mp3 file
 * db[playlist].songs.type	// folder or not
 * db[playlist].songs.count	// if type is folder, count is the number of files in the folder
 */

function loadPlaylist() {
	fs.readFile(dbPath + '/playlist.db', {
		flag: 'a+'
	}, function(err, data) {
		if (err) throw err;
		console.log(data.toString());

		if (data.length === 0)
			return;
		playlist.db = JSON.parse(data.toString());
	});
};

function savePlaylist() {
	fs.writeFile(dbPath + '/playlist.db', JSON.stringify(playlist.db), function(err) {
		if (err) throw err;
		console.log('it is saved');
	});
};

loadPlaylist();

//
// Get Playlist list and its song counts
// 
playlist.getPlaylist = function(req, res) {
	var result = [];

	for (var obj in playlist.db) {
		result.push({
			name: playlist.db[obj].name,
			count: playlist.db[obj].songs.length,
			default: playlist.db[obj].default
		});
	}
	res.json(result);
};

//
// Delete specific playlist
//
playlist.deletePlaylist = function(req, res) {
	//console.log(req.body);
	var plName = req.body.plName;

	if (typeof plName == 'undefined') {
		res.statusCode = 500;
		return res.json({
			status: 'error',
			message: 'no playlist name to delete'
		});
	}

	delete playlist.db[plName];
	savePlaylist();
	res.json({
		status: 'done'
	});
};

//
// Create new playlist
//
playlist.createPlaylist = function(req, res) {
	//console.log(req.body);
	var newPlName = req.body.plName;
	if (typeof newPlName == 'undefined') {
		res.statusCode = 500;
		return res.json({
			status: 'error',
			message: 'no playlist name'
		});
	}

	playlist.db[newPlName] = {
		name: newPlName,
		songs: [],
		default: 0
	};
	savePlaylist();
	res.json({
		status: 'done'
	});
};


//
// Add songs to playlist
//
playlist.addSongsToPlaylist = function(req, res) {
	//console.log(req.body);
	var items = req.body.items;
	var plName = req.body.plName;
	var queuedItems = [];

	if (typeof plName == 'undefined') {
		res.statusCode = 500;
		return res.json({
			status: 'error',
			message: 'no playlist name to add'
		});
	}

	//console.log(items);

	for (var item in items) {
		if (items[item].type == true) {
			queuedItems.push(items[item]);
		} else {
			playlist.db[plName].songs.push({
				name: items[item].name,
				path: items[item].path,
				mp3len: items[item].mp3len,
				mp3valid: items[item].mp3valid,
				type: items[item].type,
				count: items[item].count
			});
		}
	}

	async.map(queuedItems, function(dirObj, cb) {
		filelist.getAudioFiles(dirObj.path, 2, cb);
	}, function(err, results) {
		for (var i = 0; i < results.length; i++) {
			Array.prototype.push.apply(playlist.db[plName].songs, results[i]);
		}
		playlist.db[plName].count = playlist.db[plName].songs.length;
		console.log(playlist.db[plName].songs);
		savePlaylist();
		res.json({
			status: 'done'
		});
	});
};

//
// Remove specific song from the playlist
//
playlist.removeSongFromPlaylist = function(req, res) {
	//console.log(req.query);
	var plName = req.query.playlist;

	if (req.query.index > playlist.db[plName].songs.length - 1) {
		res.statusCode = 500;
		return res.json({
			status: 'error',
			message: 'index is wrong!'
		});
	}
	_.pullAt(playlist.db[plName].songs, req.query.index);
	res.json({
		status: 'done'
	});
};

//
// Get all songs from the platlist
//
playlist.getSongsFromPlaylist = function(req, res) {
	//console.log(req.query);

	var plName = req.query.plName;

	if (typeof plName == 'undefined') {
		res.statusCode = 500;
		return res.json({
			status: 'error',
			message: 'no playlist name to add'
		});
	}

	var songs = playlist.db[plName].songs;

	res.json({
		name: plName,
		items: songs
	});
};

//
//
//
playlist.updateDefault = function(plName, songIndex) {

	if (playlist.db[plName] == null) {
		console.log('failed to update the playlist info.(' + plName + ')');
		return;
	}

	for (var obj in playlist.db) {
		if (playlist.db[obj].name == plName) {
			playlist.db[obj].default = 1;
		} else {
			playlist.db[obj].default = 0;
		}
	}

	for (var i = 0; i < playlist.db[plName].songs.length; i++) {
		if (i == songIndex) {
			playlist.db[plName].songs[i].default = 1;
		} else {
			playlist.db[plName].songs[i].default = 0;
		}
	}
};

module.exports = playlist;
