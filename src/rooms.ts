// Rooms controller / router
import {Router} from "express";
import {uniqueId} from "lodash";

const router = Router();
type RoomEntry = {
    name: String,
    video: Boolean,
    audio: Boolean,
    screenshare: Boolean,
    locked: Boolean,
    users: Array<String>,
    lastActive: Number
}

const rooms: {[key: string]: RoomEntry} = {};

// Split passwords from the rooms object so updating the users of room changes is simple.
const passwords: {[key: string]: String} = {};

router.post("/create", (req, res) => {
    const {name, video, audio, screenshare, password} = req.body;
    const locked = req.body.private;

    // Create a new room with a unique ID, so we don't have any conflicts in room addresses
    const id = uniqueId();
    const entry: RoomEntry = {
        name,
        video,
        audio,
        screenshare,
        locked,
        lastActive: Date.now(),
        users: []
    }
    rooms[id] = entry;

    if (password)
        passwords[id] = password;

    // Send the user back the new successful room
    res.send(entry);
})

export default router;
export {rooms};