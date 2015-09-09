import Component from './component';

// TODO: clear old records by setTimeout

class JoinQueueComponent extends Component {
	constructor(client) {
		super(client);

		this.queue = new Map();
	}

	get(userId) {
		let strId = String(userId);

		if (!this.queue.has(strId)) {
			this.queue.set(strId, []);
		}

		return this.queue.get(strId);
	}

	has(userId, chatId) {
		let queue = this.queue.get(userId);

		return queue.indexOf(String(chatId)) !== -1;
	}

	add(userId, chatId) {
		let queue = this.queue.get(userId);

		if (queue.indexOf(String(chatId)) === -1) {
			queue.push(String(chatId));
		}

		return this;
	}

	remove(userId, chatId) {
		let queue = this.queue.get(userId);
		let index = queue.indexOf(String(chatId));

		if (index !== -1) {
			queue.splice(index, 1);

			if (queue.length === 0) {
				this.delete(userId);
			}
		}

		return this;
	}

	delete(userId) {
		this.queue.delete(String(userId));

		return this;
	}

	clear() {
		this.queue.clear();
	}

	resolve(chatId, members) {
		let uniqueClients  = [];
		let clients        = this.client.namespace.to(String(chatId)).clients('room');
		let onlineClients  = this.client.members.get(members);

		onlineClients
			.filter(function (onlineClient) {
				return clients.indexOf(clients) === -1
			})
			.forEach(function (onlineClient) {
				onlineClient.join(String(chatId));
			});

		clients.forEach(function (client) {
			if (uniqueClients.indexOf(client.user) === -1) {
				uniqueClients.push(client.user);
			}
		});

		members
			.filter(function (member) {
				return uniqueClients.indexOf(member) === -1;
			})
			.forEach((offlineMember) => {
				this.add(offlineMember, String(chatId));
			});
	}
}

export default JoinQueueComponent;