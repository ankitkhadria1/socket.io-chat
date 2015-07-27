'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x6, _x7, _x8) { var _again = true; _function: while (_again) { desc = parent = getter = undefined; _again = false; var object = _x6,
    property = _x7,
    receiver = _x8; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x6 = parent; _x7 = property; _x8 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

(function () {
	var _ = require('underscore'),
	    db = require('./db'),
	    Validator = require('jsonschema').Validator,
	    EventEmitter = require('events').EventEmitter,
	    debug = require('debug')('develop'),
	    schemaLoader = require('./schema');

	var sl = Array.prototype.slice;
	var typeOf = function typeOf(object) {
		return Object.prototype.toString.call(object).replace(/\[object\s(\w+)\]/, '$1');
	};

	var Model = (function (_EventEmitter) {
		function Model() {
			var _this2 = this;

			var props = arguments[0] === undefined ? {} : arguments[0];

			_classCallCheck(this, Model);

			_get(Object.getPrototypeOf(Model.prototype), 'constructor', this).call(this);

			this._id = new db.ObjectID();
			this.isNew = true;

			_.each(this.defaults(), function (value, key) {
				_this2[key] = props[key] ? props[key] : value;
			});

			this.__defaultAttrs = Object.keys(this.defaults());
			this.__readonlyAttrs = [];
			this.__atomics = {};
		}

		_inherits(Model, _EventEmitter);

		_createClass(Model, [{
			key: 'save',
			value: function save() {
				var _this3 = this;

				var cb = sl.call(arguments, -1)[0];

				if (!this.isNew) {
					return this.update.apply(this, arguments);
				}

				if (this.isValid()) {
					this.set('_id', new db.ObjectID());
					this.emit('beforeSave');

					db.getConnect(function (connect) {
						connect.collection(_this3.collection()).insert(_this3.toJSON(), {}, function (error, result) {
							if (!error) {
								_this3.isNew = false;
								_this3.__atomics = {};
							}

							cb && cb(error, _this3);
						});
						_this3.emit('save');
					});
				} else {
					cb(this.validationError);
				}

				return this;
			}
		}, {
			key: 'update',
			value: function update() {
				var _this4 = this;

				var query, data, cb, modelId;

				modelId = db.ObjectID(this.get('_id'));
				query = { _id: modelId };
				cb = sl.call(arguments, -1)[0];
				data = {};

				if (this.isValid()) {
					_.each(this.__atomics, function (atomic, key) {
						if (Object.keys(atomic).length) {
							delete atomic._id;

							data[key] = atomic;
						}
					});

					if (!Object.keys(data).length) {
						return cb && cb(null, this);
					}

					db.getConnect(function (connect) {
						//debug('update', query);

						connect.collection(_this4.collection()).update(query, data, function (error, result) {
							if (!error) {
								_this4.isNew = false;
								_this4.__atomics = {};
							}

							cb && cb(error, _this4);
						});
					});
				} else {
					cb(this.validationError);
				}

				return this;
			}
		}, {
			key: 'isValid',
			value: function isValid() {
				var result, error;

				result = this.validate();

				if (result) {
					error = new Error(result.message);
					error.type = 'validation';

					this.validationError = error;
				}

				return !result;
			}
		}, {
			key: 'validate',
			value: function validate() {
				var validator = new Validator(),
				    result = validator.validate(this.toJSON(), this.getSchema());

				this.emit('beforeValidate');

				if (result.errors.length) {
					return new Error(result.errors[0].stack);
				}

				this.emit('validate');

				return null;
			}
		}, {
			key: 'setSchema',
			value: function setSchema(schema) {
				this.schema = schema;

				var readonlyAttrs = [];
				var path = [];

				function walk(properties) {
					_.each(properties, function (prop, key) {
						path.push(key);

						if (prop.readonly) {
							readonlyAttrs.push(path.join('.'));
						}

						if (prop.properties) {
							walk(prop.properties);
						} else {
							path = [];
						}
					});
				}

				walk(this.schema.properties);

				this.__readonlyAttrs = readonlyAttrs;
			}
		}, {
			key: 'getSchema',
			value: function getSchema() {
				return this.schema;
			}
		}, {
			key: 'toJSON',
			value: function toJSON() {
				return _.clone(_.pick(this, this.__defaultAttrs));
			}
		}, {
			key: 'fill',
			value: function fill(key, value) {
				var _this5 = this;

				var isAtomic = arguments[2] === undefined ? false : arguments[2];

				if (arguments.length === 1) {
					_.each(key, function (value, key) {
						_this5.fill(key, value);
					});
				}

				if (~this.__defaultAttrs.indexOf(key)) {
					this[key] = value;

					if (isAtomic) {
						this.__addAtomic('set', key, value);
					}
				}

				return this;
			}
		}, {
			key: 'set',
			value: function set(key, value) {
				var _this6 = this;

				var path = arguments[2] === undefined ? [] : arguments[2];

				if (arguments.length === 1) {
					_.each(key, function (value, key) {
						_this6.set(key, value, path.push(key));
					});
				} else {
					path = [key];
				}

				if (~this.__defaultAttrs.indexOf(key) && ! ~this.__readonlyAttrs.indexOf(path.join('.'))) {
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
				if (~this.__defaultAttrs.indexOf(key)) {
					return this[key];
				}
			}
		}, {
			key: '$push',
			value: function $push(field, value) {
				var isEach = arguments[2] === undefined ? false : arguments[2];

				isEach ? this.get(field) && this.__addAtomic('push', field, { $each: value }) : this.get(field) && this.__addAtomic('push', field, value);
			}
		}, {
			key: '$addToSet',
			value: function $addToSet(field, value) {
				var isEach = arguments[2] === undefined ? false : arguments[2];

				isEach ? this.get(field) && this.__addAtomic('addToSet', field, { $each: value }) : this.get(field) && this.__addAtomic('addToSet', field, value);
			}
		}, {
			key: '$pull',
			value: function $pull(field, value) {
				this.get(field) && this.__addAtomic('pull', field, value);
			}
		}, {
			key: '__addAtomic',
			value: function __addAtomic(type, field, value) {
				if (!this.__atomics['$' + type]) {
					this.__atomics['$' + type] = {};
				}

				if (_.isObject(value) && Object.keys(value).length === 1 && /^\$/.test(Object.keys(value)[0])) {
					switch (Object.keys(value)[0]) {
						case '$each':
							{
								if (!this.__atomics['$' + type][field]) {
									this.__atomics['$' + type][field] = { $each: [] };
								}

								this.__atomics['$' + type][field].$each.push(value.$each);

								break;
							}
					}
				} else {
					this.__atomics['$' + type][field] = value;
				}
			}
		}, {
			key: 'destroy',
			value: function destroy() {
				this.removeAllListeners();
				this.emit('destroy');
			}
		}]);

		return Model;
	})(EventEmitter);

	module.exports = Model;
})();
//# sourceMappingURL=model.js.map