'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _deepExtend = require('deep-extend');

var _deepExtend2 = _interopRequireDefault(_deepExtend);

var _events = require('./events');

var EVENT = _interopRequireWildcard(_events);

var _options = require('./options');

var OPTION = _interopRequireWildcard(_options);

class Middleware {
	constructor() {}
}

exports['default'] = Middleware;

class chatRecordLastMessages extends Middleware {
	static event() {
		return EVENT.NEW_MESSAGE;
	}

	constructor(client) {
		super();

		this.client = client;
		this.count = this.client._options[OPTION.CHAT_RECORD_LAST_MESSAGES_COUNT] || 10;

		(0, _deepExtend2['default'])(client._options, {
			chat: {
				schema: {
					properties: {
						countMessages: {
							"type": "number",
							'default': "Number"
						}
					}
				}
			}
		});
	}

	exec(options, next) {
		if (!options.chat.lastMessages) {
			options.chat.set('lastMessages', []);
		}

		if (options.chat.lastMessages.length > this.count) {
			options.chat.$pull('lastMessages.0');
		}

		options.chat.$push('lastMessages', options.message.toJSON());

		next();
	}
}

exports.chatRecordLastMessages = chatRecordLastMessages;

class chatRecordCountMessages extends Middleware {
	static event() {
		return EVENT.NEW_MESSAGE;
	}

	constructor(client) {
		super();
	}

	exec(options, next) {
		if (typeof options.chat.countMessages === 'undefined' || options.chat.countMessages === null) {
			options.chat.set('countMessages', 0);
		}

		options.chat.countMessages++;

		next();
	}
}

exports.chatRecordCountMessages = chatRecordCountMessages;

class chatSinglePrivate extends Middleware {
	static event() {
		return EVENT.NEW_CHAT;
	}

	constructor(client) {
		super();
		this.client = client;
	}

	exec(options, next) {
		if (options.chat.type === 'private') {
			this.client.model.Chat.findEqual(options.chat).then(function (equalChat) {
				equalChat && (options.chat = equalChat);
				equalChat && (options.chat.isEqual = true);
				next();
			})['catch'](next);
		} else {
			next();
		}
	}
}

exports.chatSinglePrivate = chatSinglePrivate;

class chatNewOnGroup extends Middleware {
	static event() {
		return EVENT.ADD_MEMBER;
	}

	constructor(client) {
		super();
		this.client = client;
	}

	exec(options, next) {
		var chat;

		if (options.chat.type === 'group' && options.chat.members.length === 2) {
			chat = new this.client.model.Chat();
			chat.set(options.chat.toJSON());

			options.chat = chat;
		}

		next();
	}
}

exports.chatNewOnGroup = chatNewOnGroup;
//# sourceMappingURL=middlewares.js.map