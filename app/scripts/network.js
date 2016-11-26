/** network.js
 *
 * This module implements the low-level network functionality, providing
 * a higher level interface for establishing peer connections through WebRTC
 *
 * Example creation:
 *
 * import net from './network';
 * import {Router} from './signal';
 *
 * // id is a hash of some identifying information for a peer
 * // in Circuit Create, maybe
 * net.getChannel(id, circID).then((channel) => {
 * 		this.next = channel;
 *		// send a CREATED message back to this.prev or something
 * });
 *
 *
 * Example callback:
 *
 * import {Channel} from './network';
 * import types from './messagetypes';
 *
 * // in Circuit constructor maybe, this.prev is an already-open channel
 * this.prev.on(types.RELAY, this.relay);
 * this.prev.on(null, this.logMessage);
 */

'use strict';

import types from './messagetypes';
import {Router} from './signal';

export var connections = {};

/** Connection
 *
 * This class handles abstraction for the WebRTC PeerConnection
 * establishment protocl. It interfaces with the signaling mechanisms
 * to establish new connections between peers.
 */
export class Connection {
	/**
	 * This constructor takes a id string and a signaling channel object.
	 * This ID string must be the valid ID string for the peer that can
	 * be used with the signaling channel to get data to the desired peer.
	 * The signaling channel should implement the interface outlined in the
	 * signal.js file.
	 */
	constructor(id, signalingChannel) {
		this.id = id;
		this.signalingChannel = signalingChannel;
		this.channels = {};

		// default to the singleton router object
		if (!this.signalingChannel) {
			this.signalingChannel = Router;
		}

		this.conn = new RTCPeerConnection();
		this.conn.onicecandidate = this.onIceCandidate;
		this.conn.onnegotiationneeded = this.sendOffer;
		this.conn.ondatachannel = this.onChannelReceived;
		//this.conn.onaddstream = this.onAddStream;

		// signaling channel callbacks
		this.signalingChannel.on(types.SIG_SDP, this.onDescriptionReceived);
		this.signalingChannel.on(types.SIG_ICE, this.addIceCandidate);
	}

	/** onChannelReceived
	 *
	 * This function serves as the callback for an incoming data channel. It
	 * adds a new data channel to the internal object that stores data channels.
	 */
	onChannelReceived(evt) {
		let rtcchan = evt.channel;
		//XXX: figure out the actual id property
		let chan = new Channel(null, rtcchan.id);
		chan.conn = this;
		chan.init(rtcchan);
		this.channels[chan.circID] = chan;
	}

	/** sendOffer
	 *
	 * This function uses the provided signaling channel to send an offer
	 * of a connection to the peer indicated by `id`. This function is used
	 * as a callback for the connection's "negotiationneeded" event.
	 */
	sendOffer() {
		this.conn.createOffer()
			.then(offer => this.conn.setLocalDescription(offer))
			.then(() => signalingChannel.sendSDP(this.id,
			   	JSON.stringify(this.conn.localDescription)))
			.catch(this.onError);
	}

	/** sendAnswer
	 *
	 * This function uses the provided signaling channel to send an answer
	 * to an offer of a connection from a new remote peer. This function
	 * is called in response to the receipt of an offer from a new peer.
	 */
	sendAnswer() {
		this.conn.createAnswer()
			.then(answer => this.conn.setLocalDescription(answer))
			.then(() => signalingChannel.sendSDP(this.id,
			   	JSON.stringify(this.conn.localDescription)))
			.catch(this.onError);
	}

	/** onDescriptionReceived
	 *
	 * This function will set the new remote description to that received on the
	 * signaling channel. Note that this function should be called by the
	 * signaling mechanism when the appropriate signal is received.
	 */
	onDescriptionReceived(desc) {
		this.conn.setRemoteDescription(desc, () => {
			if (this.conn.remoteDescription.type == 'offer') {
				this.sendAnswer();
			}
		});
	}

	/** onIceCandidate
	 *
	 * This is the callback function which is invoked whenever the currently
	 * being established connection finds a valid ICE candidate that needs
	 * to be sent to the peer it's trying to connect to. It uses the signaling
	 * channel in indicate the new ice candidate to its peer.
	 */
	onIceCandidate(evt) {
		if (evt.candidate) {
			this.signalingChannel.sendCandidate(this.id, evt.candidate);
		}
	}

	/** addIceCandidate
	 *
	 * This function should be called whenever a new ICE candidate is received
	 * by the signaling mechanism from the relevant peer. Endgame, this will
	 * be done by an event-based architecture.
	 */
	addIceCandidate(candidate) {
		this.conn.addIceCandidate(new RTCIceCandidate(candidate))
	}

	/** onError
	 *
	 * This function will log errors.
	 */
	onError(error) {
		console.log(error.name + ": " + error.message);
	}

	/** channel
	 *
	 * If there exists a channel on this connection with the specified
	 * circID, it will be returned. If not, one will be created on the
	 * channel, provided it's open, and subsequently returned.
	 */
	channel(circID) {
		if (!this.channels[circID]) {
			let chan = new Channel(this, circID);
			this.channels[circID] = new Channel(this, circID);
		}
		return this.channels[circID];
	}
}

/** Channel
 *
 * The Channel abstraction is used as a direct data channel between the
 * local browser iteration and a remote one, through a Connection. Each
 * Connection can have many Channels, with different IDs. Each channel is
 * tied to a single circuit through a circID value, which acts as the channel's
 * ID as well.
 */
export class Channel {
	constructor(conn, circID, options = { ordered: true }) {
		this.conn = conn;
		this.circID = circID;
		this.options = options;
		this.callbacks = {};

		// if no connection is specified, one will have to be added
		// before the channel can be used
		if (!this.conn) {
			this.init();
		}
	}

	/** init
	 *
	 * This function will initialize the data channel, creating a new one
	 * on the connection or just setting it to the specified one.
	 */
	init(channel) {
		if (!channel) {
			this.dataChannel = this.conn.createDataChannel(
				this.circID, this.options);
		} else {
			this.dataChannel = channel;
		}

		this.dataChannel.onmessage = this.onMessage;
		this.dataChannel.onopen = this.onOpen;
		this.dataChannel.onclose = this.onClose;
		this.dataChannel.onerror = this.onError;
	}

	/** sendMessage
	 *
	 * Send a raw message on the channel. Note that at this point message should
	 * already be a javascript Blob object or other binary stream data. 
	 * The data will be send in binary over the connection.
	 */
	sendMessage(msg_blob) {
		// initialize the datachannel if it's not ready yet
		if (!this.dataChannel) {
			this.init();
		}
		//XXX: maybe asymmetric encryption here?

		this.dataChannel.send(msg_blob);
	}

	/** addMessageCallback
	 *
	 * This function allows you to add a function to be called when
	 * a message of the specified type has been received.
	 */
	on(type, callback) {
		Channel.addCallback(type, callback, this.callbacks);
	}

	/** onMessage
	 *
	 * handles messages received on the channel.
	 */
	onMessage(evt) {
		//XXX: maybe asymmetric decryption here?
		let msg = messages.decodeRawMessage(evt.data);
		if (msg.type in this.callbacks) {
			for (let cb in this.callbacks[msg.type]) {
				// call it on the raw payload blob, which may be further
				// encrypted, etc.
				cb(msg.payload);
			}
		}
	}

	/** onOpen
	 *
	 * Handles the status change of the channel to open.
	 */
	onOpen() {
		console.log("channel " + this.circID + " opened");
	}

	/** onClose
	 *
	 * Handles the status change of the channel to closed.
	 */
	onClose() {
		console.log("channel " + this.circID + " opened");
	}

	/** onError
	 *
	 * Print to the console on an error
	 */
	onError(error) {
		console.log(error.name + ": " + error.message);
	}

	/** addCallback
	 *
	 * This function will robustly add a callback to the 
	 * specified callback structure.
	 */
	static addCallback(type, cb, cbs) {
		if (!type in cbs) {
			cbs[type] = [];
		}
		cbs[type].push(cb);
	}
}

export default {
	/** This function will open a new connection to
	 * the given ID, if possible.
	 */
	makeConnection(id, signalingChannel) {
		return new Promise((accept, reject) => {
			if (id in connections) {
				reject("connection open");
			}

			connections[id] = new Connection(id, signalingChannel);
			connections[id].on()
			// start the connection process
			connections[id].sendOffer();
		})
	},

	/**
	 * this function will give back an open data channel to the specified
	 * id with the specified circuit ID, handling all the circuit creations
	 * and signaling necessary to make that happen
	 */
	getChannel(id, circID, signalingChannel) {
	}
}
