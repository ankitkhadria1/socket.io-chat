import ObjectID from 'bson-objectid';

import ProviderMongodb from './provider-mongodb';

export default class Db {
	constructor(options = {}) {
		if (!options.provider) {
			throw new Error('db must have `provider`');
		}

		switch (options.provider) {
			case 'mongodb':
				this.provider = new ProviderMongodb(this);
				break;
			default:
				this.provider = new ProviderMongodb(this);
		}
	}

	get connect() {
		return this._connect;
	}

	set connect(_connect) {
		_connect && (this._connect = _connect);

		return this;
	}

	find() {
		this.provider.find.apply(this.provider, arguments);
	}

	update() {
		this.provider.update.apply(this.provider, arguments);
	}

	remove() {
		this.provider.remove.apply(this.provider, arguments);
	}
}