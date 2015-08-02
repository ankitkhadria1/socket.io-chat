
class ClientResponse {
	constructor (client) {
		this.client = client;

		this.emitResult.transform = function (data, next) {
			next(data);
		};

		this.emitError.transform = function (data, next) {
			next(data);
		};

		this.emitError.transformOn = (event, cb) => {
			if (!this.emitError.__transforms) {
				this.emitError.__transforms = {}
			}

			if (!this.emitError.__transforms[event]) {
				this.emitError.__transforms[event] = [];
			}

			this.emitError.__transforms[event].push(cb);

			return this.emitResult;
		};

		this.emitResult.transformOn = (event, cb) => {
			if (!this.emitResult.__transforms) {
				this.emitResult.__transforms = {}
			}

			if (!this.emitResult.__transforms[event]) {
				this.emitResult.__transforms[event] = [];
			}

			this.emitResult.__transforms[event].push(cb);

			return this.emitResult;
		};
	}

	emitError(socket, event, data) {
		var index      = 0,
			transforms = this.emitError.__transforms || {},
			transformCb;

		function nextTransform(data) {
			transformCb = transforms[event] ? transforms[event][index] : null;

			if (transformCb) {
				transformCb(data, function (data) {
					index++;

					if (transforms.length === index) {
						socket.emit(event, { error: data });
					} else {
						nextTransform(data);
					}
				});
			} else {
				socket.emit(event, { error: data });
			}
		}

		this.emitError.transform(data, (data) => {
			nextTransform(data);
		});
	}

	emitResult(socket, event, data) {
		var index      = 0,
			transforms = this.emitResult.__transforms || {},
			transformCb;

		function nextTransform(data) {
			transformCb = transforms[event] ? transforms[event][index] : null;

			if (transformCb) {
				transformCb(data, function (data) {
					index++;

					if (transforms.length === index) {
						socket.emit(event, { result: data });
					} else {
						nextTransform(data);
					}
				});
			} else {
				socket.emit(event, { result: data });
			}
		}

		this.emitResult.transform(data, (data) => {
			nextTransform(data);
		});
	}

	// authenticate () {
	// 	client.__members.add(socket.user, socket);

	// 	this.emitResult(socket, 'login', { user: socket.user });
	// 	this.emitResult(socket, 'authenticate', { user: socket.user });
	// }

	create(chat) {
		let client = this;
		
		this.emitResult(socket, client.EVENTS.CREATE, { message: 'Chat created', data: chat.toJSON() });

		client.__rooms.addMembers(
			chat.get('_id'),
			client.__members.get(chat.get('members'))
		);

		client.__members.get(chat.get('members'))
			.forEach((socket) => {
				this.emitResult(socket, client.EVENTS.JOIN, {
					message: 'Join to chat',
					data:    chat.toJSON()
				});
			});
	}

	leave() {
		let client = this;

		client.__rooms.removeMember(chat.get('_id'), member);

		let receivers = chat.get('members').concat(member),
			sockets   = client.__members.get(receivers);

		if (chat.systemMessages && chat.systemMessages.leaveMember) {
			client.newSystemMessage(chat, { whoLeaved: member })
				.then((message) => {
					sockets.forEach((socket) => {
						this.emitResult(socket, client.EVENTS.NEWSYSTEMMESSAGE, {
							message: 'New system message', data: message.toJSON(), chatId: chat.get('_id')
						});
					});
				})
		}

		sockets.forEach((socket) => {
			this.emitResult(socket, client.EVENTS.LEAVE, {
				message: 'The member leaved',
				data:    member,
				chatId:  chat.get('_id')
			});
		});
	}
	addMember() {}
	findMessagesLast() {}
	findMessagesFrom() {}
	findMessagesAt() {}
	findChat() {}
	findChats() {}
	changeTitle() {}

	removeMember (member, chat) {
		let client = this;

		client.__rooms.removeMember(chat.get('_id'), member);

		let receivers = chat.get('members').concat(member),
			sockets   = client.__members.get(receivers);

		if (chat.systemMessages && chat.systemMessages.removeMember) {
			client.newSystemMessage(chat, { whoRemove: socket.user, whomRemove: member })
				.then((message) => {
					sockets.forEach((socket) => {
						this.emitResult(socket, client.EVENTS.NEWMESSAGE, {
							message: 'New system message',
							data:    message.toJSON(),
							chatId:  chat.get('_id')
						});
					});
				});
		}

		sockets.forEach((socket) => {
			this.emitResult(socket, client.EVENTS.REMOVEMEMBER, {
				message: 'The member removed',
				data:    member,
				chatId:  chat.get('_id')
			});
		});
	}

	newMessage (message, chat) {
		let client = this;

		client.__members.get(chat.get('members'))
			.forEach((socket) => {
				this.emitResult(socket, client.EVENTS.NEWMESSAGE, {
					message: 'New message',
					data:    message.toJSON(),
					chatId:  chat.get('_id')
				});
			});
	}
}

export default new ClientResponse();