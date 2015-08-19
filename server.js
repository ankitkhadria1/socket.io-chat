var Client = require('./lib/client');

var c = new Client();

c.test()
	.then(function () {
		console.log('then');
	});