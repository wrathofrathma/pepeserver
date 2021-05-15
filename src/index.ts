import express, { Request } from 'express';
import wsServer from './websocket';

const app = express();
const port = 3000;

const server = app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
})

server.on('upgrade', (req: any, socket: any, head: any) => {
    wsServer.handleUpgrade(req, socket, head, socket => {
        wsServer.emit('connection', socket, req);
        console.log("ws connection")
    })
})