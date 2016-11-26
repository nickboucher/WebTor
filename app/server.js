/** server.js
 *
 * This module contains the SignalServer abstraction which
 * is used by bridge nodes. This is a simple TCP/IP service that
 * allows for direct signaling to the OR on this network
 */

'use strict';

import net from 'net';
import network from './scripts/network';
import types from './scripts/messagetypes';
import messages from './scripts/messages';
import {SockSigChannel} from './scripts/signal';
import or from './scripts/or';

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
		this.server.on('error', this.handleError);
		this.server.on('close', this.handleClose);
	}

	listen() {
		this.server.listen(this.port, () => {
			console.log("listening...");
		});
	}

	handleConnection(sock) {
		console.log("got connection...");
		// just create a new signaling channel, which will handle all its
		// own shit with callbacks
		// note that this is intentionally global-scoped--deletion should
		// happen as a response to a closed socket
		var signalingChannel = new ServerSockSigChannel(sock);
	}

	handleError(err) {
		console.log(err);
	}

	handleClose() {
		console.log("server closed");
	}
}

class ServerSockSigChannel extends SockSigChannel {
	constructor(sock) {
		super();
		this.sock = sock;
		this.callbacks = {};

		if (sock != null) {
			this.sock.on('data', this.onSignal);
			this.sock.on('close', this.onClose);
		}
	}

	open(host, port) {
		if (this.sock != null) {
			this.sock.close();
		}

		this.sock = new net.Socket();
		this.sock.connect(port, host);
		this.sock.on('data', this.onSignal);
		this.sock.on('close', this.onClose);
	}
}

// open a server and start listening
let server = new SignalServer(9000);
server.listen();
