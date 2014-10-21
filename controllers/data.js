var plants = require('../models/plants');

exports.page = function(req, res) {
	var cookies = require('../models/cookies')('data', req, res);
	var params = req.query;
	/* Read params from request, then cookies, then default */
	var	filter = params.filter || cookies.filter || '*';
	var sort = params.sort || cookies.sort || 'name';
	var page = parseInt(params.page || 1);
	var pagesize = parseInt(params.pagesize || cookies.pagesize || 10);
	/* Store params to cookies */
	cookies.set('filter', filter);
	cookies.set('sort', sort);
	cookies.set('pagesize', pagesize);
	/* Title of page */
	var title = 'Plants database';
	/* Generate page from query */
	plants.list(filter, sort, page, pagesize,
		function (err, data) {
			pageparams = {
				'PAGENAME'	: 'data',
				'title'		: title + ((filter && filter != '*') ? (' - ' + filter) : ''),
				'filter'	: filter,
				'filters'	: data.names,
				'sort'		: sort,
				'fields'	: data.fields,
				'units'		: { 'weight'	: 'kg' },
				'page'		: page,
				'pagecount'	: data.pagecount,
				'pagesize'	: pagesize
			};
			if (err) {
				pageparams.title = title + ' - Error';
				pageparams.error = err;
			}
			else
				pageparams.data = data.result;
			res.render('data', pageparams);
		});
};

exports.ajax = function(req, res) {
	if (req.method != 'POST') {
		res.statusCode = 405;
		res.end();
		return;
	}
	
	var callback =
		function (err) {
			res.contentType('text/plain');
			if (err) {
				res.statusCode = 500;
				res.write('Error: ' + err.toString());
			}
			else {
				/* 302: reload page (TODO: replace this with proper controller logic */
				res.statusCode = 302;
			}
			res.end();
		};
		
	var parsePost = null;

	/* Interpret command */
	var	command = req.query.command;
	if (command == 'add')
		parsePost =
			function (body) {
				var data = JSON.parse(body);
				plants.add(data.name, data.weight, callback);
			};
	else if (command == 'edit')
		parsePost =
			function (body) {
				var data = JSON.parse(body);
				plants.modify(data.id, data.weight, callback);
			};
	else if (command == 'delete')
		parsePost =
			function (body) {
				var data = JSON.parse(body);
				plants.remove(data.id, callback);
			}
	else {
		res.statusCode = 400;
		res.contentType('text/plain');
		res.end('Invalid command: ' + command);
		return;
	}

	/* Parse POST body */
	var body = '';
	req.on('data', function (data) {
		body += data;
		/* Nuke requests larger than 100kB */
		if (body.length > 1e5)
			req.connection.destroy();
	});
	req.on('end',
		function () {
			parsePost(body);
		});

};
