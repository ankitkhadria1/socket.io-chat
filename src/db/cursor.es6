function castSortValue(value) {
	var _v = parseInt(value, 10);

	return (_v !== 1 && _v !== -1) ? 1 : _v;
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


export class CursorFind extends Cursor {
	constructor(queryResolver) {
		super(queryResolver);
	}

	find(query, select) {
		this.__query = query;
		this.select(select);

		return this;
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
		this.__next = id;
	}

	prev(id) {
		this.__prev = id;
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
				if (!this.__query.hasOwnProperty(key) && this.queryResolver.Model.schema().properties.hasOwnProperty(key)) {
					this.__query[key] = castSchemaValue(this.queryResolver.Model.schema().properties[key].type, this.__criteria.filter[key]);
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
					this.sort[key] = castSortValue(this.__criteria.sort[key]);
				}
			});
		}

		return this;
	}

	merge(query = {}) {
		this.__query = deepExtend(this.__query, query);

		return this;
	}

	exec(options) {
		return this.queryResolver.provider.find(this, options);
	}
}

export class CursorFindOne extends Cursor {
	constructor(queryResolver) {
		super(queryResolver);
	}

	exec(options = {}) {
		return this.queryResolver.provider.findOne(this, options);
	}
}

export class CursorInsert extends Cursor {
	constructor(queryResolver) {
		super(queryResolver);

		this.__data = {};
	}

	insert(data = {}) {
		this.__data = data;
		return this;
	}

	exec(options = {}) {
		return this.queryResolver.provider.insert(this, options);
	}
}

export class CursorUpdate extends Cursor {
	constructor(queryResolver) {
		super(queryResolver);

		this.__query       = {};
		this.__updateQuery = {};
		this.__options     = {};
	}

	update(query = {}, updateQuery = {}, options = {}) {
		this.__query       = query;
		this.__updateQuery = updateQuery;
		this.__options     = options;

		return this;
	}

	exec(options = {}) {
		return this.queryResolver.provider.update(this, options);
	}
}

export class CursorRemove extends Cursor {
	constructor(queryResolver) {
		super(queryResolver);

		this.__query = {};
	}

	remove(query = {}) {
		this.__query = query;

		return this;
	}

	exec(options = {}) {
		return this.queryResolver.provider.remove(this, options);
	}
}