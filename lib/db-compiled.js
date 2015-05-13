'use strict';

var ObjectID = require('bson-objectid');

var _connect;

module.exports = {
	setConnect: function setConnect(externalConnect) {
		_connect = externalConnect;
	},
	getConnect: function getConnect(cb) {
		if (_connect) {
			cb(_connect);
		} else {
			return false;
		}
	},
	connect: function connect() {
		return _connect;
	},
	ObjectID: ObjectID,
	ObjectId: function ObjectId(id) {
		return ObjectID.isValid(id) ? ObjectID(id) : undefined;
	}
};

//# sourceMappingURL=db-compiled.js.map