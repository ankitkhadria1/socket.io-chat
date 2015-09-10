import deepExtend  from 'deep-extend';
import * as EVENT  from './events';
import * as OPTION from './options';

class Middleware {
	constructor() {

	}
}

export default Middleware;

export class chatRecordLastMessages extends Middleware {
	static event (){
		return EVENT.NEW_MESSAGE;
	}

	constructor(client) {
		super();

		this.client = client;
		this.count = this.client._options[OPTION.CHAT_RECORD_LAST_MESSAGES_COUNT] || 10;

		deepExtend(client._options, {
			chat: {
				schema: {
					properties: {
						countMessages: {
							"type":    "number",
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
			options.chat.$pull('lastMessages.0')
		}

		options.chat.$push('lastMessages', options.message.toJSON());

		next();
	}
}

export class chatRecordCountMessages extends Middleware {
	static event (){
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
		options.chat.save().then(function () {
			debug('save count messages');
		});

		next();
	}
}

export class chatSinglePrivate extends Middleware {
	static event (){
		return EVENT.NEW_CHAT;
	}

	constructor(client) {
		super();
		this.client = client;
	}

	exec(options, next) {
		if (options.chat.type === 'private') {
			this.client.model.Chat.findEqual(options.chat)
				.then(function (equalChat) {
					equalChat && (options.chat = equalChat);
					equalChat && (options.chat.isEqual = true);
					next();
				})
				.catch(next);
		} else {
			next();
		}
	}
}

export class chatNewOnGroup extends Middleware {
	static event (){
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