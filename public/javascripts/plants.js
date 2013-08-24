function submitNavForm() {
	document.getElementById('navForm').submit();
}

function doPage(num) {
	document.getElementById('pagenum').value = num;
	submitNavForm();
}

function doRepage(size) {
	document.getElementById('pagesize').value = size;
	document.getElementById('pagenum').value = 1;
	submitNavForm();
}

function sortByCol(name) {
	document.getElementById('sortcol').value = name;
	submitNavForm();
}

function doAjax(params) {
	var q = [ ];
	for (var param in params)
		q.push(param + '=' + encodeURIComponent(params[param]));
	q = q.join('&');
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
				var rep = xhr.responseText.trim();
				if (rep == 'GOOD')
					return;
				else if (rep == 'INVALIDATE')
					location.reload(false);
				else
					alert('The command failed:\n\n\t' + rep);
				return;
			default:
				alert('Could not connect to server');
				return;
			}
		};
	xhr.open('get', 'ajax/?' + q, true);
	xhr.send(null);
}

function isNumber(n) {
	return !isNaN(parseFloat(n)) && isFinite(n);
}
