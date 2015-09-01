'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _debug = require('../debug');

var _clone = require('clone');

var _clone2 = _interopRequireDefault(_clone);

var _deepExtend = require('deep-extend');

var _deepExtend2 = _interopRequireDefault(_deepExtend);

var _queryResolver = require('../queryResolver');

var _queryResolver2 = _interopRequireDefault(_queryResolver);

var _schema = require('../schema');

var _schema2 = _interopRequireDefault(_schema);

var Model = (function () {
	function Model() {
		_classCallCheck(this, Model);
	}

	_createClass(Model, [{
		key: 'initialize',
		value: function initialize() {
			var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

			this.defaults(this.schema());
			this.readOnly(this.schema());
		}
	}, {
		key: 'set',
		value: function set(key, value) {
			var _this = this;

			var path = arguments.length <= 2 || arguments[2] === undefined ? [] : arguments[2];

			if (arguments.length === 1) {
				_.each(key, function (value, key) {
					_this.set(key, value, path.push(key));
				});
			} else {
				path = [key];
			}

			if (~this.defaults.indexOf(key) && ! ~this.readOnly.indexOf(path.join('.'))) {
				this[key] = value;

				if (~['Number', 'String', 'Data', 'Boolean', 'Object', 'Null'].indexOf(typeOf(value))) {
					this.__addAtomic('set', key, value);
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
			var _this2 = this;

			var isAtomic = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

			if (_.isBoolean(arguments[1])) {
				_.each(key, function (value, key1) {
					_this2.fill(key1, value);
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
		key: 'defaults',
		set: function set(schema) {
			this._defaults = _schema2['default'].defaults(schema);
		},
		get: function get() {
			return this._defaults;
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