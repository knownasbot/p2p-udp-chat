import { createSocket } from "dgram";
import { createHash } from "crypto";

let socket = createSocket("udp4");
let port = 25565;

let rooms = new Map();

let interval = 5*60*1000;
setInterval(() => {
    rooms.forEach((room, k) => {
        if (room.lastActivity + interval < Date.now()) {
            rooms.delete(k);
        } else {
            room.peers.forEach((peer, i) => {
                if (peer.lastActivity + interval < Date.now()) {
                    room.splice(i);
                }
            });
        }
    });
}, interval);

socket.on("message", (msg, rinfo) => {
    let msgId = msg[0];
    let ipPort = rinfo.address + ":" + rinfo.port;

    // Update the connection list
    if (msgId == 1) {
        let roomId = createHash("md5").update(msg).digest("hex").toString();
        let room = rooms.get(roomId);
        if (!room) {
            room = {
                peers: []
            };
        }

        room.lastActivity = Date.now();
        rooms.set(roomId, room);

        // Add peer
        if (!room.peers.includes(ipPort)) {
            room.peers.push({
                lastActivity: Date.now(),
                ipPort
            });
        }

        // Return peer list
        for (let peer of room.peers) {
            let [ ip, port ] = peer.ipPort.split(":");
            port = parseInt(port);

            let peerList = [];

            for (let p of room.peers) {
                if (p.ipPort == peer.ipPort) continue;

                peerList.push(p.ipPort);
            }

            // id, peer list
            socket.send("\x01" + JSON.stringify(peerList), port, ip, (err) => {
                if (err)
                    return console.error(`Failed to send the peer list of room "${roomId}" to the peer ${ipPort}:\n`, err);
            });
        }
    }
});

socket.bind(port, () => console.log(`Server listening on port ${port}!`))