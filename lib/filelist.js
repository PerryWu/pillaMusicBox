var path = require('path');
var fs = require('fs-extra');
var util = require('util');
var async = require('async');
var _ = require('lodash');
var mp3info = require('./mp3info');

var filelist = {};

/*
 *	Will return
 *	{stats: obj, count: number, mp3len: number}
 *	count will be "files + folders number" in given path.
 */
function getFileInfo(path, cb) {
	var result = {};

	async.parallel([function(stCb) {
		fs.stat(path, function(err, stats) {
			if (err) {
				throw err;
			}
			if (stats.isDirectory()) {
				fs.readdir(path, function(err, files) {
					if (err) {
						throw err;
					}
					stCb(null, {
						stats: stats,
						count: files.length
					});
				});
			} else {
				stCb(null, {
					stats: stats,
					count: 0
				});
			}
		});
	}, function(mp3infoCb) {
		mp3info(path, mp3infoCb);
	}], function(err, results) {
		if (err) {
			console.log(err);
			return cb(err, null);
		}
		if (results[1].L.length === 0 || results[1].v.length === 0)
			mp3valid = 0;
		else
			mp3valid = 1;
		result = {
			stats: results[0].stats,
			count: results[0].count,
			mp3len: results[1].length,
			mp3valid: mp3valid
		};
		//console.log(result);
		cb(null, result);
	});
}

filelist.getFilelist = function(req, res) {
	console.log(req.query);

	var currentDir = filelist.defaultDir;
	var query = req.query.path || '';

	if (query.length === 0)
		currentDir = filelist.defaultDir;
	else
		currentDir = query;
	console.log("browsing ", currentDir);

	fs.readdir(currentDir, function(err, files) {
		if (err) {
			throw err;
		}
		var items = [];
		var itemList = [];

		files.filter(function(file) {
			return true;
		}).forEach(function(file) {
			itemList.push({
				file: file,
				filePath: path.join(currentDir, file),
			});
		});

		//console.log(itemList);
		async.map(itemList,
			function(fileObj, cb) {
				getFileInfo(fileObj.filePath, cb);
			},
			function(err, results) {
				if (err) {
					console.log(err);
					return;
				}
				for (var i = 0; i < results.length; i++) {
					// only aduio files and directory can be recorded.
					if (results[i].stats.isDirectory() == true || path.extname(itemList[i].filePath) == '.mp3' || path.extname(itemList[i].filePath) == '.wav') {
						items.push({
							name: itemList[i].file,
							path: itemList[i].filePath,
							type: results[i].stats.isDirectory(),
							count: results[i].count,
							ext: path.extname(itemList[i].filePath),
							mp3len: results[i].mp3len,
							mp3valid: results[i].mp3valid
						});
					}
				}
				// Sorted by directory or file type.
				items = _.sortBy(items, function(f) {
					return f.type
				});
				console.log(items);
				res.json({
					path: currentDir,
					items: items
				});
			});
	});
};

module.exports = filelist;
