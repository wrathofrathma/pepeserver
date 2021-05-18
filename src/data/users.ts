import ws from 'ws';
import {uniqueId} from 'lodash';
import generateUsername from "trash-username-generator";
import WebSocketController from "../controllers/ws/WebSocketController";

export type User = {
    username: string,
    avatar: string,
    dead: boolean
}

// const users = new Map<String, User>();
const users: {[key: string]: User} = {};
export const sockets: {[key: string]: ws} = {};

/**
 * Publish the entire user index to all users. Kinda wasteful, butttt fuckkkittt
 */
function publishUserIndex() {
    for (const [key,socket] of Object.entries(sockets)) {
        WebSocketController.emitUserList(socket, users);
    }
}

export function getUUIDBySocket(socket: ws) {
    for (const [uuid, s] of Object.entries(sockets)) {
        if (s === socket)
            return uuid;
    }
    return ""
}

export function getUserByUUID(uuid: string) {
    if (users[uuid])
        return users[uuid];
    return undefined;
}

export function getSocketByUUID(uuid: string) {
    if (sockets[uuid])
        return sockets[uuid];
    return undefined;
}


/**
 * Creates a new user, updates everyone that someone has connected, and returns the new user's data. 
 * @param {ws} socket Websocket
 * @return {string, string, string} User's uuid, username, and avatar 
 */
export function createUser(socket: ws) {
    const uuid = uniqueId();
    const username = generateUsername();
    const avatar = ""; // TODO randomly select an avatar once we add them

    users[uuid] = {
        username,
        dead: false,
        avatar: ""
    };

    sockets[uuid] = socket;

    // Everyone should be interested in a new user being created, so we'll just update the user list
    publishUserIndex();
    return {uuid, username, avatar};
}

/**
 * Deletes the user from the user list and publishes the new user list.
 * @param {string} uuid User's uuid
 */
export function destroyUser(uuid: string) {
    // delete users[uuid];
    users[uuid].dead = true;
    delete sockets[uuid];
    publishUserIndex();
}

export default users;