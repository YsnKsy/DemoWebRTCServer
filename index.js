const WebSocketServer = require('websocket').server;
const http = require('http');
const server = http.createServer().listen(1337);
const wsServer = new WebSocketServer({ httpServer: server });

const clients = {};
const peer = (peerID = null, description = { type: null, sdp: null }) => ({ peerID, description });
const peers = { offer: peer(), answer: peer() };
const extractUserID = req => req.resource.replace(/\//g, '');

// WebSocket server
wsServer.on('request', request => {
    const connection = request.accept(null, request.origin);
    const userID = extractUserID(request);
    clients[userID] = connection;

    clients[userID].on('message', message => {
        const { type, utf8Data } = message;
        if (type === 'utf8') {
            const { type, sdp } = JSON.parse(utf8Data);
            const validReq = (type === 'offer' || type === 'answer') && (sdp && sdp.length);
            if (validReq) {
                peers[type] = peer(userID, { type, sdp });
                Object.entries(clients)
                    .filter(c => c[0] !== userID)
                    .map(c => c[1].send(JSON.stringify(peers[type].description)));
            }
        }
    });

    clients[userID].on('close', () => delete clients[userID]);

    clients[userID].on('exchange', (data) => {
        console.log('exchange', data);
    });
});

