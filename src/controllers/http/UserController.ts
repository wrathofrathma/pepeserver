import { Request, Response } from "express"
import {readdirSync} from "fs";
import {rerollUsername, updateAvatar} from "../../data/users";

const UserController = {
    avatarIndex(req: Request, res: Response) {
        const avatarList = readdirSync("dist/public/assets/avatars").map((val) => {
            return `https://pepeserver-2zjemde1b-wrathofrathma.vercel.app/assets/avatars/${val}`
        });
        res.send({
            avatars: avatarList
        })
    },
    updateAvatar(req: Request, res: Response) {
        const uuid = req.uuid;
        const {url} = req.body;

        if (!url) {
            res.sendStatus(404);
            return;
        }

        updateAvatar(uuid, url);
        res.sendStatus(200);
    },
    rerollUsername(req: Request, res: Response) {
        const uuid = req.uuid;
        const username = rerollUsername(uuid);
        res.status(200).send({username});
    }
}

export default UserController;
