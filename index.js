const WebSocketServer = require('websocket').server;
const http = require('http');
const server = http.createServer().listen(1337);
const wsServer = new WebSocketServer({ httpServer: server });
const clients = {};

const peer = (description = { type: null, sdp: null }) => description;
const peers = { offer: peer(), answer: peer() };

const extractUserID = req => req.resource.replace(/\//g, '');
const isEmptyPeer = (p, t) => (p[t].type === null);
const isValidSDP = ({ type, sdp }) => (type === 'offer' || type === 'answer') && (sdp && sdp.length);
const isValidCandidate = (type, { candidate, sdpMLineIndex, sdpMid }) => (type === 'candidate') && (typeof candidate === 'string' && typeof sdpMLineIndex === 'number' && typeof sdpMid === 'string');
const isWrtcClose = (type, payload) => (type === 'close' && payload === 'wrtc');

// Temp
const isDebug = type => (type === 'debug');
const who = (id) => id === 'E306F95A-9F9D-4CD7-9CAA-B968CE535FE0' ? 'Yaska' : 'Guest';

/*
{
    sdp:'v=0\r\no=- 3535576052355586379 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE data\r\na=msid-semantic: WMS\r\nm=application 9 DTLS/SCTP 5000\r\nc=IN IP4 0.0.0.0\r\na=ice-ufrag:sfu5\r\na=ice-pwd:1xespOa2tDgcza4ZBgPgKcfP\r\na=ice-options:trickle renomination\r\na=fingerprint:sha-256 75:A8:A0:72:F2:B0:B9:D0:99:0B:2F:05:AE:5D:D2:95:42:BA:E2:AA:F5:22:E4:0F:87:D4:E8:A9:0B:8E:92:FC\r\na=setup:actpass\r\na=mid:data\r\na=sctpmap:5000 webrtc-datachannel 1024\r\n',
    type: 'offer' 
}
------
{
    candidate: 'candidate:2943013415 1 udp 2122260223 192.168.2.3 52456 typ host generation 0 ufrag sfu5 network-id 1 network-cost 10',
    sdpMLineIndex: 0,
    sdpMid: 'data'
}
*/

// WebSocket server
wsServer.on('request', request => {
    const connection = request.accept(null, request.origin);
    const userID = extractUserID(request);
    console.log('New User', who(userID));

    clients[userID] = connection;
    clients[userID].on('message', message => {
        const { type: encoding, utf8Data } = message;
        if (encoding === 'utf8') {
            const { type, payload } = JSON.parse(utf8Data);
            let result = null;

            if (isDebug(type)) console.log(`DEBUG > ${who(userID)} :`, payload) // temp
            
            if (isValidSDP(payload)) {
                peers[type] = isEmptyPeer(peers, type) ? peer(payload) : peers[type];
                result = { type, payload: peers[type] };
            } 
            
            if (isValidCandidate(type, payload)) {
                result = { type, payload };
            }

            if (isWrtcClose(type, payload)) {
                peers['offer'] = peer();
                peers['answer'] = peer();
            }

            if (result !== null) Object.entries(clients).filter(c => c[0] !== userID).map(c => c[1].send(JSON.stringify(result)));
        }
    });
    clients[userID].on('close', () => delete clients[userID]);
    clients[userID].on('exchange', (data) => console.log('exchange', data));
});