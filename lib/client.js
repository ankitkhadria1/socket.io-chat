'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _debug = require('./debug');

var _baseClient = require("./baseClient");

var _baseClient2 = _interopRequireDefault(_baseClient);

var _middlewares = require('./middlewares');

var middleWares = _interopRequireWildcard(_middlewares);

var _events = require('./events');

var EVENT = _interopRequireWildcard(_events);

var _options = require('./options');

var OPTION = _interopRequireWildcard(_options);

class Client extends _baseClient2['default'] {
	constructor(server, options) {
		super(server, options);

		this.onAuthenticate.priority = 100;
		this.socketAuthorized.priority = 0;

		this.addEvent(EVENT.AUTHENTICATE, this.onAuthenticate).addEvent(EVENT.NEW_CHAT, this.socketAuthorized, this.onNewChat).addEvent(EVENT.NEW_MESSAGE, this.socketAuthorized, this.newMessage);

		//.addEvent(EVENT.START_WRITE, this.socketAuthorized, this.onStartWrite)
		//.addEvent(EVENT.END_WRITE, this.socketAuthorized, this.onEndWrite)
		//.addEvent(EVENT.FOCUS, this.socketAuthorized, this.onFocus)
		//.addEvent(EVENT.BLUR, this.socketAuthorized, this.onBlur)
		if (this._options[OPTION.CHAT_RECORD_COUNT_MESSAGES]) {
			this.applyMiddleware(middleWares.chatRecordCountMessages);
		}

		if (this._options[OPTION.CHAT_RECORD_LAST_MESSAGES]) {
			this.applyMiddleware(middleWares.chatRecordLastMessages);
		}

		if (this._options[OPTION.CHAT_SINGLE_PRIVATE]) {
			this.applyMiddleware(middleWares.chatSinglePrivate);
		}

		if (this._options[OPTION.CHAT_NEW_ON_GROUP]) {
			this.applyMiddleware(middleWares.chatNewOnGroup);
		}

		if (!options.delayInitialize) {
			this.initialize();

			this.model.Chat.find({ name: 1 }).exec({}).then(function () {
				//console.log('then', arguments);
			})['catch'](function (err) {
				console.log('catch', err.stack);
			});
		}
	}

	onAuthenticate(socket, data, next) {
		socket.emit(this.eventName(EVENT.AUTHENTICATE), { result: { user: data.user } });
	}

	onNewChat(socket, options, next) {
		this.newChat(options, socket.user);
	}

	newChat() {
		var _this = this;

		var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
		var user = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

		// TODO: first message

		return this.preMiddleware(EVENT.NEW_CHAT, options).then(function (postOptions) {
			var chat = new _this.model.Chat(options.data);

			chat.setCreator(user);

			return chat.save();
		}).then(function () {
			return this.postMiddleware(EVENT.NEW_CHAT, options);
		})['catch'](function (error) {
			(0, _debug.debug)(error.stack);
		});
	}

	newMessage() {
		var _this2 = this;

		var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

		return this.preMiddleware(EVENT.NEW_CHAT, options).then(function (post) {
			_this2.post(EVENT.NEW_CHAT, post);
		})['catch'](function (error) {
			(0, _debug.debug)(error.stack);
		});
	}

	systemNotification() {}

	authorize(socket) {}
}

exports['default'] = Client;
module.exports = exports['default'];
//# sourceMappingURL=client.js.map