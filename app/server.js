/** server.js
 *
 * This module contains the SignalServer abstraction which
 * is used by bridge nodes. This is a simple TCP/IP service that
 * allows for direct signaling to the OR on this network
 */

'use strict';

import webrtc from 'wrtc';
//for (let name of webrtc) {
	//global[name] = webrtc[name];
//}

import ws from 'nodejs-websocket';
import network from './scripts/network';
import types from './scripts/messagetypes';
import messages from './scripts/messages';
import {SockSigChannel} from './scripts/signal';
import or from './scripts/or';

const HOST = '127.0.0.1';

network.start();

/** SignalServer
 *
 * This class implements the SignalServer abstraction, which is the primary
 * functionality of a bridge which differs from that of a client.
 */
export class SignalServer {
	constructor(port) {
		this.port = port;
		this.host = HOST;
		this.server = ws.createServer(this.handleConnection);
		this.server.on('error', this.handleError);
		this.server.on('close', this.handleClose);
	}

	listen() {
		this.server.listen(this.port, () => {
			console.log("listening...");
		});
	}

	handleConnection(conn) {
		console.log("got connection...");
		// just create a new signaling channel, which will handle all its
		// own shit with callbacks
		// note that this is intentionally global-scoped--deletion should
		// happen as a response to a closed socket
		var signalingChannel = new ServerSockSigChannel(conn);
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
		this.sig_buf = Buffer.alloc(0);

		if (sock != null) {
			this.sock.on('binary', (stream) => {
				stream.on('data', this.onSignal);
			});
			this.sock.on('close', this.onClose);
		}
	}

	onSignal(chunk) {
		console.log("Got " + chunk.length + " bytes");
		if (chunk) {
			this.sig_buf = Buffer.concat([this.sig_buf, chunk]);
		}

		if (this.sig_buf.length < 10) {
			return;
		}

		let size = this.sig_buf.readUInt32LE(2);

		let signal = this.sig_buf.slice(0,10 + size);
		this.sig_buf = this.sig_buf.slice(10 + size);
		super.onSignal(signal);

		// call it again if we still have more data left
		if (this.sig_buf.length !== 0) {
			this.onSignal()
		}
	}

	open(host, port) {
		if (this.sock != null) {
			this.sock.close();
		}

		this.sock = new net.Socket();
		this.sock.connect(port, host);
		this.sock.on('text', this.onSignal);
		this.sock.on('close', this.onClose);
	}
}

// open a server and start listening
let server = new SignalServer(9000);
server.listen();
