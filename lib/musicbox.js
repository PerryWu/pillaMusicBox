var mplayer = require('node-mplayer');
var path = require('path');

function musicbox(playlist) {
	var self = this;
	this.sysPlaylist = playlist;
	this.curPlaylistSongs = [];
	this.curPlaylist = '';
	this.curPlaySong = {path:'', index:0, length:0};
	this.curVolume = '';
	this.curPlayMode = 0;
	this.curPlayStatus = 'idle';
	this.player = null;
	this.queuedIndex = -1;
	this.queuedPlaylist = '';

	this.actPlay = function(req) {
		var songIndex = req.body.songIndex;
		var playlist = req.body.playlist;

		self.musicPlay(songIndex, playlist);
	};

	this.musicPlay = function(index, playlist) {

		console.log('playlist: ' + playlist + 'index: ' + index);

		if(self.player) {
			self.player.stop();
			self.queuedIndex = index;
			self.queuedPlaylist = playlist;
			return;
		}

		self.curPlaylist = playlist;
		self.curPlaylistSongs = this.sysPlaylist.db[playlist].songs;
		self.curPlaySong = {
			path:self.curPlaylistSongs[index].path,
			index:index,
			length:self.curPlaylistSongs[index].mp3len
		};

		console.log('songpath: ' + self.curPlaySong.path);
		self.player = new mplayer(self.curPlaySong.path);
		self.player.play();
		self.curPlayStatus = 'playing';
		self.player.on('end', function() {
			console.log('close player');
			self.player = null;
			if(self.queuedIndex != -1) {
				self.musicPlay(self.queuedIndex, self.queuedPlaylist);
				self.queuedIndex = -1;
				self.queuedPlaylist = '';
			}
		});
	}

	this.reqBoxActions = function(req, res) {
		var action = req.body.action;

		console.log(req.body);

		if(action == 'play') {
			self.actPlay(req);
		}
		res.json({status: 'done'});
	};

	this.getBoxInfo = function(req, res) {
		res.json({
			plName:self.curPlaylist,
			plMode:self.cirPlayMode,
			volume:self.curVolume,
			trackName:path.basename(self.curPlaySong.path),
			trackPos: 0,
			trackLength:self.curPlaySong.length
		});
	};

};


/*
musicbox.prototype.actPlay = function(req) {
	var songIndex = req.body.songIndex;
	var playlist = req.body.playlist;

	this.musicPlay(songIndex, playlist);
	return 0;
}
*/

musicbox.prototype.actStop = function (req) {
	mplayer.stop();
	this.curPlayStatus = 'idle';
	return 0;
}

musicbox.prototype.actPause = function(req) {
	mplayer.pause();
	this.curPlayStatus = 'idle';
	return 0;
}

musicbox.prototype.actResume = function(req) {
	mplayer.pause();
	this.curPlayStatus = 'playing';
	return 0;
}

musicbox.prototype.actNext = function(req) {
	var nextIndex = (this.curPlaySong.index + 1) % this.curPlaylistSongs.length;
	if(this.curPlayStatus === 'playing') {
		this.musicPlay(nextIndex, this.curPlaylist);
	} else {
		this.curPlaySong = {
			path:this.curPlaylistSongs[nextIndex].path, 
			index:nextIndex,
			length:this.curPlaylistSongs[nextIndex].mp3len
		}
	}
	return 0;
}

musicbox.prototype.actPrevious = function(req) {
	var prevIndex;
	if(this.curPlaySong.index === 0)
		prevIndex = this.curPlaylistSongs.length - 1;
	else
		prevIndex = this.curPlaySong.index - 1;

	if(this.curPlayStatus === 'playing') {
		this.musicPlay(prevIndex, this.curPlaylist);
	} else {
		this.curPlaySong = {
			path:this.curPlaylistSongs[prevIndex].path, 
			index:prevIndex,
			length:this.curPlaylistSongs[prevIndex].mp3len
		}
	}
	return 0;
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
	var curIndex = this.curPlaySong.index;
	if(this.curPlayMode === 0) {
		nextIndex = (curIndex + 1) % this.curPlaylistSongs.length;
	} else if(this.curPlayMode === 1) {
		nextIndex = curIndex;
	} else if(this.curPlayMode === 2) {
		nextIndex = Math.random() % this.curPlaylistSongs.length;
	} else if(this.curPlayMode === 3) {
		nextIndex = (curIndex + 1) % this.curPlaylistSongs.length;
		if(nextIndex === 0)
			nextIndex = -1;
	} else if(this.curPlayMode === 4) {
			nextIndex = -1;
	}
	if(nextIndex === -1)
		return null;
	return {path: curPlaylistSongs[nextIndex].path, index:nextIndex, length:curPlaylistsongs[nextIndex].mp3len};
}

musicbox.prototype.actVolume = function(req) {
	this.actNext(req, 1);
	mplayer.setVolume(req.body.value);
}

/*
musicbox.prototype.reqBoxActions = function(req, res) {
	var action = req.body.action;

	console.log(req.body);
	console.log(action);

	console.log(this);
	if(action == 'play') {
		this.actPlay(req);
	}
	
	if (this[action](req) !== 0) {
		return res.json({status: 'error'});
	}
	

	res.json({status: 'done'});
};
*/

module.exports = musicbox;

