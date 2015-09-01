import Model from './model/model';

var schema = {
	properties: {
		members: {
			type: 'array',
			default: 'Array'
		}
	}
};

class TestModel extends Model {
	constructor() {
		super();
		super.initialize({});
	}

	schema() {
		return schema;
	}
}

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