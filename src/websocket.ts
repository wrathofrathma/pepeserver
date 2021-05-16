import ws from 'ws';
import users from './data/users';
import generateUsername from "trash-username-generator";
import {rooms} from "./data/rooms";
import {uniqueId} from 'lodash';
import jsonwebtoken from "jsonwebtoken";
import {signature} from "./middleware/auth";
import {subscribe, unsubscribeAll, leaveAll} from "./data/rooms";
import {getSubscriber} from "./data/subscribers";
import WebSocketController from "./controllers/ws/WebSocketController";

const server = new ws.Server({noServer: true});

server.on('connection', (sock, req) => {
    // When a user connects, generate a unique(ish) random username and add them to the list of users connected.
    const username = generateUsername();
    const avatar = ""; // TODO randomly select an avatar once we add them
    const uuid = uniqueId();

    users.set(uuid, {
        username: username,
        socket: sock,
        avatar
    });

    // Send the user their auth token to match their UUIDs.
    const token = jsonwebtoken.sign({data: {uuid}}, signature, { expiresIn: "6h"});
    WebSocketController.emitToken(sock, token);

    // Send the user their default credentials.
    WebSocketController.emitCredentials(sock, {username, avatar, uuid});

    // Send them the current room list
    WebSocketController.emitRoomIndex(sock, rooms);

    subscribe("index", {socket: sock, uuid});

    // When the socket closes, we want to remove them from the user entry list.
    // TODO - Update other users somehow? How do we emit an event for later.
    sock.on('close', () => {
        // Unsubscribe from all room related stuff
        unsubscribeAll({uuid, socket: sock});
        // Remove the user from all rooms
        leaveAll({uuid, socket: sock})
        // Remove the user from the users list
        for (const [key, val] of users.entries()) {
            if (val.socket === sock) {
                users.delete(key);
                break;
            }
        }
    })
});

export default server;