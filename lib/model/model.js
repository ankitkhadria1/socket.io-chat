'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var _utils = require('../utils');

var _underscore = require('underscore');

var _underscore2 = _interopRequireDefault(_underscore);

var _debug = require('../debug');

var _clone = require('clone');

var _clone2 = _interopRequireDefault(_clone);

var _deepExtend4 = require('deep-extend');

var _deepExtend5 = _interopRequireDefault(_deepExtend4);

var _queryResolver = require('../queryResolver');

var _queryResolver2 = _interopRequireDefault(_queryResolver);

var _schema = require('../schema');

var _schema2 = _interopRequireDefault(_schema);

var _jsonschema = require('jsonschema');

var _events = require('events');

var _array = require('./array');

var _array2 = _interopRequireDefault(_array);

var ERROR_VALIDATION_TYPE = 'validation';

// TODO: check type Date on save

class Model extends _events.EventEmitter {
	constructor() {
		var data = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

		super();

		Object.defineProperties(this, {
			isNew: { value: true, writable: true, enumerable: false },
			_atomics: { value: {}, writable: true, enumerable: false },
			_defaults: { value: {}, writable: true, enumerable: false },
			_readOnly: { value: [], writable: true, enumerable: false },
			_propPaths: { value: [], writable: true, enumerable: false },
			_data: { value: data, writable: true, enumerable: false },
			errors: { value: [], writable: true, enumerable: false },
			error: { value: null, writable: true, enumerable: false }
		});
	}

	initialize() {
		var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

		this.defaults = this.constructor.schema();
		this.readOnly = this.constructor.schema();
		this.propPaths = this.constructor.schema();

		this.set(this.defaults);
		this.set(this._data, false);

		this._data = {};
	}

	set defaults(schema) {
		this._defaults = _schema2['default'].defaults(schema);
	}

	get defaults() {
		return (0, _clone2['default'])(this._defaults);
	}

	set readOnly(schema) {
		this._readOnly = _schema2['default'].readOnly(schema);
	}

	get readOnly() {
		return this._readOnly;
	}

	set propPaths(schema) {
		this._propPaths = _schema2['default'].propPaths(schema);
	}

	get propPaths() {
		return this._propPaths;
	}

	set(values) {
		var value = arguments.length <= 1 || arguments[1] === undefined ? undefined : arguments[1];

		var force = true;
		var self = this;

		/*
   {
   name: 123,
   systemNotification: {
   addMember: true
   }
   }
  	 */

		function set(object, values) {
			var path = arguments.length <= 2 || arguments[2] === undefined ? [] : arguments[2];

			var valuesType = (0, _utils.typeOf)(values);

			for (var prop in values) {
				if (values.hasOwnProperty(prop)) {
					var valueType = (0, _utils.typeOf)(values[prop]);
					var locPath = (0, _utils.slice)(path);

					valuesType !== 'Array' && locPath.push(prop);

					if (~self.propPaths.indexOf(locPath.join('.')) && (! ~self.readOnly.indexOf(locPath.join('.')) || force)) {
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
									for (var key in values[prop]) {
										set(object[prop], values[prop], locPath);
									}
								} else {
									// ObjectID
									object[prop] = values[prop];
								}

								break;
							case 'Array':
								object[prop] = new _array2['default']();
								object[prop]._model = self;
								object[prop]._path = locPath;

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

		if ((0, _utils.typeOf)(values) !== 'Object') {
			values = _defineProperty({}, values, value);
		}

		if (arguments.length > 1 && (0, _utils.typeOf)(Array.prototype.slice.call(arguments, -1)[0]) === 'Boolean') {
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
			var output = (0, _clone2['default'])(this);

			for (var prop in output) {
				if (!output.hasOwnProperty(prop)) continue;
				if (!this.defaults.hasOwnProperty(prop)) {
					delete output[prop];
				}
			}

			return output;
		}
	}

	fill(key, value) {
		var _this = this;

		var isAtomic = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

		if (_underscore2['default'].isBoolean(arguments[1])) {
			_underscore2['default'].each(key, function (value, key1) {
				_this.fill(key1, value);
			});
		}

		this.createProperty(key, value);

		return this;
	}

	createProperty(key, value) {
		var _key;

		if (this.defaults.hasOwnProperty(key)) {
			switch ((0, _utils.typeOf)(value)) {
				case 'Array':
					this[key] = new _array2['default']();
					this[key].model = this;
					this[key].path = key; // TODO: path with dot
					(_key = this[key]).push.apply(_key, _toConsumableArray(value));
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
		var output = {};
		var self = this;

		function walker(obj, innerObj) {
			var path = arguments.length <= 2 || arguments[2] === undefined ? [] : arguments[2];

			var valuesType = (0, _utils.typeOf)(obj);

			for (var prop in obj) {
				if (!obj.hasOwnProperty(prop)) continue;

				var locPath = (0, _utils.slice)(path);
				valuesType !== 'Array' && locPath.push(prop);

				if (! ~self.propPaths.indexOf(locPath.join('.'))) continue;

				// TODO: dirty fix
				if (/_id$|Id$/.test(prop) && obj[prop]) {
					innerObj[prop] = obj[prop].toString();
					continue;
				}

				switch ((0, _utils.typeOf)(obj[prop])) {
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
			(0, _deepExtend5['default'])(this._atomics, { '$set': _defineProperty({}, key, value) });
			return this;
		}

		switch (type) {
			case 'set':
			case 'pull':
			case 'pullAll':
			case 'pop':
				(0, _deepExtend5['default'])(this._atomics, _defineProperty({}, '$' + type, _defineProperty({}, key, value)));
				break;

			case 'push':
			case 'addToSet':
				switch ((0, _utils.typeOf)(value)) {
					case 'Array':
						(0, _deepExtend5['default'])(this._atomics, _defineProperty({}, '$' + type, _defineProperty({}, key, { $each: value })));
						break;
					default:
						(0, _deepExtend5['default'])(this._atomics, _defineProperty({}, '$' + type, _defineProperty({}, key, value)));
				}

				break;
		}

		return this;
	}

	save() {
		var _this2 = this;

		var promise = function promise(resolve, reject) {
			_this2.isValid() ? resolve() : reject(_this2.error);
		};

		return new Promise(promise).then(function () {
			var cursor = _this2.db().provider.collection(_this2);

			if (_this2.isNew) {
				return cursor.insert(_this2.toJSON()).exec().then(function (result) {
					_this2.set(result);
					_this2.isNew = false;

					return _this2;
				});
			} else {
				return cursor.update(_this2.toJSON()).exec().then(function (result) {
					_this2.set(result);
					_this2.isNew = false;

					return _this2;
				});
			}
		});
	}

	isValid() {
		var result = false,
		    error;

		result = this.validate();

		if (result.length > 0) {
			result.forEach(function (error) {
				error.type = ERROR_VALIDATION_TYPE;
			});

			this.errors = result;
			this.error = this.errors[0];

			return false;
		}

		return true;
	}

	validate() {
		var validator = new _jsonschema.Validator(),
		    result = validator.validate(this.get(), this.schema());

		this.emit('beforeValidate');

		if (result.errors.length) {
			return result.errors;
		}

		this.emit('validate');

		return [];
	}

	castData(data) {
		var _this3 = this;

		var path = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];

		switch ((0, _utils.typeOf)(data)) {
			case 'Object':
				for (var prop in data) {
					if (data.hasOwnProperty(prop)) {
						this.castData(data[prop], path.concat([prop]));
					}
				}
				break;
			case 'Array':
				var newArray = new _array2['default']();
				newArray._model = this;
				newArray._path = path.join('.');
				newArray.push.apply(newArray, _toConsumableArray(data));
				data = newArray;
				data.forEach(function (value) {
					_this3.castData(value, path);
				});
				break;
		}

		return data;
	}

	static find(query, select) {
		return this.db().provider.collection(this).find(query, select);
	}

	static findOne(query, select) {
		return this.db().provider.collection(this).findOne(query, select);
	}

	static insert() {}

	static update() {}

	static remove() {}

	static ensureIndex(Model) {
		_schema2['default'].index(Model.schema()).forEach(function (value, index) {
			//Model.db().connect.collection(Model.collection()).ensureIndex(index, value, function (err, result) {
			//	if (err) {
			//		debug('ensure index: ' + err.message);
			//	}
			//});
		});
	}
}

exports['default'] = Model;
module.exports = exports['default'];
//# sourceMappingURL=model.js.map