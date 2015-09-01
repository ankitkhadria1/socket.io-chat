'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

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

var _array = require('./array');

var _array2 = _interopRequireDefault(_array);

var typeOf = function typeOf(object) {
	return Object.prototype.toString.call(object).replace(/\[object\s(\w+)\]/, '$1');
};

var Model = (function () {
	function Model() {
		_classCallCheck(this, Model);

		this.isNew = true;
		this._atomics = {};
	}

	_createClass(Model, [{
		key: 'initialize',
		value: function initialize() {
			var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

			this.defaults = this.schema();
			this.readOnly = this.schema();

			this.set(this.defaults);

			console.log(this.defaults);
		}
	}, {
		key: 'set',
		value: function set(key, value) {
			var _this = this;

			var path = arguments.length <= 2 || arguments[2] === undefined ? [] : arguments[2];

			if (arguments.length === 1) {
				_underscore2['default'].each(key, function (value, key) {
					_this.set(key, value, path.push(key));
				});
			} else {
				path = [key];
			}

			if (this.defaults.hasOwnProperty(key) && ! ~this.readOnly.indexOf(path.join('.'))) {
				this[key] = value;

				if (~['Number', 'String', 'Data', 'Boolean', 'Object', 'Null'].indexOf(typeOf(value))) {
					this.addAtomic('set', key, value);
				}
			}

			return this;
		}
	}, {
		key: 'get',
		value: function get(key) {
			if (~this.defaults.indexOf(key)) {
				return this[key];
			}
		}
	}, {
		key: 'fill',
		value: function fill(key, value) {
			var _key,
			    _this2 = this;

			var isAtomic = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

			if (_underscore2['default'].isBoolean(arguments[1])) {
				_underscore2['default'].each(key, function (value, key1) {
					_this2.fill(key1, value);
				});
			}

			if (this.defaults.hasOwnProperty(key)) {
				switch (typeOf(value)) {
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

			return this;
		}
	}, {
		key: 'toJSON',
		value: function toJSON() {
			var output = {};

			for (var prop in this) {
				if (this.hasOwnProperty(prop)) {
					output[prop] = this[prop];
				}
			}

			return (0, _clone2['default'])(output, true);
		}
	}, {
		key: 'addAtomic',
		value: function addAtomic(type, key, value) {
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
					switch (typeOf(value)) {
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
	}, {
		key: 'defaults',
		set: function set(schema) {
			this._defaults = _schema2['default'].defaults(schema);
		},
		get: function get() {
			return (0, _clone2['default'])(this._defaults);
		}
	}, {
		key: 'readOnly',
		set: function set(schema) {
			this._readOnly = _schema2['default'].readOnly(schema);
		},
		get: function get() {
			return this._readOnly;
		}
	}], [{
		key: 'ensureIndex',
		value: function ensureIndex() {
			_schema2['default'].index(this.schema()).forEach(function (value, index) {
				this.db().connect.collection(this.collection()).ensureIndex(index, value, function (err, result) {
					if (err) {
						(0, _debug.debug)('ensure index: ' + err.message);
					}
				});
			});
		}
	}, {
		key: 'find',
		value: function find() {
			var queryResolver = new _queryResolver2['default'](Model);

			return queryResolver.find.apply(queryResolver, arguments);
		}
	}, {
		key: 'findOne',
		value: function findOne() {
			var queryResolver = new _queryResolver2['default'](Model);

			return queryResolver.findOne.apply(queryResolver, arguments);
		}
	}]);

	return Model;
})();

exports['default'] = Model;
module.exports = exports['default'];
//# sourceMappingURL=model.js.map