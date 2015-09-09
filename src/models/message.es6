import Model        from '../model/index';
import SchemaLoader from '../schema';

export default function (client, options = {}) {
	let schema = SchemaLoader.load('message');
	let db     = client.db;

	if (!options.collectionName) options.collectionName = 'chat_messages';

	class Message extends Model {
		constructor(data = {}) {
			super(data);

			super.initialize(options);
		}

		setChat(chat) {
			this.set('chatId', chat.get('_id'));
			this.set('receivers', chat.get('members').map(function (member) { return member._id; }).map(String));

			return this;
		}

		setAuthor(user) {
			this.set('authorId', String(user));

			return this;
		}

		setType(type) {
			this.set('type', type);

			return this;
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