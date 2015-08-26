import _                from 'underscore';
import db               from './db';
import { Validator }    from 'jsonschema';
import EventEmitter     from 'events';
import debugBase        from 'debug';
import SchemaLoader     from './schema';
import QueryResolver    from './queryResolver2';

var debug  = debugBase('develop');
var sl     = Array.prototype.slice;
var typeOf = function (object) {
	return Object.prototype.toString.call(object).replace(/\[object\s(\w+)\]/, '$1');
};

class Model extends EventEmitter {
	constructor(props = {}) {
		super();

		this._id   = new db.ObjectID();
		this.isNew = true;

		_.each(this.defaults(), (value, key) => {
			this[key] = props[key] ? props[key] : value;
		});

		this.__defaultAttrs  = Object.keys(this.defaults());
		this.__readonlyAttrs = [];
		this.__atomics       = {};
	}

	save() {
		var cb = sl.call(arguments, -1)[0];

		if (!this.isNew) {
			return this.update.apply(this, arguments);
		}

		if (this.isValid()) {
			this.set('_id', new db.ObjectID());
			this.emit('beforeSave');

			db.getConnect((connect) => {
				connect.collection(this.collection()).insert(this.toJSON(), {}, (error, result) => {
					if (!error) {
						this.isNew     = false;
						this.__atomics = {};
					}

					cb && cb(error, this);
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

			db.getConnect((connect) => {
				//debug('update', query);

				connect.collection(this.collection()).update(query, data, (error, result) => {
					if (!error) {
						this.isNew     = false;
						this.__atomics = {};
					}

					cb && cb(error, this);
				});
			});
		} else {
			cb(this.validationError);
		}

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

		var readonlyAttrs = SchemaLoader.readOnly(this.schema);
		let indexes       = SchemaLoader.index(this.schema);

		this.__readonlyAttrs = readonlyAttrs;

		for (indexName of indexes) {
			// ensure index
		}

		return this;
	}

	getSchema() {
		return this.schema;
	}

	toJSON() {
		return _.clone(_.pick(this, this.__defaultAttrs));
	}

	fill(key, value, isAtomic = false) {
		if (_.isBoolean(arguments[1])) {
			_.each(key, (value, key1) => {
				this.fill(key1, value);
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

	set(key, value, path = []) {
		if (arguments.length === 1) {
			_.each(key, (value, key) => {
				this.set(key, value, path.push(key));
			});
		} else {
			path = [key];
		}

		if (~this.__defaultAttrs.indexOf(key) && !~this.__readonlyAttrs.indexOf(path.join('.'))) {
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

	$push(field, value, isEach = false) {
		isEach
			? this.get(field) && this.__addAtomic('push', field, { $each: value })
			: this.get(field) && this.__addAtomic('push', field, value);
	}

	$addToSet(field, value, isEach = false) {
		isEach
			? this.get(field) && this.__addAtomic('addToSet', field, { $each: value })
			: this.get(field) && this.__addAtomic('addToSet', field, value);
	}

	$pull(field, value) {
		this.get(field) && this.__addAtomic('pull', field, value);
	}

	__addAtomic(type, field, value) {
		if (!this.__atomics['$' + type]) {
			this.__atomics['$' + type] = {};
		}

		if (_.isObject(value) && Object.keys(value).length === 1 && /^\$/.test(Object.keys(value)[0])) {
			switch (Object.keys(value)[0]) {
				case '$each':
				{
					if (!this.__atomics['$' + type][field]) {
						this.__atomics['$' + type][field] = { $each: [] }
					}

					this.__atomics['$' + type][field].$each.push(value.$each);

					break;
				}
			}
		} else {
			this.__atomics['$' + type][field] = value;
		}

	}

	destroy() {
		this.removeAllListeners();
		this.emit('destroy');
	}

	static find(Model, query) {
		var queryResolver = new QueryResolver(Model);

		return queryResolver.find(query);
	}

	static findOne(Model, query) {
		var queryResolver = new QueryResolver(Model);

		return queryResolver.findOne(query);
	}

	static update() {
		db.getConnect((connect) => {
			let collection = connect.collection(this.collection());

			collection.update.apply(collection, Array.prototype.slice.call(arguments));
		})
	}
}

export default Model;