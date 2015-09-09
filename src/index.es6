import * as OPTION   from './options';
import * as EVENT    from './events';

import color        from 'colors';
import db           from './db/index';
import BaseClient   from './client/base';
import Client       from './client/client';
import Middleware   from './middlewares';

console.log('--------------------------------------------'.yellow);
console.log('* Develop edition. Don`t use in production.'.yellow);
console.log('--------------------------------------------'.yellow);

module.exports = { OPTION, EVENT, Client, BaseClient, Middleware, db };