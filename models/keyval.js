exports.fromString = function (str) {
	return (str || '').split(',')
		.reduce(
			function (state, kvp) {
				var kv = kvp && kvp.split(':');
				if (kv && (kv.length == 2) && kv[0].length)
					state[kv[0]] = kv[1];
				return state;
			},
			{ });
};

exports.toString = function (values) {
	var data = [];
	for (var name in values || [])
		data.push(name + ':' + values[name]);
	return data.join(',');
};
