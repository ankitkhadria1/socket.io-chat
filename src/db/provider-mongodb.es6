import ObjectID         from 'bson-objectid';
import { debug }        from '../debug';
import QueryResolver    from './queryResolver';
import Provider         from './provider';
import clone            from 'clone';

export default class ProviderMongodb extends Provider {
	constructor(db) {
		super();

		Object.defineProperties(this, {
			_db:  {
				writable:   true,
				enumerable: false,
				value:      db
			},
			name: {
				value: 'mongodb'
			}
		});
	}

	collection(Model) {
		return new QueryResolver(this, Model);
	}

	insert(dbCursor) {
		let cursor = this._db.collection(dbCursor.queryResolver.Model.collection());

		dbCursor.__data._id = new ObjectID();

		return new Promise((resolve, reject) => {
			cursor.insert(dbCursor.__data, function (err, result) {
				err ? reject(err) : resolve(dbCursor.__data);
			});
		});
	}

	update(dbCursor) {
		let cursor = this._db.collection(dbCursor.queryResolver.Model.collection());

		return new Promise((resolve, reject) => {
			cursor.udpate(dbCursor.__query, dbCursor.__updateQuery, dbCursor.__options, function (err, result) {
				err ? reject(err) : resolve(result);
			});
		});
	}

	findOneAndUpdate(dbCursor, options = {}) {
		let cursor = this._db.collection(dbCursor.queryResolver.Model.collection());

		dbCursor.__options.new = true;

		return new Promise((resolve, reject) => {
			cursor.findOneAndUpdate(dbCursor.__query, dbCursor.__updateQuery, dbCursor.__options, function (err, result) {
				err ? reject(err) : resolve(result);
			});
		});
	}

	find(dbCursor, options = {}) {
		let castResult = (res) => {
			return options.lean ? res : (res && new dbCursor.queryResolver.Model().set(res));
		};

		let cursor = this._db.collection(dbCursor.queryResolver.Model.collection());
		let { query, select, sort, limit, skip, next, prev } = dbCursor.getState();

		return new Promise((resolve, reject) => {
			if (next || prev) {
				!query.$and && (query.$and = []);

				next && query.$and.push({ _id: { $gt: next } });
				prev && query.$and.push({ _id: { $lt: prev } });
			}

			query._id && (query._id = new ObjectID(query._id));

			cursor = cursor.find(query, select);

			sort && cursor.sort(sort);
			skip && cursor.skip(parseInt(skip, 10));
			limit && cursor.limit(parseInt(limit, 10));

			cursor.toArray((err, result) => {
				return err ? reject(err) : resolve(result.map(castResult));
			});
		});
	}

	findOne(dbCursor, options = {}) {
		let castResult = (res) => {
			return options.lean ? res : (res && new dbCursor.queryResolver.Model().set(res));
		};

		let cursor = this._db.collection(dbCursor.queryResolver.Model.collection());
		let { query, select } = dbCursor.getState();

		query._id && (query._id = new ObjectID(query._id));

		return new Promise((resolve, reject) => {
			cursor.findOne(query, select, (err, result) => {
				return err ? reject(err) : resolve(castResult(result));
			});
		});

	}
}