import ws from 'ws';
import users from './users';
import generateUsername from "trash-username-generator";
import {rooms} from "./rooms";
import {uniqueId} from 'lodash';

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

    /* I need to think carefully about my message spec to make the rest of this project simple.
     * 
     * Types of messages    
     * - 'credentials': Our user specific data.
     * - 'room message': Whatever room the user is subscribed to, if a message is published then we need to let them know.
     * - 'webrtc signaling'
     * - 'room list': In order to have the room list updated live, we need to have this updated occasionally when the user is on the index screen.
     * - 'user count': I also want this to be live, so we need this to be a message
     * - 'room info': Stuff like participants, room settings, 
     * - 'user data': If we want other users' usernames & avatars to update in real time, as well as their settings such as things like "deafened", some sort of status, we need this.
    */

    // Send the user their default credentials.
    sock.send(JSON.stringify({
        type: "credentials",
        payload: {
            username,
            avatar,
            uuid
        }
    }));

    // Send them the current room list
    sock.send(JSON.stringify({
        type: "rooms/index",
        payload: {
            rooms
        }
    }));

    // When the socket closes, we want to remove them from the user entry list.
    // TODO - Update other users somehow? How do we emit an event for later.
    sock.on('close', () => {
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