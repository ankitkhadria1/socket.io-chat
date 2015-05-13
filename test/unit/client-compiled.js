'use strict';

(function () {
	'use strict';

	var should = require('should'),
	    mongodb = require('mongodb'),
	    MongoClient = mongodb.MongoClient,
	    connect,
	    db = require('../../lib/db'),
	    Chat = require('../../index');

	describe('Client', function () {
		before(function (done) {
			MongoClient.connect('mongodb://127.0.0.1/test', function (error, mongoConnect) {
				if (error) {
					throw error;
				}

				connect = mongoConnect;
				Chat.setConnect(mongoConnect);

				done();
			});
		});

		describe('create', function () {
			it('1', function () {
				var client = new Chat.Client();
			});
		});
	});
})();

//# sourceMappingURL=client-compiled.js.map