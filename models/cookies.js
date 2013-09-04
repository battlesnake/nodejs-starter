module.exports = function (jarname, req, res) {
	var jar = { };
	for (var name in req.cookies)
		if (name.substr(0, jarname.length + 1) == jarname + '-')
			jar[name.substr(jarname.length + 1)] = req.cookies[name];
	jar.set = function (name, value) {
		res.on('header',
			function () {
				res.cookie(jarname + '-' + name, value, { maxAge: 7 * 86400 * 1000 });
			});
	};
	return jar;
};
