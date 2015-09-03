'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

class MArray extends Array {
	constructor() {
		super.apply(undefined, arguments);

		Object.defineProperties(this, {
			_model: {
				value: {},
				writable: true,
				enumerable: false
			},
			_path: {
				value: '',
				writable: true,
				enumerable: false
			}
		});
	}

	push(value) {
		super.push(value);
		this._model.addAtomic('push', this._path, value);
	}

	addToSet(value) {
		if (! ~this.indexOf(value)) {
			super.push(value);
			this._model.addAtomic('addToSet', this._path, value);
		}
	}

	pull(value) {
		var index = this.indexOf(value);

		if (index !== -1) {
			this.splice(index, 1);
			this._model.addAtomic('addToSet', this._path, value);
		}
	}

	valueOf() {
		return Array.prototype.slice.call(this);
	}
}

exports['default'] = MArray;
module.exports = exports['default'];
//# sourceMappingURL=array.js.map