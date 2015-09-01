import Model        from '../model/index';
import SchemaLoader from '../schema';

export default function (client, options = {}) {
	let schema = SchemaLoader.load('chat');
	let db     = client._db;

	if (!options.collectionName) options.collectionName = 'chat';

	class Chat extends Model {
		constructor() {
			super();
			super.initialize(options);
		}

		static collection() {
			return options.collectionName;
		}

		static db() {
			return db;
		}

		static schema() {
			return schema;
		}
	}

	Chat.ensureIndex();

	return Chat;
};