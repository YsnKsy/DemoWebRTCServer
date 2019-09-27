const WebSocketServer = require('websocket').server;
const http = require('http');
const server = http.createServer();
server.listen(1337);

// create the server
wsServer = new WebSocketServer({ httpServer: server });

// WebSocket server
wsServer.on('request', (request) => {
  const connection = request.accept(null, request.origin);

  // This is the most important callback for us, we'll handle
  // all messages from users here.
  connection.on('message', (message) => {
    const { type, utf8Data } = message;
    if (type === 'utf8') {
        console.log('request > onMessage > message', JSON.parse(utf8Data));
    }
  });

  connection.on('close', (connection) => {
    console.log('request > onClose > connection', connection);
    // close user connection
  });
});