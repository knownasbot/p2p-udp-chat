This is a project that I coded to learn how peer-to-peer applications work. Basically, the clients get public IPs and ports with the help of the server and try to connect to each other.

This article helped me a lot: https://bford.info/pub/net/p2pnat/index.html

![Demo](https://i.ibb.co/nw66ZDd/demo.png)

## Setup
1. Clone this repository;
2. Start the server on a specific fowarded port: edit the port in the file `src/server.js`, then `npm run server`;
3. Connect to the server using `npm start <IP:Port> <Room Name>`;
4. Have fun!