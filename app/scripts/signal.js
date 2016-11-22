/** signal.js
 *
 * This module handles the signaling mechanisms for the WebTor projects
 */

'use strict';

import messages from './messages';
import types from './messagetypes';
import {Connection, Channel} from './network';

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
		this.signalConns = {};
		super(conn, circID, options);

		super.on(types.SIGNAL, this.onSignal);
	}

	on(type, id, callback) {
		if (!type in this.callbacks) {
			this.callbacks[type] = {};
		}
		if (!id in this.callbacks[type]) {
			this.callbacks[type][id] = [];
		}
		this.callbacks[type][id].push(callback);
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
	constructor(sock) {
		this.sock = sock;
		this.callbacks = {};

		this.sock.on('data', this.onData);
		this.sock.on('close', this.onClose);
	}

	on(type, id, callback) {
		if (!type in this.callbacks) {
			this.callbacks[type] = {};
		}
		if (!id in this.callbacks[type]) {
			this.callbacks[type][id] = [];
		}
		this.callbacks[type][id].push(callback);
	}

	onSignal(data) {
		let msg = messages.decodeMessage(data);

		switch (msg.type) {
			case types.SIGNAL:
				// decode the actual signal message
				let payload = messages.decodeSignalingPayload(msg.payload);

				// if there are any callbacks for this type of signal
				// and this id, then invoke them on the payload data
				if (payload.type in this.callbacks) {
					if (payload.id in this.callbacks[payload.type]) {
						for (let callback in this.callbacks[payload.type][payload.id]) {
							callback(payload.data);
						}
					}
				}
				break;
			case default:
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
		if (!type in this.callbacks) {
			this.callbacks[type] = {};
		}
		if (!id in this.callbacks[type]) {
			this.callbacks[type][id] = [];
		}
		this.callbacks[type][id].push(callback);
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
};
