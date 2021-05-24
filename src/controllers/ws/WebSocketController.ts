import ws from "ws";
import {publishMessage, setUserStreamState} from "../../data/rooms";
import type {Message} from "../../data/rooms";
import {getSocketByUUID, User} from "../../data/users";
import {getUUIDBySocket} from "../../data/users";
import {rerollUsername} from "../../data/users";

/* I need to think carefully about my message spec to make the rest of this project simple.
* 
* Types of messages    
* - 'token': I'm just gonna send the user an auth token over websockets like a psychopath since I'm not sure where to put it as a REST call quite yet.
* - 'credentials': Our user specific data.
* - 'room index': In order to have the room list updated live, we need to have this updated occasionally when the user is on the index screen.
* - 'room info': Stuff like participants, room settings, 
* 
* - 'room message': Whatever room the user is subscribed to, if a message is published then we need to let them know.
* - 'webrtc signaling'
* - 'user count': I also want this to be live, so we need this to be a message
* - 'user data': If we want other users' usernames & avatars to update in real time, as well as their settings such as things like "deafened", some sort of status, we need this.
*/

// Let's also define some payload types for different events so we can keep things consistent.
export type MessagePayload = {
    roomId: string,
    message: string,
}

/**
 * Websocket controller to handle emitting events on a given socket.
 */
const WebSocketController = {
    emitToken(sock: ws, token: string) {
        sock.send(JSON.stringify({
            event: "token",
            payload: {
                token
            }
        }))
    },
    emitCredentials(sock: ws, creds: unknown) {
        sock.send(JSON.stringify({
            event: "credentials",
            payload: creds
        }));
    },
    emitRoomIndex(sock: ws, roomIndex: unknown) {
        sock.send(JSON.stringify({
           event: "room/index",
           payload: {
               rooms: roomIndex
           } 
        }));
    },
    emitRoomInfo(sock: ws, roomInfo: unknown) {
        sock.send(JSON.stringify({
            event: "room/info",
            payload: {
                room: roomInfo
            }
        }));
    },
    emitUserList(sock: ws, users: unknown) {
        sock.send(JSON.stringify({
            event: "user/index",
            payload: {
                users
            }
        }));
    },
    emitRoomMessage(sock: ws, room: string, message: Message) {
        sock.send(JSON.stringify({
            event: "room/message",
            payload: {
                room, 
                message 
            }
        }));
    },
    emitRoomHistory(sock: ws, room: string, messages: Array<Message>) {
        sock.send(JSON.stringify({
            event: "room/history",
            payload: {
                room, 
                history: messages 
            }
        }));
    },
    createRoomMessage(sock: ws, payload: MessagePayload) {
        // We need to send the message to all the users subscribed to the channel.
        const user = getUUIDBySocket(sock);
        if (!user) {
            console.error("[createRoomMessage] Invalid user");
            return;
        }
        publishMessage(user, payload);
    },
    setStreamState(sock: ws, payload: {room: string, state: {webcam: boolean, audio: boolean}, tracks: {webcam: string, audio: string}}) {
        const {room, state, tracks} = payload;
        const uuid = getUUIDBySocket(sock);
        if (!uuid || !state || !room)
            return;
        setUserStreamState(room, uuid, tracks);
    },
    // Router for user-generated messages
    messageRouter(this: ws, message: any) {
        const {event, payload} = JSON.parse(message);

        if (event === "room/createmessage") {
            WebSocketController.createRoomMessage(this, payload as MessagePayload)
        } 
        else if (event === "ping") {
            this.send(JSON.stringify({event: "pong"}));
        }
        else if (event === "room/deletemessage") {

        }
        else if (event === "room/setstreamstate") {
            WebSocketController.setStreamState(this, payload);
        }
        else if (event === "rtc/offer") {
            const ts = getSocketByUUID(payload.target);
            ts?.send(message);
        }
        else if (event === "rtc/answer") {
            const ts = getSocketByUUID(payload.target);
            ts?.send(message);
        }
        else if (event === "rtc/icecandidate") {
            const ts = getSocketByUUID(payload.target);
            ts?.send(message);
        }
        else if (event === "rtc/renegotiation") {
            const ts = getSocketByUUID(payload.target);
            ts?.send(message);
        }
        else if (event === "rtc/answerrenegotiation") {
            const ts = getSocketByUUID(payload.target);
            ts?.send(message);
        }
    }
}

export default WebSocketController;