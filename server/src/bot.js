// Simple bot (even if not built with the right relationship with the server)
export default function getBot(clients) {
    const bot = {};
    const COMMANDS = {
        'list-users': 'getUsersInRoom' // List users connected to this room
    };

    bot.getMessage = function (command, room) {
        let method = COMMANDS[command];
        return method && this[method] && this[method](room);
    };

    bot.getUsersInRoom = function (room) {
        let users = [];
        clients.forEach(c => {
            if (c.user.room === room) {
                users.push(c.user.name);
            }
        });
        return users.join(', ');
    };

    return bot;
}
