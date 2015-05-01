/**
* Module dependencies.
*/

var express = require('express');
var http = require('http');
var path = require('path');
var app = express();

var bodyParser = require('body-parser');
var session = require('express-session');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var methodOverride = require('method-override');
var errorhandler = require('errorhandler');

var playlist = require('./lib/playlist');
var filelist = require('./lib/filelist');
var musicinfo = require('./lib/musicinfo');
var musicbox = require('./lib/musicbox');
var musicboxApp = new musicbox(playlist);

var dir = process.argv[2] || "/home/perry/Music";
filelist.defaultDir = dir;

var util = require('util');
var async = require('async');

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'html');

app.use(logger(':method :url'));
app.use(methodOverride('_method'));
app.use(cookieParser('pilla'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(session({
	resave: false, // don't save session if unmodified
	saveUninitialized: false, // don't create session until something stored
	secret: 'pilla, very secret'
}));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res){
	res.redirect('index.html');
});

app.get('/musicbox', musicboxApp.getBoxInfo);

app.post('/musicbox', musicboxApp.reqBoxActions);

app.get('/musicinfo', musicinfo.getMusicInfo);

app.get('/playlist', playlist.getPlaylist);

app.post('/playlist', playlist.createPlaylist);

app.put('/playlist', playlist.deletePlaylist)

app.get('/songs', playlist.getSongsFromPlaylist);

app.post('/songs', playlist.addSongsToPlaylist);

app.put('/songs', playlist.removeSongFromPlaylist);

app.get('/songlist', filelist.getFilelist);

/*
app.get('/files', fileList.getFileList);
app.post('/files', fileList.actFiles);
app.get('/folders', fileList.getFolderList);
*/

// development only
if ('development' == app.get('env')) {
	app.use(errorhandler());
}

http.createServer(app).listen(app.get('port'), function(){
	console.log('Express server listening on port ' + app.get('port'));
});

