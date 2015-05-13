(function () {
	'use strict';

	class Member extends Array {
		constructor(...args) {
			super(...args);
		}
	}

	class Members {
		constructor() {
			this.__members = new Map();
		}

		add(id, socket) {
			if (!this.__members.has(id)) {
				this.__members.set(id, new Member());
			}

			this.__members.get(id).push(socket);

			return this;
		}

		remove(id, socket) {
			var member, socketIndex;

			if (socket) {
				member      = this.__members.get(id);
				socketIndex = member.indexOf(socket);
				member.splice(socketIndex, 1);

				if (member.length === 0) {
					this.__members.delete(id);
				}
			} else {
				this.__members.delete(id);
			}

			return this;
		}

		get(id) {
			var res, member;

			if (id instanceof Array) {
				res = [];

				id.forEach((id) => {
					member = this.__members.get(id);
					member && member.forEach(function (socket) {
						socket && res.push(socket);
					});
				});

				return res;
			} else {
				return this.__members.get(id);
			}
		}
	}

	module.exports = Members;
}());