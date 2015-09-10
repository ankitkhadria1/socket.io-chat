'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

var _events = require('../events');

var EVENT = _interopRequireWildcard(_events);

var _debug = require('../debug');

var _component = require('./component');

var _component2 = _interopRequireDefault(_component);

var _utils = require('../utils');

class RespondComponent extends _component2['default'] {
	constructor(client, namespace) {
		super(client);

		this.namespace = namespace;
	}

	newChat(options) {
		this.namespace.emit(this.client.eventName(EVENT.NEW_CHAT), { result: { data: options.chat.toJSON() } });
	}

	newMessage(options, uuid) {
		// TODO: change

		this.client.members.get(options.chat.get('members').map(function (member) {
			return member._id;
		}).map(String)).forEach(function (member) {
			member.join(String(options.chat._id));
		});

		this.namespace.emit(this.client.eventName(EVENT.NEW_MESSAGE), {
			result: {
				chatId: String(options.chat._id),
				data: options.message.toJSON()
			},
			uuid: uuid
		});
	}

	findChat() {}

	findChats(options) {
		this.namespace.emit(this.client.eventName(EVENT.FIND_CHATS), { result: { data: options } });
	}

	findMessages() {}

	findLastMessages(options, uuid) {
		this.namespace.emit(this.client.eventName(EVENT.FIND_LAST_MESSAGES), {
			result: { chatId: String(options.chatId), data: options.messages },
			uuid: uuid
		});
	}

	findFromMessages() {}

	findAtMessages() {}

	writeMessage(options) {
		this.namespace.emit(this.client.eventName(EVENT.WRITE_MESSAGE), { result: options });
	}
}

exports['default'] = RespondComponent;
module.exports = exports['default'];
//# sourceMappingURL=respond.js.map