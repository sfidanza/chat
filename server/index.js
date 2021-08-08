import WebSocket from 'ws';
import { MongoClient } from 'mongodb';
import redis from 'redis';
import dbModel from './src/model.js';
import getApp from './src/app.js';
import keepalive from './src/keepalive.js';

const {
	NODE_PORT,
	MONGO_HOSTNAME,
	MONGO_PORT,
	REDIS_HOSTNAME,
	REDIS_PORT
} = process.env;

new MongoClient(`mongodb://${MONGO_HOSTNAME}:${MONGO_PORT}`)
	.connect()
	.then(dbClient => {
		console.log('Connected to mongodb!');
		const model = dbModel(dbClient.db('chat').collection('chats'));

		const publisher = redis.createClient(`redis://${REDIS_HOSTNAME}:${REDIS_PORT}`);
		const subscriber = publisher.duplicate();

		const wss = new WebSocket.Server({ port: NODE_PORT });
		const app = getApp(wss, model, publisher, subscriber);

		wss.on('connection', ws => {
			console.log(`New client connected to port ${NODE_PORT}!`);
			keepalive(ws);

			/***[ Message handling ]***/
			ws.on('message', data => {
				app.dispatch(ws, data);
			});
		});
	}).catch(console.error);
