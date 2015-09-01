export default class MArray extends Array {
	set model(model) {
		this._model = model;
	}

	set path(path) {
		this._path = path;
	}

	push(value) {
		super.push(value);
		this._model.addAtomic('push', this._path, value);
	}

	addToSet(value) {
		if (!~this.indexOf(value)) {
			super.push(value);
			this._model.addAtomic('addToSet', this._path, value);
		}
	}

	pull(value) {
		let index = this.indexOf(value);

		if (index !== -1) {
			this.splice(index, 1);
			this._model.addAtomic('addToSet', this._path, value);
		}
	}
}