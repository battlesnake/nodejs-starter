/* Delayed auto-solve timer */
var solveTimer = null;

/* Save a value */
function saveValue(id) {
	saveValues([getValue(id)]);
}

/* Pass values to the controller with SAVE command */
function saveValues(values, callback, blockSolveTimer) {
	if (solveTimer) {
		window.clearTimeout(solveTimer);
		solveTimer = null;
	}
	doAjaxJson('save', values,
		function (xhr) {
			if (callback)
				callback();
			if (!blockSolveTimer)
				valueChanged();
		});
}

/* Delayed re-solve on value change */
function valueChanged() {
	if (solveTimer) {
		window.clearTimeout(solveTimer);
		solveTimer = null;
	}
	solveTimer = window.setTimeout(solve, 200);
}

/* Get a value from the view */
function getValue(id) {
	var nameField = document.getElementById('name' + id);
	if (nameField)
		return {
			'name'	: nameField.innerHTML,
			'value'	: parseFloat(document.getElementById('value' + id).value)
		}
	else
		return undefined;
}

/* Get values from view */
function getVisibleValues() {
	var values = [];
	for (i = 0; i < document.getElementById('itemcount').value; i++)
		values.push(getValue(i));
	return values;
}

/* Initiate solution process */
function solve() {
	saveValues(getVisibleValues(), solveGetData, true);
}

/* 1. Get dataset from server */
function solveGetData() {
	var fulloutput = document.getElementById('solution');
	var maxweight = parseFloat(document.getElementById('maxweight').value);
	clearNode(fulloutput);
	fulloutput.appendChild(document.createTextNode('Loading...'));
	doAjaxText('getdata', '',
		function (xhr) {
			if (xhr.status >= 400) {
				fulloutput.appendChild(document.createTextNode('Error: ' + xhr.responseTest));
				return;
			}
			else if (xhr.status == 200) {
				var data = JSON.parse(xhr.responseText);
				solveExecute(data, maxweight);
			}
		});
}

/* 2. Solve a dataset */
function solveExecute(itemList, maxweight) {
	/* Solve problem via branch and bound (dynamic programming doesn't like fractionals) */
	var tree = createTree();
	/* Sort items and store original indices */
	var items = itemList
		.map(
			function (item, index) {
				return {
					'name'	: item.name,
					'weight': parseFloat(item.weight),
					'value'	: parseFloat(item.value),
					'index'	: index,
					'density': parseFloat(item.value) / parseFloat(item.weight)
				};
			}
		)
		.filter(
			function (item) {
				return item.weight <= maxweight && item.density > 0;
			}
		)
		.sort(
			function (a, b) {
				return b.density - a.density;
			}
		);
	/* Estimate of maximum possible value */
	var estmax = items
		.reduce(
			function (state, item) {
				if (item.weight <= state.remain)
					return { 'remain': state.remain - item.weight, 'value': state.value + item.value };
				else if (state.remain > 0)
					return { 'remain': 0, 'value': state.value + (state.remain * item.density) };
				else
					return state;
			},
			{ 'remain': maxweight, 'value': 0 })
		.value;
	/* Lightest item */
	var lightestItem = items.reduce(
		function (state, item) {
			if (!state || item.weight < state.weight)
				return item;
			else
				return state;
		},
		null);
	/* Branches */
	var BRANCH_TAKE = 0, BRANCH_LEAVE = 1;
	/* Node metadata */
	var newDatum =
		function (value, remain, estmax) {
			return {
				'value'	: value,
				'remain': remain,
				'estmax': estmax
			};
		};
	/* Heuristic for pruning the tree */
	var heuristic =
		function (data) {
			/* For some reason, doing a "return <expression>;" here sometimes returns "undefined" when it should return "true" */
			if ((data.remain < 0) ||
				(data.estmax < tree.best.data.value) ||
				(data.remain < lightestItem.weight && data.value < tree.best.data.value))
				return true;
			else
				return false;
		};
	/* Create a branch */
	var createBranch =
		function (state, branch, item) {
			return newstate = (branch == BRANCH_TAKE) ?
				newDatum(state.value + item.value, state.remain - item.weight, state.estmax) :
				newDatum(state.value, state.remain, state.estmax - item.value);
		};
	/* Builds the tree */
	var recursor =
		function (parent, heuristic, recursor) {
			var item = items[parent.level];
			if (!item)
				return;
			for (branch in [BRANCH_TAKE, BRANCH_LEAVE]) {
				var data = createBranch(parent.data, branch, item);
				if (heuristic(data))
					continue;
				var node = tree.insertNewNode(parent, branch, data);
				if (data.value > tree.best.data.value) {
					tree.best = node;
					tree.pruneTree(heuristic);
				}
				recursor(node, heuristic, recursor);
			}
		};
	/* Initialise the branch and bound root state */
	tree.root.data = newDatum(0, maxweight, estmax+100);
	tree.best = tree.root;
	/* Begin the branch and bound */
	recursor(tree.root, heuristic, recursor);
	/* Get list of item indices */
	var indices = [];
	for (var node = tree.best; node && node.up; node = node.up)
		if (node == node.up[BRANCH_TAKE])
			indices.push(node.up.level);
	/* Get list of items */
	var itemList = indices
			.reverse()
			.map(
				function (index) {
					return items[index];
				});
	solveFormatSolution(itemList);
}

/* 3. HTML-format the solution and display it */
function solveFormatSolution(itemList) {
	var fulloutput = document.getElementById('solution');
	/* AJAX request for formatted solution */
	doAjaxJson('formatsolution', itemList,
		function (xhr) {
			clearNode(fulloutput);
			var showError = function (error) {
				fulloutput.appendChild(document.createTextNode('Error: ' + error));
			};
			if (xhr.status >= 400) {
				showError(xhr.responseText);
			}
			if (xhr.status == 200) {
				var doc = (new DOMParser()).parseFromString(xhr.responseText, 'text/xml');
				if (doc.documentElement.tagName == "parsererror")
					showError('Parse error: ' + xhr.documentElement.innerHTML);
				else
					fulloutput.appendChild(doc.documentElement);
			}
			fulloutput.style.display = 'block';
		});
}

window.onload = solve;



/*** Data structures ***/

/* Binary tree (for branch-and-bound solver) */
function createTree() {
	return {
		'root'	: { 0: null, 1: null, data: null, level: 0 },
		'best'	: null,
		'insertNewNode'	:
			function (parent, position, data) {
				return this.insertNode(parent, position, this.createNode(parent, data));
			},
		'insertNode'	:
			function (parent, position, node) {
				node.level = parent.level + 1;
				return parent[position] = node;
			},
		'deleteNode'	:
			function (parent, position) {
				if (!parent)
					return;
				var node = parent[position];
				if (!node)
					return;
				this.deleteNode(node, 0);
				this.deleteNode(node, 1)
				parent[position] = null;
			},
		'pruneTree'	:
			function (heuristic) {
				var tree = this;
				function prune(parent) {
					for (position in [0, 1]) {
						var node = parent[position];
						if (node)
							if (heuristic(node.data))
								tree.deleteNode(parent, position);
							else
								prune(node);
					}
				}
				if (this.root)
					prune(this.root);
			},
		'createNode'	:
			function (parent, data) {
				return {
					'up'	: parent,
					'level'	: parent ? (parent.level + 1) : 0,
					0	: null,
					1	: null,
					'data'	: data
				};
			}
	};
}

/* 2D array (not used unless we implement dynamic programming solver */
function grid(w, h) {
	return {
		'width'	: w,
		'height': h,
		'data'	: new Array(w * h),
		'get'	:
			function (x, y) {
				return this.data[x * h + y];
			},
		'set'	:
			function (x, y, value) {
				this.data[x * h + y] = value;
			}
	};
}
