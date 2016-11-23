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
import sig from './scripts/signal';
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
		var signalingChannel = new SockSigChannel(sock);
	}

	handleError(err) {
		console.log(err);
	}

	handleClose() {
		console.log("server closed");
	}
};

/** SockSigChannel
 *
 * This class represents a raw socket signaling channel, primarily used
 * for signaling to from a bridge node. The implementation in this file uses
 * a node net.Socket, rather than a WebSocket, as in network.js.
 */
export class SockSigChannel {
	constructor(sock) {
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

	close() {
		this.sock.close();
	}

	on(type, id, callback) {
		sig.add_callback(this.callbacks, type, id, callback);
	}

	onSignal(data) {
		console.log(data);
		return 0;

		let msg = messages.decodeMessage(data);

		switch (msg.type) {
			case types.SIGNAL:
				// decode the actual signal message
				let payload = messages.decodeSignalingPayload(msg.payload);

				sig.invoke_static_callbacks(payload.type, payload.id, payload.data);
				sig.invoke_callbacks(this.callbacks, payload.type, payload.id, payload.data);

				break;
			default:
				console.log('bad message received');
		}
	}

	onClose(data) {
	}

	sendSignal(type, id, signal) {
		let payload = signal;
		let sig = messages.encodeSignalingPayload({
			'type': type,
		   	'id': id,
		   	'payload': payload});
		let message = messages.encodeMessage({
			'type': types.SIGNAL,
			'id': id,
			'payload': sig
		});
		this.send(message);
	}

	sendSDP(id, desc) {
		this.sendSignal(types.SIG_SDP, id, desc);
	}

	sendCandidate(id, candidate) {
		this.sendSignal(types.SIG_SDP, id, candidate);
	}
}

// open a server and start listening
let server = new SignalServer(9000);
server.listen();
