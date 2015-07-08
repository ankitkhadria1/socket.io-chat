(function (window) {
	'use strict';

	var describe   = window.describe,
		it         = window.it,
		expect     = window.expect,
		define     = window.define,
		beforeAll  = window.beforeAll,
		afterAll   = window.afterAll,
		beforeEach = window.beforeEach,
		afterEach  = window.afterEach,
		console    = window.console;

	define([
		'io',
		'q'
	], function (IO, Q) {
		jasmine.DEFAULT_TIMEOUT_INTERVAL = 2000;

		var socket,
			promise    = Q.Promise,
			connectUrl = 'http://localhost:3000',
			usersData  = [
				{
					"username": "thereissuchname",
					"password": "123456"
				},
				{
					"username": "test",
					"password": "654321"
				},
				{
					"username": "Iron Man",
					"password": "123456"
				},
				{
					"username": "user1",
					"password": "123456"
				},
				{
					"username": "FOO",
					"password": "123456"
				}
			];

		describe('Client test', function () {
			describe('connect', function () {
				it('connect', function (done) {
					if (socket) {
						socket.close();
					}

					socket = IO(connectUrl, { 'force new connection': true });
					socket.once('connect', function () {
						done();
					});
				});
			});

			describe('authenticate', function () {
				it('credentials not specified', function (done) {
					socket.once('login', function (response) {
						expect(response).toBeTruthy();
						expect(response.error).toBeDefined();
						done();
					});

					socket.emit('authenticate', {});
				});

				it('invalid credentials', function (done) {
					socket.once('login', function (response) {
						expect(response).toBeTruthy();
						expect(response.error).toBeDefined();
						done();
					});

					socket.emit('authenticate', { username: 1, password: 2 });
				});

				it('success', function (done) {
					socket.once('login', function (response) {
						expect(response).toBeTruthy();
						expect(response.error).not.toBeDefined();
						expect(response.result).toBeDefined();
						done();
					});

					socket.emit('authenticate', { username: 'thereissuchname', password: '123456' });
				});
			});

			describe('create', function () {
				it('required name', function (done) {
					socket.once('create', function (response) {
						expect(response).toBeTruthy();
						expect(response.error).toBeDefined();
						expect(response.error.message).toMatch(/minimum length/);
						done();
					});

					socket.emit('create');
				});

				it('success', function (done) {
					var promiseCreate = Q.defer(), promiseAddMember = Q.defer();

					socket.once('create', function (response) {
						expect(response).toBeTruthy();
						expect(response.error).not.toBeDefined();

						expect(response.result).toBeDefined();
						expect(response.result.message).toBeDefined();
						expect(response.result.data).toBeDefined();
						expect(response.result.data).toBeTruthy();

						promiseCreate.resolve();
					});

					socket.once('addMember', function (response) {
						expect(response).toBeTruthy();
						expect(response.error).not.toBeDefined();

						expect(response.result).toBeDefined();
						expect(response.result.message).toBeDefined();
						expect(response.result.data).toBeDefined();
						expect(response.result.data).toBeTruthy();

						promiseAddMember.resolve();
					});

					Q.all([
						promiseCreate,
						promiseAddMember
					]).then(function () {
						done();
					}).catch(done);

					socket.emit('create', { name: 'first chat' });
				});
			});

			describe('enter', function () {

			});

			describe('addMember', function () {
				var chat;
				var sockets = [];

				beforeAll(function (done) {
					socket.once('create', function (response) {
						var tasks = [];

						expect(response).toBeTruthy();
						expect(response.error).not.toBeDefined();
						expect(response.result).toBeDefined();

						chat = response.result.data;

						tasks = usersData.map(function (userData, key) {
								return promise(function (resolve, reject) {
									var socket;

									socket = IO(connectUrl, { 'force new connection': true });

									socket.once('login', function (response) {
										expect(response).toBeTruthy();
										expect(response.error).not.toBeDefined();
										expect(response.result).toBeDefined();

										socket.user = response.result.user;

										sockets[key] = socket;

										resolve();
									});

									socket.emit('authenticate', {
										username: userData.username,
										password: userData.password
									});
								});
						});

						Q.all(tasks).then(function () {
							done();
						}).fail(done);
					});

					socket.emit('create', { name: 'test-add-member chat' });
				});

				afterAll(function () {
					sockets.forEach(function (socket) {
						socket.disconnect();
					});
				});

				// TODO: проверка на смену типа
				it('chat not exists', function (done) {
					sockets[0].once('addMember', function (response) {
						expect(response).toBeTruthy();
						expect(response.error).toBeDefined();
						expect(response.result).not.toBeDefined();
						expect(response.error.message).toMatch(/Chat not found/);

						done();
					});

					sockets[0].emit('addMember', { chatId: 1, member: sockets[1].user });
				});

				it('not specified member', function (done) {
					sockets[0].once('addMember', done);
					sockets[0].emit('addMember', { chatId: chat._id });

					setInterval(function () {
						sockets[0].removeAllListeners('addMember');
						done();
					}, 150);
				});

				it('invalid member id', function (done) {
					sockets[0].once('addMember', done);
					sockets[0].emit('addMember', { chatId: chat._id, member: 1 });

					setInterval(function () {
						sockets[0].removeAllListeners('addMember');
						done();
					}, 150);
				});

				it('member not exist', function (done) {
					sockets[0].once('addMember', done);
					sockets[0].emit('addMember', { chatId: chat._id, member: 12 });

					setInterval(function () {
						sockets[0].removeAllListeners('addMember');
						done();
					}, 150);
				});

				it('performer not a member of chat', function (done) {
					sockets[1].once('addMember', function (response) {
						expect(response).toBeTruthy();
						expect(response.error).toBeDefined();
						expect(response.result).not.toBeDefined();
						expect(response.error.message).toMatch(/Performer not member/);
						done();
					});

					sockets[1].emit('addMember', { chatId: chat._id, member: sockets[2].user });
				});

				it('success', function (done) {
					var defer1 = Q.defer();
					var defer2 = Q.defer();

					sockets[0].once('addMember', function (response) {
						expect(response).toBeTruthy();
						expect(response.error).not.toBeDefined();
						expect(response.result).toBeDefined();
						expect(response.result.data).toBeDefined();
						expect(response.result.message).toMatch(/The member added/);

						defer1.resolve();
					});

					sockets[1].once('addMember', function (response) {
						defer2.resolve();
					});

					sockets[0].emit('addMember', { chatId: chat._id, member: sockets[1].user });

					Q.all([defer1.promise, defer2.promise]).then(function () {
						done();
					});
				});
			});

			describe('removeMember', function () {
				var chat;
				var sockets = [];

				beforeAll(function (done) {
					socket.once('create', function (response) {
						var tasks = [];

						expect(response).toBeTruthy();
						expect(response.error).not.toBeDefined();
						expect(response.result).toBeDefined();

						chat = response.result.data;

						tasks = usersData.map(function (userData, key) {
							return promise(function (resolve, reject) {
								var socket;

								socket = IO(connectUrl, { 'force new connection': true });

								socket.once('login', function (response) {
									expect(response).toBeTruthy();
									expect(response.error).not.toBeDefined();
									expect(response.result).toBeDefined();

									socket.user = response.result.user;

									sockets[key] = socket;

									resolve();
								});

								socket.emit('authenticate', {
									username: userData.username,
									password: userData.password
								});
							});
						});

						Q.all(tasks).then(function () {
							done();
						}).fail(done);
					});

					socket.emit('create', { name: 'test-remove-member chat' });
				});

				afterAll(function () {
					sockets.forEach(function (socket) {
						socket.disconnect();
					});
				});

				it('chat not exists', function (done) {
					sockets[0].once('removeMember', function (response) {
						expect(response).toBeTruthy();
						expect(response.error).toBeDefined();
						expect(response.result).not.toBeDefined();
						expect(response.error.message).toMatch(/Chat not found/);

						done();
					});

					sockets[0].emit('removeMember', { chatId: 1, member: sockets[1].user });
				});

				it('member not specified', function (done) {
					sockets[0].once('removeMember', done);
					sockets[0].emit('removeMember', { chatId: chat._id });

					setInterval(function () {
						sockets[0].removeAllListeners('removeMember');
						done();
					}, 150);
				});

				it('invalid member id', function (done) {
					sockets[0].once('removeMember', done);
					sockets[0].emit('removeMember', { chatId: chat._id, member: 1 });

					setInterval(function () {
						sockets[0].removeAllListeners('removeMember');
						done();
					}, 150);
				});

				it('member not exists', function (done) {
					sockets[0].once('removeMember', done);
					sockets[0].emit('removeMember', { chatId: chat._id, member: 12 });

					setInterval(function () {
						sockets[0].removeAllListeners('removeMember');
						done();
					}, 150);
				});

				it('member not a creator', function (done) {
					sockets[0].once('addMember', function () {

						sockets[1].once('removeMember', done);
						sockets[0].emit('removeMember', { chatId: chat._id, member: sockets[0].user });

						setInterval(function () {
							sockets[1].removeAllListeners('removeMember');
							sockets[0].removeAllListeners('removeMember');
							done();
						}, 150);
					});

					sockets[0].emit('addMember', { chatId: chat._id, member: sockets[1].user });
				});

				it('performer not a member of chat', function (done) {
					sockets[0].once('addMember', function () {

						sockets[2].once('removeMember', done);
						sockets[0].emit('removeMember', { chatId: chat._id, member: sockets[0].user });

						setInterval(function () {
							sockets[2].removeAllListeners('removeMember');
							sockets[0].removeAllListeners('removeMember');
							done();
						}, 150);
					});

					sockets[0].emit('addMember', { chatId: chat._id, member: sockets[2].user });
				});

				it('success', function (done) {
					sockets[0].once('addMember', function () {
						var defer1 = Q.defer();
						var defer2 = Q.defer();

						sockets[3].once('removeMember', function (response) {
							expect(response).toBeTruthy();
							expect(response.error).not.toBeDefined();
							expect(response.result).toBeDefined();
							expect(response.result.message).toMatch(/The member removed/);
							defer1.resolve();
						});

						sockets[0].once('removeMember', function (response) {
							expect(response).toBeTruthy();
							expect(response.error).not.toBeDefined();
							expect(response.result).toBeDefined();
							expect(response.result.message).toMatch(/The member removed/);
							defer2.resolve();
						});

						Q.all([defer1.promise, defer2.promise]).then(function () {
							done();
						}).catch(done);

						sockets[0].emit('removeMember', { chatId: chat._id, member: sockets[3].user });
					});

					sockets[0].emit('addMember', { chatId: chat._id, member: sockets[3].user });
				});
			});

			describe('leave', function () {
				var chat;
				var sockets = [];

				beforeAll(function (done) {
					socket.once('create', function (response) {
						var tasks = [];

						expect(response).toBeTruthy();
						expect(response.error).not.toBeDefined();
						expect(response.result).toBeDefined();

						chat = response.result.data;

						tasks = usersData.map(function (userData, key) {
							return promise(function (resolve, reject) {
								var socket;

								socket = IO(connectUrl, { 'force new connection': true });

								socket.once('login', function (response) {
									expect(response).toBeTruthy();
									expect(response.error).not.toBeDefined();
									expect(response.result).toBeDefined();

									socket.user = response.result.user;

									sockets[key] = socket;

									resolve();
								});

								socket.emit('authenticate', {
									username: userData.username,
									password: userData.password
								});
							});
						});

						Q.all(tasks).then(function () {

							var added = [];

							sockets[0].removeAllListeners('addMember');
							sockets[0].emit('addMember', { chatId: chat._id, member: sockets[1].user });
							sockets[0].emit('addMember', { chatId: chat._id, member: sockets[2].user });
							sockets[0].emit('addMember', { chatId: chat._id, member: sockets[3].user });

							sockets[0].on('addMember', function (response) {
								expect(response).toBeTruthy();
								expect(response.result).toBeDefined();
								expect(response.error).not.toBeDefined();

								if (response.result && response.result.data) {
									added.push(response.result.data);
								}

								if (added.length === 3) {
									sockets[0].removeAllListeners('addMember');

									sockets[0].once('findChat', function (response) {
										done();
									});

									sockets[0].emit('findChat', { chatId: chat._id });
								}
							});

						}).fail(done);
					});

					socket.emit('create', { name: 'test-leave-member chat' });
				});

				afterAll(function () {
					sockets.forEach(function (socket) {
						socket.disconnect();
					});
				});

				it('chat not exists', function (done) {
					sockets[0].once('leave', function (response) {
						expect(response).toBeTruthy();
						expect(response.error).toBeDefined();
						expect(response.result).not.toBeDefined();
						expect(response.error.message).toMatch(/Chat not found/);

						done();
					});

					sockets[0].emit('leave', { chatId: 1 });
				});

				it('performer not a member of chat', function (done) {
					sockets[4].once('leave', function (response) {
						expect(response).toBeTruthy();
						expect(response.error).toBeDefined();
						expect(response.result).not.toBeDefined();
						expect(response.error.message).toMatch(/Performer not member/);

						done();
					});

					sockets[4].emit('leave', { chatId: chat._id });
				});

				//it('performer not a creator of chat', function () {
				//
				//}); // TODO: что делать, когда выходит исполнитель чата
				//

				it('success', function (done) {
					sockets[2].once('leave', function (response) {
						expect(response).toBeTruthy();
						expect(response.error).not.toBeDefined();
						expect(response.result).toBeDefined();
						expect(response.result.message).toMatch(/The member leaved/);

						sockets[0].once('findChat', function (response) {
							expect(response.result.data.members).not.toContain(sockets[2].user);
							done();
						});

						sockets[0].emit('findChat', { chatId: chat._id });
					});

					sockets[2].emit('leave', { chatId: chat._id });
				});
			});

			describe('newMessage', function () {
				var chat;
				var sockets = [];

				beforeAll(function (done) {
					socket.once('create', function (response) {
						var tasks = [];

						expect(response).toBeTruthy();
						expect(response.error).not.toBeDefined();
						expect(response.result).toBeDefined();

						chat = response.result.data;

						tasks = usersData.map(function (userData, key) {
							return promise(function (resolve, reject) {
								var socket;

								socket = IO(connectUrl, { 'force new connection': true });

								socket.once('login', function (response) {
									expect(response).toBeTruthy();
									expect(response.error).not.toBeDefined();
									expect(response.result).toBeDefined();

									socket.user = response.result.user;

									sockets[key] = socket;

									resolve();
								});

								socket.emit('authenticate', {
									username: userData.username,
									password: userData.password
								});
							});
						});

						Q.all(tasks).then(function () {

							var added = [];

							sockets[0].removeAllListeners('addMember');
							sockets[0].emit('addMember', { chatId: chat._id, member: sockets[1].user });
							sockets[0].emit('addMember', { chatId: chat._id, member: sockets[2].user });
							sockets[0].emit('addMember', { chatId: chat._id, member: sockets[3].user });

							sockets[0].on('addMember', function (response) {
								expect(response).toBeTruthy();
								expect(response.result).toBeDefined();
								expect(response.error).not.toBeDefined();

								if (response.result && response.result.data) {
									expect(response.result.message).toMatch(new RegExp('The member added'));
									added.push(response.result.data);
								}

								if (added.length === 3) {
									sockets[0].removeAllListeners('addMember');

									sockets[0].once('findChat', function (response) {
										//console.log('chat', response.result.data.members);
										chat = response.result.data;

										done();
									});

									sockets[0].emit('findChat', { chatId: chat._id });
								}
							});

						}).fail(done);
					});

					socket.emit('create', { name: 'test-leave-member chat' });
				});

				afterAll(function () {
					sockets.forEach(function (socket) {
						socket.disconnect();
					});
				});

				it('chat not exists', function (done) {
					sockets[0].once('newMessage', function (response) {
						expect(response).toBeTruthy();
						expect(response.error).toBeDefined();
						expect(response.result).not.toBeDefined();
						expect(response.error.message).toMatch(/Chat not found/);

						done();
					});

					sockets[0].emit('newMessage', { chatId: 1 });
				});

				it('text not specified', function (done) {
					sockets[0].once('newMessage', function (response) {
						expect(response).toBeTruthy();
						expect(response.error).toBeDefined();
						expect(response.result).not.toBeDefined();
						expect(response.error.message).toMatch(/minimum length/);

						done();
					});

					sockets[0].emit('newMessage', { chatId: chat._id });
				});

				it('text is empty', function (done) {
					sockets[0].once('newMessage', function (response) {
						expect(response).toBeTruthy();
						expect(response.error).toBeDefined();
						expect(response.result).not.toBeDefined();
						expect(response.error.message).toMatch(/minimum length/);

						done();
					});

					sockets[0].emit('newMessage', { chatId: chat._id, text: '' });
				});

				it('performer not a member of chat', function (done) {
					sockets[4].once('newMessage', function (response) {
						expect(response).toBeTruthy();
						expect(response.error).toBeDefined();
						expect(response.result).not.toBeDefined();
						expect(response.error.message).toMatch(/Performer not member/);

						done();
					});

					sockets[4].emit('newMessage', { chatId: chat._id, text: '' });
				});

				it('success', function (done) {
					var message = 'new newMessage' + Math.random();

					var defer1 = Q.defer();
					var defer2 = Q.defer();
					var defer3 = Q.defer();
					var defer4 = Q.defer();

					sockets[0].once('newMessage', function (response) {
						expect(response).toBeTruthy();
						expect(response.error).not.toBeDefined();
						expect(response.result).toBeDefined();
						expect(response.result.message).toMatch(/New message/);
						expect(response.result.data).toBeTruthy();
						expect(response.result.data.text).toMatch(new RegExp(message));
						defer1.resolve();
					});

					sockets[1].once('newMessage', function (response) {
						expect(response).toBeTruthy();
						expect(response.error).not.toBeDefined();
						expect(response.result).toBeDefined();
						expect(response.result.message).toMatch(/New message/);
						expect(response.result.data).toBeTruthy();
						expect(response.result.data.text).toMatch(new RegExp(message));
						defer2.resolve();
					});

					sockets[2].once('newMessage', function (response) {
						expect(response).toBeTruthy();
						expect(response.error).not.toBeDefined();
						expect(response.result).toBeDefined();
						expect(response.result.message).toMatch(/New message/);
						expect(response.result.data).toBeTruthy();
						expect(response.result.data.text).toMatch(new RegExp(message));
						defer3.resolve();
					});

					sockets[3].once('newMessage', function (response) {
						expect(response).toBeTruthy();
						expect(response.error).not.toBeDefined();
						expect(response.result).toBeDefined();
						expect(response.result.message).toMatch(/New message/);
						expect(response.result.data).toBeTruthy();
						expect(response.result.data.text).toMatch(new RegExp(message));
						defer4.resolve();
					});

					sockets[4].once('newMessage', function (response) {
						throw new Error('member not in chat');
					});

					Q.all([
						defer1.promise,
						defer2.promise,
						defer3.promise,
						defer4.promise
					]).then(function () {
						setTimeout(function () {
							done();
						}, 1000); // expected sokcets[4] that would not answer
					}).catch(function (error) {
						throw error;
					});

					sockets[0].emit('newMessage', { chatId: chat._id, text: message });
				});

				it('removed member not receive new message', function (done) {
					var defer1 = Q.defer();
					var defer2 = Q.defer();

					var message = 'Removed member don`t see this message';

					sockets[3].once('removeMember', function (response) {
						expect(response).toBeTruthy();
						expect(response.error).not.toBeDefined();
						expect(response.result).toBeDefined();
						expect(response.result.message).toMatch(/The member removed/);
						defer1.resolve();
					});

					sockets[0].once('removeMember', function (response) {
						expect(response).toBeTruthy();
						expect(response.error).not.toBeDefined();
						expect(response.result).toBeDefined();
						expect(response.result.message).toMatch(/The member removed/);

						defer2.resolve();
					});

					Q.all([defer1.promise, defer2.promise]).then(function () {
						var inDefer1 = Q.defer(),
							inDefer2 = Q.defer(),
							inDefer3 = Q.defer();

						sockets[0].once('newMessage', function (response) {
							expect(response).toBeTruthy();
							expect(response.error).not.toBeDefined();
							expect(response.result).toBeDefined();
							expect(response.result.message).toMatch(/New message/);
							expect(response.result.data).toBeTruthy();
							expect(response.result.data.text).toMatch(new RegExp(message));
							inDefer1.resolve();
						});

						sockets[1].once('newMessage', function (response) {
							expect(response).toBeTruthy();
							expect(response.error).not.toBeDefined();
							expect(response.result).toBeDefined();
							expect(response.result.message).toMatch(/New message/);
							expect(response.result.data).toBeTruthy();
							expect(response.result.data.text).toMatch(new RegExp(message));
							inDefer2.resolve();
						});

						sockets[2].once('newMessage', function (response) {
							expect(response).toBeTruthy();
							expect(response.error).not.toBeDefined();
							expect(response.result).toBeDefined();
							expect(response.result.message).toMatch(/New message/);
							expect(response.result.data).toBeTruthy();
							expect(response.result.data.text).toMatch(new RegExp(message));
							inDefer3.resolve();
						});

						sockets[3].once('newMessage', function (response) {
							throw new Error('member not in chat');
						});

						Q.all([
							inDefer1.promise,
							inDefer2.promise,
							inDefer3.promise
						]).then(function () {
							setTimeout(function () {
								done();
							}, 500);
						}).catch(function (error) {
							throw error;
						});

						sockets[0].emit('newMessage', { chatId: chat._id, text: message });
					}).catch(function (error) {
						throw error;
					});

					sockets[0].emit('removeMember', { chatId: chat._id, member: sockets[3].user });
				});

				it('leaved member not receive new message', function (done) {
					var defer1 = Q.defer();
					var defer2 = Q.defer();

					var message = 'Removed member don`t see this message';

					sockets[2].once('leave', function (response) {
						expect(response).toBeTruthy();
						expect(response.error).not.toBeDefined();
						expect(response.result).toBeDefined();
						expect(response.result.message).toMatch(/The member leaved/);
						defer1.resolve();
					});

					sockets[0].once('leave', function (response) {
						expect(response).toBeTruthy();
						expect(response.error).not.toBeDefined();
						expect(response.result).toBeDefined();
						expect(response.result.message).toMatch(/The member leaved/);

						defer2.resolve();
					});

					Q.all([defer1.promise, defer2.promise]).then(function () {
						var inDefer1 = Q.defer(),
							inDefer2 = Q.defer();

						sockets[0].once('newMessage', function (response) {
							expect(response).toBeTruthy();
							expect(response.error).not.toBeDefined();
							expect(response.result).toBeDefined();
							expect(response.result.message).toMatch(/New message/);
							expect(response.result.data).toBeTruthy();
							expect(response.result.data.text).toMatch(new RegExp(message));
							inDefer1.resolve();
						});

						sockets[1].once('newMessage', function (response) {
							expect(response).toBeTruthy();
							expect(response.error).not.toBeDefined();
							expect(response.result).toBeDefined();
							expect(response.result.message).toMatch(/New message/);
							expect(response.result.data).toBeTruthy();
							expect(response.result.data.text).toMatch(new RegExp(message));
							inDefer2.resolve();
						});

						sockets[2].once('newMessage', function (response) {
							throw new Error('member not in chat');
						});

						Q.all([
							inDefer1.promise,
							inDefer2.promise
						]).then(function () {
							setTimeout(function () {
								done();
							}, 500);
						}).catch(function (error) {
							throw error;
						});

						sockets[0].emit('newMessage', { chatId: chat._id, text: message });
					}).catch(function (error) {
						throw error;
					});

					sockets[2].emit('leave', { chatId: chat._id });
				});
			});

			describe('newSystemMessage', function () {
				var chat;
				var sockets = [];

				beforeAll(function (done) {
					socket.once('create', function (response) {
						var tasks = [];

						expect(response).toBeTruthy();
						expect(response.error).not.toBeDefined();
						expect(response.result).toBeDefined();

						chat = response.result.data;

						tasks = usersData.map(function (userData, key) {
							return promise(function (resolve, reject) {
								var socket;

								socket = IO(connectUrl, { 'force new connection': true });

								socket.once('login', function (response) {
									expect(response).toBeTruthy();
									expect(response.error).not.toBeDefined();
									expect(response.result).toBeDefined();

									socket.user = response.result.user;

									sockets[key] = socket;

									resolve();
								});

								socket.emit('authenticate', {
									username: userData.username,
									password: userData.password
								});
							});
						});

						Q.all(tasks).then(function () {

							var added = [];

							sockets[0].removeAllListeners('addMember');
							sockets[0].emit('addMember', { chatId: chat._id, member: sockets[1].user });
							sockets[0].emit('addMember', { chatId: chat._id, member: sockets[2].user });
							sockets[0].emit('addMember', { chatId: chat._id, member: sockets[3].user });

							sockets[0].on('addMember', function (response) {
								expect(response).toBeTruthy();
								expect(response.result).toBeDefined();
								expect(response.error).not.toBeDefined();

								if (response.result && response.result.data) {
									expect(response.result.message).toMatch(new RegExp('The member added'));
									added.push(response.result.data);
								}

								if (added.length === 3) {
									sockets[0].removeAllListeners('addMember');

									sockets[0].once('findChat', function (response) {
										//console.log('chat', response.result.data.members);
										chat = response.result.data;

										done();
									});

									sockets[0].emit('findChat', { chatId: chat._id });
								}
							});

						}).fail(done);
					});

					socket.emit('create', { name: 'test-leave-member chat', systemMessages: { removeMember: true } });
				});

				afterAll(function () {
					sockets.forEach(function (socket) {
						socket.disconnect();
					});
				});

				it('on remove member', function (done) {
					var defer1 = Q.defer();
					var defer2 = Q.defer();

					sockets[3].once('removeMember', function (response) {
						expect(response).toBeTruthy();
						expect(response.error).not.toBeDefined();
						expect(response.result).toBeDefined();
						expect(response.result.message).toMatch(/The member removed/);
						defer1.resolve();
					});

					sockets[0].once('removeMember', function (response) {
						console.log(response);

						expect(response).toBeTruthy();
						expect(response.error).not.toBeDefined();
						expect(response.result).toBeDefined();
						expect(response.result.message).toMatch(/The member removed/);
						defer2.resolve();
					});

					Q.all([defer1.promise, defer2.promise]).then(function () {
						done();
					}).catch(done);

					sockets[0].emit('removeMember', { chatId: chat._id, member: sockets[3].user });
				});

				it('on leave', function () {
				});
				it('on change title', function () {
				});
			});

			describe('changeTitle', function () {
				it('chat not exists', function () {
				});
				it('performer not a member of chat', function () {
				});
				it('title is empty', function () {
				});
			});

			describe('findLast', function () {
				it('chat not exists', function () {
				});
				it('count not specified', function () {
				});
				it('count 7', function () {
				});
				it('count 10', function () {
				});
				it('performer not a member of chat (found only received messages)', function () {
				});
			});

			describe('findFrom', function () {
				it('chat not exists', function () {
				});
				it('count not specified', function () {
				});
				it('count 7', function () {
				});
				it('count 10', function () {
				});
				it('messageId not specified', function () {
				});
				it('messageId invalid', function () {
				});
				it('success', function () {
				});
			});

			describe('findAt', function () {
				it('chat not exists', function () {
				});
				it('count not specified', function () {
				});
				it('count 7', function () {
				});
				it('count 10', function () {
				});
				it('messageId not specified', function () {
				});
				it('messageId invalid', function () {
				});
				it('success', function () {
				});
			});
		});

	});

}(this));