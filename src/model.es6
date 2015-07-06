(function () {
	var _            = require('underscore'),
		db           = require('./db'),
		Validator    = require('jsonschema').Validator,
		EventEmitter = require('events').EventEmitter,
		debug        = require('debug')('develop'),
		schemaLoader = require('./schema');

	var sl     = Array.prototype.slice;
	var typeOf = function (object) {
		return Object.prototype.toString.call(object).replace(/\[object\s(\w+)\]/, '$1');
	};

	class Model extends EventEmitter {
		constructor(props = {}) {
			super();

			this._id = new db.ObjectID();

			_.each(this.defaults(), (value, key) => {
				this[key] = props[key] ? props[key] : value;
			});

			this.__defaultAttrs = Object.keys(this.defaults());
			this.__atomics = {};
		}

		save() {
			var cb = sl.call(arguments, -1)[0];

			if (this.isValid()) {
				this.set('_id', new db.ObjectID());
				this.emit('beforeSave');

				db.getConnect((connect) => {
					connect.collection(this.collection()).insert(this.toJSON(), {}, (error, result) => {
						if (!error) {
							this.__atomics = {};
						}

						cb(error, this);
					});
					this.emit('save');
				});
			} else {
				cb(this.validationError);
			}

			return this;
		}

		update() {
			var query, data, cb, modelId;

			modelId = db.ObjectID(this.get('_id'));
			query   = { _id: modelId };
			cb      = sl.call(arguments, -1)[0];
			data    = {};

			_.each(this.__atomics, function (atomic, key) {
				if (Object.keys(atomic).length) {
					delete atomic._id;

					data[key] = atomic;
				}
			});

			if (!Object.keys(data).length) {
				return cb(null, this);
			}

			db.getConnect((connect) => {
				//debug('update', query);

				connect.collection(this.collection()).update(query, data, (error, result) => {
					if (!error) {
						this.__atomics = {};
					}

					cb(error, this);
				});
			});

			return this;
		}

		isValid() {
			var result, error;

			result = this.validate();

			if (result) {
				error      = new Error(result.message);
				error.type = 'validation';

				this.validationError = error;
			}

			return !result;
		}

		validate() {
			var validator = new Validator(),
				result    = validator.validate(this.toJSON(), this.getSchema());

			this.emit('beforeValidate');

			if (result.errors.length) {
				return new Error(result.errors[0].stack);
			}

			this.emit('validate');

			return null;
		}

		setSchema(schema) {
			this.schema = schema;
		}

		getSchema() {
			return this.schema;
		}

		toJSON() {
			return _.clone(_.pick(this, this.__defaultAttrs));
		}

		set(key, value) {
			if (arguments.length === 1) {
				_.each(key, (value, key) => {
					this.set(key, value);
				});
			}

			if (~this.__defaultAttrs.indexOf(key)) {
				this[key] = value;

				if (~['Number', 'String', 'Data', 'Boolean', 'Object', 'Null'].indexOf(typeOf(value))) {
					this.__addAtomic('set', key, value);
				}
			}

			return this;
		}

		get(key) {
			if (~this.__defaultAttrs.indexOf(key)) {
				return this[key];
			}
		}

		$push(field, value) {
			this.get(field) && this.__addAtomic('push', field, value);
		}

		$addToSet(field, value) {
			this.get(field) && this.__addAtomic('addToSet', field, value);
		}

		$pull(field, value) {
			this.get(field) && this.__addAtomic('pull', field, value);
		}

		__addAtomic(type, field, value) {
			if (!this.__atomics['$' + type]) {
				this.__atomics['$' + type] = {};
			}

			this.__atomics['$' + type][field] = value;
		}

		destroy() {
			this.removeAllListeners();
			this.emit('destroy');
		}
	}

	module.exports = Model;
}());