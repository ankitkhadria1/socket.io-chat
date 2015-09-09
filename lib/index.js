'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

var _options = require('./options');

var OPTION = _interopRequireWildcard(_options);

var _events = require('./events');

var EVENT = _interopRequireWildcard(_events);

var _colors = require('colors');

var _colors2 = _interopRequireDefault(_colors);

var _dbIndex = require('./db/index');

var _dbIndex2 = _interopRequireDefault(_dbIndex);

var _clientBase = require('./client/base');

var _clientBase2 = _interopRequireDefault(_clientBase);

var _clientClient = require('./client/client');

var _clientClient2 = _interopRequireDefault(_clientClient);

var _middlewares = require('./middlewares');

var _middlewares2 = _interopRequireDefault(_middlewares);

console.log('--------------------------------------------'.yellow);
console.log('* Develop edition. Don`t use in production.'.yellow);
console.log('--------------------------------------------'.yellow);

module.exports = { OPTION: OPTION, EVENT: EVENT, Client: _clientClient2['default'], BaseClient: _clientBase2['default'], Middleware: _middlewares2['default'], db: _dbIndex2['default'] };
//# sourceMappingURL=index.js.map