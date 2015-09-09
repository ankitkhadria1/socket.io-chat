'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _component = require('./component');

var _component2 = _interopRequireDefault(_component);

// TODO: clear old records by setTimeout

class JoinQueueComponent extends _component2['default'] {
	constructor(client) {
		super(client);

		this.queue = new Map();
	}

	get(userId) {
		var strId = String(userId);

		if (!this.queue.has(strId)) {
			this.queue.set(strId, []);
		}

		return this.queue.get(strId);
	}

	has(userId, chatId) {
		var queue = this.queue.get(userId);

		return queue.indexOf(String(chatId)) !== -1;
	}

	add(userId, chatId) {
		var queue = this.queue.get(userId);

		if (queue.indexOf(String(chatId)) === -1) {
			queue.push(String(chatId));
		}

		return this;
	}

	remove(userId, chatId) {
		var queue = this.queue.get(userId);
		var index = queue.indexOf(String(chatId));

		if (index !== -1) {
			queue.splice(index, 1);

			if (queue.length === 0) {
				this['delete'](userId);
			}
		}

		return this;
	}

	delete(userId) {
		this.queue['delete'](String(userId));

		return this;
	}

	clear() {
		this.queue.clear();
	}

	resolve(chatId, members) {
		var _this = this;

		var uniqueClients = [];
		var clients = this.client.namespace.to(String(chatId)).clients('room');
		var onlineClients = this.client.members.get(members);

		onlineClients.filter(function (onlineClient) {
			return clients.indexOf(clients) === -1;
		}).forEach(function (onlineClient) {
			onlineClient.join(String(chatId));
		});

		clients.forEach(function (client) {
			if (uniqueClients.indexOf(client.user) === -1) {
				uniqueClients.push(client.user);
			}
		});

		members.filter(function (member) {
			return uniqueClients.indexOf(member) === -1;
		}).forEach(function (offlineMember) {
			_this.add(offlineMember, String(chatId));
		});
	}
}

exports['default'] = JoinQueueComponent;
module.exports = exports['default'];
//# sourceMappingURL=joinQueue.js.map