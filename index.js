(function () {
	"use strict";

	var db         = require('./lib/db');
	var ChatClient = require('./lib/client');

	module.exports = {
		setConnect: db.setConnect,
		getConnect: db.getConnect,
		Client:     ChatClient
	};

}());