const TPL_ROOM_ADMIN = (r) => `<li>${r} - <a class="action" onclick="chat.delete('${r}'); return false;">remove</a></li>`;
const TPL_ROOM = (r) => `<li data-room="${r.id}">${r.name}</li>`;
const TPL_CHAT = (m) => `<dt>${m.author}</dt><dd>${m.value}</dd>`;

const chat = {};
const io = new WebSocket("ws://localhost:8080/ws/");

chat.init = function() {
    let params = new URLSearchParams(document.location.search.substring(1));
    chat.user = params.get('user');

    io.onopen = chat.onSocketOpen.bind(chat);
    io.onmessage = chat.onSocketMessage.bind(chat);
};

chat.onSocketOpen = function (event) {
    let msg = {
        type: "user-connect",
        user: chat.user
    };
    io.send(JSON.stringify(msg));
};

chat.onSocketMessage = function (event) {
    console.log(event.data);
    let data = JSON.parse(event.data);
    if (data.type === 'room-list') {
        chat.displayRooms(data.list);
    } else if (data.type === 'push-message') {
        chat.addMessage(data);
    } else if (data.type === 'room-history') {
        chat.displayMessages(data.value);
    }
};

chat.simpleMessage = function (type) {
    return JSON.stringify({ type });
};

chat.displayRooms = function (rooms) {
    let contents = '';
    if (rooms && rooms.length) {
        contents = rooms.reduce((str, room) => str + TPL_ROOM(room), '');
    }
    const container = document.getElementById('rooms');
    container.innerHTML = contents;
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

chat.sanitize = function (text) {
    return text;
};

chat.post = function (text) {
    let msg = {
        type: "send-message",
        value: this.sanitize(text),
        room: this.activeRoom
    };
    io.send(JSON.stringify(msg));
};

chat.selectRoom = function (e) {
    let target = e.target;
    if (target.dataset.room && target.dataset.room !== this.activeRoom) {
        if (this.activeRoomElement) {
            this.activeRoomElement.classList.remove("active");
        } else {
            document.querySelector("#room-content").classList.remove("hidden");
            document.querySelector("#user-entry").classList.remove("hidden");
        }
        this.activeRoom = target.dataset.room;
        this.activeRoomElement = target;
        target.classList.add("active");

        let msg = {
            type: "select-room",
            value: this.activeRoom
        };
        io.send(JSON.stringify(msg));

        // this.clearMessages();
    }
};

window.addEventListener("load", function() {
	chat.init();
}, false);
