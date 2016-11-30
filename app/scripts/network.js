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
 * // in Circuit extend, maybe
 * net.getChannel(id, label).then((channel) => {
 * 		this.next = channel;
 *
 *		// setup a callback to send 
 *		// a CREATED message back to this.prev or something
 *
 *		// send or pass along CREATE message with DH handshake info
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
		this.callbacks = {};

		// default to the singleton router object
		if (!this.signalingChannel) {
			this.signalingChannel = Router;
		}

		// prebinding for callback methods
		this.handleDescriptionReceived = this.handleDescriptionReceived.bind(this);
		this.handleIceCandidateReceived = this.handleIceCandidateReceived.bind(this);

		this.handleConnectionStateChange = this.handleConnectionStateChange.bind(this);
		this.handleNegotiationNeeded = this.handleNegotiationNeeded.bind(this);
		this.handleIceCandidate = this.handleIceCandidate.bind(this);
		this.handleDataChannel = this.handleDataChannel.bind(this);

		// create connections
		this.conn = new RTCPeerConnection();
		this.conn.onconnectionstatechange = this.handleConnectionStateChange;
		this.conn.onnegotiationneeded = this.handleNegotiationNeeded;
		this.conn.onicecandidate = this.handleIceCandidate;
		this.conn.ondatachannel = this.handleDataChannel;
		this.conn.oniceconnectionstatechange = evt => {
			console.log('conn ' + this.id + ': ice connection state: ' + this.conn.iceConnectionState);
		};
		this.conn.onsignalingstatechange = evt => {
			console.log('conn ' + this.id + ': signaling state: ' + this.conn.signalingState);
		};
		//this.conn.onaddstream = this.onAddStream;
		
		// signaling channel callbacks
		this.signalingChannel.on(types.SIG_SDP, id, this.handleDescriptionReceived);
		this.signalingChannel.on(types.SIG_ICE, id, this.handleIceCandidateReceived);
	}

	/** channel
	 *
	 * If there exists a channel on this connection with the specified
	 * label, it will be returned. If not, one will be created on the
	 * channel, provided it's open, and subsequently returned.
	 */
	channel(label, options={reliable: true}) {
		if (!(label in this.channels)) {
			let chan = new Channel(this, label, options);
			this.channels[label] = chan;
		}
		return this.channels[label];
	}

	createDataChannel(label, options) {
		return this.conn.createDataChannel(label, options);
	}

	on(evstr, cb) {
		if (!(evstr in this.callbacks)) {
			this.callbacks[evstr] = [];
		}
		this.callbacks[evstr].push(cb);
	}

	signal(evstr) {
		console.log('connection ' + this.id + ' ' + evstr);
		if (evstr in this.callbacks) {
			for (let cb of this.callbacks[evstr]) {
				cb();
			}
		}
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
			.then(() => this.signalingChannel.sendSDP(this.id,
			   	this.conn.localDescription))
			.catch(this.handleError);
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
			.then(() => this.signalingChannel.sendSDP(this.id,
			   this.conn.localDescription))
			.catch(this.handleError);
	}

	handleConnectionStateChange(evt) {
		this.signal(this.conn.connectionState);
	}

	handleNegotiationNeeded(evt) {
		this.sendOffer();
	}

	/** handleIceCandidate
	 *
	 * This is the callback function which is invoked whenever the currently
	 * being established connection finds a valid ICE candidate that needs
	 * to be sent to the peer it's trying to connect to. It uses the signaling
	 * channel in indicate the new ice candidate to its peer.
	 */
	handleIceCandidate(evt) {
		console.log('conn ' + this.id + ': got ice candidate: ' + evt.candidate);
		if (evt && evt.candidate) {
			this.signalingChannel.sendCandidate(this.id, evt.candidate);
		}
	}

	/** handleDescriptionReceived
	 *
	 * This function will set the new remote description to that received on the
	 * signaling channel. Note that this function should be called by the
	 * signaling mechanism when the appropriate signal is received.
	 */
	handleDescriptionReceived(desc) {
		this.conn.setRemoteDescription(new RTCSessionDescription(desc), () => {
			if (this.conn.remoteDescription.type === 'offer') {
				this.sendAnswer();
			}
		});
	}

	/** handleIceCandidateReceived
	 *
	 * This function should be called whenever a new ICE candidate is received
	 * by the signaling mechanism from the relevant peer. Endgame, this will
	 * be done by an event-based architecture.
	 */
	handleIceCandidateReceived(candidate) {
		this.conn.addIceCandidate(new RTCIceCandidate(candidate))
	}

	/** handleDataChannel
	 *
	 * This function serves as the callback for an incoming data channel. It
	 * adds a new data channel to the internal object that stores data channels.
	 */
	handleDataChannel(evt) {
		let rtcchan = evt.channel;
		let chan = new Channel(null, rtcchan.label);
		chan.conn = this;
		chan.init(rtcchan);
		this.channels[chan.label] = chan;
	}

	/** handleError
	 *
	 * This function will log errors.
	 */
	handleError(error) {
		console.log(error.name + ": " + error.message);
	}
}

/** Channel
 *
 * The Channel abstraction is used as a direct data channel between the
 * local browser iteration and a remote one, through a Connection. Each
 * Connection can have many Channels, with different IDs. Each channel is
 * tied to a single circuit through a label value, which acts as the channel's
 * ID as well.
 */
export class Channel {
	constructor(conn, label, options = { ordered: true, reliable: true }) {
		this.conn = conn;
		this.label = label;
		this.options = options;
		this.callbacks = {};
		this.enc = null;
		this.dec = null;

		// explicit prebinding of callback methods
		this.handleMessage = this.handleMessage.bind(this);
		this.handleOpen = this.handleOpen.bind(this);
		this.handleClose = this.handleClose.bind(this);
		this.handleError = this.handleError.bind(this);

		// if no connection is specified, one will have to be added
		// before the channel can be used
		if (this.conn) {
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
				this.label, this.options);
		} else {
			this.dataChannel = channel;
		}

		this.dataChannel.onmessage = this.handleMessage;
		this.dataChannel.onopen = this.handleOpen;
		this.dataChannel.onclose = this.handleClose;
		this.dataChannel.onerror = this.handleError;
	}

	/** setKey
	 *
	 * This function may be used to encrypt or unencrypt the data stream.
	 * The enc function should take a plaintext data blob (of arbitrary
	 * size) and return an encrypted data blob. The dec function should
	 * take a ciphertext data blob and return a plaintext data blob.
	 *
	 * This can be set to just symmetric enc+dec, or a composition of symmetric
	 * and asymmetric crypto to add authentication. This handling is left to
	 * the caller.
	 */
	setEncryption(enc, dec) {
		this.enc = enc;
		this.dec = dec;
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

		if (this.enc != null) {
			msg_blob = this.enc(msg_blob);
		}

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

	/** handleMessage
	 *
	 * handles messages received on the channel.
	 */
	handleMessage(evt) {
		console.log('received message on chan ' + this.label + ': ' + evt.data);
		let raw_msg = evt.data;
		if (this.dec) {
			raw_msg = this.dec(raw_msg);
		}

		let msg = messages.decodeMessage(raw_msg);
		if (msg.type in this.callbacks) {
			for (let cb in this.callbacks[msg.type]) {
				// call it on the raw payload blob, which may be further
				// encrypted, etc.
				cb(msg.payload);
			}
		}
	}

	/** handleOpen
	 *
	 * Handles the status change of the channel to open.
	 */
	handleOpen() {
		console.log("channel " + this.label + " opened");
	}

	/** handleClose
	 *
	 * Handles the status change of the channel to closed.
	 */
	handleClose() {
		console.log("channel " + this.label + " opened");
	}

	/** handleError
	 *
	 * Print to the console on an error
	 */
	handleError(error) {
		console.log(error.name + ": " + error.message);
	}

	/** addCallback
	 *
	 * This function will robustly add a callback to the 
	 * specified callback structure.
	 */
	static addCallback(type, cb, cbs) {
		if (!(type in cbs)) {
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
				return;
			}

			connections[id] = new Connection(id, signalingChannel);
			// start the connection process
			connections[id].sendOffer();

			accept(connections[id]);
		});
	},

	/**
	 * this function will give back an open data channel to the specified
	 * id with the specified circuit ID, handling all the circuit creations
	 * and signaling necessary to make that happen
	 */
	getChannel(id, label, signalingChannel) {
		return new Promise((accept, reject) => {
			if (id in connections) {
				// if there's already a connection to the ID, return the valid
				// channel
				accept(connections[id].channel(label));
			} else {
				// otherwise make one and then return it
				this.makeConnection(id, signalingChannel)
					.then((connection) => {
						accept(connection.channel(label));
					})
					.catch((err) => {
						reject(err);
					});
			}
		});
	}
}
