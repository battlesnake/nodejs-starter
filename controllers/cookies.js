module.exports = function (req, res) {
	return {
		'req': req,
		'res': res,
		'get':
			function (name) {
				if (this.req.cookies[name])
					return this.req.cookies[name];
				else
					return undefined;
			},
		'set':
			function (name, value) {
				this.res.cookie(name, value, { maxAge: 3600 * 1000 });
			}
	};
};
