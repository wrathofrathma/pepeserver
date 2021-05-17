import ws from "ws";
import users from "../data/users";
import {sockets} from "../data/users";

export type Subscriber = {
    uuid: String,
    socket: ws
}

export function getSubscriber(uuid: string) {
    if (users[uuid])
        return {uuid, socket: sockets[uuid]};
    return undefined;
}