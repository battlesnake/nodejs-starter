var db = require('./db');

/*
 * If I was to re-write this after a few years of using Node, it would use the
 * caolan async library rather than this hacked-together async method chainer
 */

/* Parses a list of queries */
/* The query callbacks(state, result) should modify the state object */
/* The main callback(err, state) is called on error or on completion */
function parseQueryList(queries, state, callback) {
	if (!queries.length) {
		callback(null, state);
		return;
	}
	var data = queries.shift();
	db.query(data.query, data.params,
		function (err, result) {
			if (err)
				callback(err, state);
			else {
				data.callback(state, result);
				parseQueryList(queries, state, callback);
			}
		});
};

/* Add extra clauses to a query */
function querySortLimit(query, params, extra) {
	var	name = extra.name,
		sort = extra.sort,
		page = extra.page,
		pagesize = extra.pagesize;
	if (name && name.length && name != '*') {
		query.push('where ?');
		params.push({ 'name': name });
	}
	if (sort && sort.length) {
		query.push('order by ??');
		params.push(sort);
	}
	if (pagesize && page) {
		query.push('limit ?, ?');
		params.push((page - 1) * pagesize, pagesize);
	}
}

/* Lists plants, name, sort, page, pagesize are optional */
/* function callback(err, { result fields pagecount names }) */
exports.list = function(name, sort, page, pagesize, callback) {
	var queries = [];
	/* Main query */
	var query = [];
	var params = [];
	query.push('select SQL_CALC_FOUND_ROWS id, name, weight from plants');
	querySortLimit(query, params, {
		'name': name,
		'sort': sort,
		'page': page,
		'pagesize': pagesize
	});
	/* Build a query list and use pseudorecursion to avoid a stupid level of indentation */
	queries.push(
		{
			'query'		: query.join(' '),
			'params'	: params,
			'callback'	:
				function (state, value) {
					state.result = value;
				}
		});
	queries.push(
		{
			'query'		: 'select FOUND_ROWS() as rowcount',
			'params'	: null,
			'callback'	:
				function (state, value) {
					state.pagecount = Math.ceil(value[0].rowcount / pagesize);
				}
		});
	queries.push(
		{
			'query'		: 'select distinct name from plants order by name',
			'params'	: null,
			'callback'	:
				function (state, value) {
					state.names = value.map(
						function (row) {
							return row.name;
						});
				}
		});
	var state = {
		fields: [ 'name', 'weight' ]
	};
	parseQueryList(queries, state,
		function (err, state) {
			if (err)
				console.log('Failed to read from the plant database: ' + err);
			callback(err, state);
		});
};

/* Summarises (aggregates) the data */
/* function callback(err, { result fields pagecount }) */
exports.summary = function(sort, page, pagesize, callback) {
	var queries = [];
	/* Main query */
	var query = [];
	var params = [];
	query.push('select SQL_CALC_FOUND_ROWS');
	query.push([
		'name',
		'COUNT(name) as `count`',
		'FORMAT(SUM(weight), 2) as `total weight`',
		'FORMAT(AVG(weight), 2) as `average weight`'
		].join(', '));
	query.push('from plants');
	query.push('group by name');
	querySortLimit(query, params, {
		'sort': sort,
		'page': page,
		'pagesize': pagesize
	});
	/* Build a query list and use pseudorecursion to avoid a stupid level of indentation */
	queries.push(
		{
			'query'		: query.join(' '),
			'params'	: params,
			'callback'	:
				function (state, value) {
					state.result = value;
				}
		});
	queries.push(
		{
			'query'		: 'select FOUND_ROWS() as rowcount',
			'params'	: null,
			'callback'	:
				function (state, value) {
					state.pagecount = Math.ceil(value[0].rowcount / pagesize);
				}
		});
	var state = {
		'fields': [ 'name', 'count', 'total weight', 'average weight' ]
	};
	parseQueryList(queries, state,
		function (err, state) {
			if (err)
				console.log('Failed to read from the plant database: ' + err);
			callback(err, state);
		});
};

/* Gets the names of all plants in the database */
/* function callback(err, { result pagecount }) */
exports.names = function(page, pagesize, callback) {
	var queries = [];
	var query = [];
	var params = [];
	query.push('select SQL_CALC_FOUND_ROWS name from plants');
	query.push('group by name');
	querySortLimit(query, params, {
		'sort': 'name',
		'page': page,
		'pagesize': pagesize
	});
	queries.push(
		{
			'query'		: query.join(' '),
			'params'	: params,
			'callback'	:
				function (state, value) {
					state.result = value;
				}
		});
	queries.push(
		{
			'query'		: 'select FOUND_ROWS() as rowcount',
			'params'	: null,
			'callback'	:
				function (state, value) {
					state.pagecount = Math.ceil(value[0].rowcount / pagesize);
				}
		});
	var state = { };
	parseQueryList(queries, state,
		function (err, state) {
			if (err)
				console.log('Failed to read from the plant database: ' + err);
			callback(err, state);
		});
};

/* Dumps the table */
/* function callback(err, result) */
exports.dump = function(callback) {
	var queries = [];
	/* Build a query list and use pseudorecursion to avoid a stupid level of indentation */
	queries.push(
		{
			'query'		: 'select name, weight from plants',
			'params'	: null,
			'callback'	:
				function (state, value) {
					state.result = value;
				}
		});
	var state = { };
	parseQueryList(queries, state,
		function (err, state) {
			if (err)
				console.log('Failed to read from the plant database: ' + err);
			callback(err, state.result);
		});
};

/* Adds a plant to the database */
/* function callback(err, id_of_new_row) */
exports.add = function(name, weight, callback) {
	params = {
		'id'	: null,
		'name'	: name,
		'weight': weight
	};
	db.query('insert into plants set ?', params,
		function (err, result) {
			callback(err, err ? null : result.insertId);
		});
};

/* Modifies a plant */
/* function callback(err) */
exports.modify = function(id, weight, callback) {
	db.query('update plants set ? where ?', 
		[
			{ 'weight': weight },
			{ 'id': id }
		],
		function (err, result) {
			callback(err);
		});
};

/* Deletes plants from the database */
/* function callback(err, number_of_rows_deleted) */
exports.remove = function(id, callback) {
	db.query('delete from plants where ?', { 'id': id },
		function (err, result) {
			callback(err, err ? null : result.affectedRows);
		});
};
