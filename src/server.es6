import * as chat from './index';

let client = new chat.Client(httpServer, {
	db: {
		provider: 'mongodb',
		connect: mongodb.connect
	},
	eventPrefix: 'my',
	deferInitialize: true
});

client.authorize(function (socket, data, next) {

});

client.addEvent('someEvent', client.authorize, function (socket, data) {

});

client.use('someEvent', function (options, next) {

});