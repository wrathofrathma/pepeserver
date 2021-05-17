import { uniqueId } from "lodash";
import type {Subscriber} from "./subscribers";
import lodash from "lodash";
import WebSocketController from "../controllers/ws/WebSocketController";
import type {MessagePayload} from "../controllers/ws/WebSocketController";
import { getSocketByUUID } from "./users";
import ws from "ws";

export type RoomEntry = {
    name: String,
    video: Boolean,
    audio: Boolean,
    screenshare: Boolean,
    locked: Boolean,
    users: Array<String>,
    lastActive: Number
}

export type Message = {
    uuid: String
    userId: String,
    contents: String,
    timestamp: Number,
}

export const rooms: {[key: string]: RoomEntry} = {};
export const messages: {[key: string]: Array<Message>} = {};

// Split passwords from the rooms object so updating the users of room changes is simple.
export const passwords: {[key: string]: string} = {};

const subscriptions = {
    index: new Array<Subscriber>(),
    rooms: new Map<String, Array<Subscriber>>()
}

/**
 * Publishes the update of the room index to subscribers.
 */
function publishIndexUpdate() {
    subscriptions.index.forEach((subscriber) => {
        WebSocketController.emitRoomIndex(subscriber.socket, rooms);
    })
}

function publishRoomUpdate(roomId: string) {
    subscriptions.rooms.get(roomId)?.forEach((subscriber) => {
        WebSocketController.emitRoomInfo(subscriber.socket, {
            id: roomId,
            room: rooms[roomId]
        })
    });
}

/**
 * Subscribe to the events of the room index or a specific room.
 * @param {string} key What type of subscription is it?
 * @param {Subscriber} subscriber Subscriber data
 * @param {string} subkey Room key if we're subscribing to a room
 */
export function subscribe(key: string, subscriber: Subscriber, subkey: string = "") {
    // TODO - Check if the subscriber already exists.
    if (key === "index") {
        subscriptions.index.push(subscriber);
    }
    else if (key === "room" && subkey) {
        if (subscriptions.rooms.has(subkey)) {
            subscriptions.rooms.get(subkey)?.push(subscriber)
        }
    }
}

/**
 * Unsubscribe from the events of the room index or a specific room.
 * @param {string} key What type of subscription is it?
 * @param {Subscriber} subscriber Subscriber data
 * @param {string} subkey Room key if we're subscribing to a room
 */
export function unsubscribe(key: string, subscriber: Subscriber, subkey: string = "") {
    // TODO Make this less shit
    if (key === "index") {
        lodash.remove(subscriptions.index, (sub) => {
            if (sub.uuid === subscriber.uuid)
                return true;
            return false;
        });
    }

    else if (key === "room" && subkey) {
        lodash.remove(subscriptions.rooms.get(subkey) as Array<Subscriber>, (sub) => {
            return sub.uuid === subscriber.uuid;
        });
    }
}

/**
 * Unsubscribes a user from all room related subscriptions.
 * @param {Subscriber} subscriber Subscriber info
 */
export function unsubscribeAll(subscriber: Subscriber) {
    lodash.remove(subscriptions.index, (sub) => {
        if (sub.uuid === subscriber.uuid)
            return true;
        return false;
    });
    for (const [key, val] of subscriptions.rooms.entries()) { 
        lodash.remove(val, (sub) => {
            return sub.uuid === subscriber.uuid;
        })
    }
}

/**
 *  Creates a new chatroom and notifies subscribers of the room index that a new room is available. 
 * @param {RoomEntry} entry The RoomEntry containing the data of our room settings.
 * @param {string} password An optional room password.
 * @returns {}
 */
export function createRoom(entry: RoomEntry, password: string) {
    // Create a new room with a unique ID, so we don't have any conflicts in room addresses
    const id = uniqueId();
    rooms[id] = entry;

    // Track the password if it exist
    if (password)
        passwords[id] = password;

    // Create the subscription object for this room so users can track it.
    subscriptions.rooms.set(id, []);
    
    // Now we need to update the subscribers.
    publishIndexUpdate();

    // Create the room's message store
    messages[id] = [];

    // Return the room & room id 
    return {...rooms[id],id};
}


/**
 * Removes an inactive room, cleans up subscribers, and notifies users of the room index updating.
 * @param {string} roomId Room ID
 */
export function removeRoom(roomId: string) {
    if (rooms[roomId]) {
        // We should just be able to delete it since we only really delete when there's no users in it after some time period
        delete rooms[roomId];
        delete messages[roomId];
        // Clean up the subscribers of this channel
        subscriptions.rooms.delete(roomId);
        // Notify the peeps
        publishIndexUpdate();
    }
}

/**
 * Joins and subscribes a user to a specific room.
 * @param {string} roomId Room ID
 * @param {Subscriber} subscriber Subscriber info
 */
export function joinRoom(roomId: string, subscriber: Subscriber) {
    subscriptions.rooms.get(roomId)?.push(subscriber);
    publishIndexUpdate();
    publishRoomUpdate(roomId);
}

/**
 * Leaves and unsubscribes a user from a room.
 * @param {string} roomId Room ID
 * @param {Subscriber} subscriber Subscriber info
 */
export function leaveRoom(roomId: string, subscriber: Subscriber) {
    lodash.remove(subscriptions.rooms.get(roomId) as Array<Subscriber>, (sub) => {
        return sub.uuid === subscriber.uuid;
    });
    publishIndexUpdate();
    publishRoomUpdate(roomId);
}

/**
 * Leaves and unsubscribes a user from all rooms
 * @param {Subscriber} subscriber Subscriber info
 */
export function leaveAll(subscriber: Subscriber) {
    for (const [key, val] of Object.entries(rooms)) { 
        lodash.remove(val.users, (sub) => {
            if (sub === subscriber.uuid) {
                publishIndexUpdate();
                publishRoomUpdate(key);
            }
            return sub === subscriber.uuid;
        })
    }
}

/**
 * Deletes a room message.
 * @param uuid Message uuid
 * @param userId User's uuid
 */
export function destroyMessage(uuid: string, userId: string) {

}

/**
 * Publishes a room message to all the users listening.
 * @param uuid User's uuid
 * @param payload Message to be published
 */
export function publishMessage(uuid: string, payload: MessagePayload) {
    console.log("publish message", payload);
    console.log("Previous messages", messages[payload.roomId])
    if (!messages[payload.roomId])
        return
    // Create message
    const message: Message = {
        uuid: uniqueId(),
        userId: uuid,
        contents: payload.message,
        timestamp: Date.now()
    }

    // Save it to the message db
    messages[payload.roomId].push(message);

    console.log("Publishing message", payload);
    // publish it to users in the channel
    for (const userId of rooms[payload.roomId].users) {
        console.log("Publishing to?", userId)
        const socket = getSocketByUUID(userId as string);
        if (!socket)
            continue;
        WebSocketController.emitRoomMessage(socket as ws, payload.roomId, message);
    }
}