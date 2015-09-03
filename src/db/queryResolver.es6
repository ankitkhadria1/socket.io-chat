import { CursorFind, CursorFindOne, CursorInsert, CursorUpdate, CursorRemove } from './cursor';

import deepExtend from 'deep-extend';

var typeOf = function (object) {
	return Object.prototype.toString.call(object).replace(/\[object\s(\w+)\]/, '$1');
};

export default class QueryResolver {
	constructor(provider, Model) {
		this.provider = provider;
		this.Model   = Model;
	}

	exec(options = {}) {
		return this._provider.exec(this, options);
	}

	find(query = {}, select = {}) {
		return new CursorFind(this).find(query, select);
	}

	findOne(query = {}, select = {}) {
		return new CursorFindOne(this).find(query, select);
	}

	insert(data = []) {
		return new CursorInsert(this).insert(data);
	}

	update(query, updateQuery, options = {}) {
		return new CursorUpdate(this).update(query, updateQuery, options = {});
	}

	remove(query) {
		return new CursorRemove(this).remove(query);
	}
}