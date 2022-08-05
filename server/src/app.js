import WebSocket from 'ws';
import getBot from './bot.js';

const WS_CHANNEL_PREFIX = 'chat:messages.';
const BOT_TRIGGER = '/';

/***[ Default rooms ]***/
const ROOM_LIST = [{
    id: 'room1',
    name: 'Room 1'
}, {
    id: 'room2',
    name: 'Room 2'
}, {
    id: 'room3',
    name: 'Room 3'
}];

export default function getApp(wss, model, publisher, subscriber) {
    const app = {};
    const ROUTE = {
        'user-connect': 'userConnect',
        'send-message': 'sendMessage',
        'select-room': 'selectRoom',
        'reset-room': 'resetRoom'
    };

    let counter = 1;

    /***[Database setup]***/
    model.setup(ROOM_LIST);

    /***[Message Broker setup]***/
    subscriber.pSubscribe(WS_CHANNEL_PREFIX + '*', (message, channel) => {
        console.log('Received pmessage through Redis:', channel, message);
        const room = channel.slice(WS_CHANNEL_PREFIX.length);
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN && client.user?.room === room) {
                // console.log('Sending message to client:', client.user?.name);
                client.send(message);
            }
        });
    });

    /***[Communication framework]***/
    app.send = function (client, msg) {
        client.send(JSON.stringify(msg));
    };

    app.saveAndBroadcast = function (room, msg) {
        model.update(room, msg);
        app.broadcast(room, msg);
    };

    app.broadcast = function (room, msg) {
        msg = JSON.stringify(msg);
        publisher.publish(WS_CHANNEL_PREFIX + room, msg);
    };

    /***[Message routing]***/
    app.dispatch = function (client, data) {
        console.log('New message received:', data);
        let msg;
        try {
            msg = JSON.parse(data);
        } catch (e) {
            console.error('Invalid message:', e);
        }

        const route = ROUTE[msg && msg.type];
        if (route) app[route](client, msg);
    };

    app.userConnect = function (client, msg) {
        client.user = {
            name: msg.user || 'user' + counter++
        };
        app.send(client, {
            type: 'room-list',
            list: ROOM_LIST
        });
    };

    app.sendMessage = function (client, msg) {
        app.saveAndBroadcast(msg.room, {
            type: 'push-message',
            value: msg.value,
            time: Date.now(),
            author: client.user?.name
        });

        if (msg.value.startsWith(BOT_TRIGGER)) {
            const bot = getBot(wss.clients);
            const response = bot.getMessage(msg.value.slice(1), msg.room);
            if (response) {
                app.saveAndBroadcast(msg.room, {
                    type: 'push-message',
                    value: response,
                    time: Date.now(),
                    author: 'BOT'
                });
            }
        }
    };

    app.selectRoom = function (client, msg) {
        if (!client.user) {
            console.error('[Select room] Invalid client');
            return;
        }
        client.user.room = msg.value;
        model.get(msg.value)
            .then(result => {
                app.send(client, {
                    type: 'room-history',
                    value: (result && result.messages) || []
                });
            });
    };

    app.resetRoom = function (client, msg) {
        model.empty(msg.room);
        app.broadcast(msg.room, {
            type: 'room-history',
            value: []
        });
    };

    return app;
}
