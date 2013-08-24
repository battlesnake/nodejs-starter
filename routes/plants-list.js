var plants = require('../model/plants');

exports.page = function(req, res) {
	var params = req.query;
	var	name = params.name,
		sort = params.sort || 'name',
		page = parseInt(params.page || 1),
		pagesize = parseInt(params.pagesize || 10);
	var title = 'Plants database';
	console.log('Getting data');
	plants.list(name, sort, page, pagesize,
		function (err, data) {
			pageparams = {
				'title'		: title + (name ? (' - ' + name) : ''),
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
