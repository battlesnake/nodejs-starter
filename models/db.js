var mysql = require('mysql');

var connection = mysql.createConnection({
	host	: 'localhost',
	user	: 'node',
	password: 'node-password',
	database: 'node'
});

connection.connect(
	function(err) {
		if (err)
			throw new Error('Failed to connect to database: ' + err);
	});

function query(query, params, callback) {
	queryobject = connection.query(query, params, callback);
}

module.exports.query = query;
