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

var _ = require('lodash');
var fs = require('fs');
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

app.get('/musicbox', function(req, res) {
	res.json({plName:'musicstatusxx', plMode:3 ,volume:40, trackName:'love story', trackPos: 70, trackLength:80});
});

app.post('/musicbox', function(req, res) {
	console.log(req.body);
	res.json({status: 'done'});
});

app.get('/musicinfo', function(req, res) {
	console.log(req.query);
	res.json({fName:'musicstatusxx', fPath:'/music/test/a/xxx.mp3' , audio:'192 kbps, 44 kHz (stereo)', length:123});
});

app.get('/playlist', function(req, res) {
	res.json([{name:'item1', count:3, default: 0}, {name:'item2', count: 4, default:1}]);
});

app.post('/playlist', function(req, res) {
	console.log(req.body);
	res.json({status: 'done'});
});

app.put('/playlist', function(req, res) {
	console.log(req.body);
	res.json({status: 'done'});
});

app.get('/songs', function(req, res) {
	console.log(req.query);
res.json({name:'item1', items: [{name: 'music1', default:0, length:70, path:'f/a/b/xxx.mp3'}, {name: 'music2', default:1, length:90, path:'abc/a.mp3'}, {name: 'music3', default:0, length:121, path:'rew/b.mp3'}]});
});

app.post('/songs', function(req, res) {
	console.log(req.body);
	res.json({status: 'done'});
});

app.put('/songs', function(req, res) {
	console.log(req.query);
	res.json({status: 'done'});
});

app.get('/songlist', function(req, res) {
	console.log(req.query);
	res.json({path:'/music/box/', items: [{name: 'music1.mp3', ext:'.mp3', type:0, count:0, path:'/music/box/music1.mp3'}, {name: 'music2.avi', ext:'.avi', type:0, count:0, path:'/music/box/music2.mp3'}, {name: 'folder1', ext:'' ,type:1, count:121, path:'/music/box/folder1'}, {name: 'folder2', ext:'', type:1, count:0, path:'/music/box/folder2'}]});
});

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

