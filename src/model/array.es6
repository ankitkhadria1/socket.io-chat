{
	name: '/chat', server
:
	Server
	{
		nsps: {
			'/'
		:
			[Object], '/chat'
		:
			[Circular]
		}
	,
		_path: '/socket.io', _serveClient
	:
		true, _adapter
	:
		[Function
	:
		Adapter
	],
		_origins: '*:*', sockets
	:
		Namespace
		{
			name: '/', server
		:
			[Circular], sockets
		:
			[Object], connected
		:
			[Object], fns
		:
			[], ids
		:
			0, acks
		:
			{
			}
		,
			adapter: [Object]
		}
	,
		eio: Server
		{
			clients: [Object], clientsCount
		:
			3, pingTimeout
		:
			60000, pingInterval
		:
			25000, upgradeTimeout
		:
			10000, maxHttpBufferSize
		:
			1000, transports
		:
			[Object], allowUpgrades
		:
			true, allowRequest
		:
			[Function], cookie
		:
			'io', ws
		:
			[Object], _events
		:
			[Object], _eventsCount
		:
			1
		}
	,
		httpServer: Server
		{
			domain: null, _events
		:
			[Object], _eventsCount
		:
			7, _maxListeners
		:
			undefined, _connections
		:
			10, _handle
		:
			[Object], _usingSlaves
		:
			false, _slaves
		:
			[], _unref
		:
			false, allowHalfOpen
		:
			true, pauseOnConnect
		:
			false, httpAllowHalfOpen
		:
			false, timeout
		:
			120000, _connectionKey
		:
			'6::::3000'
		}
	,
		engine: Server
		{
			clients: [Object], clientsCount
		:
			3, pingTimeout
		:
			60000, pingInterval
		:
			25000, upgradeTimeout
		:
			10000, maxHttpBufferSize
		:
			1000, transports
		:
			[Object], allowUpgrades
		:
			true, allowRequest
		:
			[Function], cookie
		:
			'io', ws
		:
			[Object], _events
		:
			[Object], _eventsCount
		:
			1
		}
	}
,
	sockets: [Socket {
		nsp:          [Circular],
		server:       [Object],
		adapter:      [Object],
		id:           'urOohTNgC9R-OZCxAAAB',
		client:       [Object],
		conn:         [Object],
		rooms:        [Object],
		acks:         {},
		connected:    true,
		disconnected: false,
		handshake:    [Object],
		_events:      [Object],
		_eventsCount: 9,
		user:         '55e6cefe6f081a662f886f63',
		auth:         true
	}, Socket {
		nsp:          [Circular],
		server:       [Object],
		adapter:      [Object],
		id:           'BGdh2gX4Th0UP191AAAC',
		client:       [Object],
		conn:         [Object],
		rooms:        [Object],
		acks:         {},
		connected:    true,
		disconnected: false,
		handshake:    [Object],
		_events:      [Object],
		_eventsCount: 9
	}], connected
:
	{
		'urOohTNgC9R-OZCxAAAB'
	:
		Socket
		{
			nsp: [Circular], server
		:
			[Object], adapter
		:
			[Object], id
		:
			'urOohTNgC9R-OZCxAAAB', client
		:
			[Object], conn
		:
			[Object], rooms
		:
			[Object], acks
		:
			{
			}
		,
			connected: true, disconnected
		:
			false, handshake
		:
			[Object], _events
		:
			[Object], _eventsCount
		:
			9, user
		:
			'55e6cefe6f081a662f886f63', auth
		:
			true
		}
	,
		BGdh2gX4Th0UP191AAAC: Socket
		{
			nsp: [Circular], server
		:
			[Object], adapter
		:
			[Object], id
		:
			'BGdh2gX4Th0UP191AAAC', client
		:
			[Object], conn
		:
			[Object], rooms
		:
			[Object], acks
		:
			{
			}
		,
			connected: true, disconnected
		:
			false, handshake
		:
			[Object], _events
		:
			[Object], _eventsCount
		:
			9
		}
	}
,
	fns: [], ids
:
	0, acks
:
	{
	}
,
	adapter: Adapter
	{
		nsp: [Circular], rooms
	:
		{
			'urOohTNgC9R-OZCxAAAB'
		:
			[Object], '55eef46f34188930752575dd'
		:
			[Object], BGdh2gX4Th0UP191AAAC
		:
			[Object]
		}
	,
		sids: {
			'urOohTNgC9R-OZCxAAAB'
		:
			[Object], BGdh2gX4Th0UP191AAAC
		:
			[Object]
		}
	,
		encoder: Encoder
		{
		}
	}
,
	_events: {
		connection: [Function]
	}
,
	_eventsCount: 1
}