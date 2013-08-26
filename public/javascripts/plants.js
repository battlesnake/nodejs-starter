function submitNavForm() {
	document.getElementById('navForm').submit();
}

function doPage(page) {
	if (page)
		document.getElementById('page').value = page;
	submitNavForm();
}

function doRepage(newsize) {
	if (newsize) {
		var page = document.getElementById('page');
		var pagesize = document.getElementById('pagesize');
		page.value = ((page.value - 1) * pagesize.value) / newsize + 1;
		pagesize.value = newsize;
	}
	submitNavForm();
}

function doFilter(filter) {
	if (filter)
		document.getElementById('filter').value = filter;
	submitNavForm();
}

function doSort(sort) {
	if (sort)
		document.getElementById('sort').value = sort;
	submitNavForm();
}

/* Create an XMLHttpRequest object */
function makeXHR(callback) {
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange =
		function () {
			switch (xhr.readyState) {
			case 0: /* Uninitialized */
			case 1: /* Loading */
			case 2: /* Loaded */
			case 3: /* Interactive */
				return;
			case 4: /* Completed */
				callback(xhr);
				return;
			default:
				alert('Could not connect to server');
				return;
			}
		};
	return xhr;
}

/* Ajax request, uses POST method but URI-encodes all parameters in the query string */
/* Use for small queries */
function doAjax(params, callback) {
	var q = [ ];
	for (var param in params)
		q.push(param + '=' + encodeURIComponent(params[param]));
	q = q.join('&');
	var xhr = makeXHR(callback);
	xhr.open('post', 'ajax/?' + q, true);
	xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
	xhr.send();
}

/* Ajax request, uses POST method with command URI-encoded in the query string and */
/* the body placed in the HTTP body */
function doAjaxText(command, body, callback, contenttype) {
	var xhr = makeXHR(callback);
	var xml = (new XMLSerializer()).serializeToString(document);
	xhr.open('post', 'ajax/?command=' + encodeURIComponent(command), true);
	xhr.setRequestHeader('Content-type', contenttype || 'text/plain');
	xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
	xhr.send(body);
}

/* Ajax request, uses POST method with command URI-encoded in the query string and */
/* document placed in the HTTP body */
function doAjaxXml(command, document, callback) {
	doAjaxText(command, (new XMLSerializer()).serializeToString(document), callback, 'application/xml');
}

/* Ajax request, uses POST with command URI-encoded in the query string and */
/* the object JSON-encoded in the POST body */
function doAjaxJson(command, object, callback) {
	doAjaxText(command, JSON.stringify(object), callback, 'text/json');
}

function isNumber(n) {
	return !isNaN(parseFloat(n)) && isFinite(n);
}

function clearNode(node) {
	var child;
	while (child = node.firstChild)
		node.removeChild(child);
}
