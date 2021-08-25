export default function getModel(collection) {
	const model = {};

	model.setup = function (roomList) {
		return collection.stats()
			.then(result => {
				if (result.count === 0) {
					console.log('Database empty: creating default rooms.');
					roomList.forEach(r => model.create(r.id));
				}
			})
			.catch(console.error);
	};

	model.get = function (room) {
		return collection.findOne({ _id: room })
			.catch(console.error);
	};

	model.create = function (room) {
		const obj = { _id: room, messages: [] };
		collection.insertOne(obj)
			.catch(console.error);
	};

	model.update = function (room, message) {
		collection.updateOne(
			{ _id: room },
			{ $push: { messages: message } }
		).then(result => {
			if (result.matchedCount === 0) {
				console.error('\x1b[31m%s\x1b[0m', '[Model update] No matching room for', room);
			}
		}).catch(console.error);

	};

	model.empty = function (room) {
		collection.updateOne(
			{ _id: room },
			{ $set: { messages: [] } }
		).catch(console.error);

	};

	model.delete = function (room) {
		collection.deleteOne({ _id: room })
			.catch(console.error);
	};

	return model;
}
