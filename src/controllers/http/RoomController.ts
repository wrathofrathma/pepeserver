import { NextFunction, Request, Response } from "express"
import {createRoom, rooms, passwords, joinRoom} from "../../data/rooms";
import type {RoomEntry} from "../../data/rooms";
import {getSubscriber, Subscriber} from "../../data/subscribers";

const RoomController = {
    create(req: Request, res: Response) {
        const {name, video, audio, screenshare, password} = req.body;
        const locked = req.body.private;

        const entry: RoomEntry = {
            name,
            video,
            audio,
            screenshare,
            locked,
            lastActive: Date.now(),
            users: []
        }

        const room = createRoom(entry, password);

        // Send the user back the new successful room
        res.send(room);
    },

    join(req: Request, res: Response, next: NextFunction) {
        const {id} = req.params;
        const {password} = req.body;
        // check if room exists
        if (!rooms.hasOwnProperty(id)) {
            res.sendStatus(404);        
        }

        // Check if the room is locked and the password matches
        if (passwords.hasOwnProperty(id)) {
            if (passwords[id] !== password) {
                res.sendStatus(403);
            }
        }

        // Strip the user's uuid from the request that we attached it to from the auth middleware.
        const uuid = req.uuid;
        // If we make it this far, we need to
        // 1. Add our user to the users in the chatroom
        rooms[id].users.push(uuid);

        // 3. Send the status back that we've joined successfully
        joinRoom(id, getSubscriber(uuid) as Subscriber);
        res.sendStatus(200);
    }, 

    leave() {

    }
}

export default RoomController;