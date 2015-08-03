'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var ClientResponse = (function () {
	function ClientResponse(client) {
		var _this = this;

		_classCallCheck(this, ClientResponse);

		this.client = client;

		this.emitResult.transform = function (data, next) {
			next(data);
		};

		this.emitError.transform = function (data, next) {
			next(data);
		};

		this.emitError.transformOn = function (event, cb) {
			if (!_this.emitError.__transforms) {
				_this.emitError.__transforms = {};
			}

			if (!_this.emitError.__transforms[event]) {
				_this.emitError.__transforms[event] = [];
			}

			_this.emitError.__transforms[event].push(cb);

			return _this.emitResult;
		};

		this.emitResult.transformOn = function (event, cb) {
			if (!_this.emitResult.__transforms) {
				_this.emitResult.__transforms = {};
			}

			if (!_this.emitResult.__transforms[event]) {
				_this.emitResult.__transforms[event] = [];
			}

			_this.emitResult.__transforms[event].push(cb);

			return _this.emitResult;
		};
	}

	_createClass(ClientResponse, [{
		key: 'emitError',
		value: function emitError(socket, event, data) {
			var index = 0,
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

			this.emitError.transform(data, function (data) {
				nextTransform(data);
			});
		}
	}, {
		key: 'emitResult',
		value: function emitResult(socket, event, data) {
			var index = 0,
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

			this.emitResult.transform(data, function (data) {
				nextTransform(data);
			});
		}
	}, {
		key: 'create',

		// authenticate () {
		// 	client.__members.add(socket.user, socket);

		// 	this.emitResult(socket, 'login', { user: socket.user });
		// 	this.emitResult(socket, 'authenticate', { user: socket.user });
		// }

		value: function create(chat) {
			var _this2 = this;

			var client = this;

			this.emitResult(socket, client.EVENTS.CREATE, { message: 'Chat created', data: chat.toJSON() });

			client.__rooms.addMembers(chat.get('_id'), client.__members.get(chat.get('members')));

			client.__members.get(chat.get('members')).forEach(function (socket) {
				_this2.emitResult(socket, client.EVENTS.JOIN, {
					message: 'Join to chat',
					data: chat.toJSON()
				});
			});
		}
	}, {
		key: 'leave',
		value: function leave() {
			var _this3 = this;

			var client = this;

			client.__rooms.removeMember(chat.get('_id'), member);

			var receivers = chat.get('members').concat(member),
			    sockets = client.__members.get(receivers);

			if (chat.systemMessages && chat.systemMessages.leaveMember) {
				client.newSystemMessage(chat, { whoLeaved: member }).then(function (message) {
					sockets.forEach(function (socket) {
						_this3.emitResult(socket, client.EVENTS.NEWSYSTEMMESSAGE, {
							message: 'New system message', data: message.toJSON(), chatId: chat.get('_id')
						});
					});
				});
			}

			sockets.forEach(function (socket) {
				_this3.emitResult(socket, client.EVENTS.LEAVE, {
					message: 'The member leaved',
					data: member,
					chatId: chat.get('_id')
				});
			});
		}
	}, {
		key: 'addMember',
		value: function addMember() {}
	}, {
		key: 'findMessagesLast',
		value: function findMessagesLast() {}
	}, {
		key: 'findMessagesFrom',
		value: function findMessagesFrom() {}
	}, {
		key: 'findMessagesAt',
		value: function findMessagesAt() {}
	}, {
		key: 'findChat',
		value: function findChat() {}
	}, {
		key: 'findChats',
		value: function findChats() {}
	}, {
		key: 'changeTitle',
		value: function changeTitle() {}
	}, {
		key: 'removeMember',
		value: function removeMember(member, chat) {
			var _this4 = this;

			var client = this;

			client.__rooms.removeMember(chat.get('_id'), member);

			var receivers = chat.get('members').concat(member),
			    sockets = client.__members.get(receivers);

			if (chat.systemMessages && chat.systemMessages.removeMember) {
				client.newSystemMessage(chat, { whoRemove: socket.user, whomRemove: member }).then(function (message) {
					sockets.forEach(function (socket) {
						_this4.emitResult(socket, client.EVENTS.NEWMESSAGE, {
							message: 'New system message',
							data: message.toJSON(),
							chatId: chat.get('_id')
						});
					});
				});
			}

			sockets.forEach(function (socket) {
				_this4.emitResult(socket, client.EVENTS.REMOVEMEMBER, {
					message: 'The member removed',
					data: member,
					chatId: chat.get('_id')
				});
			});
		}
	}, {
		key: 'newMessage',
		value: function newMessage(message, chat) {
			var _this5 = this;

			var client = this;

			client.__members.get(chat.get('members')).forEach(function (socket) {
				_this5.emitResult(socket, client.EVENTS.NEWMESSAGE, {
					message: 'New message',
					data: message.toJSON(),
					chatId: chat.get('_id')
				});
			});
		}
	}]);

	return ClientResponse;
})();

exports['default'] = new ClientResponse();
module.exports = exports['default'];
//# sourceMappingURL=clientResponse.js.map