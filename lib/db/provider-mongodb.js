'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _bsonObjectid = require('bson-objectid');

var _bsonObjectid2 = _interopRequireDefault(_bsonObjectid);

var _debug = require('../debug');

var _queryResolver = require('./queryResolver');

var _queryResolver2 = _interopRequireDefault(_queryResolver);

var _provider = require('./provider');

var _provider2 = _interopRequireDefault(_provider);

var _clone = require('clone');

var _clone2 = _interopRequireDefault(_clone);

class ProviderMongodb extends _provider2['default'] {
	constructor(db) {
		super();

		Object.defineProperties(this, {
			_db: {
				writable: true,
				enumerable: false,
				value: db
			},
			name: {
				value: 'mongodb'
			}
		});
	}

	collection(Model) {
		return new _queryResolver2['default'](this, Model);
	}

	insert(dbCursor) {
		var cursor = this._db.collection(dbCursor.queryResolver.Model.collection());

		dbCursor.__data._id = new _bsonObjectid2['default']();

		return new Promise(function (resolve, reject) {
			cursor.insert(dbCursor.__data, function (err, result) {
				err ? reject(err) : resolve(dbCursor.__data);
			});
		});
	}

	update(dbCursor) {
		var cursor = this._db.collection(dbCursor.queryResolver.Model.collection());

		return new Promise(function (resolve, reject) {
			cursor.udpate(dbCursor.__query, dbCursor.__updateQuery, dbCursor.__options, function (err, result) {
				err ? reject(err) : resolve(result);
			});
		});
	}

	findOneAndUpdate(dbCursor) {
		var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

		var cursor = this._db.collection(dbCursor.queryResolver.Model.collection());

		dbCursor.__options['new'] = true;

		return new Promise(function (resolve, reject) {
			cursor.findOneAndUpdate(dbCursor.__query, dbCursor.__updateQuery, dbCursor.__options, function (err, result) {
				err ? reject(err) : resolve(result);
			});
		});
	}

	find(dbCursor) {
		var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

		var castResult = function castResult(res) {
			return options.lean ? res : res && new dbCursor.queryResolver.Model().set(res);
		};

		var cursor = this._db.collection(dbCursor.queryResolver.Model.collection());

		var _dbCursor$getState = dbCursor.getState();

		var query = _dbCursor$getState.query;
		var select = _dbCursor$getState.select;
		var sort = _dbCursor$getState.sort;
		var limit = _dbCursor$getState.limit;
		var skip = _dbCursor$getState.skip;
		var next = _dbCursor$getState.next;
		var prev = _dbCursor$getState.prev;

		return new Promise(function (resolve, reject) {
			if (next || prev) {
				!query.$and && (query.$and = []);

				next && query.$and.push({ _id: { $gt: next } });
				prev && query.$and.push({ _id: { $lt: prev } });
			}

			query._id && (query._id = new _bsonObjectid2['default'](query._id));

			cursor = cursor.find(query, select);

			sort && cursor.sort(sort);
			skip && cursor.skip(parseInt(skip, 10));
			limit && cursor.limit(parseInt(limit, 10));

			cursor.toArray(function (err, result) {
				return err ? reject(err) : resolve(result.map(castResult));
			});
		});
	}

	findOne(dbCursor) {
		var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

		var castResult = function castResult(res) {
			return options.lean ? res : res && new dbCursor.queryResolver.Model().set(res);
		};

		var cursor = this._db.collection(dbCursor.queryResolver.Model.collection());

		var _dbCursor$getState2 = dbCursor.getState();

		var query = _dbCursor$getState2.query;
		var select = _dbCursor$getState2.select;

		query._id && (query._id = new _bsonObjectid2['default'](query._id));

		return new Promise(function (resolve, reject) {
			cursor.findOne(query, select, function (err, result) {
				return err ? reject(err) : resolve(castResult(result));
			});
		});
	}
}

exports['default'] = ProviderMongodb;
module.exports = exports['default'];
//# sourceMappingURL=provider-mongodb.js.map