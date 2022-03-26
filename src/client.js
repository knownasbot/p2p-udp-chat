import { createSocket } from "dgram";
import { createHash } from "crypto";
import chalk from "chalk";

const socket = createSocket("udp4");

let serverIp;
let serverPort;
let room;

const args = process.argv.slice(2);
if (args.length > 0) {
    let server = args[0].split(":");
    room = args[1];
    if (!room)
        throw new Error("No room provided.");

    serverIp = server[0];
    serverPort = parseInt(server[1]);
} else {
    throw new Error("No server provided.");
}

let peerList = [];

// Retrieve peer list
console.log("[Room]", `Trying to retrieve the peer list of room "${room}"...`);
sendPeerListRequest();
setInterval(sendPeerListRequest, 5*60*1000);

/*
    0 = ping
    1 = peer list
    2 = message
*/
socket.on("message", (msg, rinfo) => {
    let id = msg[0];
    let data = msg.slice(1);

    if (rinfo.address == serverIp && rinfo.port == serverPort) {
        // Peer list
        if (id == 1) {
            data = JSON.parse(data);

            for (let peer of data) {
                let [ ip, port ] = peer.split(":");

                // Ping
                socket.send("\x00", port, ip);
            }

            console.log("[Room]", "Peers in the room: ", data.length + 1);
        }
    } else {
        let ipPort = rinfo.address + ":" + rinfo.port;

        // Ping
        if (id == 0) {
            if (!peerList.includes(ipPort)) {
                peerList.push(ipPort);
            } else {
                return;
            }

            return socket.send("\x00", rinfo.port, rinfo.address);
        // Message
        } else if (id == 2) {
            let nickname = createHash("md5").update(rinfo.address + rinfo.port).digest("hex").slice(0, 6);
            nickname = chalk.bgHex("#" + nickname)(`[${nickname}]`);

            console.log(new Date().toLocaleTimeString(), nickname + ":", data.toString());
        }
    }
});

/**
 * Sends a packet to the server asking for the peers in the room.
 */
function sendPeerListRequest() {
    return socket.send("\x01" + room, serverPort, serverIp, (err) => {
        if (err) console.error("Failed to retrieve the peer list:\n", err);
    });
}

/**
 * Sends a message to all peers in the list.
 * @param {string} content 
 */
function sendMessage(content) {
    content = content.trim();
    if (peerList.length < 1 || content.length < 1) return;

    for (let peer of peerList) {
        let [ ip, port ] = peer.split(":");

        sendPeerMessage(content, ip, parseInt(port));
    }

    console.log(new Date().toLocaleTimeString(), "[You]: " + content);
}

/**
 * Sends a message to a peer.
 * @param {string} content Message content.
 * @param {string} ip Peer ip.
 * @param {number} port Peer port.
 */
function sendPeerMessage(content, ip, port) {
    return socket.send("\x02" + content, port, ip, (err) => {
        if (err)
            return console.error(`Failed to send a message to "${ip}:${port}":\n`, err);
    });
}

process.stdin.on("data", c => sendMessage(c.toString()));