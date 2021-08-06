const TPL_ROOM_ADMIN = (r) => `<li>${r} - <a class="action" onclick="chat.delete('${r}'); return false;">remove</a></li>`;
const TPL_ROOM = (r) => `<li data-room="${r.id}">${r.name}</li>`;
const TPL_CHAT = (m) => `<dt>${m.author}</dt><dd>${m.value}</dd>`;

const chat = {};
const io = new WebSocket(`ws://${location.host}/ws/`);

chat.init = function () {
    let params = new URLSearchParams(location.search.substring(1));
    chat.user = params.get('user');
    chat.admin = (params.get('admin') != null);

    io.onopen = chat.onSocketOpen.bind(chat);
    io.onmessage = chat.onSocketMessage.bind(chat);
};

chat.onSocketOpen = function (event) {
    chat.send({
        type: "user-connect",
        user: chat.user
    });
};

chat.onSocketMessage = function (event) {
    console.log("Received:", event.data);
    let data = JSON.parse(event.data);
    if (data.type === 'room-list') {
        chat.displayRooms(data.list);
    } else if (data.type === 'push-message') {
        chat.addMessage(data);
    } else if (data.type === 'room-history') {
        chat.displayMessages(data.value);
    }
};

chat.displayRooms = function (rooms) {
    let contents = '';
    if (rooms && rooms.length) {
        contents = rooms.reduce((str, room) => str + TPL_ROOM(room), '');
    }
    const container = document.getElementById('rooms');
    container.innerHTML = contents;
    chat.selectFirstRoom();
};

chat.addMessage = function (msg) {
    const container = document.getElementById('room-content');
    container.innerHTML += TPL_CHAT(msg);
    container.scrollTo(0, container.scrollTopMax);
};

chat.clearMessages = function () {
    const container = document.getElementById('room-content');
    container.innerHTML = "";
};

chat.displayMessages = function (msgs) {
    const container = document.getElementById('room-content');
    let html = msgs.map(msg => TPL_CHAT(msg));
    container.innerHTML = html.join("");
    container.scrollTo(0, container.scrollTopMax);
};

chat.send = function (msg) {
    console.log("Sending:", msg);
    io.send(JSON.stringify(msg));
};

chat.sanitize = function (text) {
    return text;
};

chat.post = function (text) {
    chat.send({
        type: "send-message",
        value: this.sanitize(text),
        room: this.activeRoom
    });
};

chat.resetRoom = function () {
    if (!this.activeRoom) return;
    chat.send({
        type: "reset-room",
        room: this.activeRoom
    });
};

chat.deleteRoom = function () {
    if (!this.activeRoom) return;
    chat.send({
        type: "delete-room",
        room: this.activeRoom
    });
};

chat.createRoom = function () {
    chat.send({
        type: "create-room",
        value: "Room 3",
        room: "room3"
    });
};

chat.selectFirstRoom = function () {
    let firstRoom = document.querySelector("#rooms li");
    if (firstRoom) {
        chat.selectRoom(firstRoom.dataset.room, firstRoom);
    }
};

chat.onSelectRoom = function (e) {
    let target = e.target;
    if (target.dataset.room) {
        chat.selectRoom(target.dataset.room, target);
    }
};

chat.selectRoom = function (room, roomElement) {
    if (room !== this.activeRoom) {
        if (this.activeRoomElement) {
            this.activeRoomElement.classList.remove("active");
        } else {
            document.querySelector("#room-content").classList.remove("hidden");
            document.querySelector("#user-entry").classList.remove("hidden");
            if (chat.admin) {
                document.querySelector("#admin-panel").classList.remove("hidden");
            }
        }
        this.activeRoom = room;
        this.activeRoomElement = roomElement;
        roomElement.classList.add("active");

        chat.send({
            type: "select-room",
            value: this.activeRoom
        });
    }
};

window.addEventListener("load", function () {
    chat.init();
}, false);
