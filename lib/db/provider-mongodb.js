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

class ProviderMongodb extends _provider2['default'] {
	constructor(db) {
		super();

		Object.defineProperties(this, {
			_db: {
				writable: true,
				enumerable: false,
				value: db
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
				err ? reject(err) : resolve(result);
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

	find(dbCursor, options) {
		var _this = this;

		var castResult = function castResult(res) {
			return options.lean ? res : res && dbCursor.queryResolver.Model.fill(res);
		};

		var cursor = this._db.collection(dbCursor.queryResolver.Model.collection());

		return new Promise(function (resolve, reject) {
			if (dbCursor.__next || dbCursor.__prev) {
				if (!dbCursor.__query.$and) {
					dbCursor.__query.$and = [];
				}

				dbCursor.__next && dbCursor.__query.$and.push({ _id: { $gt: dbCursor.__next } });
				dbCursor.__prev && dbCursor.__query.$and.push({ _id: { $lt: dbCursor.__prev } });
			}

			cursor = cursor.find(dbCursor.__query);

			dbCursor.__sort && cursor.sort(_this.__sort);
			dbCursor.__skip && cursor.skip(_this.__skip);
			dbCursor.__limit && cursor.limit(_this.__limit);

			cursor.toArray(function (err, result) {
				return err ? reject(err) : resolve(result.map(castResult));
			});
		});
	}

	findOne(dbCursor) {
		var _this2 = this;

		var cursor = this._db.collection(dbCursor.__Model.collection());

		return new Promise(function (resolve, reject) {
			cursor.findOne(_this2.__query, function (err, result) {
				return err ? reject(err) : resolve(castResult(result));
			});
		});
	}
}

exports['default'] = ProviderMongodb;
module.exports = exports['default'];
//# sourceMappingURL=provider-mongodb.js.map