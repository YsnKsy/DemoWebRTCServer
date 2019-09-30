const WebSocketServer = require('websocket').server;
const http = require('http');
const server = http.createServer().listen(1337);

const clients = {};
const peer = (peerID = null, description = null) => ({ peerID, description });
const peers = { offer: peer(), answer: peer() };

const extractUserID = req => req.resource.replace(/\//g, '');

// create the server
wsServer = new WebSocketServer({ httpServer: server });

// WebSocket server
wsServer.on('request', (request) => {
    const connection = request.accept(null, request.origin);
    const userID = extractUserID(request);
    clients[userID] = connection;

    clients[userID].on('message', (message) => {
        const { type, utf8Data } = message;

        if (type === 'utf8') {
            const { type, sdp } = JSON.parse(utf8Data);
            
            if (type === 'offer') {
                console.log(`Offer from ${userID}`, sdp);
                const test = JSON.stringify({ test: 'voici mon test' });
                clients[userID].send(JSON.stringify(test))
            } else if (type === 'answer') {
                console.log(`Answer from ${userID}`, sdp);
                const test = JSON.stringify({ test: 'voici mon test' });
                clients[userID].send(JSON.stringify(test))
            }
        }
    });

    clients[userID].on('close', (connection) => {
        console.log('request > onClose > connection', connection);
        delete clients[userID];
        // close user connection
    });

    clients[userID].on('exchange', (data) => {
        console.log('exchange', data);
        // data.from = connection.id;
        // let to = wsServer.sockets.connected[data.to];
        // to.emit('exchange', data);
    });
});

