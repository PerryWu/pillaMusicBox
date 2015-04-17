(function($) {

	$(function() {
		$( '#popupYnPage' ).enhanceWithin().popup();
	});

	//
	// Loading
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
	// Y/N Page works
	//
	function emptyYnSelection() {
		$('#ynPageConfirmationMsg').text('Please select files');
		$('#pilla_btn_y').hide();
		$('#pilla_btn_n').text('Back');
	}

	function updateYnMsg(msg) {
		$('#ynPageConfirmationMsg').text(msg);
		$('#pilla_btn_y').show();
		$('#pilla_btn_n').text('No');
	}

	//
	// Ajax Actions
	//
/*
	function ajaxReqAction() {
		actReq.srcFiles = [];
		if(currentItem) {
			actReq.srcFiles.push(currentItem.Path);
		} else {
			var itemList = Object.keys(currentSelectedItems);
			for(var i=0; i < itemList.length; i++) {
				if(currentMainPath.length != 0)
					actReq.srcFiles.push(currentMainPath + "/" + itemList[i]);
				else
					actReq.srcFiles.push(itemList[i]);
			}
		}
		showLoading();
		$.ajax( {
			url: '/files',
			method: 'POST',
			data: JSON.stringify(actReq),
			//processData: false,
			contentType: "application/json",
			//dataType: 'json',
		timeout: 10000})
		.done(function(data) {
			hideLoading();
			ajaxReqFileList("files", "");
			$(':mobile-pagecontainer').pagecontainer('change', '#mainPage');
			console.log("done callback. data:" + data);})
			.fail(function(jqXHR, textStatus) {
				hideLoading();
				ajaxReqFileList("files", "");
				$(':mobile-pagecontainer').pagecontainer('change', '#mainPage');
				console.log("fail callback. xhr:" + textStatus);
				console.log(jqXHR);
			});
	};
*/

	function ajaxReqMainlist() {
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

	function ajaxReqPlaylist(name) {
		showLoading();
		$.ajax( {
			url: '/playlistContent?name=' + name ,
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

	function ajaxReqPlayStatus(redirect) {
		//showLoading();
		$.ajax( {
			url: '/playstatus',
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

	function ajaxReqNewFolder() {
		showLoading();
		$.ajax( {
			url: '/folder',
			method: 'POST',
			data: $('form#newPlaylistForm').serialize(),
			//processData: false,
			//contentType: 'application/json',
			//dataType: 'json',
		timeout: 10000})
		.done(function(data) {
			hideLoading();
			ajaxReqMainlist();})
		.fail(function(jqXHR, textStatus) {
			hideLoading();
			$(':mobile-pagecontainer').pagecontainer('change', '#mainPage');
			console.log('fail callback. xhr:' + textStatus);
			console.log(jqXHR);
		});
	};
/*
	function ajaxReqFolderList(urlPath, itemPath) {
		var reqItemPath = itemPath;
		showLoading();
		$.ajax( {
			url: urlPath,
			method: 'GET',
		timeout: 10000})
		.done(function(data) {
			hideLoading();
			pillaUpdateTreeList(reqItemPath, data);
			currentTreePath = reqItemPath;
		})
		.fail(function(jqXHR, textStatus) {
			hideLoading();
			alert("Error occur while accessing (" + itemPath + ") : " + textStatus);
		});
	};
*/
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
			var	liEntry = $('<li data-icon="carat-r">').html('<a href="#" class="pilla_a_music">' + playlist.items[i].name + '</a><a href="#" class="pilla_a_music_act">link</a>');
			liEntry.data(playlist);

			$('#pilla_playlist_list').append(liEntry);
		}
		$('#pilla_playlist_list').listview('refresh');
	}

	var trackUpdater = null;
	//
	// Play Menu Page: to update play menu by given items
	//
	function pillaUpdatePlayMenu(playStatus) {
		//$('#pilla_playmenu_list').empty();
		$('#playMenuPlaylistName').text(playStatus.name);
		$('#playMenuVolume').val(playStatus.volume);
		$('#playMenuVolume').slider('refresh');

		$('#playMenuTrackPos').attr('max', playStatus.trackLength);
		$('#playMenuTrackPos').val(playStatus.trackPos);
		//$('#playMenuTrackPos').attr('value', playStatus.trackPos);
		$('#playMenuTrackPos').slider('refresh');

		trackUpdater = window.setInterval(function() {
			//var trackPos = $('#playMenuTrackPos').val();
			var trackPos = Number.parseInt($('#playMenuTrackPos').val());
			$('#playMenuTrackPos').val(trackPos + 1);
			if( (trackPos + 1) == $('#playMenuTrackPos').attr('max')) {
				window.clearInterval(trackUpdater);
				console.log('stop');
			}
			$('#playMenuTrackPos').slider('refresh');
		}, 1000);

		//$('#pilla_playmenu_list').listview('refresh');
	}

/*
	//
	// Item Page: to update list by given item
	//
	function pillaUpdateItemInfo(item) {
		currentItem = item;
		$("#itemPageHeaderMsg").text(item.Name);
		$("#itemPageContentMsg").html("<h3> File path :" + item.Path + "</h3><h3> File size :" + humanFileSize(item.fileSize) + "</h3><h3> Last modified time :" + item.MTime + "</h3>");
	}

	//
	// Tree page: to update list by given items
	//
	function pillaUpdateTreeList(path, items) {
		$("#pilla_tree_list").empty();
		$("#treePagePathMsg").text("To: " + path + "/");
		for(i = 0; i < items.length; i++) {
			var liEntry;
			if(items[i].FolderCount > 0) {
				liEntry = $('<li data-icon="carat-r">').html('<a href="#"><i class="fa fa-folder"></i>&nbsp;&nbsp;' + items[i].Name + '<span class="ui-li-count">' + items[i].FolderCount + '</span></a>');
			} else {
				liEntry = $('<li data-icon="false">').html('<a href="#"><i class="fa fa-folder"></i>&nbsp;&nbsp;' + items[i].Name + '</a>');

			}

			if(items[i].FolderCount > 0) { 
				(function (selector, item) {
					var itemPath = item.Path;
					$(selector).children("a").on("click", function(e) {
						ajaxReqFolderList('/folders?path=' + itemPath, itemPath);
					});
				})(liEntry, items[i]);
			} else {
				(function (selector, item) {
					var itemPath = item.Path;
					$(selector).children("a").on("click", function(e) {
						$("#treePagePathMsg").text("To: " + itemPath + "/");
					});
				})(liEntry, items[i]);
			}
			$("#pilla_tree_list").append(liEntry);
		}
		$("#pilla_tree_list").listview('refresh');
	}
*/
	$(document).ready(function() {
		// First run, load the list
		ajaxReqMainlist();

		$(document).on('click', '.pilla_a_plName', function(e) {
			console.log('playlist name');
			$('#pilla_main_list li a').removeClass('ui-btn-b');
			$(this).parent('li').children('a').addClass('ui-btn-b');
		});

		$(document).on('click', '.pilla_a_plLink', function(e) {
			console.log('playlist link');
			console.log($(this).parent('li').data());
			ajaxReqPlaylist($(this).parent('li').data().name);
		});

		/*
		$('.pilla_btn_play').on('click', function(e){
			var data = [{name:'item1', count:3, default: 0}, {name:'item2', count: 4, default: 1}];
			pillaUpdateMainlist(data);
		});
		*/

		$('#pilla_btn_newPlName').on('click', function(e){
			ajaxReqNewFolder();
		});

		$('.pilla_btn_play_menu').on('click', function(e){
			console.log('play_menu');
			ajaxReqPlayStatus(1);
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

		$("#treePage .pilla_btn_here").on("click", function(e){
			actReq.toPath = $("#treePagePathMsg").text().slice(4);
			if (actReq.action === "copy") {
				updateYnMsg("Are you sure to copy?");
			} else if (actReq.action === "move") {
				updateYnMsg("Are you sure to move?");
			} else {
				alert("Unknown action:" + actReq.action);
				return;
			}
		});

		$(".pilla_btn_copy").on("click", function(e){
			if (currentItem == null && Object.keys(currentSelectedItems).length == 0) {
				emptyYnSelection();
				return;
			}
			actReq.action = "copy";
			ajaxReqFolderList('/folders', "");
			$(':mobile-pagecontainer').pagecontainer('change', '#treePage');
		});

		$(".pilla_btn_move").on("click", function(e){
			if (currentItem == null && Object.keys(currentSelectedItems).length == 0) {
				emptyYnSelection();
				return;
			}
			actReq.action = "move";
			ajaxReqFolderList('/folders', "");
			$(':mobile-pagecontainer').pagecontainer('change', '#treePage');
		});

		$(".pilla_btn_delete").on("click", function(e){
			if (currentItem == null && Object.keys(currentSelectedItems).length == 0) {
				emptyYnSelection();
				return;
			}
			actReq.action = "delete";
			updateYnMsg("Are you sure to delete ?");
		});

		$("#pilla_btn_y").on("click", function(e){
			ajaxReqAction();
			//setTimeout(function() {}, 5000);
		});
*/
	});

})(jQuery);

