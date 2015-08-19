var ObjectID = require('bson-objectid');
//var ObjectID = require('mongodb').ObjectID;

var connect;

module.exports = {
	setConnect: function (externalConnect) {
		connect = externalConnect;
	},
	getConnect: function (cb, errorCb) {
		connect
			? cb(connect)
			: errorCb && errorCb(new Error('connect is not ready'));
	},
	connect: function () {
		return connect;
	},
	ObjectID: ObjectID,
	ObjectId: function (id) {
		return ObjectID.isValid(id)
			? ObjectID(id)
			: null;
	}
};