import Model        from '../model/index';
import SchemaLoader from '../schema';

export default function (client, options = {}) {
	let schema = SchemaLoader.load('message');
	let db     = client._db;

	if (!options.collectionName) options.collectionName = 'chat_messages';

	class Message extends Model {
		constructor(...args) {
			super(...args);
			super.initialize(options);
		}

		static collection() { return options.collectionName; }
		static db() { return db; }
		static schema() { return schema; }

		collection() { return options.collectionName; }
		db() { return db; }
		schema() { return schema; }
	}

	//Model.ensureIndex(Message);

	return Message;
};