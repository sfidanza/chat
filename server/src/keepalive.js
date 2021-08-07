const HEARTBEAT_DELAY = 50000; // 50s as websocket inactivity timeout is 60s

export default function keepalive(ws) {
    let isAlive = true;

    ws.on('pong', () => {
        // console.log("%s answered", ws.user.name);
        isAlive = true;
    });

    const interval = setInterval(() => {
        if (isAlive === false) {
            console.log("Client [%s] is no more connected", ws.user.name);
            return ws.terminate();
        }
        isAlive = false;
        // console.log("Pinging %s", ws.user.name);
        ws.ping();
    }, HEARTBEAT_DELAY);

    ws.on('close', () => {
        console.log("%s closed connection", ws.user.name);
        clearInterval(interval);
    });
}
