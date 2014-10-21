#!/usr/local/bin/node

var express = require('express');
var db = require('./models/db');
var http = require('http');
var path = require('path');

var app = express();

app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.cookieParser('node-secret-cookie-key-thing'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(app.router);
app.locals.pretty = true;

var pages = {
	'data'		: require('./controllers/data'),
	'summary'	: require('./controllers/summary'),
	'knapsack'	: require('./controllers/knapsack')
};

app.get('/', function (req, res) { res.redirect('/data/'); });

for (var name in pages) {
	app.get('/' + name, pages[name].page);
	if (pages[name].ajax) {
		app.post('/' + name + '/ajax', pages[name].ajax);
	}
}

http.createServer(app).listen(app.get('port'), function() {
  console.log('Express server listening on port ' + app.get('port'));
});
