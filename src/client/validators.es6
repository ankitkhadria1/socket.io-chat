'use strict';

export function chatMessagesInc (data) {
	data.chat.fill('lastMessageAt', new Date(), true);
	data.chat.fill('countMessages', data.chat.get('countMessages') + 1, true);
	data.chat.save();
}

export function singlePrivateChat (options, next) {
	if (options.chat.type === 'private') {
		this.model('chat').findEqual(options.chat)
			.then(function (equalChat) {
				equalChat && (options.chat = equalChat);
				equalChat && (options.chat.isEqual = true);
				console.log('next');
				next();
			})
			.catch(next);
	} else {
		next();
	}
}

export function newChatOnGroup (options, next) {
	var chat;

	chat = new (this.model('chat'))();
	chat.set(options.chat.toJSON());

	options.chat = chat;

	next();
}