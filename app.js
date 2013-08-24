#!/usr/local/bin/node

var express = require('express');
var db = require('./models/db');
var http = require('http');
var path = require('path');

var app = express();

app.configure(function () {
	app.set('port', process.env.PORT || 3000);
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.use(express.favicon());
	app.use(express.logger('dev'));
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(app.router);
	app.use(express.static(path.join(__dirname, 'public')));
});

// app.get('/', require('./routes'));
var plants = {
	'list'		: require('./controllers/plants-list'),
	'summary'	: require('./controllers/plants-summary')
};

function makeRedir(from, to) {
	app.use(from,
		function (req, res) {
			res.redirect(to);
		});
}

app.get('/plants/summary/ajax/', plants.summary.ajax);
app.get('/plants/summary/', plants.summary.page);
app.get('/plants/data/ajax/', plants.list.ajax);
app.get('/plants/data/', plants.list.page);
makeRedir('/plants', '/plants/data/');

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
