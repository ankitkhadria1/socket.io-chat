var _ = require('lodash'),
	db = require('./db'),
	Validator = require('jsonschema').Validator,
	EventEmitter = require('events').EventEmitter;

var sl = Array.prototype.slice;

class Model extends EventEmitter {
	constructor(props = {}) {
		super();

		_.each(this.defaults(), (value, key) => {
			this[key] = props[key] ? props[key] : value;
		});
	}

	save() {
		var cb = sl.call(arguments, -1)[0];

		if (this.isValid()) {
			this.set('_id', new db.ObjectID());
			this.emit('beforeSave');

			db.getConnect((connect) => {
				connect.collection(this.collection()).insertOne(this.toJSON(), {}, cb);
				this.emit('save');
			});
		} else {
			cb(new Error(this.validationError.message));
		}

		return this;
	}

	update() {
		var data, cb, modelId;

		modelId = db.ObjectID(this.get('_id'));
		data    = this.toJSON();
		cb      = sl.call(arguments, -1)[0];

		delete data._id;

		db.getConnect((connect) => {
			connect.collection(this.collection()).updateOne({ _id: modelId }, data, cb);
		});

		return this;
	}

	isValid() {
		var result;

		result = this.validate();

		if (result) {
			this.validationError = result;
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
		}

		return this;
	}

	get(key) {
		if (~Object.keys(this.defaults()).indexOf(key)) {
			return this[key];
		}
	}

	destroy() {
		this.removeAllListeners();
		this.emit('destroy');
	}
}

module.exports = Model;