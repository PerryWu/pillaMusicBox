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

app.get('/playlist', function(req, res) {
	res.json([{name:'item1', count:3, default: 0}, {name:'item2', count: 4, default:1}]);
});

app.get('/playlistContent', function(req, res) {
	console.log(req.query);
	res.json({name:'item1', items: [{name: 'music1'}, {name: 'music2'}, {name: 'music3'}]});
});

app.get('/playStatus', function(req, res) {
	res.json({name:'musicstatusxx', volume:40, trackPos: 70, trackLength:80});
});

app.post('/folder', function(req, res) {
	console.log(req.body);
	res.json({status: 'done'});
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

