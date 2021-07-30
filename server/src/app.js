import WebSocket from "ws";

const WS_CHANNEL_PREFIX = "chat:messages.";

export default function getApp(wss, model, publisher, subscriber) {
    const app = {};

    subscriber.on("pmessage", (pattern, channel, message) => {
        console.log("Received pmessage through Redis:", pattern, channel, message);
        let room = channel.slice(WS_CHANNEL_PREFIX.length);
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN && client.user.room === room) {
                client.send(message);
            }
        });
    });

    subscriber.psubscribe(WS_CHANNEL_PREFIX + "*");

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

    return app;
}
