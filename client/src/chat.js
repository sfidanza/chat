import { video } from './video.js';

const TPL_ROOM_ADMIN = (r) => `<li>${r} - <a class="action" onclick="chat.delete('${r}'); return false;">remove</a></li>`;
const TPL_ROOM = (r) => `<li data-room="${r.id}">${r.name}</li>`;
const TPL_CHAT = (m) => `<dt>${m.author}</dt><dd>${m.value}</dd>`;

export const chat = {
    video
};
window.chat = chat; // make chat callable from global scope so it can be used from html

chat.init = function () {
    const params = new URLSearchParams(location.search.substring(1));
    chat.user = params.get('user');
    chat.admin = (params.get('admin') != null);

    const protocol = (location.protocol === 'https:') ? 'wss:' : 'ws:';
    this.io = new WebSocket(`${protocol}//${location.host}/ws/`);
    this.io.onopen = chat.onSocketOpen.bind(chat);
    this.io.onmessage = chat.onSocketMessage.bind(chat);
    this.io.onclose = chat.onSocketClose.bind(chat);
    this.io.onerror = chat.onSocketError.bind(chat);
};

chat.onSocketOpen = function (event) {
    chat.send({
        type: 'user-connect',
        user: chat.user
    });
};

chat.onSocketError = function (event) {
    console.error(event);
};

chat.onSocketClose = function (event) {
    chat.displayDisconnect();
};

chat.onSocketMessage = function (event) {
    const data = JSON.parse(event.data);
    if (data.type === 'room-list') {
        chat.displayRooms(data.list);
    } else if (data.type === 'room-history') {
        chat.displayMessages(data.value);
    } else if (data.type === 'push-message') {
        chat.addMessage(data);
    }
};

chat.displayRooms = function (rooms) {
    const container = document.getElementById('rooms');
    const html = rooms?.map(room => TPL_ROOM(room)) ?? [];
    container.innerHTML = html.join('');
    chat.selectFirstRoom();
};

chat.displayMessages = function (msgs) {
    const container = document.getElementById('room-content');
    const html = msgs?.map(msg => TPL_CHAT(msg)) ?? [];
    container.innerHTML = html.join('');
    container.scrollTo(0, container.scrollTopMax);
};

chat.addMessage = function (msg) {
    const container = document.getElementById('room-content');
    container.innerHTML += TPL_CHAT(msg);
    container.scrollTo(0, container.scrollTopMax);
};

chat.displayDisconnect = function () {
    document.querySelector('#disconnected-overlay').classList.remove('hidden');
};

chat.send = function (msg) {
    this.io.send(JSON.stringify(msg));
};

chat.sanitize = function (text) {
    return text;
};

chat.post = function (text) {
    chat.send({
        type: 'send-message',
        value: this.sanitize(text),
        room: this.activeRoom
    });
};

chat.resetRoom = function () {
    if (!this.activeRoom) return;
    chat.send({
        type: 'reset-room',
        room: this.activeRoom
    });
};

chat.deleteRoom = function () {
    if (!this.activeRoom) return;
    chat.send({
        type: 'delete-room',
        room: this.activeRoom
    });
};

chat.createRoom = function () {
    chat.send({
        type: 'create-room',
        value: 'Room 4',
        room: 'room4'
    });
};

chat.selectFirstRoom = function () {
    const firstRoom = document.querySelector('#rooms li');
    if (firstRoom) {
        chat.selectRoom(firstRoom.dataset.room, firstRoom);
    }
};

chat.onSelectRoom = function (e) {
    const target = e.target;
    if (target.dataset.room) {
        chat.selectRoom(target.dataset.room, target);
    }
};

chat.selectRoom = function (room, roomElement) {
    if (room !== this.activeRoom) {
        if (this.activeRoomElement) {
            this.activeRoomElement.classList.remove('active');
        } else {
            document.querySelector('#room-content').classList.remove('hidden');
            document.querySelector('#user-entry').classList.remove('hidden');
            if (chat.admin) {
                document.querySelectorAll('[data-admin]').forEach(item => {
                    item.classList.remove('hidden');
                });
                // document.querySelector('#admin-panel').classList.remove('hidden');
            }
        }
        this.activeRoom = room;
        this.activeRoomElement = roomElement;
        roomElement.classList.add('active');

        chat.send({
            type: 'select-room',
            value: this.activeRoom
        });
    }
};

window.addEventListener('load', function () {
    chat.init();
}, false);
