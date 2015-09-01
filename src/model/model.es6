import _ 			 from 'underscore';
import { debug }     from '../debug';
import clone         from 'clone';
import deepExtend    from 'deep-extend';
import QueryResolver from '../queryResolver';
import SchemaLoader  from '../schema';

import MArray from './array';

var typeOf = function (object) {
	return Object.prototype.toString.call(object).replace(/\[object\s(\w+)\]/, '$1');
};

export default class Model {
	constructor() {
		this.isNew = true;
		this._atomics = {};
	}

	initialize(options = {}) {
		this.defaults = this.schema();
		this.readOnly = this.schema();

		this.set(this.defaults);

		console.log(this.defaults);
	}

	static ensureIndex() {
		SchemaLoader
			.index(this.schema())
			.forEach(function (value, index) {
				this.db().connect.collection(this.collection()).ensureIndex(index, value, function (err, result) {
					if (err) {
						debug('ensure index: ' + err.message);
					}
				});
			});
	}

	set defaults(schema) {
		this._defaults = SchemaLoader.defaults(schema);
	}

	get defaults() {
		return clone(this._defaults);
	}

	set readOnly(schema) {
		this._readOnly = SchemaLoader.readOnly(schema);
	}

	get readOnly() {
		return this._readOnly;
	}

	set(key, value, path = []) {
		if (arguments.length === 1) {
			_.each(key, (value, key) => {
				this.set(key, value, path.push(key));
			});
		} else {
			path = [key];
		}

		if (this.defaults.hasOwnProperty(key) && !~this.readOnly.indexOf(path.join('.'))) {
			this[key] = value;

			if (~['Number', 'String', 'Data', 'Boolean', 'Object', 'Null'].indexOf(typeOf(value))) {
				this.addAtomic('set', key, value);
			}
		}

		return this;
	}

	get(key) {
		if (~this.defaults.indexOf(key)) {
			return this[key];
		}
	}

	fill(key, value, isAtomic = false) {
		if (_.isBoolean(arguments[1])) {
			_.each(key, (value, key1) => {
				this.fill(key1, value);
			});
		}

		if (this.defaults.hasOwnProperty(key)) {
			switch (typeOf(value)) {
				case 'Array':
					this[key]       = new MArray();
					this[key].model = this;
					this[key].path  = key; // TODO: path with dot
					this[key].push(...value);
					break;
				default:
					this[key] = value;
			}

			if (isAtomic) {
				this.addAtomic('set', key, value);
			}
		}

		return this;
	}

	toJSON() {
		let output = {};

		for (let prop in this) {
			if (this.hasOwnProperty(prop)) {
				output[prop] = this[prop];
			}
		}

		return clone(output, true);
	}

	addAtomic(type, key, value) {
		if (this.isNew) {
			// TODO: if type is addToSet/push, this override initialized values
			deepExtend(this._atomics, { '$set': { [key]: value } });
			return this;
		}

		switch (type) {
			case 'set':
			case 'pull':
			case 'pullAll':
			case 'pop':
				deepExtend(this._atomics, { ['$' + type]: { [key]: value } });
				break;

			case 'push':
			case 'addToSet':
				switch (typeOf(value)) {
					case 'Array':
						deepExtend(this._atomics, { ['$' + type]: { [key]: { $each: value } } });
						break;
					default:
						deepExtend(this._atomics, { ['$' + type]: { [key]: value } });
				}

				break;
		}

		return this;
	}

	static find() {
		let queryResolver = new QueryResolver(Model);

		return queryResolver.find.apply(queryResolver, arguments);
	}

	static findOne() {
		let queryResolver = new QueryResolver(Model);

		return queryResolver.findOne.apply(queryResolver, arguments);
	}
}