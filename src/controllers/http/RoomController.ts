import { NextFunction, Request, Response } from "express"
import {createRoom, rooms, passwords, joinRoom, leaveRoom} from "../../data/rooms";
import type {RoomEntry} from "../../data/rooms";
import {getSubscriber, Subscriber} from "../../data/subscribers";
import argon2 from "argon2";

const RoomController = {
    async create(req: Request, res: Response) {
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

        const encrypted_password = await argon2.hash(password);
        const room = createRoom(entry, encrypted_password);

        // Send the user back the new successful room
        res.send(room);
    },

    async join(req: Request, res: Response, next: NextFunction) {
        const {id} = req.params;
        const {password} = req.body;
        // Strip the user's uuid from the request that we attached it to from the auth middleware.
        const uuid = req.uuid;
        // check if room exists
        if (!rooms.hasOwnProperty(id)) {
            res.sendStatus(404);        
            return;
        }
        // Since we also attempt joining when the user enters the page, let's check if they're already in the room
        if (rooms[id].users.includes(uuid)) {
            // If they're in it, let's just remind them and not do anything data alterations.
            res.sendStatus(200);
            return;
        }

        // Check if the room is locked and the password matches
        if (passwords.hasOwnProperty(id)) {
            const valid_password = await argon2.verify(passwords[id], password);
            if (!valid_password) {
                res.sendStatus(403);
                return;
            }
        }

        // If we make it this far, we need to
        // 1. Add our user to the users in the chatroom
        rooms[id].users.push(uuid);

        // 3. Send the status back that we've joined successfully
        joinRoom(id, getSubscriber(uuid) as Subscriber);
        res.sendStatus(200);
    }, 

    leave(req: Request, res: Response, next: NextFunction) {
        const {id} = req.params;
        // Strip the user's uuid from the request that we attached it to from the auth middleware.
        const uuid = req.uuid;

        // check if room exists
        if (!rooms.hasOwnProperty(id)) {
            // If the room exists, just tell them it succeeded since they can't be in it anyways.
            res.sendStatus(200);        
            return;
        }

        // Remove the user and tell them it worked out.
        leaveRoom(id, getSubscriber(uuid) as Subscriber);
        res.sendStatus(200);
    }
}

export default RoomController;