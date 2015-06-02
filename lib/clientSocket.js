'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

(function () {
	'use strict';

	var ClientError = require('./error');

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

	var ClientSocket = (function () {
		function ClientSocket() {
			_classCallCheck(this, ClientSocket);
		}

		_createClass(ClientSocket, [{
			key: 'onAuthenticate',
			value: function onAuthenticate(client, socket) {
				var data = arguments[2] === undefined ? {} : arguments[2];

				client.emit(client.EVENTS.AUTHENTICATE, socket, data, function (error) {
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
		}, {
			key: 'onCreate',
			value: function onCreate(client, socket) {
				var data = arguments[2] === undefined ? {} : arguments[2];

				client.create(data, socket.user).then(function (chat) {
					socket.emitResult(client.EVENTS.CREATE, { message: 'Chat created', data: chat.toJSON() });

					client.__rooms.addMembers(chat.get('_id'), client.__members.get(chat.get('members')));

					client.__members.get(chat.get('members')).forEach(function (socket) {
						socket.emitResult(client.EVENTS.ENTER, { data: chat.toJSON() });
					});
				})['catch'](function (error) {
					return socket.emit(client.EVENTS.CREATE, { error: { message: error.message } });
				});
			}
		}, {
			key: 'onLeave',
			value: function onLeave(client, socket) {
				var data = arguments[2] === undefined ? {} : arguments[2];

				var chat;

				client.model('chat').findById(data.chatId).then(function (result) {
					if (!(chat = result)) {
						throw new ClientError('Chat not found');
					}

					return client.leave(chat, socket.user);
				}).then(function (member) {
					client.__rooms.removeMember(chat.get('_id'), member);

					var receivers = chat.get('members').concat(member),
					    sockets = client.__members.get(receivers);

					if (chat.systemMessages && chat.systemMessages.leaveMember) {
						client.newSystemMessage(chat, { whoLeaved: member }).then(function (message) {
							sockets.forEach(function (socket) {
								socket.emitResult(client.EVENTS.NEWMESSAGE, {
									message: 'New system message',
									data: message.toJSON()
								});
							});
						});
					}

					sockets.forEach(function (socket) {
						socket.emitResult(client.EVENTS.LEAVE, { message: 'The member leaved', data: member });
					});
				})['catch'](function (error) {
					socket.emitError(client.EVENTS.LEAVE, { message: catchErrorMessage(error) });
				});
			}
		}, {
			key: 'onAddMember',
			value: function onAddMember(client, socket) {
				var data = arguments[2] === undefined ? {} : arguments[2];

				var chat, countBefore, countAfter;

				client.model('chat').findById(data.chatId).then(function (result) {
					if (!(chat = result)) {
						throw new ClientError('Chat not found');
					}

					countBefore = chat.get('members').length;

					return client.addMember(chat, data.member, socket.user);
				}).then(function (member) {
					countAfter = chat.get('members').length;

					if (countBefore === countAfter) {
						return;
					}

					var receivers = chat.get('members'),
					    sockets = client.__members.get(receivers);

					client.__rooms.addMembers(chat.get('_id'), member);

					if (chat.systemMessages && chat.systemMessages.addMember) {
						client.newSystemMessage(chat, { whoAdded: socket.user, whomAdded: member }).then(function (message) {
							sockets.forEach(function (socket) {
								socket.emitResult(client.EVENTS.NEWMESSAGE, {
									message: 'New system message',
									data: message.toJSON()
								});
							});
						});
					}

					sockets.forEach(function (socket) {
						socket.emitResult(client.EVENTS.ADDMEMBER, { message: 'The member added', data: member });
					});
				})['catch'](function (error) {
					socket.emitError(client.EVENTS.ADDMEMBER, { message: catchErrorMessage(error) });
				});
			}
		}, {
			key: 'onRemoveMember',
			value: function onRemoveMember(client, socket) {
				var data = arguments[2] === undefined ? {} : arguments[2];

				var chat, countBefore, countAfter;

				client.model('chat').findById(data.chatId).then(function (result) {
					if (!(chat = result)) {
						throw new ClientError('Chat not found');
					}

					countBefore = chat.get('members').length;

					return client.removeMember(chat, data.member, socket.user);
				}).then(function (member) {
					countAfter = chat.get('members').length;

					if (countBefore === countAfter) {
						return;
					}

					client.__rooms.removeMember(chat.get('_id'), member);

					var receivers = chat.get('members').concat(member),
					    sockets = client.__members.get(receivers);

					if (chat.systemMessages && chat.systemMessages.removeMember) {
						client.newSystemMessage(chat, { whoRemove: socket.user, whomRemove: member }).then(function (message) {
							sockets.forEach(function (socket) {
								socket.emitResult(client.EVENTS.NEWMESSAGE, {
									message: 'New system message',
									data: message.toJSON()
								});
							});
						});
					}

					sockets.forEach(function (socket) {
						socket.emitResult(client.EVENTS.REMOVEMEMBER, { message: 'The member removed', data: member });
					});
				})['catch'](function (error) {
					socket.emitError(client.EVENTS.REMOVEMEMBER, { message: catchErrorMessage(error) });
				});
			}
		}, {
			key: 'onNewMessage',
			value: function onNewMessage(client, socket) {
				var data = arguments[2] === undefined ? {} : arguments[2];

				var chat;

				client.model('chat').findById(data.chatId).then(function (result) {
					if (!(chat = result)) {
						throw new ClientError('Chat not found');
					}

					return client.newMessage(chat, data, socket.user);
				}).then(function (message) {
					client.__members.get(chat.get('members')).forEach(function (socket) {
						socket.emitResult(client.EVENTS.NEWMESSAGE, {
							message: 'New message',
							data: message.toJSON()
						});
					});
				})['catch'](function (error) {
					if (catchErrorMessage(error) === 'Unknown error') {
						console.log(error.stack);
					}

					socket.emitError(client.EVENTS.NEWMESSAGE, { message: catchErrorMessage(error) });
				});
			}
		}, {
			key: 'onLoadLast',
			value: function onLoadLast(client, socket) {
				var data = arguments[2] === undefined ? {} : arguments[2];

				client.findLastMessages(data.chatId, socket.user, data.count).then(function (messages) {
					socket.emit(client.EVENTS.FINDMESSAGESLAST, {
						result: {
							chatId: data.chatId,
							data: messages
						}
					});
				})['catch'](function (error) {
					socket.emit('error', socketError(client.EVENTS.FINDMESSAGESLAST, error));
				});
			}
		}, {
			key: 'onLoadFrom',
			value: function onLoadFrom(client, socket) {
				var data = arguments[2] === undefined ? {} : arguments[2];

				client.findFromMessages(data.chatId, data.messageId, socket.user, data.count).then(function (messages) {
					socket.emit(client.EVENTS.FINDMESSAGESFROM, {
						result: {
							chatId: data.chatId,
							data: messages
						}
					});
				})['catch'](function (error) {
					socket.emit('error', socketError(client.EVENTS.FINDMESSAGESFROM, error));
				});
			}
		}, {
			key: 'onLoadAt',
			value: function onLoadAt(client, socket) {
				var data = arguments[2] === undefined ? {} : arguments[2];

				client.findAtMessages(data.chatId, data.messageId, socket.user, data.count).then(function (messages) {
					socket.emitResult(client.EVENTS.FINDMESSAGESAT, { chatId: data.chatId, data: messages });
				})['catch'](function (error) {
					socket.emit('error', socketError(client.EVENTS.FINDMESSAGESAT, error));
				});
			}
		}, {
			key: 'onFindChat',
			value: function onFindChat(client, socket) {
				var data = arguments[2] === undefined ? {} : arguments[2];

				client.findChatById(socket.user, data.chatId).then(function (chat) {
					socket.emitResult(client.EVENTS.FINDCHAT, { data: chat });
				})['catch'](function (error) {
					socket.emit('error', socketError(client.EVENTS.FINDCHAT, error));
				});
			}
		}, {
			key: 'onFindChats',
			value: function onFindChats(client, socket) {
				var data = arguments[2] === undefined ? {} : arguments[2];

				client.findChats(socket.user, data.count).then(function (chats) {
					socket.emitResult(client.EVENTS.FINDCHATS, { data: chats });
				})['catch'](function (error) {
					socket.emit('error', socketError(client.EVENTS.FINDCHATS, error));
				});
			}
		}, {
			key: 'onChangeTitle',
			value: function onChangeTitle(client, socket) {
				var data = arguments[2] === undefined ? {} : arguments[2];

				var oldTitle;

				client.model('chat').findById(data.chatId).then(function (chat) {
					if (!chat) {
						throw new ClientError('Chat not found');
					}

					oldTitle = String(chat.get('title'));

					return client.changeTitle(chat, data.title, socket.user);
				}).then(function (chat) {
					var receivers = chat.get('members'),
					    sockets = client.__members.get(receivers);

					if (chat.systemMessages && chat.systemMessages.changeTitle) {
						client.newSystemMessage(chat, {
							changed: socket.user, oldTitle: oldTitle, newTitle: chat.get('title')
						}).then(function (message) {
							sockets.forEach(function (socket) {
								socket.emitResult(client.EVENTS.NEWMESSAGE, {
									message: 'New system message',
									data: message.toJSON()
								});
							});
						});
					}

					sockets.forEach(function (socket) {
						socket.emitResult(client.EVENTS.CHANGETITLE, {
							message: 'Title changed',
							data: message.toJSON()
						});
					});
				})['catch'](function (error) {
					socket.emitError(client.EVENTS.CHANGETITLE, { message: catchErrorMessage(error) });
				});
			}
		}]);

		return ClientSocket;
	})();

	module.exports = new ClientSocket();
})();
//# sourceMappingURL=clientSocket.js.map