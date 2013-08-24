var plants = require('../models/plants');

var printObj = require('../debug/printObj');

exports.page = function(req, res) {
	var cookies = require('./cookies')(req, res);
	var params = req.query;
	printObj(req.cookies, 'cookies');
	/* Read params from request, then cookies, then default */
	var	name = params.name || cookies.get('name'),
		sort = params.sort || cookies.get('sort') || 'name',
		page = parseInt(params.page || 1),
		pagesize = parseInt(params.pagesize || cookies.get('pagesize') || 10);
	/* Store params to cookies */
	cookies.set('name', name);
	cookies.set('sort', sort);
	cookies.set('pagesize', pagesize);
	/* Title of page */
	var title = 'Plants database';
	/* Generate page from query */
	plants.list(name, sort, page, pagesize,
		function (err, data) {
			pageparams = {
				'title'		: title + ((name && name != '*') ? (' - ' + name) : ''),
				'name'		: name,
				'sort'		: sort,
				'page'		: page,
				'pagesize'	: pagesize,
				'pagecount'	: data.pagecount,
				'names'		: data.names,
				'fields'	: data.fields
			};
			if (err) {
				pageparams.title = title + ' - Error';
				pageparams.error = err;
			}
			else
				pageparams.data = data.result;
			res.render('plants-list', pageparams);
		});
};

exports.ajax = function(req, res) {
	var params = req.query;
	var	command = params.command,
		id = params.id,
		name = params.name,
 		weight = params.weight;
	var callback =
		function (err) {
			res.setHeader('Content-Type', 'text/html');
			if (err)
				res.write('Error: ' + err.toString());
			else
				res.write('INVALIDATE');
			res.end();
		};
	if (command == 'add' && name && weight) {
		plants.add(name, weight, callback);
	}
	else if (command = 'edit' && id && weight) {
		plants.modify(id, weight, callback);
	}
	else if (command = 'delete' && id) {
		plants.remove(id, callback);
	}
	else
		res.end('Invalid command or missing parameter: ' + command);
};
