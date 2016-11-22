/** server.js
 *
 * This module contains the SignalServer abstraction which
 * is used by bridge nodes. This is a simple TCP/IP service that
 * allows for direct signaling to the OR on this network
 */

'use strict';

import net from 'net';
import Connection from './network';
import SockChannel from './signal';

const HOST = '127.0.0.1';

/** SignalServer
 *
 * This class implements the SignalServer abstraction, which is the primary
 * functionality of a bridge which differs from that of a client.
 */
export class SignalServer {
	constructor(port) {
		this.port = port;
		this.host = HOST;
		this.server = net.createServer(this.handleConnection);
	}

	listen() {
		this.server.listen(this.port, this.host);
	}

	handleConnection(sock) {
		let conn = new Connection(new SockChannel(sock));
	}
};

export default {
};
