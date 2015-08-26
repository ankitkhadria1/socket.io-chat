'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x4, _x5, _x6) { var _again = true; _function: while (_again) { var object = _x4, property = _x5, receiver = _x6; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x4 = parent; _x5 = property; _x6 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _baseClient = require("./baseClient");

var _baseClient2 = _interopRequireDefault(_baseClient);

var _middlewares = require('./middlewares');

var middleWares = _interopRequireWildcard(_middlewares);

var _events = require('./events');

var EVENT = _interopRequireWildcard(_events);

var _options = require('./options');

var OPTION = _interopRequireWildcard(_options);

var Client = (function (_BaseClient) {
	_inherits(Client, _BaseClient);

	function Client(server, options) {
		_classCallCheck(this, Client);

		_get(Object.getPrototypeOf(Client.prototype), 'constructor', this).call(this, server, options);

		this.addEvent(EVENT.AUTHENTICATE, this.onAuthenticate).addEvent(EVENT.NEW_CHAT, socketAuthorized, this.newChat).addEvent(EVENT.NEW_MESSAGE, this.socketAuthorized, this.newMessage).addEvent(EVENT.START_WRITE, this.socketAuthorized, this.onStartWrite).addEvent(EVENT.END_WRITE, this.socketAuthorized, this.onEndWrite).addEvent(EVENT.FOCUS, this.socketAuthorized, this.onFocus).addEvent(EVENT.BLUR, this.socketAuthorized, this.onBlur);

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
		}
	}

	_createClass(Client, [{
		key: 'onAuthenticate',
		value: function onAuthenticate() {
			var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

			return this.useMiddleware(EVENT.AUTHENTICATE, options).then(function () {});
		}
	}, {
		key: 'newChat',
		value: function newChat() {
			var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

			return this.useMiddleware(EVENT.NEW_CHAT, options).then(function (postOptions) {});
		}
	}, {
		key: 'newMessage',
		value: function newMessage() {
			var _this = this;

			var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

			return this.useMiddleware(EVENT.NEW_CHAT, options).then(function (postOptions) {
				_this.getChat(postOptions.chatId);
			});
		}
	}, {
		key: 'systemNotification',
		value: function systemNotification() {}
	}, {
		key: 'authorize',
		value: function authorize(callback) {}
	}]);

	return Client;
})(_baseClient2['default']);

exports['default'] = Client;
module.exports = exports['default'];
//# sourceMappingURL=client.js.map