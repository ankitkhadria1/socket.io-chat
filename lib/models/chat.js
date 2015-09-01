'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x2, _x3, _x4) { var _again = true; _function: while (_again) { var object = _x2, property = _x3, receiver = _x4; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x2 = parent; _x3 = property; _x4 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _modelIndex = require('../model/index');

var _modelIndex2 = _interopRequireDefault(_modelIndex);

var _schema2 = require('../schema');

var _schema3 = _interopRequireDefault(_schema2);

exports['default'] = function (client) {
	var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

	var _schema = _schema3['default'].load('chat');
	var _db = client._db;

	if (!options.collectionName) options.collectionName = 'chat';

	var Chat = (function (_Model) {
		_inherits(Chat, _Model);

		function Chat() {
			_classCallCheck(this, Chat);

			_get(Object.getPrototypeOf(Chat.prototype), 'constructor', this).call(this);
			_get(Object.getPrototypeOf(Chat.prototype), 'initialize', this).call(this, options);
		}

		_createClass(Chat, null, [{
			key: 'collection',
			value: function collection() {
				return options.collectionName;
			}
		}, {
			key: 'db',
			value: function db() {
				return _db;
			}
		}, {
			key: 'schema',
			value: function schema() {
				return _schema;
			}
		}]);

		return Chat;
	})(_modelIndex2['default']);

	Chat.ensureIndex();

	return Chat;
};

;
module.exports = exports['default'];
//# sourceMappingURL=chat.js.map