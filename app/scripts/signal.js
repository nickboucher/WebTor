/** signal.js
 *
 * This module handles the signaling mechanisms for the WebTor projects
 */

'use strict';

import messages from './messages';
import types from './messagetypes';
import {Connection, Channel} from './network';

// this variable is used by all signaling channel types, and it allows
// callbacks to be added to abstract signal channels so that messages of
// any type from any source may be intercepted
let static_callbacks = {};

/** PeerSigRouter
 *
 * This class is the abstract routing protocol which
 * implements the signal routing algorithm based on its open
 * data channel connections. It also handles the general maintenence of
 * the desired network connectivity properties by closing and opening
 * connections as appropriate
 */
export class PeerSigRouter {
	constructor() {
		this.sigchannels = {};
	}

	addPeerSigChannel(chan) {
		this.sigchannels[chan.id] = chan;
	}

	on(type, id, callback) {
	}

	onSignal(data) {
	}

	sendSignal(id, signal) {
	}

	sendSDP(id, desc) {
	}

	sendCandidate(id, candidate) {
	}
}

/** PeerSigChannel
 *
 * This class is the abstraction for a signaling channel
 * implemented over the tor network. Several of these
 * can be used together to do signaling using a PeerSigRouter.
 */
export class PeerSigChannel extends Channel {
	constructor(conn, circID, options = { ordered: true }) {
		super(conn, circID, options);
		super.on(types.SIGNAL, this.onSignal);
	}

	on(type, id, callback) {
		add_callback(this.callbacks, type, id, callback);
	}

	onSignal(data) {
	}

	/** sendSignal
	 *
	 * Send a signaling message on the channel.
	 */
	sendSignal(id, signal) {
	}

	/** sendSDP
	 *
	 * Send an SDP message on the channel
	 */
	sendSDP(id, desc) {
	}

	/** sendCandidate
	 *
	 * sends an ICE candidate on the channel
	 */
	sendCandidate(id, candidate) {
	}
}


/** SockSigChannel
 *
 * This class represents a raw socket signaling channel, primarily used
 * for signaling to or from a bridge node.
 */
export class SockSigChannel {
	constructor(url) {
		this.callbacks = {};

		if (url) {
			this.open(url);
		}
	}

	open(url) {
		if (this.sock) {
			this.sock.close();
		}

		this.sock = new WebSocket(url);
		this.sock.onmessage = this.onSignal;
		this.sock.onclose = this.onClose;
	}

	close() {
		this.sock.close();
	}

	on(type, id, callback) {
		add_callback(this.callbacks, type, id, callback);
	}

	onSignal(data) {
		console.log(data);
		return 0;

		let msg = messages.decodeMessage(data);

		switch (msg.type) {
			case types.SIGNAL:
				// decode the actual signal message
				let payload = messages.decodeSignalingPayload(msg.payload);

				invoke_callbacks(static_callbacks, payload.type, payload.id, payload.data);
				invoke_callbacks(this.callbacks, payload.type, payload.id, payload.data);

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
		this.sock.send(message);
	}

	sendSDP(id, desc) {
		this.sendSignal(types.SIG_SDP, id, desc);
	}

	sendCandidate(id, candidate) {
		this.sendSignal(types.SIG_SDP, id, candidate);
	}
}

/** ManualSigChannel
 *
 * This class does signaling over a manual connection, for pure
 * peer-to-peer out-of-band serverless connection establishment.
 */
export class ManualSigChannel {
	constructor() {
		this.callbacks = {};
	}

	on(type, id, callback) {
		add_callback(this.callbacks, type, id, callback);
	}

	onSignal(data) {
	}

	sendSignal(id, signal) {
	}

	sendSDP(id, desc) {
	}

	sendCandidate(id, candidate) {
	}
}

export default {
	on(type, id, callback) {
		this.add_callback(static_callbacks, type, id, callback);
	},

	add_callback(cbs, type, id, cb) {
		if (!type in cbs) {
			cbs[type] = {};
		}
		if (!id in cbs[type]) {
			cbs[type][id] = [];
		}
		cbs[type][id].push(cb);
	},

	invoke_static_callbacks(type, id, data) {
		this.invoke_callbacks(static_callbacks, type, id, data);
	},

	/** invoke_callbacks
	 *
	 * this function serves to invoke all the callbacks matching
	 * the specified type and id, or callbacks intended to be invoked
	 * for arbitrary value of these
	 */
	invoke_callbacks(cbs, type, id, data) {
		// definite type callbacks invoked first
		if (type in cbs) {
			// definite id callbacks invoked first
			if (id in cbs[type]) {
				for (let cb in cbs[type][id]) {
					cb(data);
				}
			}

			// then definite type, indefinite id
			if (null in cbs[type]) {
				for (let cb in cbs[type][null]) {
					cb(data);
				}
			}
		}

		if (null in cbs) {
			//indefinite type, definite id
			if (id in cbs[null]) {
				for (let cb in cbs[null][id]) {
					cb(data);
				}
			}

			//indefinite type, indefinite id
			if (null in cbs[null]) {
				for (let cb in cbs[null][null]) {
					cb(data);
				}
			}
		}
	}
};
