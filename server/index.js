import WebSocket from "ws";
import { MongoClient } from "mongodb";
import redis from "redis";
import dbModel from "./src/model.js";
import getApp from "./src/app.js";
import getBot from "./src/bot.js";

const {
	NODE_PORT,
	MONGO_HOSTNAME,
	MONGO_PORT,
	REDIS_HOSTNAME,
	REDIS_PORT
} = process.env;

const BOT_TRIGGER = '/';

let counter = 1;

new MongoClient(`mongodb://${MONGO_HOSTNAME}:${MONGO_PORT}`)
	.connect()
	.then(dbClient => {
		console.log("Connected to mongodb!");
		const model = dbModel(dbClient.db('chat').collection('chats'));
		model.setup(ROOM_LIST);

		const publisher = redis.createClient({
			url: `redis://${REDIS_HOSTNAME}:${REDIS_PORT}`
		});
		const subscriber = publisher.duplicate();

		const wss = new WebSocket.Server({ port: NODE_PORT });
		const app = getApp(wss, model, publisher, subscriber);

		wss.on("connection", ws => {
			console.log(`New client connected to port ${NODE_PORT}!`);
			ws.on("message", data => {
				console.log('New message received:', data);
				const message = JSON.parse(data);

				if (message.type === "user-connect") {
					ws.user = {
						name: message.user || "user" + counter++
					};
					app.send(ws, {
						type: "room-list",
						list: ROOM_LIST
					});

				} else if (message.type === "send-message") {
					app.saveAndBroadcast(message.room, {
						type: "push-message",
						value: message.value,
						time: Date.now(),
						author: ws.user.name
					});

					if (message.value.startsWith(BOT_TRIGGER)) {
						let bot = getBot(wss.clients);
						let response = bot.getMessage(message.value.slice(1), message.room);
						if (response) {
							app.saveAndBroadcast(message.room, {
								type: "push-message",
								value: response,
								time: Date.now(),
								author: "BOT"
							});
						}
					}

				} else if (message.type === "reset-room") {
					model.empty(message.room);
					app.broadcast(message.room, {
						type: "room-history",
						value: []
					})

				} else if (message.type === "select-room") {
					ws.user.room = message.value;
					model.get(message.value)
						.then(result => {
							app.send(ws, {
								type: "room-history",
								value: (result && result.messages) || []
							});
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
