var plants = require('../models/plants');

exports.page = function(req, res) {
	var cookies = require('../models/cookies')('summary', req, res);
	var params = req.query;
	/* Read params from request, then cookies, then defaults */
	var	sort = params.sort || cookies.sort || 'name';
	var page = parseInt(params.page || 1);
	var pagesize = parseInt(params.pagesize || cookies.pagesize || 10);
	console.log('Page: ' + page);
	/* Store params to cookies */
	cookies.set('sort', sort);
	cookies.set('pagesize', pagesize);
	/* Title of page */
	var title = 'Plants database';
	/* Generate page from query */
	plants.summary(sort, page, pagesize,
		function (err, data) {
			pageparams = {
				'PAGENAME'	: 'summary',
				'title'		: title + ' - Summary',
				'sort'		: sort,
				'page'		: page,
				'pagesize'	: pagesize,
				'pagecount'	: data.pagecount,
				'fields'	: data.fields,
				'units'		: { 'weight': 'kg', 'average weight': 'kg', 'total weight': 'kg' }
			};
			if (err) {
				pageparams.title = title + ' - Error';
				pageparams.error = err;
			}
			else
				pageparams.data = data.result;
			res.render('summary', pageparams);
		});
};
