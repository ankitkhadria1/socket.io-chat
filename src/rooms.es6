(function () {
	'use strict';

	class Room extends Array {
		constructor(...args) {
			super(...args);
		}
	}

	class Rooms {
		constructor() {
			this.__rooms = new Map();
		}

		create(id) {
			this.__rooms.set(String(id), new Room());

			return this.get(String(id));
		}

		remove(id) {
			this.__rooms.delete(String(id));

			return this;
		}

		get(id) {
			return this.__rooms.get(String(id));
		}

		exist(id) {
			return this.__rooms.has(String(id));
		}

		addMembers(idRoom, member) {
			var room = this.__rooms.get(String(idRoom));

			if (!room) {
				room = this.create(String(idRoom));
			}

			if (!(member instanceof Array)) {
				member = [member];
			}

			member.forEach(function (member) {
				if (!~room.indexOf(String(member))) {
					room.push(String(member));
				}
			});

			return room;
		}

		removeMember(idRoom, member) {
			var room  = this.__rooms.get(String(idRoom)),
			    index = -1;

			if (room) {
				if (!(member instanceof Array)) {
					member = [member];
				}

				member.forEach(function (member) {
					index = room.indexOf(String(member));

					~index && room.splice(index, 1);
				});

			}

			return this;
		}
	}

	module.exports = Rooms;
}());