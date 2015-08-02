(function () {
	"use strict";

	var _ = require('underscore');
	var FLAGS = require('./flags');
	var ClientError = require('./error');

	class ClientAction {
		constructor () {
			this.__validators = {};

			this.addValidator(FLAGS.AUTHOR, function (options = {}) {
				return options.chat.creatorId && options.chat.creatorId.equals(options.performer);
			}, 'Performer not author');

			this.addValidator(FLAGS.MEMBER, function (options = {}) {
				return options.chat.hasMember(options.performer);
			}, 'Performer not member');

			this.addValidator(FLAGS.OTHER, function (options = {}) {
				return true;
			});
		}

		addValidator(flag, validator, message = '') {
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

		validate (flag, options = {}) {
			var result = false, error;

			return new Promise((resolve, reject) => {
				var result = false, message = 'Unknown flag';

				if (this.__validators[flag] && this.__validators[flag].cb instanceof Function) {
					result = this.__validators[flag].cb(options);
					message = this.__validators[flag].message;
				}

				return result ? resolve(options) : reject(new ClientError(message));
			});
		}
	}

	module.exports = ClientAction;
}());