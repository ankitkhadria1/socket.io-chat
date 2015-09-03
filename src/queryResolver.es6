import extend    from 'extend';
import debugBase from 'debug';
import _         from 'underscore';

class QueryResolver {
	constructor(Model) {
		this.__Model = Model;

		this.__query    = {};
		this.__criteria = {};
		this.__select   = {};
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

		return (_v !== 1 && _v !== -1) ? 1 : _v;
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
				return value.toLowerCase().match(/id$/) ? (this.__Model.db.ObjectId(value) || null) : value; // TODO: check in schema
			default:
				return String(value);
		}
	}

	select(select = {}) {
		this.__select = select;
	}

	sort(sort = {}) {
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

	bindCriteria(criteria = {}) {
		criteria.limit && ( this.__criteria.limit = Math.abs(criteria.limit) );
		criteria.next && ( this.__criteria.next = criteria.next );
		criteria.prev && ( this.__criteria.prev = criteria.prev );

		if (criteria.filter) {
			if (!_.isObject(criteria.filter)) {
				this.__criteria.filter = {};
			}

			this.__criteria.filter = criteria.filter;

			Object.keys(this.__criteria.filter).forEach((key) => {
				if (!this.__query.hasOwnProperty(key) && this.schema.properties.hasOwnProperty(key)) {
					this.__query[key] = QueryResolver.castSchemaValue(this.schema.properties[key].type, this.__criteria.filter[key]);
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

			Object.keys(this.__criteria.sort).forEach((key) => {
				if (!this.sort.hasOwnProperty(key) && this.schema.properties.hasOwnProperty(key)) {
					this.sort[key] = QueryResolver.castSortValue(this.__criteria.sort[key]);
				}
			});
		}

		return this;
	}

	merge(query = {}) {
		this.__query = extend(this.__query, query);

		return this;
	}

	find(query = {}, select = {}, options = {}) {
		this.__query = query;
		this.select(select);

		this._findType = 'find';

		return this;
	}

	findOne(query = {}, select = {}) {
		this.__query = query;
		this.select(select);

		this._findType = 'findOne';

		return this;
	}

	exec(options = {}) {

	}
}

export default QueryResolver;