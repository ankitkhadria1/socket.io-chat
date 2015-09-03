'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _cursor = require('./cursor');

var _deepExtend = require('deep-extend');

var _deepExtend2 = _interopRequireDefault(_deepExtend);

var typeOf = function typeOf(object) {
	return Object.prototype.toString.call(object).replace(/\[object\s(\w+)\]/, '$1');
};

class QueryResolver {
	constructor(provider, Model) {
		this.provider = provider;
		this.Model = Model;
	}

	exec() {
		var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

		return this._provider.exec(this, options);
	}

	find() {
		var query = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
		var select = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

		return new _cursor.CursorFind(this).find(query, select);
	}

	findOne() {
		var query = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
		var select = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

		return new _cursor.CursorFindOne(this).find(query, select);
	}

	insert() {
		var data = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];

		return new _cursor.CursorInsert(this).insert(data);
	}

	update(query, updateQuery) {
		var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

		return new _cursor.CursorUpdate(this).update(query, updateQuery, options = {});
	}

	remove(query) {
		return new _cursor.CursorRemove(this).remove(query);
	}
}

exports['default'] = QueryResolver;
module.exports = exports['default'];
//# sourceMappingURL=queryResolver.js.map