import express, { Request } from 'express';
import wsServer from './websocket';
import roomRouter from "./routes/rooms";
import cors from "cors";

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use("/room", roomRouter);

const server = app.listen(port, () => {
    console.log(`PepeChat listening at http://localhost:${port}`);
})


server.on('upgrade', (req: any, socket: any, head: any) => {
    wsServer.handleUpgrade(req, socket, head, socket => {
        wsServer.emit('connection', socket, req);
    })
})