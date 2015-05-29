var _ = require('lodash'),
	db = require('./db'),
	Validator = require('jsonschema').Validator,
	EventEmitter = require('events').EventEmitter;

var sl = Array.prototype.slice;
var typeOf = function (object) {
	return Object.prototype.toString.call(object).replace(/\[object\s(\w+)\]/, '$1');
};

class Model extends EventEmitter {
	constructor(props = {}) {
		super();

		_.each(this.defaults(), (value, key) => {
			this[key] = props[key] ? props[key] : value;
		});

		this.__atomics = {};
		this.__update = {};
	}

	save() {
		var cb = sl.call(arguments, -1)[0];

		if (this.isValid()) {
			this.set('_id', new db.ObjectID());
			this.emit('beforeSave');

			db.getConnect((connect) => {
				connect.collection(this.collection()).insert(this.toJSON(), {}, cb);
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
		data    = _.extend({ $set: this.__update }, this.__atomics);

		delete data._id;

		db.getConnect((connect) => {
			connect.collection(this.collection()).update(query, data, (error, result) => {
				if (!error) {
					this.__update = {};
					this.__atomics = {};
				}

				cb(error, result);
			});
		});

		return this;
	}

	isValid() {
		var result, error;

		result = this.validate();

		if (result) {
			error = new Error(result.message);
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
		return _.clone(_.pick(this, Object.keys(this.defaults())));
	}

	set(key, value) {
		if (arguments.length === 1) {
			_.each(key, (value, key) => {
				this.set(key, value);
			});
		}

		if (~Object.keys(this.defaults()).indexOf(key)) {
			this[key] = value;

			if (~['Number', 'String', 'Data', 'Boolean', 'Object', 'Null'].indexOf(typeOf(value))) {
				this.__update[key] = value;
			}
		}

		return this;
	}

	get(key) {
		if (~Object.keys(this.defaults()).indexOf(key)) {
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
		if (!this.__atomics['$'+ type]) {
			this.__atomics['$'+ type] = {};
		}

		this.__atomics['$'+ type][field] = value;
	}

	destroy() {
		this.removeAllListeners();
		this.emit('destroy');
	}
}

module.exports = Model;