import { WebSocketServer } from 'ws';
import { MongoClient } from 'mongodb';
import redis from 'redis';
import dbModel from './model.js';
import getApp from './app.js';
import keepalive from './keepalive.js';

const {
	NODE_PORT,
	MONGO_HOSTNAME,
	MONGO_PORT,
	REDIS_HOSTNAME,
	REDIS_PORT
} = process.env;

const publisher = redis.createClient({
	url: `redis://${REDIS_HOSTNAME}:${REDIS_PORT}`,
	RESP: 3
});
const subscriber = publisher.duplicate();

Promise.all([
		new MongoClient(`mongodb://${MONGO_HOSTNAME}:${MONGO_PORT}`).connect(),
		publisher.connect(),
		subscriber.connect()
	]).then(([dbClient]) => {
		console.log('Connected to mongodb!');
		const model = dbModel(dbClient.db('chat').collection('chats'));

		const wss = new WebSocketServer({ port: NODE_PORT });
		const app = getApp(wss, model, publisher, subscriber);

		wss.on('connection', ws => {
			console.log(`New client connected to port ${NODE_PORT}!`);
			keepalive(ws);

			/***[ Message handling ]***/
			ws.on('message', (data, isBinary) => {
				const message = isBinary ? data : data.toString();
				app.dispatch(ws, message);
			});
		});
	}).catch(console.error);
