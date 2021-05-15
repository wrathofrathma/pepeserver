import ws from 'ws';

export type User = {
    username: string,
    avatar: string,
    socket: ws 
}

const users = new Map<String, User>();

export default users;