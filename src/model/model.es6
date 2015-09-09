import { typeOf, slice } from '../utils';
import _                from 'underscore';
import { debug }        from '../debug';
import clone            from 'clone';
import deepExtend       from 'deep-extend';
import QueryResolver    from '../queryResolver';
import SchemaLoader     from '../schema';
import { Validator }    from 'jsonschema';
import { EventEmitter } from 'events';
import MArray           from './array';

const ERROR_VALIDATION_TYPE = 'validation';

// TODO: check type Date on save

export default class Model extends EventEmitter {
	constructor(data = {}) {
		super();

		Object.defineProperties(this, {
			isNew:      { value: true, writable: true, enumerable: false },
			_atomics:   { value: {}, writable: true, enumerable: false },
			_defaults:  { value: {}, writable: true, enumerable: false },
			_readOnly:  { value: [], writable: true, enumerable: false },
			_propPaths: { value: [], writable: true, enumerable: false },
			_data:      { value: data, writable: true, enumerable: false },
			errors:     { value: [], writable: true, enumerable: false },
			error:      { value: null, writable: true, enumerable: false }
		});
	}

	initialize(options = {}) {
		this.defaults  = this.constructor.schema();
		this.readOnly  = this.constructor.schema();
		this.propPaths = this.constructor.schema();

		this.set(this.defaults);
		this.set(this._data, false);

		this._data = {};
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

	set propPaths(schema) {
		this._propPaths = SchemaLoader.propPaths(schema);
	}

	get propPaths() {
		return this._propPaths;
	}

	set(values, value = undefined) {
		let force = true;
		let self  = this;

		/*
		 {
		 name: 123,
		 systemNotification: {
		 addMember: true
		 }
		 }

		 */

		function set(object, values, path = []) {
			let valuesType = typeOf(values);

			for (let prop in values) {
				if (values.hasOwnProperty(prop)) {
					let valueType = typeOf(values[prop]);
					let locPath   = slice(path);

					valuesType !== 'Array' && locPath.push(prop);

					if (~self.propPaths.indexOf(locPath.join('.')) && (!~self.readOnly.indexOf(locPath.join('.')) || force)) {
						if (/_id$|Id$/.test(locPath.join('.'))) {
							object[prop] = values[prop];
							continue;
						}

						if (locPath.join('.') === 'createdAt') {
							//debug(typeOf(values[prop]));
						}

						switch (valueType) {
							case 'Object':
								if (values[prop].constructor === Object) {
									object[prop] = {};
									for (let key in values[prop]) {
										set(object[prop], values[prop], locPath);
									}
								} else {
									// ObjectID
									object[prop] = values[prop];
								}

								break;
							case 'Array':
								object[prop]        = new MArray();
								object[prop]._model = self;
								object[prop]._path  = locPath;

								set(object[prop], values[prop], locPath);
								//for (let item of values[prop]) {
								//}

								break;
							default:
								object[prop] = values[prop];
						}
					} else {
						//debug('fail path', locPath.join('.'))
					}

				}
			}
		}

		if (typeOf(values) !== 'Object') {
			values = { [values]: value };

		}

		if (arguments.length > 1 && typeOf(Array.prototype.slice.call(arguments, -1)[0]) === 'Boolean') {
			force = Array.prototype.slice.call(arguments, -1)[0];

			if (typeof force === 'undefined') {
				force = true;
			}
		}


		set(this, values);

		return this;
	}

	get(key) {
		if (arguments.length > 0 && ~this.defaults.hasOwnProperty(key)) {
			return this[key];
		}

		if (arguments.length === 0) {
			let output = clone(this);

			for (let prop in output) {
				if (!output.hasOwnProperty(prop)) continue;
				if (!this.defaults.hasOwnProperty(prop)) {
					delete output[prop];
				}
			}

			return output;
		}
	}

	fill(key, value, isAtomic = false) {
		if (_.isBoolean(arguments[1])) {
			_.each(key, (value, key1) => {
				this.fill(key1, value);
			});
		}

		this.createProperty(key, value);

		return this;
	}

	createProperty(key, value) {
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
	}

	toJSON() {
		let output = {};
		let self   = this;

		function walker(obj, innerObj, path = []) {
			let valuesType = typeOf(obj);

			for (let prop in obj) {
				if (!obj.hasOwnProperty(prop)) continue;

				let locPath   = slice(path);
				valuesType !== 'Array' && locPath.push(prop);

				if (!~self.propPaths.indexOf(locPath.join('.'))) continue;

				// TODO: dirty fix
				if (/_id$|Id$/.test(prop) && obj[prop]) {
					innerObj[prop] = obj[prop].toString();
					continue;
				}

				switch (typeOf(obj[prop])) {
					case 'Object':
						innerObj[prop] = {};
						walker(obj[prop], innerObj[prop], locPath);
						break;
					case 'Array':
						innerObj[prop] = [];
						walker(obj[prop], innerObj[prop], locPath);
						break;
					default:
						innerObj[prop] = obj[prop];
				}
			}
		}

		walker(this, output);

		return output;
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

	save() {
		let promise = (resolve, reject) => {
			this.isValid() ? resolve() : reject(this.error);
		};

		return new Promise(promise)
			.then(() => {
				let cursor = this.db().provider.collection(this);

				if (this.isNew) {
					return cursor.insert(this.toJSON()).exec()
						.then((result) => {
							this.set(result);
							this.isNew = false;

							return this;
						});
				} else {
					return cursor.update(this.toJSON()).exec()
						.then((result) => {
							this.set(result);
							this.isNew = false;

							return this;
						});
				}
			});
	}

	isValid() {
		var result = false, error;

		result = this.validate();

		if (result.length > 0) {
			result.forEach(function (error) {
				error.type = ERROR_VALIDATION_TYPE;
			});

			this.errors = result;
			this.error  = this.errors[0];

			return false;
		}

		return true;
	}

	validate() {
		var validator = new Validator(),
			result    = validator.validate(this.get(), this.schema());

		this.emit('beforeValidate');

		if (result.errors.length) {
			return result.errors;
		}

		this.emit('validate');

		return [];
	}

	castData(data, path = []) {
		switch (typeOf(data)) {
			case 'Object':
				for (let prop in data) {
					if (data.hasOwnProperty(prop)) {
						this.castData(data[prop], path.concat([prop]));
					}
				}
				break;
			case 'Array':
				let newArray    = new MArray();
				newArray._model = this;
				newArray._path  = path.join('.');
				newArray.push(...data);
				data            = newArray;
				data.forEach((value) => {
					this.castData(value, path);
				});
				break;
		}

		return data;
	}

;

	static find(query, select) {
		return this.db().provider.collection(this).find(query, select);
	}

	static findOne(query, select) {
		return this.db().provider.collection(this).findOne(query, select);
	}

	static insert() {

	}

	static update() {

	}

	static remove() {

	}

	static ensureIndex(Model) {
		SchemaLoader
			.index(Model.schema())
			.forEach(function (value, index) {
				//Model.db().connect.collection(Model.collection()).ensureIndex(index, value, function (err, result) {
				//	if (err) {
				//		debug('ensure index: ' + err.message);
				//	}
				//});
			});
	}
}