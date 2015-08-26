'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

var _options = require('./options');

var OPTION = _interopRequireWildcard(_options);

var _events = require('./events');

var EVENT = _interopRequireWildcard(_events);

var _colors = require('colors');

var _colors2 = _interopRequireDefault(_colors);

var _libDb = require('./lib/db');

var _libDb2 = _interopRequireDefault(_libDb);

var _libClient = require('./lib/client');

var _libClient2 = _interopRequireDefault(_libClient);

console.log('--------------------------------------------'.yellow);
console.log('* Develop edition. Don`t use in production.'.yellow);
console.log('--------------------------------------------'.yellow);

module.exports = { OPTION: OPTION, EVENT: EVENT, Client: _libClient2['default'] };
//# sourceMappingURL=index.js.map