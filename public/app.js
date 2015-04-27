(function($) {

	var trackUpdater = null;
	var lastAction = {};
	var selectedSongs = {};

	$(function() {
		$( '#popupYnPage' ).enhanceWithin().popup();
	});

	//
	// Common APIs
	//
	var extensionsMap = {
		".zip": "fa-file-archive-o",
		".gz": "fa-file-archive-o",
		".bz2": "fa-file-archive-o",
		".xz": "fa-file-archive-o",
		".rar": "fa-file-archive-o",
		".tar": "fa-file-archive-o",
		".tgz": "fa-file-archive-o",
		".tbz2": "fa-file-archive-o",
		".z": "fa-file-archive-o",
		".7z": "fa-file-archive-o",
		".mp3": "fa-file-audio-o",
		".cs": "fa-file-code-o",
		".c++": "fa-file-code-o",
		".cpp": "fa-file-code-o",
		".js": "fa-file-code-o",
		".xls": "fa-file-excel-o",
		".xlsx": "fa-file-excel-o",
		".png": "fa-file-image-o",
		".jpg": "fa-file-image-o",
		".jpeg": "fa-file-image-o",
		".gif": "fa-file-image-o",
		".mpeg": "fa-file-movie-o",
		".avi": "fa-file-movie-o",
		".pdf": "fa-file-pdf-o",
		".ppt": "fa-file-powerpoint-o",
		".pptx": "fa-file-powerpoint-o",
		".txt": "fa-file-text-o",
		".log": "fa-file-text-o",
		".doc": "fa-file-word-o",
		".docx": "fa-file-word-o",
	};

	function getFileIcon(ext) {
		return (ext && extensionsMap[ext.toLowerCase()]) || 'fa-file-o';
	}

	// Seconds to m:s format
	function humanSeconds(seconds) {
		var local_min = Math.floor(Number.parseInt(seconds) / 60);
		var local_sec = Number.parseInt(seconds) % 60;

		console.log("seconds:" + seconds + "min:" + local_min);
		return local_min.toString() + ':' + padLeft(local_sec.toString(), 2);
	}

	function humanFileSize(bytes, si) {
		var thresh = si ? 1000: 1024;
		if (bytes < thresh) return bytes + ' B';
		var units = si ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'] : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
		var u = - 1;
		do {
			bytes /= thresh; ++u;
		} while (bytes >= thresh);
		return bytes.toFixed(1) + ' ' + units[u];
	};

	function padLeft(str, len) {
		str = '' + str;
		if (str.length >= len) {
			return str;
		} else {
			return padLeft("0" + str, len);
		}   
	}

	//
	// Page Loading Effect
	//
	function showLoading() {
		$('body').addClass('ui-disabled');
		$.mobile.loading( 'show', {
			text: 'Loading',
			textVisible: true,
			theme: 'b',
			textonly: false,
			html: ''
		});
	}

	function hideLoading() {
		$.mobile.loading('hide');
		$('body').removeClass('ui-disabled');
	}

	//
	// Ajax Actions
	//

	// Resource: musicbox
	function ajaxReqPlayStatus(redirect) {
		//showLoading();
		$.ajax( {
			url: '/musicbox',
			method: 'GET',
		timeout: 10000})
		.done(function(data) {
			//hideLoading();
			if(redirect === 1)
				$(':mobile-pagecontainer').pagecontainer('change', '#playMenuPage');
			pillaUpdatePlayMenu(data);
		})
		.fail(function(jqXHR, textStatus) {
			hideLoading();
			console.log('Error occur while getting play status' + textStatus);
		});
	};

	function ajaxReqControl(action) {
		//showLoading();
		$.ajax( {
			url: '/musicbox',
			method: 'POST',
			data: JSON.stringify(action),
			//processData: false,
			//contentType: 'application/json',
			//dataType: 'json',
			timeout: 10000})
		.done(function(data) {
			//hideLoading();
			})
		.fail(function(jqXHR, textStatus) {
			//hideLoading();
			$(':mobile-pagecontainer').pagecontainer('change', '#mainPage');
			console.log('fail callback. xhr:' + textStatus);
			console.log(jqXHR);
		});
	};

	// Resource: playlist
	function ajaxReqPlaylist() {
		showLoading();
		$.ajax( {
			url: '/playlist',
			method: 'GET',
		timeout: 10000})
		.done(function(data) {
			hideLoading();
			$(':mobile-pagecontainer').pagecontainer('change', '#mainPage');
			pillaUpdateMainlist(data);
		})
		.fail(function(jqXHR, textStatus) {
			hideLoading();
			console.log('Error occur while getting mainlist' + textStatus);
		});
	};

	function ajaxReqNewPlaylist() {
		showLoading();
		$.ajax( {
			url: '/playlist',
			method: 'POST',
			data: $('form#newPlaylistForm').serialize(),
			//processData: false,
			//contentType: 'application/json',
			//dataType: 'json',
		timeout: 10000})
		.done(function(data) {
			hideLoading();
			ajaxReqPlaylist();})
			.fail(function(jqXHR, textStatus) {
				hideLoading();
				$(':mobile-pagecontainer').pagecontainer('change', '#mainPage');
				console.log('fail callback. xhr:' + textStatus);
				console.log(jqXHR);
			});
	};

	function ajaxReqDeletePlaylist(playlist) {
		showLoading();
		$.ajax( {
			url: '/playlist',
			method: 'PUT',
			data: {playlist: encodeURIComponent(playlist)},
			//processData: false,
			//contentType: 'application/json',
			//dataType: 'json',
		timeout: 10000})
		.done(function(data) {
			hideLoading();
			ajaxReqPlaylist();})
			.fail(function(jqXHR, textStatus) {
				hideLoading();
				$(':mobile-pagecontainer').pagecontainer('change', '#mainPage');
				console.log('fail callback. xhr:' + textStatus);
				console.log(jqXHR);
			});
	};

	// Resoruce: songs
	function ajaxReqSongs(playlist) {
		showLoading();
		$.ajax( {
			url: '/songs?name=' + playlist,
			method: 'GET',
		timeout: 10000})
		.done(function(data) {
			hideLoading();
			$(':mobile-pagecontainer').pagecontainer('change', '#playlistPage');
			pillaUpdatePlaylist(data);
		})
		.fail(function(jqXHR, textStatus) {
			hideLoading();
			console.log('Error occur while getting playlist' + textStatus);
		});
	};

	function ajaxReqRemoveSong(song) {
		showLoading();
		$.ajax( {
			url: '/songs?' + $.param(song),
			method: 'PUT',
			//data: $.param(song),
			//processData: false,
			//contentType: 'application/json',
			//dataType: 'json',
		timeout: 10000})
		.done(function(data) {
			hideLoading();
			ajaxReqSongs(song.playlist);})
			.fail(function(jqXHR, textStatus) {
				hideLoading();
				$(':mobile-pagecontainer').pagecontainer('change', '#mainPage');
				console.log('fail callback. xhr:' + textStatus);
				console.log(jqXHR);
			});
	};

	function ajaxReqAddSong(playlist, items) {
		showLoading();
		$.ajax( {
			url: '/songs',
			method: 'POST',
			data: JSON.stringify({playlist:playlist, items:items}),
			//processData: false,
			contentType: "application/json",
			//dataType: 'json',
		timeout: 10000})
		.done(function(data) {
			hideLoading();
			ajaxReqSongs(playlist);
			$(':mobile-pagecontainer').pagecontainer('change', '#playlistPage');
			console.log("done callback. data:" + data);})
			.fail(function(jqXHR, textStatus) {
				hideLoading();
				ajaxReqSongs(playlist);
				$(':mobile-pagecontainer').pagecontainer('change', '#platlistPage');
				console.log("fail callback. xhr:" + textStatus);
				console.log(jqXHR);
			});
	};

	function ajaxReqSongList(path) {
		showLoading();
		$.ajax( {
			url: '/songlist?path=' + encodeURIComponent(path),
			method: 'GET',
			//processData: false,
			//contentType: 'application/json',
			//dataType: 'json',
		timeout: 10000})
		.done(function(data) {
			hideLoading();
			$(':mobile-pagecontainer').pagecontainer('change', '#songPage');
			pillaUpdateSongList(data);})
			.fail(function(jqXHR, textStatus) {
				hideLoading();
				$(':mobile-pagecontainer').pagecontainer('change', '#mainPage');
				console.log('fail callback. xhr:' + textStatus);
				console.log(jqXHR);
			});
	};

	function ajaxReqMusicInfo(filePath) {
		showLoading();
		$.ajax( {
			url: '/musicinfo?path=' + encodeURIComponent(filePath),
			method: 'GET',
		timeout: 10000})
		.done(function(data) {
			hideLoading();
			$(':mobile-pagecontainer').pagecontainer('change', '#musicInfoPage');
			pillaUpdateMusicInfo(data);
		})
		.fail(function(jqXHR, textStatus) {
			hideLoading();
			console.log('Error occur while getting play status' + textStatus);
		});
	};

	//
	// Main Page: to update list by given items
	// 
	function pillaUpdateMainlist(items) {
		$('#pilla_main_list').empty();
		for(i = 0; i < items.length; i++) {
			var	liEntry = $('<li data-icon="carat-r">').html('<a href="#" class="pilla_a_plName">' + items[i].name + '<span class="ui-li-count">' + items[i].count + '</span></a><a href="#" class="pilla_a_plLink">link</a>');
			if(items[i].default === 1) {
				liEntry.attr('data-theme','b');
			}
			liEntry.data(items[i]);

			$('#pilla_main_list').append(liEntry);
		}
		$('#pilla_main_list').listview('refresh');
	}

	//
	// Playlist Page: to update list by given items
	//
	function pillaUpdatePlaylist(playlist) {
		$('#pilla_playlist_list').empty();
		$('#playlistPageHeaderMsg').text(playlist.name);
		for(i = 0; i < playlist.items.length; i++) {
			var	liEntry = $('<li data-icon="carat-r">').html('<a href="#" class="pilla_a_music">' + playlist.items[i].name + '<span class="ui-li-count">' + humanSeconds(playlist.items[i].length) + '</a><a href="#" class="pilla_a_music_act">link</a>');

			if(playlist.items[i].default === 1) {
				liEntry.attr('data-theme','b');
			}
			liEntry.data(playlist.items[i]);

			$('#pilla_playlist_list').append(liEntry);
		}
		$('#pilla_playlist_list').listview('refresh');
	}

	//
	// Play Menu Page: to update play menu by given items
	//
	function pillaUpdatePlayMenu(mb) {
		//$('#pilla_playmenu_list').empty();
		$('#playMenuPlaylistName').text(mb.plName);
		$('#playMenuPlayMode').val(mb.plMode);
		$('#playMenuPlayMode').selectmenu('refresh');
		$('#playMenuVolume').val(mb.volume);
		$('#playMenuVolume').slider('refresh');
		$('#playMenuTrackName').text(mb.trackName);

		$('#playMenuTrackPos').attr('max', mb.trackLength);
		$('#playMenuTrackPos').val(mb.trackPos);
		//$('#playMenuTrackPos').attr('value', mb.trackPos);
		$('#playMenuTrackPos').slider('refresh');

		/*
		trackUpdater = window.setInterval(function() {
			//var trackPos = $('#playMenuTrackPos').val();
			var trackPos = Number.parseInt($('#playMenuTrackPos').val());
			$('#playMenuTrackPos').val(trackPos + 1);
			if( (trackPos + 1) == $('#playMenuTrackPos').attr('max')) {
				window.clearInterval(trackUpdater);
				trackUpdater = null;
				console.log('stop');
			}
			$('#playMenuTrackPos').slider('refresh');
		}, 1000);
		*/
	}

	//
	// Music Page: to update music info by given item
	//
	function pillaUpdateMusicInfo(music) {
		//$('#pilla_playmenu_list').empty();
		$('#musicInfoPageHeaderMsg').text(music.fName);
		$('#musicInfoFileName').text(music.fName);
		$('#musicInfoFilePath').text(music.fPath);
		$('#musicInfoFileLength').text(humanSeconds(music.length));
		$('#musicInfoAudio').text(music.audio);
	}

	//
	// Song Page: to update song page by give items
	//
	function pillaUpdateSongList(songs) {
		$('#pilla_song_list').empty();
		$('#songPageHeaderMsg').text($('#playlistPageHeaderMsg').text());
		$('#songPageSelectedCountMsg').text('Selected Count: 0');
		$('#songPagePathMsg').text('Path: ' + songs.path);

		for(i = 0; i < songs.items.length; i++) {
			var liEntry;
			if(songs.items[i].type === 0) {
				liEntry = $('<li data-icon="false">').html('<a href="#" class="pilla_a_songname"><i class="fa ' + getFileIcon(songs.items[i].ext) + '"></i>&nbsp;&nbsp;' + songs.items[i].name + '</a>');
			} else {
				liEntry = $('<li>').html('<a href="#" class="pilla_a_songname"><i class="fa ' + getFileIcon(songs.items[i].ext) + '"></i>&nbsp;&nbsp;' + songs.items[i].name + '<span class="ui-li-count">' + songs.items[i].count + '</span></a><a href="#" class="pilla_a_songlink">link</a>');
			}

			if(selectedSongs[songs.items[i].path] === 1) {
				liEntry.attr('data-theme','b');
			}

			liEntry.data(songs.items[i]);
			$('#pilla_song_list').append(liEntry);
		}
		$('#pilla_song_list').listview('refresh');
	}

	$(document).ready(function() {
		// First run, load the list
		ajaxReqPlaylist();

		$(document).on('click', '.pilla_a_plName', function(e) {
			console.log('main page name');
			$('#pilla_main_list li a').removeClass('ui-btn-b');
			$(this).parent('li').children('a').addClass('ui-btn-b');
		});

		$(document).on('click', '.pilla_a_plLink', function(e) {
			console.log('main page link');
			console.log($(this).parent('li').data());
			ajaxReqSongs($(this).parent('li').data().name);
		});

		$(document).on('click', '.pilla_a_music', function(e) {
			console.log('playlist page music');
			$('#pilla_playlist_list li a').removeClass('ui-btn-b');
			$(this).parent('li').children('a').addClass('ui-btn-b');
		});

		$(document).on('click', '.pilla_a_music_act', function(e) {
			console.log('playlist page music act');
			console.log($(this).parent('li').data());
			ajaxReqMusicInfo($(this).parent('li').data().name);
		});

		$(document).on('click', '.pilla_a_songname', function(e) {
			console.log('song page name');
			var liData = $(this).parent('li').data()
			if($(this).hasClass('ui-btn-b') === true) {
				$(this).parent('li').children('a').removeClass('ui-btn-b');
				delete selectedSongs[liData.path];
			} else {
				$(this).parent('li').children('a').addClass('ui-btn-b');
				selectedSongs[liData.path] = 1;
			}
			$('#songPageSelectedCountMsg').text('Selected Count: ' +Object.keys(selectedSongs).length);
		});

		$(document).on('click', '.pilla_a_songlink', function(e) {
			console.log('song page link');
			console.log($(this).parent('li').data());
			// If the folder is selected, no need to enter the folder for more selections.
			if($(this).hasClass('ui-btn-b') === true)
				return;
			ajaxReqSongList($(this).parent('li').data().path);
		});

		$('#pilla_btn_newPlName').on('click', function(e) {
			ajaxReqNewPlaylist();
		});

		$('.pilla_btn_play_menu').on('click', function(e) {
			console.log('play_menu');
			ajaxReqPlayStatus(1);
		});

		$('#mainPage .pilla_btn_delete').on('click', function(e) {
			var plItem = $('#pilla_main_list li a.ui-btn-b').parent('li').data();
			$("#ynPageConfirmationMsg").text('Are you sure the delete playlist "'+ plItem.name + '"?');
			console.log("selected item is " + plItem.name);
			lastAction.target = 'playlist';
			lastAction.name = plItem.name;
		});

		$('#playlistPage .pilla_btn_delete').on('click', function(e) {
			var musicItem = $('#pilla_playlist_list li a.ui-btn-b').parent('li').data();
			$("#ynPageConfirmationMsg").text('Are you sure to remove "'+ musicItem.name + '" from playlist?');
			console.log('remove music');
			lastAction.target = "music";
			lastAction.name = musicItem.name;
			lastAction.playlist = $('#playlistPageHeaderMsg').text();
		});

		$("#pilla_btn_y").on("click", function(e) {
			if(lastAction.target === 'playlist') {
				ajaxReqDeletePlaylist(lastAction.name);
			} else if(lastAction.target === 'music') {
				ajaxReqRemoveSong({name: lastAction.name, playlist:lastAction.playlist});
			}
		});

		$(".pilla_btn_addsong").on("click", function(e) {
			selectedSongs = {};
			ajaxReqSongList('/');
		});

		$(".pilla_btn_ok").on("click", function(e) {
			console.log(Object.keys(selectedSongs));
			ajaxReqAddSong($('#playlistPageHeaderMsg').text(), Object.keys(selectedSongs));
		});

		$(".pilla_btn_reset").on("click", function(e) {
			selectedSongs = {};
			$('#pilla_song_list li a').removeClass('ui-btn-b');
			$('#songPageSelectedCountMsg').text('Selected Count: 0');
		});

		$(".pilla_btn_play").on("click", function(e) {
			ajaxReqControl({action:'play'});
		});

		$(".pilla_btn_stop").on("click", function(e) {
			ajaxReqControl({action:'stop'});
		});

		$(".pilla_btn_previous").on("click", function(e) {
			ajaxReqControl({action:'previous'});
		});

		$(".pilla_btn_next").on("click", function(e) {
			ajaxReqControl({action:'next'});
		});

		$(".pilla_btn_pause").on("click", function(e) {
			ajaxReqControl({action:'pause'});
		});

		$(document).on('slidestop', '#playMenuVolume', function(e) {
			console.log('volume value:' +$(this).val());
			ajaxReqControl({action:'volume', value:$(this).val()});
		});

		$(document).on('slidestop', '#playMenuTrackPos', function(e) {
			console.log('trackPos value:' +$(this).val());
			ajaxReqControl({action:'trackpos', value:$(this).val()});
		});

		$(document).on('change', '#playMenuPlayMode', function(e) {
			console.log('select value:' +$(this).val());
			ajaxReqControl({action:'playmode', value:$(this).val()});
		});

		/*
		$("#mainPage .pilla_btn_up").on("click", function(e){
		if (!currentMainPath) return;
		var idx = currentMainPath.lastIndexOf("/");
		var path = currentMainPath.substr(0, idx);
		ajaxReqFileList('/files?path=' + path, path);
		});

		$("#treePage .pilla_btn_home").on("click", function(e){
		ajaxReqFolderList('/folders', "");
		});

		$("#treePage .pilla_btn_up").on("click", function(e){
		if (!currentTreePath) return;
		var idx = currentTreePath.lastIndexOf("/");
		var path = currentTreePath.substr(0, idx);
		ajaxReqFolderList('/folders?path=' + path, path);
		$(':mobile-pagecontainer').pagecontainer('change', '#treePage');
		});
		*/
	});

})(jQuery);

