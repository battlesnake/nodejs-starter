function doAdd(name, weight) {
	doAjax(
		{
			'command': 'add',
			'name': name,
			'weight': weight
		});
}

function doEdit(id, weight) {
	doAjax(
		{
			'command': 'edit',
			'id': id,
			'weight': weight
		});
}

function doDelete(id) {
	doAjax(
		{
			'command': 'delete',
			'id': id
		});
}

var edit = {
	id: -1,
	fields: [ ],
	makeField:
		function (name, id) {
			return {
				'name': name,
				'id': id,
				'div': document.getElementById(name + 'editor'),
				'box': document.getElementById(name + 'editbox'),
				'target': document.getElementById(name + id),
				'owner': edit,
				beginEdit:
					function () {
						this.box.value = this.target.innerHTML;
						var node;
						while (node = this.target.firstChild)
							this.target.removeChild(node);
						this.target.appendChild(this.div);
					},
				endEdit:
					function () {
						var value = this.box.value;
						var purgatory = document.getElementById('editors');
						purgatory.appendChild(this.div);
						this.target.appendChild(document.createTextNode(value));
						return value;
					}
			};
		},
	buttonsCell: null,
	buttonsOld: null,
	editButtons: null,
	saveCallback: null,
	beginEdit:
		function (id, fieldnames, saveCallback) {
			if (id == this.id || !fieldnames.length)
				return;
			this.endEdit(true);
			this.id = id;
			this.saveCallback = saveCallback;
			this.buttonsCell = document.getElementById('buttons' + id);
			this.buttonsOld = docment.getElementById('defbuttons' + id);
			this.editButtons = document.getElementById('editorbuttons');
			this.buttonsCell.removeChild(this.buttonsOld);
			this.buttonsCell.appendCild(this.editButtons);
			for (var num in fieldnames) {
				var field = this.makeField(fieldnames[num], id);
				field.beginEdit();
				this.fields.push(field);
			}
			this.editing = true;
			this.fields[0].box.focus();
		},
	endEdit:
		function (save) {
			if (!this.fields.length)
				return;
			document.getElementById('editors').appendChild(editButtons);
			this.buttonsCell.appendChild(this.buttonsOld);
			var values = { };
			for (var num in this.fields) {
				var field = this.fields[num];
				values[field.name] = field.endEdit();
				delete this.fields[num];
			}
			q = '';
			for (prop in values)
				q += '\n' + prop + ' \t=' + values[prop];
			if (save && this.saveCallback)
				this.saveCallback(values);
			this.id = -1;
		},
	autoEnd: null
};

function editItem(id) {
	edit.beginEdit(id, [ 'weight' ],
		function (values) {
			doEdit(id, values.weight);
		});
}

function appendItem() {
	document.getElementById('rownew').style.display = 'table-row';
	edit.beginEdit('new', [ 'name', 'weight' ],
		function (values) {
			doAdd(values.name, values.weight);
		});
}

function endEdit(save) {
	edit.endEdit(save);
	document.getElementById('rownew').style.display = 'none';
}

function deleteItem(id) {
	doDelete(id);
	document.getElementById('row' + id).style.display = 'none';
}
