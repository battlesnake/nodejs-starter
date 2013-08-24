var db = require('./db');

/* Lists plants, name, sort, page, pagesize are optional */
/* function callback(err, { result pagecount names fields }) */
exports.list = function(name, sort, page, pagesize, callback) {
	var queries = [];
	/* Main query */
	var query = [];
	var params = [];
	query.push('select SQL_CALC_FOUND_ROWS * from plants');
	if (name) {
		query.push('where ?');
		params.push({ 'name': name });
	}
	if (sort) {
		query.push('order by ??');
		params.push(sort);
	}
	if (pagesize && page) {
		query.push('limit ?, ?');
		params.push((page - 1) * pagesize, pagesize);
	}
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
			'query'		: 'select FOUND_ROWS() as count',
			'params'	: null,
			'callback'	:
				function (state, value) {
					state.pagecount = Math.ceil(value[0].count / pagesize);
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
	queries.push(
		{
			'query'		: 'show columns from plants',
			'params'	: null,
			'callback'	:
				function (state, value) {
					state.fields = value.map(
						function (row) {
							return row.Field;
						});
				}
		});
	var parseQueryList =
		function (queries, state, callback) {
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
	var state = { };
	parseQueryList(queries, state,
		function (err, state) {
			if (err)
				console.log('Failed to read from the plant database: ' + err);
			callback(err, state);
		});
};

/* Lists plant types */
/* function callback(err, array_of_names) */
exports.types = function(callback) {
	db.query('select name from plants order by name asc', null,
		function(err, result) {
			callback(err, result);
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
