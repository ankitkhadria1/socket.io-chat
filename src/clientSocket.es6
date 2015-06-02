(function () {
	"use strict";

	var ClientError  = require('./error');

	function catchErrorMessage(error) {
		switch (error.type) {
			case 'validation':
			case 'client':
				return error.message;
			default:
				return 'Unknown error';
		}
	}

	/**
	 * @function socketError
	 * @param {String} event
	 * @param {Error|String} error
	 * @returns {Error}
	 */
	function socketError(event, error) {
		var sError = new Error();

		sError.event = String(event);

		switch (Object.prototype.toString.call(error)) {
			case '[object Error]':
				sError.message = error.message;
				break;
			case '[object String]':
				sError.message = error;
				break;
			default:
				sError.message = String(error);
		}

		return sError;
	}

	class ClientSocket {
		onAuthenticate(client, socket, data = {}) {
			client.emit(client.EVENTS.AUTHENTICATE, socket, data, (error) => {
				if (error) {
					return socket.emitError('login', { message: error.message || error });
				}

				if (!client.authorize(socket)) {
					return;
				}

				client.__members.add(socket.user, socket);

				socket.emitResult('login', { user: socket.user, data: [] });
			});
		}

		onCreate(client, socket, data = {}) {
			client.create(data, socket.user)
				.then((chat) => {
					socket.emitResult(client.EVENTS.CREATE, { message: 'Chat created', data: chat.toJSON() });

					client.__rooms.addMembers(
						chat.get('_id'),
						client.__members.get(chat.get('members'))
					);

					client.__members.get(chat.get('members'))
						.forEach((socket) => {
							socket.emitResult(client.EVENTS.ENTER, { data: chat.toJSON() });
						});

				})
				.catch((error) => {
					return socket.emit(client.EVENTS.CREATE, { error: { message: error.message } });
				});
		}

		onLeave(client, socket, data = {}) {
			var chat;

			client.model('chat').findById(data.chatId)
				.then((result) => {
					if (!(chat = result)) {
						throw new ClientError('Chat not found');
					}

					return client.leave(chat, socket.user)
				})
				.then((member) => {
					client.__rooms.removeMember(chat.get('_id'), member);

					let receivers = chat.get('members').concat(member),
						sockets   = client.__members.get(receivers);

					if (chat.systemMessages && chat.systemMessages.leaveMember) {
						client.newSystemMessage(chat, { whoLeaved: member })
							.then((message) => {
								sockets.forEach((socket) => {
									socket.emitResult(client.EVENTS.NEWMESSAGE, {
										message: 'New system message',
										data:    message.toJSON()
									});
								});
							})
					}

					sockets.forEach((socket) => {
						socket.emitResult(client.EVENTS.LEAVE, { message: 'The member leaved', data: member });
					});
				})
				.catch((error) => {
					socket.emitError(client.EVENTS.LEAVE, { message: catchErrorMessage(error) });
				});
		}

		onAddMember(client, socket, data = {}) {
			var chat, countBefore, countAfter;

			client.model('chat').findById(data.chatId)
				.then((result) => {
					if (!(chat = result)) {
						throw new ClientError('Chat not found');
					}

					countBefore = chat.get('members').length;

					return client.addMember(chat, data.member, socket.user)
				})
				.then((member) => {
					countAfter = chat.get('members').length;

					if (countBefore === countAfter) {
						return;
					}


					let receivers = chat.get('members'),
						sockets   = client.__members.get(receivers);

					client.__rooms.addMembers(chat.get('_id'), member);

					if (chat.systemMessages && chat.systemMessages.addMember) {
						client.newSystemMessage(chat, { whoAdded: socket.user, whomAdded: member })
							.then((message) => {
								sockets.forEach((socket) => {
									socket.emitResult(client.EVENTS.NEWMESSAGE, {
										message: 'New system message',
										data:    message.toJSON()
									});
								});
							})
					}

					sockets.forEach((socket) => {
						socket.emitResult(client.EVENTS.ADDMEMBER, { message: 'The member added', data: member });
					});
				})
				.catch((error) => {
					socket.emitError(client.EVENTS.ADDMEMBER, { message: catchErrorMessage(error) });
				});
		}

		onRemoveMember(client, socket, data = {}) {
			var chat, countBefore, countAfter;

			client.model('chat').findById(data.chatId)
				.then((result) => {
					if (!(chat = result)) {
						throw new ClientError('Chat not found');
					}

					countBefore = chat.get('members').length;

					return client.removeMember(chat, data.member, socket.user)
				})
				.then((member) => {
					countAfter = chat.get('members').length;

					if (countBefore === countAfter) {
						return;
					}

					client.__rooms.removeMember(chat.get('_id'), member);

					let receivers = chat.get('members').concat(member),
						sockets   = client.__members.get(receivers);

					if (chat.systemMessages && chat.systemMessages.removeMember) {
						client.newSystemMessage(chat, { whoRemove: socket.user, whomRemove: member })
							.then((message) => {
								sockets.forEach((socket) => {
									socket.emitResult(client.EVENTS.NEWMESSAGE, {
										message: 'New system message',
										data:    message.toJSON()
									});
								});
							});
					}

					sockets.forEach((socket) => {
						socket.emitResult(client.EVENTS.REMOVEMEMBER, { message: 'The member removed', data: member });
					});
				})
				.catch((error) => {
					socket.emitError(client.EVENTS.REMOVEMEMBER, { message: catchErrorMessage(error) });
				});
		}

		onNewMessage(client, socket, data = {}) {
			var chat;

			client.model('chat').findById(data.chatId)
				.then((result) => {
					if (!(chat = result)) {
						throw new ClientError('Chat not found');
					}

					return client.newMessage(chat, data, socket.user);
				})
				.then((message) => {
					client.__members.get(chat.get('members'))
						.forEach((socket) => {
							socket.emitResult(client.EVENTS.NEWMESSAGE, {
								message: 'New message',
								data:    message.toJSON()
							});
						});
				})
				.catch((error) => {
					if (catchErrorMessage(error) === 'Unknown error') {
						console.log(error.stack);
					}

					socket.emitError(client.EVENTS.NEWMESSAGE, { message: catchErrorMessage(error) });
				});
		}

		onLoadLast(client, socket, data = {}) {
			client.findLastMessages(data.chatId, socket.user, data.count)
				.then((messages) => {
					socket.emit(client.EVENTS.FINDMESSAGESLAST, {
						result: {
							chatId: data.chatId,
							data:   messages
						}
					})
				})
				.catch((error) => {
					socket.emit('error', socketError(client.EVENTS.FINDMESSAGESLAST, error));
				});
		}

		onLoadFrom(client, socket, data = {}) {
			client.findFromMessages(data.chatId, data.messageId, socket.user, data.count)
				.then((messages) => {
					socket.emit(client.EVENTS.FINDMESSAGESFROM, {
						result: {
							chatId: data.chatId,
							data:   messages
						}
					});
				})
				.catch((error) => {
					socket.emit('error', socketError(client.EVENTS.FINDMESSAGESFROM, error));
				});
		}

		onLoadAt(client, socket, data = {}) {
			client.findAtMessages(data.chatId, data.messageId, socket.user, data.count)
				.then((messages) => {
					socket.emitResult(client.EVENTS.FINDMESSAGESAT, { chatId: data.chatId, data: messages });
				})
				.catch((error) => {
					socket.emit('error', socketError(client.EVENTS.FINDMESSAGESAT, error));
				});
		}

		onFindChat(client, socket, data = {}) {
			client.findChatById(socket.user, data.chatId)
				.then((chat) => {
					socket.emitResult(client.EVENTS.FINDCHAT, { data: chat });
				})
				.catch((error) => {
					socket.emit('error', socketError(client.EVENTS.FINDCHAT, error));
				});
		}

		onFindChats(client, socket, data = {}) {
			client.findChats(socket.user, data.count)
				.then((chats) => {
					socket.emitResult(client.EVENTS.FINDCHATS, { data: chats });
				})
				.catch((error) => {
					socket.emit('error', socketError(client.EVENTS.FINDCHATS, error));
				});
		}

		onChangeTitle(client, socket, data = {}) {
			var oldTitle;

			client.model('chat').findById(data.chatId)
				.then((chat) => {
					if (!chat) {
						throw new ClientError('Chat not found');
					}

					oldTitle = String(chat.get('title'));

					return client.changeTitle(chat, data.title, socket.user)
				})
				.then((chat) => {
					let receivers = chat.get('members'),
						sockets   = client.__members.get(receivers);

					if (chat.systemMessages && chat.systemMessages.changeTitle) {
						client.newSystemMessage(chat, {
							changed: socket.user, oldTitle: oldTitle, newTitle: chat.get('title')
						}).then((message) => {
							sockets.forEach((socket) => {
								socket.emitResult(client.EVENTS.NEWMESSAGE, {
									message: 'New system message',
									data:    message.toJSON()
								});
							});
						})
					}

					sockets.forEach((socket) => {
						socket.emitResult(client.EVENTS.CHANGETITLE, {
							message: 'Title changed',
							data:    message.toJSON()
						});
					});
				})
				.catch((error) => {
					socket.emitError(client.EVENTS.CHANGETITLE, { message: catchErrorMessage(error) });
				});
		}
	}

	module.exports = new ClientSocket;
}());