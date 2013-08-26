function printObj(obj, name) {
	var owrap = { };
	owrap[name] = obj;
	printObjRecurse(owrap);
}

function printObjRecurse(obj, path, level) {
	var p = (typeof path != 'undefined') ? (path + '.') : '';
	var l = level || 1;
	var indentation = Array(l + 1).join("\t");
	if (l > 4) {
		console.log(indentation + '(not shown due to indentation limit)');
		return;
	}
	for (var prop in obj) {
		var val = obj[prop];
		var vtyp = (typeof val).toString();
		var vstr = (vtyp == 'object') ? null : (val == null) ? 'null' : val.toString().substr(0, 20).replace("\r", "\\r").replace("\n", "\\n").replace("\t", "\\t");
		if (vtyp == 'object') {
			console.log(indentation + p + prop + ': object = {');
			printObjRecurse(val, p + prop, l + 1);
			console.log(indentation + '}');
		}
		else if (vtyp == 'function')
			; //console.log(indentation + prop + ': function');
		else
			console.log(indentation + p + prop + ': ' + vtyp + ' = "' + vstr + '"');
	}
}

module.exports = printObj;
