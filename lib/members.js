"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});
class Member extends Array {
	constructor() {
		var length = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];

		super(length);
	}
}

class Members {
	constructor() {
		this.__members = new Map();
	}

	add(id, socket) {
		if (!this.__members.has(String(id))) {
			this.__members.set(String(id), new Member());
		}

		this.__members.get(String(id)).push(socket);

		return this;
	}

	remove(id, socket) {
		var member, socketIndex;

		if (socket) {
			member = this.__members.get(String(id));

			if (member) {
				socketIndex = member.indexOf(socket);
				member.splice(socketIndex, 1);

				if (member.length === 0) {
					this.__members["delete"](String(id));
				}
			}
		} else {
			this.__members["delete"](String(id));
		}

		return this;
	}

	get(id) {
		var _this = this;

		var res, member;

		if (id instanceof Array) {
			res = [];

			id.forEach(function (id) {
				member = _this.__members.get(String(id));
				member && member.forEach(function (socket) {
					socket && res.push(socket);
				});
			});

			return res;
		} else {
			return this.__members.get(String(id));
		}
	}

	isOnline(id) {
		return this.__members.has(String(id)) && this.__members.get(String(id)).length > 0;
	}
}

exports["default"] = Members;
module.exports = exports["default"];
//# sourceMappingURL=members.js.map