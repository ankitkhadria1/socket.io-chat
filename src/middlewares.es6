export function chatRecordCountMessages (options, next) {
	if (typeof options.chat.countMessages === 'undefined' || options.chat.countMessages === null) {
		options.chat.set('countMessages', 0);
	}

	options.chat.countMessages++;

	next();
}

export function chatRecordLastMessages (options, next) {
	let count = 10;

	if (this._options[chatRecordLastMessagesCount]) {
		count = parseInt(this._options[chatRecordLastMessagesCount], 10) || 10;
	}

	if (!options.chat.lastMessages) {
		options.chat.set('lastMessages', []);
	}

	if (options.chat.lastMessages.length > count) {
		options.chat.$pull('lastMessages.0')
	}

	options.chat.$push('lastMessages', options.message.toJSON());
}