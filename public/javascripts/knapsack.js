'use strict';

/* Incremented for each solve request, to abort previous one */
var solveId = 0;

/* Save a value */
function saveValue(id) {
	saveValues([getValue(id)]);
	solve();
}

/* Save values to backend */
function saveValues(values, callback) {
	doAjaxJson('save', values, function () {
		if (callback) {
			callback();
		}
	});
}

/* Max weight changed */
function maxWeightChanged() {
	solve();
}

/* Get a value from the view */
function getValue(id) {
	var nameField = document.getElementById('name' + id);
	return nameField && {
		'name'	: nameField.innerHTML,
		'value'	: parseFloat(document.getElementById('value' + id).value)
	};
}

/* Get values from view */
function getVisibleValues() {
	var values = [];
	var max = document.getElementById('itemcount').value;
	for (var i = 0; i < max; i++) {
		values.push(getValue(i));
	}
	return values;
}

/* Initiate solution process */
function solve() {
	/*
	 * 0. Save current "value" values (to cookie)
	 * 1. Get full dataset from server
	 * 2. Solve dataset
	 * 3. Format output and display it
	 */
	/* 0. Save values to cookie */
	saveValues(getVisibleValues(), savedValues);

	function savedValues() {
		solveGetData(loadedData);
	}

	function loadedData(data) {
		var maxWeight = parseFloat(document.getElementById('maxweight').value);
		solveExecute(++solveId, data, maxWeight, solvedProblem);
	}

	function solvedProblem(items) {
		solveFormatSolution(items);
	}
}

/* 1. Get dataset from server */
function solveGetData(callback) {
	var fulloutput = document.getElementById('solution');
	clearNode(fulloutput);
	fulloutput.appendChild(document.createTextNode('Loading...'));
	doAjaxText('getdata', '', function (xhr) {
		if (xhr.status === 200) {
			callback(JSON.parse(xhr.responseText));
		} else {
			fulloutput.appendChild(document.createTextNode('Error: ' + xhr.responseTest));
		}
	});
}

/* 2. Solve a dataset using branch and bound */
function solveExecute(sid, itemList, maxWeight, callback) {
	if (sid != solveId) {
		return;
	}

	var fulloutput = document.getElementById('solution');

	/* Sort items and store original indices */
	var itemMap = itemList
		.map(function (item, index) {
			return new Item(item.name, item.weight, item.value, index);
		})
		.filter(function (item) {
			return item.weight <= maxWeight && item.density > 0;
		})
		.sort(function (a, b) {
			return b.density - a.density;
		});

	var itemCount = itemMap.length;

	/* Estimate of maximum possible value, using sorted item list */
	var estmax = itemMap
		.reduce(function (memo, item) {
			/* Memo is [weight, value] */
			var weight = memo[0], value = memo[1];
			var remain = maxWeight - weight;
			/* Take item */
			if (item.weight <= remain) {
				return [weight + item.weight, value + item.value];
			}
			/* Take partial item */
			else if (remain > 0) {
				return [maxWeight, value + remain * item.density];
			}
			/* Full, don't take item */
			else {
				return memo;
			}
		}, [0, 0])[1];

	/* Lightest item */
	var lightestItem = itemMap
		.reduce(function (min, item) {
			return (min && min.weight < item.weight) ? min : item;
		}, 0);

	/* Create the binary tree and initialize the root element */
	var tree = new BinaryTree(new Data(0, maxWeight, estmax));

	/*
	 * So we don't lock up the browser, the branch-and-bound uses asynchronous
	 * callbacks for each recursive step, and thus for the result also.
	 * Add the root node to the "nodes to examine" list.
	 */
	var toCall = [tree.root];
	var nodesWalked = 0, totalNodes = Math.pow(2, itemCount), percent = -1;

	/* Begin the branch and bound */
	var recursor = setInterval(branchAndBound, 0);

	function solverCompleted() {
		/* Get list of indices of taken items */
		var indices = [];
		for (var node = tree.best; node && node.parent; node = node.parent) {
			if (node.position === 0) {
				indices.push(itemMap[node.parent.level].index);
			}
		}

		/* Get list of items */
		var resultItems = indices
			.reverse()
			.map(function (index) { return itemList[index]; });

		/* Format the solution and display it */
		callback(resultItems);
	}

	/* Item */
	function Item(name, weight, value, index) {
		this.name = name;
		this.weight = parseFloat(weight);
		this.value = parseFloat(value);
		this.index = index;
		this.density = this.value / this.weight;
	}

	/* BinaryTreeNode data */
	function Data(value, remain, estmax) {
		this.value = value;
		this.remain = remain;
		this.estmax = estmax;
	}

	/* Heuristic for pruning the tree */
	function heuristic(node) {
		/* 1e-6 rather than zero: Hack to avoid rounding errors somewhat */
		var overflow = node.data.remain < 1e-6;
		var impossible1 = node.data.estmax < tree.best.data.value;
		var impossible2 = node.data.remain < lightestItem.weight && node.data.value < tree.best.data.value;
		var impossible3 = tree.best !== node && node.hasChildren && !node.hasChildren();
		return overflow || impossible1 || impossible2 || impossible3;
	}

	/* Builds the tree */
	function branchAndBound() {
		/* Ensure we're solving the latest dataset */
		if (sid != solveId) {
			clearInterval(recursor);
			return;
		}
		/* No more nodes to test: solution complete */
		if (toCall.length === 0) {
			clearInterval(recursor);
			solverCompleted();
			return;
		}
		var parent = toCall.shift();
		nodesWalked++;
		/*
		 * Due to the asynchronous implementation, we may end up trying to
		 * recurse into a deleted item
		 */
		if (parent.deleted) {
			nodesWalked += Math.pow(2, itemCount - (parent.level + 1));
			return;
		}
		/* Get item corresponsing to branch level */
		var data = parent.data;
		var item = itemMap[parent.level];
		for (var branch = 0; branch < 2; branch++) {
			var take = branch === 0;
			var data = take ?
				new Data(data.value + item.value, data.remain - item.weight, data.estmax) :
				new Data(data.value, data.remain, data.estmax - item.value);
			/* Don't add item if it fails the heuristic */
			if (heuristic({ data: data })) {
				nodesWalked += Math.pow(2, itemCount - (parent.level + 1));
				continue;
			}
			var node = parent.insert(branch, data);
			/* New best item? */
			if (data.value > tree.best.data.value) {
				tree.best = node;
				tree.prune(heuristic);
				/* If the stack is big, immediately remove deleted nodes from it */
				if (toCall.length > 30) {
					toCall = toCall.filter(function (node) {
						var cull = node.deleted;
						if (cull) {
							nodesWalked += Math.pow(2, itemCount - (node.level + 1));
						}
						return !cull;
					});
				}
			}
			/* Recurse if there are more items to test */
			if (node.level < itemCount) {
				toCall.push(node);
			}
		}
		var newPercent = Math.floor(nodesWalked * 100 / totalNodes);
		if (newPercent > percent) {
			fulloutput.innerHTML = '';
			fulloutput.appendChild(document.createTextNode(
				'Solving (' + Math.floor(nodesWalked * 100 / totalNodes) + '% = ' + nodesWalked + '/' + totalNodes + ') ' + 
				'stack = ' + toCall.length));
			percent = newPercent;
		}
	}
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
function BinaryTree(rootData) {
	this.root = new BinaryTreeNode(null, rootData, 0);
	this.best = this.root;
}

BinaryTree.prototype = {
	root: null,
	best: null,
	prune: function (heuristic) { this.root.prune(heuristic); },
};

function BinaryTreeNode(parent, data, position) {
	this.parent = parent;
	this.position = position;
	this.data = data;
	this.level = parent ? parent.level + 1 : 0;
}

BinaryTreeNode.prototype = {
	parent: null,
	position: null,
	level: 0,
	'0': null,
	'1': null,
	data: null,
	deleted: false,
	removeChild: function (position) {
		var node = this[position];
		if (!node) {
			throw new Error('Cannot remove child node: no node is at that ' +
				'position');
		}
		this[position] = null;
		node.clear();
		node.deleted = true;
	},
	clear: function () {
		for (var branch = 0; branch < 2; branch++) {
			if (this[branch]) {
				this.removeChild(branch);
			}
		}
	},
	remove: function () {
		var parent = this.parent;
		if (!parent) {
			throw new Error('Cannot remove node, node has no parent');
		}
		parent.removeChild(this.position);
	},
	insert: function (position, data) {
		if (this[position]) {
			throw new Error('Cannot insert node: node already exists at that ' +
				'position');
		}
		return this[position] = new BinaryTreeNode(this, data, position);
	},
	prune: function (heuristic) {
		if (heuristic(this)) {
			this.remove();
		} else {
			for (var branch = 0; branch < 2; branch++) {
				var child = this[branch];
				if (child) {
					child.prune(heuristic);
				}
			}
		}
	},
	hasChildren: function () {
		return !!(this[0] || this[1]);
	}
};
