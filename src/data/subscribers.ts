import ws from "ws";
import users from "../data/users";

export type Subscriber = {
    uuid: String,
    socket: ws
}

export function getSubscriber(uuid: string) {
    if (users.has(uuid))
        return {uuid, socket: users.get(uuid)?.socket};
    return undefined;
}