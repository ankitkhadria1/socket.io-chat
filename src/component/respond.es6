import * as EVENT       from '../events';
import { debug }        from '../debug';
import Component from './component';
import { typeOf } from '../utils';

class RespondComponent extends Component {
	constructor(client, namespace) {
		super(client);

		this.namespace = namespace;
	}

	newChat(options) {
		this.namespace.emit(this.client.eventName(EVENT.NEW_CHAT), {result: {data: options.chat.toJSON()}});
	}

	newMessage(options, uuid) {
		// TODO: change

		this.client.members
			.get(options.chat.get('members').map(function (member) {
				return member._id
			}).map(String))
			.forEach(function (member) {
				member.join(String(options.chat._id))
			});

		this.namespace.emit(this.client.eventName(EVENT.NEW_MESSAGE), {
			result: {
				chatId: String(options.chat._id),
				data: options.message.toJSON()
			},
			uuid: uuid
		});
	}

	findChat() {

	}

	findChats(options) {
		this.namespace.emit(this.client.eventName(EVENT.FIND_CHATS), {result: {data: options}});
	}

	findMessages() {

	}

	findLastMessages(options, uuid) {
		this.namespace.emit(this.client.eventName(EVENT.FIND_LAST_MESSAGES), {
			result: {chatId: String(options.chatId), data: options.messages},
			uuid: uuid
		});
	}

	findFromMessages() {

	}

	findAtMessages() {

	}

	writeMessage(options) {
		this.namespace.emit(this.client.eventName(EVENT.WRITE_MESSAGE), {result: options});
	}
}

export default RespondComponent;