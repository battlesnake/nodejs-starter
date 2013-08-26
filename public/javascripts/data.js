function doAdd(name, weight, callback) {
	doAjaxJson('add', { 'name': name, 'weight': weight }, callback);
}

function doEdit(id, weight, callback) {
	doAjaxJson('edit', { 'id': id, 'weight': weight }, callback);
}

function doDelete(id, callback) {
	doAjaxJson('delete', { 'id': id }, callback);
}

var edit = {
	id: -1,
	fields: [],
	makeField:
		function (name, id) {
			var target = document.getElementById(name + id);
			return {
				'name': name,
				'id': id,
				'div': document.getElementById(name + 'editor'),
				'box': document.getElementById(name + 'editbox'),
				'target': target,
				'oldValue': target.innerHTML,
				'owner': edit,
				'editing': false,
				beginEdit:
					function () {
						this.box.value = this.oldValue;
						var node;
						while (node = this.target.firstChild)
							this.target.removeChild(node);
						this.target.appendChild(this.div);
						this.editing = true;
					},
				endEdit:
					function (newvalue) {
						var value = newvalue || this.box.value;
						var purgatory = document.getElementById('editors');
						purgatory.appendChild(this.div);
						this.target.appendChild(document.createTextNode(value));
						this.box.value = '';
						this.editing = false;
						return value;
					},
				revertEdit:
					function () {
						if (this.editing)
							this.endEdit(this.oldValue);
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
			this.buttonsOld = document.getElementById('defbuttons' + id);
			this.editButtons = document.getElementById('editorbuttons');
			this.buttonsCell.removeChild(this.buttonsOld);
			this.buttonsCell.appendChild(this.editButtons);
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
			document.getElementById('editors').appendChild(this.editButtons);
			this.buttonsCell.appendChild(this.buttonsOld);
			var values = { };
			var fields = this.fields;
			for (var num in fields) {
				var field = fields[num];
				values[field.name] = field.endEdit();
			}
			this.fields = [];
			q = '';
			for (prop in values)
				q += '\n' + prop + ' \t=' + values[prop];
			if (save && this.saveCallback)
				this.saveCallback(values, fields);
			this.id = -1;
		},
	autoEnd: null
};

function editItem(id) {
	edit.beginEdit(id, [ 'weight' ],
		function (values, fields) {
			doEdit(id, values.weight,
				function (xhr) {
					if (xhr.status >= 400) {
						fields.map(
							function (field) {
								field.revertEdit();
							});
						alert('Edit failed:\n\n\t' + xhr.responseText);
					}
					else if (xhr.status == 302)
						location.reload(false);
					else if (xhr.status == 200)
						return;
				});
		});
}

function appendItem() {
	document.getElementById('rownew').style.display = 'table-row';
	edit.beginEdit('new', [ 'name', 'weight' ],
		function (values, fields) {
			doAdd(values.name, values.weight,
				function (xhr) {
					if (xhr.status >= 400) {
						fields.map(
							function (field) {
								field.revertEdit();
							});
						document.getElementById('rownew').style.display = 'none';
						alert('Insertion failed:\n\n\t' + xhr.responseText);
					}
					else if (xhr.status == 302)
						location.reload(false);
					else if (xhr.status == 200)
						return;
				});
		});
}

function endEdit(save) {
	edit.endEdit(save);
	document.getElementById('rownew').style.display = 'none';
}

function deleteItem(id) {
	doDelete(id,
		function (xhr) {
			if (xhr.status >= 400)
				alert('Deletion failed\n\n\t:' + xhr.responseText);
			else if (xhr.status == 302)
				location.reload(false);
			else if (xhr.status == 200)
				return;
		});
	document.getElementById('row' + id).style.display = 'none';
}
