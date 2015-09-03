'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _underscore = require('underscore');

var _underscore2 = _interopRequireDefault(_underscore);

var _flags = require('../flags');

var _flags2 = _interopRequireDefault(_flags);

var _error = require('../error');

var _error2 = _interopRequireDefault(_error);

class ClientAction {
	constructor() {
		this.__validators = {};

		this.addValidator(_flags2['default'].AUTHOR, function () {
			var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

			return options.chat.creatorId && options.chat.creatorId.equals(options.performer);
		}, 'Performer not author');

		this.addValidator(_flags2['default'].MEMBER, function () {
			var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

			return options.chat.hasMember(options.performer);
		}, 'Performer not member');

		this.addValidator(_flags2['default'].OTHER, function () {
			var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

			return true;
		});
	}

	addValidator(flag, validator) {
		var message = arguments.length <= 2 || arguments[2] === undefined ? '' : arguments[2];

		if (!flag) return false;
		if (!validator) return false;
		if (!(validator instanceof Function)) return false;
		if (this.__validators[flag]) return false;

		this.__validators[flag] = {
			cb: validator,
			message: message
		};

		return true;
	}

	removeValidator(flag) {
		return delete this.__validators[flag];
	}

	validate(flag) {
		var _this = this;

		var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

		var result = false,
		    error;

		return new Promise(function (resolve, reject) {
			var result = false,
			    message = 'Unknown flag';

			if (_this.__validators[flag] && _this.__validators[flag].cb instanceof Function) {
				result = _this.__validators[flag].cb(options);
				message = _this.__validators[flag].message;
			}

			return result ? resolve(options) : reject(new _error2['default'](message));
		});
	}
}

exports['default'] = ClientAction;
module.exports = exports['default'];
//# sourceMappingURL=action.js.map