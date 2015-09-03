import ObjectID         from 'bson-objectid';
import { debug }        from '../debug';
import QueryResolver    from './queryResolver';
import Provider         from './provider';

export default class ProviderMongodb extends Provider {
	constructor(db) {
		super();

		Object.defineProperties(this, {
			_db: {
				writable:   true,
				enumerable: false,
				value:      db
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
				err ? reject(err) : resolve(result);

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

	find(dbCursor, options) {
		let castResult = (res) => {
			return options.lean ? res : (res && dbCursor.queryResolver.Model.fill(res));
		};

		let cursor = this._db.collection(dbCursor.queryResolver.Model.collection());

		return new Promise((resolve, reject) => {
			if (dbCursor.__next || dbCursor.__prev) {
				if (!dbCursor.__query.$and) {
					dbCursor.__query.$and = [];
				}

				dbCursor.__next && dbCursor.__query.$and.push({ _id: { $gt: dbCursor.__next } });
				dbCursor.__prev && dbCursor.__query.$and.push({ _id: { $lt: dbCursor.__prev } });
			}

			cursor = cursor.find(dbCursor.__query);

			dbCursor.__sort && cursor.sort(this.__sort);
			dbCursor.__skip && cursor.skip(this.__skip);
			dbCursor.__limit && cursor.limit(this.__limit);

			cursor.toArray((err, result) => {
				return err ? reject(err) : resolve(result.map(castResult));
			});
		});
	}

	findOne(dbCursor) {
		let cursor = this._db.collection(dbCursor.__Model.collection());

		return new Promise((resolve, reject) => {
			cursor.findOne(this.__query, (err, result) => {
				return err ? reject(err) : resolve(castResult(result));
			});
		});

	}
}