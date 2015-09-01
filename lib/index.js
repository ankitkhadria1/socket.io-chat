'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _modelModel = require('./model/model');

var _modelModel2 = _interopRequireDefault(_modelModel);

var _schema = {
	properties: {
		members: {
			type: 'array',
			'default': 'Array'
		}
	}
};

var TestModel = (function (_Model) {
	_inherits(TestModel, _Model);

	function TestModel() {
		_classCallCheck(this, TestModel);

		_get(Object.getPrototypeOf(TestModel.prototype), 'constructor', this).call(this);
		_get(Object.getPrototypeOf(TestModel.prototype), 'initialize', this).call(this, {});
	}

	_createClass(TestModel, [{
		key: 'schema',
		value: function schema() {
			return _schema;
		}
	}]);

	return TestModel;
})(_modelModel2['default']);

var m = new TestModel();

m.set('members', []);
m.fill('members', [1, 2, 3], true);

m.members.addToSet(5);

console.log('m.members', m._atomics);

//import * as OPTION   from './options';
//import * as EVENT    from './events';
//
//import color        from 'colors';
////import db           from './lib/db';
//import db			from './db/index';
//import Client       from './client';
//import Middleware   from './middlewares';
//
//console.log('--------------------------------------------'.yellow);
//console.log('* Develop edition. Don`t use in production.'.yellow);
//console.log('--------------------------------------------'.yellow);
//
//module.exports = { OPTION, EVENT, Client, Middleware };
//# sourceMappingURL=index.js.map