var plants = require('../models/plants');
var keyval = require('../models/keyval');

exports.page = function(req, res) {
	var cookies = require('../models/cookies')('knapsack', req, res);
	var params = req.query;
	/* Read params from request, then cookies, then default */
	var	page = parseInt(params.page || 1);
	var pagesize = parseInt(params.pagesize || cookies.pagesize || 10);
	/* Store params to cookies */
	cookies.set('pagesize', pagesize);
	/* Title of page */
	var title = 'Plants database';
	/* Generate page from query */
	plants.names(page, pagesize,
		function (err, data) {
			pageparams = {
				'PAGENAME'	: 'knapsack',
				'title'		: title + ' - Knapsack',
				'filters'	: data.names,
				'fields'	: [ 'name', 'value' ],
				'units'		: { 'value': '&pound;/kg' },
				'page'		: page,
				'pagecount'	: data.pagecount,
				'pagesize'	: pagesize
			};
			if (err) {
				pageparams.title = title + ' - Error';
				pageparams.error = err;
			}
			else {
				/* Parse "values" cookie, stored as comma-separated key:value pairs */
				var kv = keyval.fromString(cookies.values || '');
				pageparams.data = data.result
					.map(
						function (row) {
							return {
								'name'	: row.name,
								'value'	: parseFloat(kv[row.name] || 1)
							};
						});
			}
			res.render('knapsack', pageparams);
		});
};

exports.ajax = function(req, res) {
	if (req.method != 'POST') {
		res.statusCode = 405;
		res.end();
		return;
	}

	/* Interpret command */
	var command = req.query.command;	
	var parsePost;
	if (command == 'save')
		parsePost = commandSave;
	else if (command == 'getdata')
		parsePost = commandGetData;
	else if (command == 'formatsolution')
		parsePost = commandFormatSolution;
	else {
		res.statusCode = 400;
		res.contentType('text/plain');
		res.end('Invalid command or missing parameter: ' + command);
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
	
	/* Save some values to the cookie: KVP=> */
	function commandSave(body) {
		var cookies = require('../models/cookies')('knapsack', req, res);
		var storedvalues = keyval.fromString(cookies.values);
		JSON.parse(body).forEach(
			function (kv) {
				storedvalues[kv.name] = kv.value;
			}
		);
		cookies.set('values', keyval.toString(storedvalues));
		res.statusCode = 200;
		res.end();
	}

	/* Get a full dataset for the solver: =>JSON */
	function commandGetData(body) {
		var cookies = require('../models/cookies')('knapsack', req, res);
		var storedvalues = keyval.fromString(cookies.values);
		plants.dump(
			function(err, result) {
				if (err) {
					res.statusCode = 500;
					res.end('Error: ' + err);
				}
				else {
					var data = result
						.map(
							function (item) {
								var valueRate = storedvalues[item.name];
								if (!valueRate)
									return undefined
								else
									return {
										'name'	: item.name,
										'weight': item.weight,
										'value'	: item.weight * valueRate
								};
							})
						.filter(
							function (item) {
								return item;
							});
					res.statusCode = 200;
					res.contentType('text/json');
					res.end(JSON.stringify(data));
				}
			});
	}

	/* HTML-format a solution: JSON=>HTML */
	function commandFormatSolution(body) {
		var data = JSON.parse(body);
		var summary = data.reduce(
			function (state, item) {
				state.value += item.value;
				state.weight += item.weight;
				return state;
			},
			{ 'value': 0, 'weight': 0 });
		summary.items = data;
		summary.fields = { 'name': null, 'weight': null, 'value': null };
		summary.units = { 'weight': 'kg', 'value': '&#163;' }
		res.statusCode = 200;
		res.contentType('application/xml');
		res.render('knapsack-solution', summary);
	}
};
