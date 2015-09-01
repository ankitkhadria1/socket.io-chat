import { debug }     from '../debug';
import clone         from 'clone';
import deepExtend     from 'deep-extend';
import QueryResolver from '../queryResolver';
import SchemaLoader  from '../schema';

export default class Model {
	constructor() {

	}

	initialize(options = {}) {
		this.defaults(this.schema());
		this.readOnly(this.schema());
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
		return this._defaults;
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

		if (~this.defaults.indexOf(key) && !~this.readOnly.indexOf(path.join('.'))) {
			this[key] = value;

			if (~['Number', 'String', 'Data', 'Boolean', 'Object', 'Null'].indexOf(typeOf(value))) {
				this.__addAtomic('set', key, value);
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

		if (~this.defaults.indexOf(key)) {
			this[key] = value;

			if (isAtomic) {
				this.__addAtomic('set', key, value);
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

	static find() {
		let queryResolver = new QueryResolver(Model);

		return queryResolver.find.apply(queryResolver, arguments);
	}

	static findOne() {
		let queryResolver = new QueryResolver(Model);

		return queryResolver.findOne.apply(queryResolver, arguments);
	}
}