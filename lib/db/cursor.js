'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});
function castSortValue(value) {
	var _v = parseInt(value, 10);

	return _v !== 1 && _v !== -1 ? 1 : _v;
}

function castSchemaValue(type, value) {
	switch (type) {
		case 'string':
			return String(value);
		case 'number':
			return Number(value);
		case 'date-time':
			return new Date(value) || null;
		case 'object':
			return value;
		default:
			return String(value);
	}
}

class Cursor {
	constructor(queryResolver) {
		this.queryResolver = queryResolver;
	}
}

class CursorFind extends Cursor {
	constructor(queryResolver) {
		super(queryResolver);
	}

	find(query, select) {
		this.__query = query;
		this.select(select);

		return this;
	}

	select() {
		var select = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

		this.__select = select;
	}

	sort() {
		var sort = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

		this.__sort = sort;

		return this;
	}

	limit(limit) {
		this.__limit = Math.abs(limit);

		return this;
	}

	skip(skip) {
		this.__skip = Math.abs(skip);

		return this;
	}

	next(id) {
		this.__next = id;
	}

	prev(id) {
		this.__prev = id;
	}

	bindCriteria() {
		var _this = this;

		var criteria = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

		criteria.limit && (this.__criteria.limit = Math.abs(criteria.limit));
		criteria.next && (this.__criteria.next = criteria.next);
		criteria.prev && (this.__criteria.prev = criteria.prev);

		if (criteria.filter) {
			if (!_.isObject(criteria.filter)) {
				this.__criteria.filter = {};
			}

			this.__criteria.filter = criteria.filter;

			Object.keys(this.__criteria.filter).forEach(function (key) {
				if (!_this.__query.hasOwnProperty(key) && _this.queryResolver.Model.schema().properties.hasOwnProperty(key)) {
					_this.__query[key] = castSchemaValue(_this.queryResolver.Model.schema().properties[key].type, _this.__criteria.filter[key]);
				}
			});
		}

		if (criteria.limit && typeof this.__limit === 'undefined') {
			this.limit(criteria.limit);
		}

		if (criteria.skip && typeof this.__skip === 'undefined') {
			this.skip(criteria.skip);
		}

		if (criteria.sort) {
			if (!_.isObject(criteria.sort)) {
				criteria.sort = {};
			}

			this.__criteria.sort = criteria.sort;

			Object.keys(this.__criteria.sort).forEach(function (key) {
				if (!_this.sort.hasOwnProperty(key) && _this.schema.properties.hasOwnProperty(key)) {
					_this.sort[key] = castSortValue(_this.__criteria.sort[key]);
				}
			});
		}

		return this;
	}

	merge() {
		var query = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

		this.__query = deepExtend(this.__query, query);

		return this;
	}

	getState() {
		return {
			query: this.__query,
			select: this.__select,
			sort: this.__sort,
			limit: this.__limit,
			skip: this.__skip,
			next: this.__next,
			prev: this.__prev
		};
	}

	exec(options) {
		return this.queryResolver.provider.find(this, options);
	}
}

exports.CursorFind = CursorFind;

class CursorFindOne extends CursorFind {
	constructor(queryResolver) {
		super(queryResolver);
	}

	findOne(query, select) {
		this.__query = query;
		this.select(select);

		return this;
	}

	getState() {
		return {
			query: this.__query,
			select: this.__select
		};
	}

	exec() {
		var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

		return this.queryResolver.provider.findOne(this, options);
	}
}

exports.CursorFindOne = CursorFindOne;

class CursorInsert extends Cursor {
	constructor(queryResolver) {
		super(queryResolver);

		this.__data = {};
	}

	insert() {
		var data = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

		this.__data = data;
		return this;
	}

	exec() {
		var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

		return this.queryResolver.provider.insert(this, options);
	}
}

exports.CursorInsert = CursorInsert;

class CursorUpdate extends Cursor {
	constructor(queryResolver) {
		super(queryResolver);

		this.__query = {};
		this.__updateQuery = {};
		this.__options = {};
	}

	update() {
		var query = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
		var updateQuery = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
		var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

		this.__query = query;
		this.__updateQuery = updateQuery;
		this.__options = options;

		return this;
	}

	exec() {
		var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

		return this.queryResolver.provider.name === 'mongodb' ? this.queryResolver.provider.findOneAndUpdate(this, options) : this.queryResolver.provider.update(this, options);
	}
}

exports.CursorUpdate = CursorUpdate;

class CursorRemove extends Cursor {
	constructor(queryResolver) {
		super(queryResolver);

		this.__query = {};
	}

	remove() {
		var query = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

		this.__query = query;

		return this;
	}

	exec() {
		var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

		return this.queryResolver.provider.remove(this, options);
	}
}

exports.CursorRemove = CursorRemove;
//# sourceMappingURL=cursor.js.map