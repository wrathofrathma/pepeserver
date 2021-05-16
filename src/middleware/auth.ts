// Some basic auth middleware just making sure that there's a valid id token
import { NextFunction, Request, Response } from "express";
import jsonwebtoken from "jsonwebtoken";
import crypto from "crypto";

export const signature = crypto.randomBytes(20).toString('hex'); // Gonna generate the signature for the web token every time the server restarts.

function parseAuthToken(req: Request) {
    if (req.headers.authorization)
        return req.headers.authorization;
    return "";
}

export default function (req: Request, res: Response, next: NextFunction) {
    const token = parseAuthToken(req);

    return jsonwebtoken.verify(token, signature, (err, decoded) => {
        if (err) {
            next(new Error("Invalid token"));
        }

        req.uuid = (decoded as {data: {uuid: string}}).data.uuid;
        return next();
    })
}