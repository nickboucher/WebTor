/** server.js
 *
 * This module contains the SignalServer abstraction which
 * is used by bridge nodes. This is a simple TCP/IP service that
 * allows for direct signaling to the OR on this network
 */

'use strict';

import net from 'net';
import ws from 'nodejs-websocket';
import types from './scripts/messagetypes';
import messages from './scripts/messages';
import {SignalChannel} from './scripts/signal';

let debug = (string) => {
	console.log(string);
};

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
		this.server = ws.createServer(this.handleConnection);
		this.server.on('error', this.handleError);
		this.server.on('close', this.handleClose);
	}

	listen() {
		this.server.listen(this.port, () => {
			debug("listening");
		});
	}

	handleConnection(conn) {
		debug("got connection");
		// just create a new signaling channel, which will handle all its
		// own shit with callbacks
		// note that this is intentionally global-scoped--deletion should
		// happen as a response to a closed socket
		var signalingChannel = new ServerSockSigChannel(conn);
	}

	handleError(err) {
		debug(err);
	}

	handleClose() {
		console.log("server closed");
	}
}

var open_sockets = {};

class ServerSockSigChannel extends SignalChannel {
	constructor(sock) {
		super();
		this.sock = sock;
		this.callbacks = {};
		this.sig_buf = Buffer.alloc(0);

		this.forwardSignal = this.forwardSignal.bind(this);
		this.forwardSignalRandom = this.forwardSignalRandom.bind(this);
		this.handleSigID = this.handleSigID.bind(this);
		this.handleReqPeerlist = this.handleReqPeerlist.bind(this);
		this.logSignal = this.logSignal.bind(this);

		this.on(null, null, this.forwardSignal);
		this.on(null, 0, this.forwardSignal);
		this.on(types.SIG_ID, null, this.handleSigID);
		this.on(null, null, this.logSignal);

		if (sock != null) {
			this.sock.on('binary', (stream) => {
				stream.on('data', this.handleSignal);
			});
			this.sock.on('close', this.handleClose);
		}
	}

	forwardSignal(signal, type, id) {
		if (id != this.id && id in open_sockets) {
			debug('forwarding a normal message');
			// forward other packets w/ a defined id
			open_sockets[id].sendSignal(type, id, signal);
		}
	}

	forwardSignalRandom(signal, type, id) {
		debug('forwarding msg to random recipient');
		// if id isn't specified, connect to a random socket
		let key = Object.keys(open_sockets);
		if (key.length === 0) {
			debug('no one to send to');
		} else { 
			let index = Math.floor(Math.random() * (key.length));
			if (key[index] !== this.id) {
				open_sockets[key[index]].sendSignal(type, id, signal);
			}
		}
	}

	handleSigID(signal, type, id) {
		debug('connection from: ' + id);
		this.id = id;
		this.pub = signal.pub;
		// identify this open socket so we can receive data
		open_sockets[this.id] = this;
		this.on(types.SIG_REQ_PEERLIST, this.id, this.handleReqPeerlist);
	}

	handleReqPeerlist(signal, type, id) {
		if (Object.keys(open_sockets).length > 1) {
			debug("sending peerlist");
			let peers = [];
			for (let peerid in open_sockets) {
				if (open_sockets.hasOwnProperty(peerid) && peerid != this.id) {
					debug(peerid);
					peers.push({
						id: open_sockets[peerid].id,
						pub: open_sockets[peerid].pub
					});
				}
			}
			this.sendSignal(types.SIG_PEERLIST, id, peers);
		} else {
			debug("no peers");
			this.sendSignal(types.SIG_ERROR, id, {reason: types.REASON_NOPEERS});
		}
	}

	logSignal(signal, type, id) {
		debug('got signal: ' + id + ' : ' + type + ' :: ');
		debug(signal);
	}

	sendSignal(type, id, signal) {
		debug("sending message: " + type);
		let message = this.buildSignal(type, id, signal);
		this.sendMessage(message);
	}

	sendMessage(message) {
		// just send the raw data
		this.sock.send(message);
	}

	handleSignal(chunk) {
		debug("got " + chunk.length + " bytes");

		// append the chunk
		if (chunk) {
			this.sig_buf = Buffer.concat([this.sig_buf, chunk]);
		}

		// wait for more data
		if (this.sig_buf.length < 6) {
			return;
		}

		let size = this.sig_buf.readUInt32LE(2);

		// wait for more data
		if (this.sig_buf.length < 6 + size) {
			return;
		}

		// pull of the first message
		let msg_buf = this.sig_buf.slice(0,6 + size);
		this.sig_buf = this.sig_buf.slice(6 + size);

		super.handleSignal(msg_buf);

		// call it again if we still have more data left
		if (this.sig_buf.length !== 0) {
			this.handleSignal();
		}
	}

	open(host, port) {
		if (this.sock != null) {
			this.sock.close();
		}

		this.sock = new net.Socket();
		this.sock.connect(port, host);
		this.sock.on('text', this.handleSignal);
		this.sock.on('close', this.handleClose);
	}

	handleClose() {
		debug('connection closed');
		if (this.id in open_sockets) {
			delete open_sockets[this.id];
			console.log(typeof open_sockets[this.id]);
		}
	}
}

// open a server and start listening
let server = new SignalServer(9000);
server.listen();
