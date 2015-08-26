'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _deepExtend = require('deep-extend');

var _deepExtend2 = _interopRequireDefault(_deepExtend);

var _events = require('./events');

var EVENT = _interopRequireWildcard(_events);

var _options = require('./options');

var OPTION = _interopRequireWildcard(_options);

var Middleware = function Middleware() {
	_classCallCheck(this, Middleware);
};

exports['default'] = Middleware;

var chatRecordLastMessages = (function (_Middleware) {
	_inherits(chatRecordLastMessages, _Middleware);

	_createClass(chatRecordLastMessages, null, [{
		key: 'event',
		value: function event() {
			return EVENT.NEW_MESSAGE;
		}
	}]);

	function chatRecordLastMessages(client) {
		_classCallCheck(this, chatRecordLastMessages);

		_get(Object.getPrototypeOf(chatRecordLastMessages.prototype), 'constructor', this).call(this);

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

	_createClass(chatRecordLastMessages, [{
		key: 'exec',
		value: function exec(options, next) {
			if (!options.chat.lastMessages) {
				options.chat.set('lastMessages', []);
			}

			if (options.chat.lastMessages.length > this.count) {
				options.chat.$pull('lastMessages.0');
			}

			options.chat.$push('lastMessages', options.message.toJSON());

			next();
		}
	}]);

	return chatRecordLastMessages;
})(Middleware);

exports.chatRecordLastMessages = chatRecordLastMessages;

var chatRecordCountMessages = (function (_Middleware2) {
	_inherits(chatRecordCountMessages, _Middleware2);

	_createClass(chatRecordCountMessages, null, [{
		key: 'event',
		value: function event() {
			return EVENT.NEW_MESSAGE;
		}
	}]);

	function chatRecordCountMessages(client) {
		_classCallCheck(this, chatRecordCountMessages);

		_get(Object.getPrototypeOf(chatRecordCountMessages.prototype), 'constructor', this).call(this);
	}

	_createClass(chatRecordCountMessages, [{
		key: 'exec',
		value: function exec(options, next) {
			if (typeof options.chat.countMessages === 'undefined' || options.chat.countMessages === null) {
				options.chat.set('countMessages', 0);
			}

			options.chat.countMessages++;

			next();
		}
	}]);

	return chatRecordCountMessages;
})(Middleware);

exports.chatRecordCountMessages = chatRecordCountMessages;

var chatSinglePrivate = (function (_Middleware3) {
	_inherits(chatSinglePrivate, _Middleware3);

	_createClass(chatSinglePrivate, null, [{
		key: 'event',
		value: function event() {
			return EVENT.NEW_CHAT;
		}
	}]);

	function chatSinglePrivate(client) {
		_classCallCheck(this, chatSinglePrivate);

		_get(Object.getPrototypeOf(chatSinglePrivate.prototype), 'constructor', this).call(this);
		this.client = client;
	}

	_createClass(chatSinglePrivate, [{
		key: 'exec',
		value: function exec(options, next) {
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
	}]);

	return chatSinglePrivate;
})(Middleware);

exports.chatSinglePrivate = chatSinglePrivate;

var chatNewOnGroup = (function (_Middleware4) {
	_inherits(chatNewOnGroup, _Middleware4);

	_createClass(chatNewOnGroup, null, [{
		key: 'event',
		value: function event() {
			return EVENT.ADD_MEMBER;
		}
	}]);

	function chatNewOnGroup(client) {
		_classCallCheck(this, chatNewOnGroup);

		_get(Object.getPrototypeOf(chatNewOnGroup.prototype), 'constructor', this).call(this);
		this.client = client;
	}

	_createClass(chatNewOnGroup, [{
		key: 'exec',
		value: function exec(options, next) {
			var chat;

			if (options.chat.type === 'group' && options.chat.members.length === 2) {
				chat = new this.client.model.Chat();
				chat.set(options.chat.toJSON());

				options.chat = chat;
			}

			next();
		}
	}]);

	return chatNewOnGroup;
})(Middleware);

exports.chatNewOnGroup = chatNewOnGroup;
//# sourceMappingURL=middlewares.js.map