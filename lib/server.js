'use strict';

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

var _index = require('./index');

var chat = _interopRequireWildcard(_index);

var client = new chat.Client(httpServer, {
	db: {
		provider: 'mongodb',
		connect: mongodb.connect
	},
	eventPrefix: 'my',
	deferInitialize: true
});

client.authorize(function (socket, data, next) {});

client.addEvent('someEvent', client.authorize, function (socket, data) {});

client.use('someEvent', function (options, next) {});
//# sourceMappingURL=server.js.map