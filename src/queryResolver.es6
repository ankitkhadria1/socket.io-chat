(function () {
	"use strict";
	var extend = require('extend'),
		db     = require('./db'),
		debug  = require('debug')('develop'),
		_      = require('underscore');

	function castSortValue(value) {
		var _v = parseInt(value, 10);

		return (_v !== 1 && _v !== -1) ? 1 : _v;
	}

	class QueryResolver {
		constructor() {
			this.query    = {};
			this.select   = {};
			this.sort     = {};
			this.limit    = null;
			this.schema   = {};
			this.next     = null;
			this.prev     = null;
			this.criteria = {};
		}

		collection(collection) {
			this.collection = collection;

			return this;
		}

		setQuery(query) {
			this.query = query;

			return this;
		}

		addQuery(query) {
			extend(this.query, query);

			return this;
		}

		setLimit(limit = null) {
			if (limit) {
				this.limit = Math.abs(limit) > 50 ? 50 : (Math.abs(limit) || 10);
			}

			return this;
		}

		setSort(sort) {
			this.sort = sort;

			return this;
		}

		addSort(sort) {
			extend(this.sort, sort);

			return this;
		}

		setSelect(select) {
			this.select = select;

			return this;
		}

		setSchema(schema) {
			this.schema = schema;

			return this;
		}

		setNext() {
			this.next = db.ObjectId(this.criteria.next);

			return this;
		}

		setPrev() {
			this.prev = db.ObjectId(this.criteria.prev);

			return this;
		}

		bindCriteria(criteria = {}) {
			this.criteria = criteria;

			this.criteria.limit && this.setLimit(this.criteria.limit);
			this.criteria.next && this.setNext(this.criteria.next);
			this.criteria.prev && this.setPrev(this.criteria.prev);

			if (this.criteria.filter) {
				if (!_.isObject(this.criteria.filter)) {
					this.criteria.filter = {};
				}

				Object.keys(this.criteria.filter).forEach((key) => {
					if (!this.query.hasOwnProperty(key) && this.schema.properties.hasOwnProperty(key)) {
						switch (this.schema.properties[key].type) {
							case 'string':
								this.query[key] = String(this.criteria.filter[key]);
								break;
							case 'number':
								this.query[key] = Number(this.criteria.filter[key]);
								break;
							case 'date-time':
								this.query[key] = new Date(this.criteria.filter[key]) || null;
								break;
							case 'object':
								if (key.toLowerCase().match(/id$/)) {
									this.query[key] = db.ObjectId(this.criteria.filter[key]) || null;
								}
								break;
							default:
								this.query[key] = String(this.criteria.filter[key]);
						}
					}
				});
			}

			if (this.criteria.sort) {
				if (!_.isObject(this.criteria.sort)) {
					this.criteria.sort = {};
				}

				Object.keys(this.criteria.sort).forEach((key) => {
					if (!this.sort.hasOwnProperty(key) && this.schema.properties.hasOwnProperty(key)) {
						this.sort[key] = castSortValue(this.criteria.sort[key]);
					}
				});
			}

			return this;
		}

		find() {
			var cursor,
				collectionName = this.collection,
				query          = this.query,
				select         = this.select,
				limit          = this.limit,
				sort           = this.sort,
				next           = this.next,
				prev           = this.prev;

			return new Promise(function (resolve, reject) {
				db.getConnect(function (connect) {
					if (next || prev) {
						if (!query.$and) {
							query.$and = [];
						}

						next && query.$and.push({ _id: { $gt: next } });
						prev && query.$and.push({ _id: { $lt: prev } });
					}

					cursor = connect.collection(collectionName).find(query, select);

					if (Object.keys(sort).length > 0) cursor.sort(sort);
					if (isFinite(limit)) cursor.limit(limit);

					cursor.toArray(function (err, res) {
						err ? reject(err) : resolve(res);
					})
				});
			});
		}

		findOne() {
			var cursor,
				collectionName = this.collection,
				query          = this.query,
				select         = this.select;

			return new Promise(function (resolve, reject) {
				db.getConnect(function (connect) {
					cursor = connect.collection(collectionName);
					cursor.findOne(query, function (err, res) {
						err ? reject(err) : resolve(res);
					})
				});
			});
		}
	}

	module.exports = QueryResolver;
}());