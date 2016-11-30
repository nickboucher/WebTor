/** signal.js
 *
 * This module handles the signaling mechanisms for the WebTor projects.
 * Primarily, any newly-created signaling channels should be added to the
 * Router singleton. This routing singleton should also be used to establish
 * all new connections, as it is designed to robustly handle routing, so long
 * as it has been set up with at least on Bridge and a manual signaling channel.
 *
 * Example usage:
 *
 * import {Router} from './signal';
 * import types from './messagetypes';
 * import messages from './messages';
 *
 * // in router initialization, invoke the arrow function when a signal
 * // on any channel of type SIG_NEW_PEER is received, from any ID
 * Router.on(types.SIG_NEW_PEER, null, (data) => {
 * 		let new_peer = messages.decodeMessage(types.SIG_NEW_PEER, data);
 *		// do something with the new peer--as yet undecided prototype
 * });
 */

'use strict';

import base32 from 'rfc-3548-b32';

import Queue from 'qv2';
import messages from './messages';
import types from './messagetypes';
import {Channel} from './network';

// this variable is used by all signaling channel types, and it allows
// callbacks to be added to abstract signal channels so that messages of
// any type from any source may be intercepted
let static_callbacks = {};

/** SignalChannel
 *
 * This class is an abstract superclass which implements most functions
 * which are common to different possible signaling channels.
 */
class SignalChannel {
	constructor() {
		this.callbacks = {};
	}

	/** on
	 *
	 * This function allows you to add a callback to this instance of the
	 * Concrete SignalChannel implementation, to be invoked when the specified
	 * type and id are called, or for any type or id for values of null for
	 * either.
	 */
	on(type, id, callback) {
		SignalChannel.addCallback(type, id, callback, this.callbacks);
	}

	/** onSignal
	 *
	 * This function should be invoked whenever a signal is received on
	 * the concrete channel. data should be a direct binary blob received
	 * on the channel. This function will then decode the signal, do any
	 * error handling, and then invoke all the callbacks necessary appropriate
	 * to the decoded signal.
	 */
	onSignal(data) {
		try {
			let msg = messages.decodeMessage(data);

			switch (msg.type) {
				case types.SIGNAL:
					// decode the actual signal message
					let payload = messages.decodeMessagePayload(msg.type, msg.payload);
					let signal = messages.decodeSignalPayload(payload.type, payload.payload);
					this.invokeCallbacks(payload.type, payload.id, signal);
					break;
				default:
					console.log('bad message received');
			}
		} catch(e) {
			console.log(e);
		}
	}

	/** invokeCallbacks
	 *
	 * This function will invoke both static and instance callbacks
	 * using the static invokeCallbacks function of the SignalChannel
	 * class
	 */
	invokeCallbacks(type, id, data) {
		SignalChannel.invokeCallbacks(type, id, data, static_callbacks);
		SignalChannel.invokeCallbacks(type, id, data, this.callbacks);
	}

	/** sendSignal
	 *
	 * This is an abstract function which will be invoked if ever
	 * a signal is attempted to be send on an instance of this class which
	 * has not overridden the sendSignal function. As such, the function just
	 * throws an error. Concrete implementations should override this function
	 * with one that sends a signal on the underlying channel, whatever it is.
	 */
	sendSignal(type, id, signal) {
		throw "You cannot use this superclass directly";
	}

	/** buildSignal
	 *
	 * This function will build a raw message blob to send over the channel
	 * using the messages encode functions
	 */
	buildSignal(type, id, signal) {
		let sig = messages.encodeSignalPayload(type, signal);
		let payload = messages.encodeMessagePayload(types.SIGNAL, {
			'type': type,
		   	'id': id,
		   	'payload': sig});
		let message = messages.encodeMessage({
			'type': types.SIGNAL,
			'id': id,
			'payload': payload
		});
		return message;
	}

	/** sendSDP
	 *
	 * shortcut for sending an offer
	 */
	sendSDP(id, desc) {
		this.sendSignal(types.SIG_SDP, id, JSON.stringify(desc));
	}

	/** sendCandidate
	 *
	 * shortcut for sending an ICE candidate
	 */
	sendCandidate(id, candidate) {
		this.sendSignal(types.SIG_ICE, id, JSON.stringify(candidate));
	}

	/** addCallback
	 *
	 * This function will robustly add a callback to the 
	 * specified callback structure.
	 */
	static addCallback(type, id, cb, cbs) {
		if (!(type in cbs)) {
			cbs[type] = {};
		}
		if (!(id in cbs[type])) {
			cbs[type][id] = [];
		}
		cbs[type][id].push(cb);
	}

	/** invokeCallbacks
	 *
	 * this function serves to invoke all the callbacks matching
	 * the specified type and id, or callbacks intended to be invoked
	 * for arbitrary value of these
	 */
	static invokeCallbacks(type, id, data, cbs) {
		// definite type callbacks invoked first
		if (type in cbs) {
			// definite id callbacks invoked first
			if (id in cbs[type]) {
				for (let cb of cbs[type][id]) {
					cb(data);
				}
			}

			// then definite type, indefinite id
			if (null in cbs[type]) {
				for (let cb of cbs[type][null]) {
					cb(data);
				}
			}
		}

		if (null in cbs) {
			//indefinite type, definite id
			if (id in cbs[null]) {
				for (let cb of cbs[null][id]) {
					cb(data);
				}
			}

			//indefinite type, indefinite id
			if (null in cbs[null]) {
				for (let cb of cbs[null][null]) {
					cb(data);
				}
			}
		}
	}
}

/** SignalRouter
 *
 * This class is the abstract routing protocol which
 * implements the signal routing algorithm based on its open
 * data channel connections. It also handles the general maintenence of
 * the desired network connectivity properties by closing and opening
 * connections as appropriate
 */
export class SignalRouter extends SignalChannel {
	constructor() {
		super();

		this.sigchannels = {};
		this.sigchannels['bridge'] = [];
		this.sigchannels['manual'] = [];

		// explicit prebinding of callback methods
		this.onSignal = this.onSignal.bind(this);
	}

	/** addBridgeChannel
	 *
	 * This function adds an active bridge channel to be used as a signaling
	 * fallback.
	 */
	addBridgeChannel(chan) {
		chan.on(null, null, this.onSignal);
		this.sigchannels['bridge'].push(chan);
	}

	/** addManualChannel
	 *
	 * This function adds an active manual channel to be used as a signaling
	 * fallback
	 */
	addManualChannel(chan) {
		chan.on(null, null, this.onSignal);
		this.sigchannels['manual'].push(chan);
	}

	/** addPeerSigChannl
	 *
	 * This function adds an active peer signaling channel to be used
	 * as a primary signaling mechanism.
	 */
	addPeerSigChannel(chan) {
		chan.on(null, null, this.onSignal);
		this.sigchannels[chan.id] = chan;
	}

	/** sendSignal
	 *
	 * This function implements the primary routing algorithm for this project,
	 * which does mostly transparent signal handling, guaranteeing that the
	 * specified signal will reach its destination, if at all possible. It
	 * first looks to implement its closest-first scheme, sending the signal
	 * to the peer in its list with id closest to that of the intended
	 * destination. If it has no peer connections, it will check for
	 * bridge connections, attempting to establish them if possible to
	 * create more peer connections. Finally, if the peer connections are all
	 * down, then it will attempt to use a fallback manual signaling channel.
	 */
	sendSignal(type, id, signal) {
		let message = this.buildSignal(type, id, signal);
		//XXX: routing algorithm
	}
}

/** PeerSigChannel
 *
 * This class is the abstraction for a signaling channel
 * implemented over the tor network.
 */
export class PeerSigChannel extends SignalChannel {
	constructor(conn, circID, options = { ordered: true }) {
		super(); 	//SignalChannel constructor

		// get or create a channel for the new circuit
		this.chan = conn.channel(circID, options);
		this.chan.on(types.SIGNAL, super.onSignal);
	}

	/** sendSignal
	 *
	 * Send a signaling message on the channel, using the underlying Channel
	 * architecture.
	 */
	sendSignal(type, id, signal) {
		let message = this.buildSignal(type, id, signal);
		this.chan.sendMessage(message);
	}
}

/** SockSigChannel
 *
 * This class represents a raw socket signaling channel, primarily used
 * for signaling to a bridge node.
 */
export class SockSigChannel extends SignalChannel {
	constructor(url) {
		super();
		// explicit prebinding of callback methods
		this.onClose = this.onClose.bind(this);

		if (url) {
			this.open(url);
		}
	}

	/** open
	 *
	 * this function will open a new websocket from the ws:// or wss:// URL
	 * provided, in the interests in establishing a bridge connection.
	 */
	open(url) {
		if (this.sock) {
			this.sock.close();
		}

		this.sock = new WebSocket(url);
		this.sock.onmessage = this.onSignal;
		this.sock.onclose = this.onClose;
	}

	/** close
	 *
	 * This function will close the open socket.
	 */
	close() {
		this.sock.close();
	}

	/** onClose
	 *
	 * This function will be invoked when the internal websocket is closed.
	 */
	onClose(data) {
		console.log("Connection closed.");
	}

	/** sendSignal
	 *
	 * For the SockSigChannel, this function just sends it over the
	 * open socket.
	 */
	sendSignal(type, id, signal) {
		let message = this.buildSignal(type, id, signal);
		this.sock.send(message);
	}
}

/** ManualSigChannel
 *
 * This class does signaling over a manual connection, for pure
 * peer-to-peer out-of-band serverless connection establishment.
 */
export class ManualSigChannel extends SignalChannel {
	constructor() {
		super();
		this.messages = new Queue();
		this.hooks = [];
	}

	next() {
		for (let hook of this.hooks) {
			hook(this.messages.dequeue());
		}
	}

	addDisplayHook(callback) {
		this.hooks.push(callback);
	}

	onSignal(signal) {
		let data = base32.decode(signal);
		return super.onSignal(data);
	}

	/** sendSignal
	 *
	 * For the ManualSigChannel class, this function will display a
	 * message for the user to copy and send by some out-of-band mechanism
	 * to a partner to establish a connection.
	 */
	sendSignal(type, id, signal) {
		let message = this.buildSignal(type, id, signal);
		//encode to base32 to send out-of-band
		let messagestring = base32.encode(message);
		this.messages.enqueue(messagestring);
	}
}

/** Router
 *
 * This global object will be created once and can be used by any script
 * calling `import {Router} from '* /signal.js';`, and used to do the
 * primary signal routing.
 */
export var Router = new SignalRouter();

/** Manual
 *
 * This singleton object serves as the primary manual signaling channel for
 * this system. Others may be added if necessary.
 */
export var Manual = new ManualSigChannel();

export default {
	/** init
	 *
	 * This function does the global state initialization for the signaling
	 * subsystem.
	 */
	init() {
		Router.addManualChannel(Manual);
	},

	/** on
	 *
	 * This function will add a static callback, to be invoked whenever any
	 * signal channel receives a message corresponding to the specified type.
	 * This may be used, for instance, by the OR layer to add a new peer
	 * whenever a SIG_NEW_PEER message is received.
	 */
	on(type, id, callback) {
		SignalChannel.addCallback(type, id, callback, static_callbacks);
	},
};
