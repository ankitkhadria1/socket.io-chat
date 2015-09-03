import ObjectID from 'bson-objectid';

import ProviderMongodb from './provider-mongodb';

export default class Db {
	constructor(options = {}) {
		if (!options.provider) {
			throw new Error('db must have `provider`');
		}

		switch (options.provider) {
			case 'mongodb':
				this._provider = new ProviderMongodb(options.connect);
				break;
			default:
				this._provider = new ProviderMongodb(options.connect);
		}
	}

	get provider () {
		return this._provider;
	}

	get connect() {
		return this._connect;
	}

	set connect(_connect) {
		_connect && (this._connect = _connect);

		return this;
	}
}