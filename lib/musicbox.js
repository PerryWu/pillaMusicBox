var mplayer = require('./node-mplayer');
var path = require('path');
var fs = require('fs-extra');

/*
 *	Global variables
 */
var sysPlaylist = null;
var curPlaylistSongs = [];
var curPlayStatus = 'idle';
var player = null;
var queuedIndex = -1;
var queuedPlaylist = '';
var userStop = 0;

var boxSettings = {
	curPlayMode: 0,
	curPlaylist: '',
	curPlaySong: {
		path: '',
		index: 0,
		length: 0
	},
	curVolume: '50'
}

var dbPath = __dirname + '/../db';

/*
 *	Settings save/restore
 */
function loadSettings() {
	fs.readFile(dbPath + '/settings.db', {
		flag: 'a+'
	}, function(err, data) {
		if (err) throw err;
		console.log(data.toString());

		if (data.length === 0)
			return;
		boxSettings = JSON.parse(data.toString());
		if (sysPlaylist != null)
			sysPlaylist.updateDefault(boxSettings.curPlaylist, boxSettings.curPlaySong.index);
	});
};

function saveSettings() {
	fs.writeFile(dbPath + '/settings.db', JSON.stringify(boxSettings), function(err) {
		if (err) throw err;
		console.log('it is saved');
	});
};

loadSettings();

function musicbox(playlist) {
	var self = this;

	if (typeof(playlist) == 'undefined') {
		throw new Error('playlist is not assigned.');
	}

	sysPlaylist = playlist;

	// object for acts to be correctly dispatched.
	this.actHandlers = {
		play: self.actPlay,
		pause: self.actPause,
		stop: self.actStop,
		next: self.actNext,
		previous: self.actPrevious,
		volume: self.actVolume,
		trackpos: self.actTrackPos,
		playmode: self.actPlayMode
	};

	// dispatcher functions.
	this.reqBoxActions = function(req, res) {
		var action = req.body.action;
		console.log(req.body);
		self.actHandlers[action].call(self, req);
		res.json({
			status: 'done'
		});
	};

	// get current musicbox information. This function might be caled frequently.
	this.getBoxInfo = function(req, res) {
		// Perry: calling this will introduce some unstable issues... not knowing the reason. disable the pos ability.
		/*
		if (player != null) {
            player.getTimePosition.call(player, function(pos) {
                //console.log("pos:" + pos);
                res.json({
                    plName: boxSettings.curPlaylist,
                    plMode: boxSettings.curPlayMode,
                    volume: boxSettings.curVolume,
                    trackName: path.basename(boxSettings.curPlaySong.path),
                    trackIndex: boxSettings.curPlaySong.index,
                    trackPos: pos,
                    trackLength: boxSettings.curPlaySong.length
                });
            });
        } else {
		*/
		res.json({
			plName: boxSettings.curPlaylist,
			plMode: boxSettings.curPlayMode,
			volume: boxSettings.curVolume,
			trackName: path.basename(boxSettings.curPlaySong.path),
			trackIndex: boxSettings.curPlaySong.index,
			trackPos: 0,
			trackLength: boxSettings.curPlaySong.length,
			status: curPlayStatus
		});
		/*
        }
		*/
	};

	// Play specific song by given playlist name and its index.
	this.musicPlay = function(songIndex, plName) {

		console.log('playlist: ' + plName + 'index: ' + songIndex);

		if (sysPlaylist.db[plName] == null || songIndex >= sysPlaylist.db[plName].songs.length) {
			console.log('error occurs with wrong plName: ' + plName + 'or index: ' + songIndex);
			return;
		}

		// The player is working now, asking it to be stop first. Queued this play index
		if (player) {
			player.stop();
			queuedIndex = songIndex;
			queuedPlaylist = plName;
			return;
		}

		// Update boxsettings
		boxSettings.curPlaylist = plName;
		curPlaylistSongs = sysPlaylist.db[plName].songs;
		boxSettings.curPlaySong = {
			path: curPlaylistSongs[songIndex].path,
			index: songIndex,
			length: curPlaylistSongs[songIndex].mp3len
		};
		if (sysPlaylist != null)
			sysPlaylist.updateDefault(boxSettings.curPlaylist, boxSettings.curPlaySong.index);

		//console.log('songpath: ' + boxSettings.curPlaySong.path);

		// It is clear now, ask player to play the song.
		player = new mplayer(boxSettings.curPlaySong.path);
		player.play({
			volume: boxSettings.curVolume
		});
		curPlayStatus = 'playing';
		saveSettings();

		// When the player ends, it will emit end event, 
		player.on('end', function() {
			console.log('close player');
			player = null;
			// There is queued song to be played.
			if (queuedIndex != -1) {
				self.musicPlay(queuedIndex, queuedPlaylist);
				queuedIndex = -1;
				queuedPlaylist = '';
			} else {
				// If the stop action is from user, no need to play next.
				if (userStop == 1) {
					userStop = 0;
					curPlayStatus = 'idle';
					return;
				}

				// Get the next song to play.
				var nextSong = self.getNextSong();
				if (nextSong != null) {
					self.musicPlay(nextSong.index, boxSettings.curPlaylist);
				} else {
					curPlayStatus = 'idle';
				}
			}
		});

	};
}

// User ask to play specific song in the playlist.
musicbox.prototype.actPlay = function(req) {
	var songIndex = req.body.songIndex || boxSettings.curPlaySong.index;
	var plName = req.body.plName || boxSettings.curPlaylist;

	if(plName.length == 0 || songIndex == -1) {
		songIndex = boxSettings.curPlaySong.index;
		plName = boxSettings.curPlaylist;
	}

	this.musicPlay(songIndex, plName);
};

// Stop the play
musicbox.prototype.actStop = function(req) {
	if (player != null) {
		player.stop();
		userStop = 1;
	}
}

// Pause
musicbox.prototype.actPause = function(req) {
	if (player != null) {
		player.pause();
		curPlayStatus = 'idle';
	}
}

// Resume
musicbox.prototype.actResume = function(req) {
	if (player != null) {
		player.pause();
		curPlayStatus = 'playing';
	}
}

// Play next
musicbox.prototype.actNext = function(req) {

	//console.log(curPlaylistSongs);
	if (curPlaylistSongs.length == 0)
		return;

	var nextIndex = (boxSettings.curPlaySong.index + 1) % curPlaylistSongs.length;
	if (curPlayStatus == 'playing') {
		this.musicPlay(nextIndex, boxSettings.curPlaylist);
	} else {
		boxSettings.curPlaySong = {
			path: curPlaylistSongs[nextIndex].path,
			index: nextIndex,
			length: curPlaylistSongs[nextIndex].mp3len
		}
	}
}

// Play previous
musicbox.prototype.actPrevious = function(req) {

	//console.log(curPlaylistSongs);
	if (curPlaylistSongs.length == 0)
		return;

	var prevIndex;
	if (boxSettings.curPlaySong.index == 0)
		prevIndex = curPlaylistSongs.length - 1;
	else
		prevIndex = boxSettings.curPlaySong.index - 1;

	if (curPlayStatus == 'playing') {
		this.musicPlay(prevIndex, boxSettings.curPlaylist);
	} else {
		boxSettings.curPlaySong = {
			path: curPlaylistSongs[prevIndex].path,
			index: prevIndex,
			length: curPlaylistSongs[prevIndex].mp3len
		}
	}
}

/*
 *	0: playlist repeat
 *	1: Track repeat
 *	2: Random
 *	3: playlist once
 *	4: track once
 *
 *	return null is no next song and should stop the play
 *	otherwise, will be {path, index, length} obj
 */
musicbox.prototype.getNextSong = function() {

	var nextIndex;
	var curIndex = boxSettings.curPlaySong.index;
	if (boxSettings.curPlayMode == 0) {
		nextIndex = (curIndex + 1) % curPlaylistSongs.length;
	} else if (boxSettings.curPlayMode == 1) {
		nextIndex = curIndex;
	} else if (boxSettings.curPlayMode == 2) {
		nextIndex = Math.ceil((Math.random() * 100)) % curPlaylistSongs.length;
	} else if (boxSettings.curPlayMode == 3) {
		nextIndex = (curIndex + 1) % curPlaylistSongs.length;
		if (nextIndex == 0)
			nextIndex = -1;
	} else if (boxSettings.curPlayMode == 4) {
		nextIndex = -1;
	}
	console.log('currIndex: ' + curIndex + ' nextIndex: ' + nextIndex + ' Mode: ' + boxSettings.curPlayMode);
	if (nextIndex == -1)
		return null;
	return {
		path: curPlaylistSongs[nextIndex].path,
		index: nextIndex,
		length: curPlaylistSongs[nextIndex].mp3len
	};
}

// Set the vloume
musicbox.prototype.actVolume = function(req) {
	var volume = req.body.value || 50;

	boxSettings.curVolume = volume;
	if (player != null)
		player.setVolume(volume);
	saveSettings();
}

// Set the play mode
musicbox.prototype.actPlayMode = function(req) {
	var playMode = req.body.value || 0;

	boxSettings.curPlayMode = playMode;
	saveSettings();
}

// Set the pos
musicbox.prototype.actTrackPos = function(req) {
	var pos = req.body.value || 0;
	console.log('actTrack Pos: ' + pos);
	if (player != null)
		player.seek(pos);
}

module.exports = musicbox;
