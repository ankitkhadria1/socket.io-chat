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
			this.__rooms.set(id, new Room());

			return this.get(id);
		}

		remove(id) {
			this.__rooms.delete(id);

			return this;
		}

		get(id) {
			return this.__rooms.get(id);
		}

		exist(id) {
			return this.__rooms.has(id);
		}

		addMembers(idRoom, member) {
			var room = this.__rooms.get(idRoom);

			if (!room) {
				room = this.create(idRoom);
			}

			if (!(member instanceof Array)) {
				member = [member];
			}

			member.forEach(function (member) {
				if (!~room.indexOf(member)) {
					room.push(member);
				}
			});

			return room;
		}

		removeMember(idRoom, member) {
			var room  = this.__rooms.get(idRoom),
			    index = -1;

			if (room) {
				if (!(member instanceof Array)) {
					member = [member];
				}

				member.forEach(function (member) {
					index = room.indexOf(member);

					~index && room.splice(index, 1);
				});

			}

			return this;
		}
	}

	module.exports = Rooms;
}());