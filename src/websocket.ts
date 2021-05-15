import ws from 'ws';
import users from './users';

import {uniqueId} from 'lodash';

const server = new ws.Server({noServer: true});

server.on('connection', (sock, req) => {
    users.set(uniqueId(), {
        username: "",
        socket: sock
    });

    sock.on('close', () => {
        // Remove the user from the users list
        for (const [key, val] of users.entries()) {
            if (val.socket === sock) {
                users.delete(key);
                break;
            }
        }
    })
});

export default server;