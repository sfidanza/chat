export default function getModel(collection) {
	const model = {};

	model.get = function (room) {
		return collection.findOne({ _id: room })
			.catch(err => {
				console.error(err);
			});
	};

	model.create = function (room) {
		let obj = { _id: room, messages: [] };
		collection.insertOne(obj)
			.catch(err => {
				console.error(err);
			});
	};

	model.update = function (room, message) {
		collection.updateOne(
			{ _id: room },
			{ $push: { messages: message } }
		).catch(err => {
			console.error(err);
		});
	};

	model.delete = function (room) {
		collection.deleteOne({ _id: room })
			.catch(err => {
				console.error(err);
			});
	};

	return model;
}
