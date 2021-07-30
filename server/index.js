import WebSocket from "ws";
import { MongoClient } from "mongodb";
import dbModel from "./src/model.js";
import getBot from "./src/bot.js";

const {
	MONGO_HOSTNAME,
	MONGO_PORT,
	NODE_PORT
} = process.env;

const BOT_TRIGGER = '/';

let counter = 1;

const dbClient = new MongoClient(`mongodb://${MONGO_HOSTNAME}:${MONGO_PORT}`);
dbClient.connect()
	.then(client => {
		console.log("Connected to mongodb!");
		const db = client.db('chat').collection('chats');
		const model = dbModel(db);
		// ROOM_LIST.forEach(r => model.create(r.id));

		const wss = new WebSocket.Server({ port: NODE_PORT });

		wss.on("connection", ws => {
			console.log(`New client connected to port ${NODE_PORT}!`);
			ws.on("message", data => {
				console.log('New message received:', data);
				const message = JSON.parse(data);

				if (message.type === "user-connect") {
					ws.user = {
						name: message.user || "user" + counter++
					};
					let msg = {
						type: "room-list",
						list: ROOM_LIST
					};
					ws.send(JSON.stringify(msg));
				} else if (message.type === "send-message") {
					let msg = {
						type: "push-message",
						value: message.value,
						time: Date.now(),
						author: ws.user.name
					};
					model.update(message.room, msg);
					msg = JSON.stringify(msg);
					wss.clients.forEach(client => {
						if (client.readyState === WebSocket.OPEN && client.user.room === message.room) {
							client.send(msg);
						}
					});

					if (message.value.startsWith(BOT_TRIGGER)) {
						let bot = getBot(wss.clients);
						let response = bot.getMessage(message.value.slice(1), message.room);
						if (response) {
							let botMsg = {
								type: "push-message",
								value: response,
								time: Date.now(),
								author: "BOT"
							};
							model.update(message.room, botMsg);
							botMsg = JSON.stringify(botMsg);
							wss.clients.forEach(client => {
								if (client.readyState === WebSocket.OPEN && client.user.room === message.room) {
									client.send(botMsg);
								}
							});
						}
					}

				} else if (message.type === "reset-room") {
					model.empty(message.room);
					let msg = {
						type: "room-history",
						value: []
					};
					msg = JSON.stringify(msg);
					wss.clients.forEach(client => {
						if (client.readyState === WebSocket.OPEN && client.user.room === message.room) {
							client.send(msg);
						}
					});
				} else if (message.type === "select-room") {
					ws.user.room = message.value;
					model.get(message.value)
						.then(result => {
							let msg = {
								type: "room-history",
								value: result && result.messages,
							};
							ws.send(JSON.stringify(msg));
						});
				}
			});
		});
	}).catch(console.error);

const ROOM_LIST = [{
	id: "room1",
	name: "Room 1"
}, {
	id: "room2",
	name: "Room 2"
}, {
	id: "room3",
	name: "Room 3"
}];