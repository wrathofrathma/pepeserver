import ws from 'ws';
import users from './data/users';
import {createUser, destroyUser} from "./data/users"
import {rooms} from "./data/rooms";
import {uniqueId} from 'lodash';
import jsonwebtoken from "jsonwebtoken";
import {signature} from "./middleware/auth";
import {subscribe, unsubscribeAll, leaveAll} from "./data/rooms";
import WebSocketController from "./controllers/ws/WebSocketController";

const server = new ws.Server({noServer: true});

server.on('connection', (sock, req) => {
    const {uuid, username, avatar} = createUser(sock);

    sock.on("message", WebSocketController.messageRouter);

    // Send the user their auth token to match their UUIDs.
    const token = jsonwebtoken.sign({data: {uuid}}, signature, { expiresIn: "6h"});
    WebSocketController.emitToken(sock, token);

    // Send the user their default credentials.
    WebSocketController.emitCredentials(sock, {username, avatar, uuid});

    // Send them the current room list
    WebSocketController.emitRoomIndex(sock, rooms);

    // Default user subscriptions
    subscribe("index", {socket: sock, uuid});

    // When the socket closes, we want to remove them from the user entry list.
    sock.on('close', () => {
        // Unsubscribe from all room related stuff
        unsubscribeAll({uuid, socket: sock});
        // Remove the user from all rooms
        leaveAll({uuid, socket: sock})
        // Remove the user from the users list
        destroyUser(uuid);
    })
});

export default server;