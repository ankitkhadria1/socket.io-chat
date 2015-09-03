'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _extend = require('extend');

var _extend2 = _interopRequireDefault(_extend);

var _db = require('./db');

var _db2 = _interopRequireDefault(_db);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _underscore = require('underscore');

var _underscore2 = _interopRequireDefault(_underscore);

class QueryResolver {
	constructor(Model) {
		this.__Model = Model;

		this.__query = {};
		this.__criteria = {};
		this.__select = {};
		this.__limit;
		this.__sort;
		this.__skip;
		this.__next;
		this.__pref;
		this._findType;

		this.schema = this.__Model.schema();
	}

	static castSortValue(value) {
		var _v = parseInt(value, 10);

		return _v !== 1 && _v !== -1 ? 1 : _v;
	}

	static castSchemaValue(type, value) {
		switch (type) {
			case 'string':
				return String(value);
			case 'number':
				return Number(value);
			case 'date-time':
				return new Date(value) || null;
			case 'object':
				return key.toLowerCase().match(/id$/) ? _db2['default'].ObjectId(value) || null : value; // TODO: check in schema
			default:
				return String(value);
		}
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
		this.__next = new ObjectId(id);
	}

	prev(id) {
		this.__prev = new ObjectId(id);
	}

	bindCriteria() {
		var _this = this;

		var criteria = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

		criteria.limit && (this.__criteria.limit = Math.abs(criteria.limit));
		criteria.next && (this.__criteria.next = criteria.next);
		criteria.prev && (this.__criteria.prev = criteria.prev);

		if (criteria.filter) {
			if (!_underscore2['default'].isObject(criteria.filter)) {
				this.__criteria.filter = {};
			}

			this.__criteria.filter = criteria.filter;

			Object.keys(this.__criteria.filter).forEach(function (key) {
				if (!_this.__query.hasOwnProperty(key) && _this.schema.properties.hasOwnProperty(key)) {
					_this.__query[key] = QueryResolver.castSchemaValue(_this.schema.properties[key].type, _this.__criteria.filter[key]);
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
			if (!_underscore2['default'].isObject(criteria.sort)) {
				criteria.sort = {};
			}

			this.__criteria.sort = criteria.sort;

			Object.keys(this.__criteria.sort).forEach(function (key) {
				if (!_this.sort.hasOwnProperty(key) && _this.schema.properties.hasOwnProperty(key)) {
					_this.sort[key] = QueryResolver.castSortValue(_this.__criteria.sort[key]);
				}
			});
		}

		return this;
	}

	merge() {
		var query = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

		this.__query = (0, _extend2['default'])(this.__query, query);

		return this;
	}

	find() {
		var query = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
		var select = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
		var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

		this.__query = query;
		this.select(select);

		this._findType = 'find';

		return this;
	}

	findOne() {
		var query = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
		var select = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

		this.__query = query;
		this.select(select);

		this._findType = 'findOne';

		return this;
	}

	exec() {
		var _this2 = this;

		var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

		var castResult = function castResult(res) {
			return options.lean ? res : res && _this2.__Model.fill(res);
		};

		return new Promise(function (resolve, reject) {
			_db2['default'].getConnect(function (connect) {
				var cursor = connect.collection(_this2.__Model.collection());

				switch (_this2._findType) {
					case 'find':
						if (_this2.__next || _this2.__prev) {
							if (!_this2.__query.$and) {
								_this2.__query.$and = [];
							}

							_this2.__next && _this2.__query.$and.push({ _id: { $gt: _this2.__next } });
							_this2.__prev && _this2.__query.$and.push({ _id: { $lt: _this2.__prev } });
						}

						cursor = cursor.find(_this2.__query);

						_this2.__sort && cursor.sort(_this2.__sort);
						_this2.__skip && cursor.skip(_this2.__skip);
						_this2.__limit && cursor.limit(_this2.__limit);

						cursor.toArray(function (err, result) {
							return err ? reject(err) : resolve(result.map(castResult));
						});

						break;
					case 'findOne':
						cursor.findOne(_this2.__query, function (err, result) {
							return err ? reject(err) : resolve(castResult(result));
						});
						break;
					default:
						throw new Error('exec unknown findType');
				}
			});
		});
	}
}

exports['default'] = QueryResolver;
module.exports = exports['default'];
//# sourceMappingURL=queryResolver2.js.map