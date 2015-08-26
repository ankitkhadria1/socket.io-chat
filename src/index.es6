import * as OPTION   from './options';
import * as EVENT    from './events';

import color        from 'colors';
import db           from './lib/db';
import Client       from './lib/client';
import Middleware   from './lib/middlewares';

console.log('--------------------------------------------'.yellow);
console.log('* Develop edition. Don`t use in production.'.yellow);
console.log('--------------------------------------------'.yellow);

module.exports = { OPTION, EVENT, Client, Middleware };