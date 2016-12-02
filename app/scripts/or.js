/** or.js
 *
 *
 * This module implements the Onion Router functionality
 * of relay nodes in the Tor network in the browser.
 */
'use strict';

import crypto from './crypto';
import network from './network';

/** peers
 *
 * This object keeps track of known peers for
 * the network.
 */
export var peers = {};

var circuits = {};
var local_id;

/** Circuit
 *
 * The Circuit class encapsulates the TOR
 * circuit abstraction.
 */
export class Circuit {
	/**
	 * This constructor is equivalent to the TOR create() method, which
	 * creates a new circuit from a given endpoint. If the previous
	 * endpoint is unspecified, then this is the entrypoint of the circuit.
	 * If the previous endpoint is specified, the successful completion
	 * of this method will also send a CREATED message back along the circuit.
	 *
	 * This function will also setup a callback for the event that the connections
	 * in the circuit are dropped, so that this event is handled elegantly in
	 * the expected TOR way. In particular, if the prior connection is dropped,
	 * it will send a DESTROY message to the next connection and delete itself.
	 * If the post connection is dropped, it will instead send a TRUNCATED message
	 * to the prior connection and remain open.
	 */


	/*
	constructor(prev, msg)
	does the dh handshake

	Arguments:
	- prev: channel coming from the network
	- msg: create msg coming from that channel
	*/
	constructor(prev, msg) {
		//dh exchange
		var dh = crypto.get_dh()
		dh.generateKeys();
		var dh_pub = message.decodeMessagePayload(msg.type,
		crypto.decrypt_rsa(msg.payload)).pub;
		var password = dh.computeSecret(dh_pub).toString('hex');
		let pub_key = peers[prev.id].pub;
		let payload = crypto.encrypt_rsa(pub_key, messages.encodeMessagePayload(types.CREATED, {
			pub: dh.getPublicKey() // DH public key
		}));
		let message = messages.encodeMessage({
			type: types.CREATED,
			payload: payload
		});
		prev.sendMessage(message);

		this.prev = prev;

		// set aes encryption
		this.prev.setEncryption((buffer) => {
 				return encrypt_aes(password, buffer);
	 		},
	 		(buffer) => {
	 			return decrypt_aes(password, buffer);
	 		});
	}

	/** relay()
	 *
	 * This function implements the TOR Relay method, passing messages
	 * back and forth along the circuit, wrapping or unwrapping them
	 * with encryption as appropriate.
	 msg is unencrypted has attribute id_next if there relay.EXTEND
	 */
	relay(forward, msg) {
		if (forward){
			if (!msg.recognized){
				if(type.CREATE){
					constructor(prev, msg);
				};
				if(type.EXTEND){
					network.channel('new');
					let pub_key = peers[msg.id_next].pub;
					let payload = crypto.encrypt_rsa(pub_key, messages.encodeMessagePayload(types.CREATE, {
						pub: dh.getPublicKey() // DH public key
					}));
					let message = messages.encodeMessage({
						type: types.CREATE, //this information is already in the payload
						payload: payload
					});
					prev.sendMessage(message);
				};
				if(type.TRUNCATE){

				};
			} else {
				let pub_key = peers[prev.id].pub;
				let payload = crypto.encrypt_rsa(pub_key, messages.encodeMessagePayload(types.CREATED, {
					pub: dh.getPublicKey() // DH public key
				}));
				let message = messages.encodeMessage({
					type: types.CREATED,
					payload: payload
				});
				prev.sendMessage(message);
			}
		} else {

		}
		// if the encryption failed
		this.next.sendMessage(decr_msg);
	}

	/** extend()
	 *
	 * This function implements the TOR extend method, which will send
	 * a create request to the next node in the circuit.
	 */
	extend() {
		// create this.next to the next peer
		this.next = network.getChannel(peer_id, this.circID);
		this.next.on(types.RELAY, this.relay_backward);
		// do a DH exchange

	}

	/*
	/** truncate()
	 *
	 * This function will truncate the TOR circuit from this node, sending
	 * a destroy request to the next node in the circuit.

	truncate() {
	}
	*/

	/** destroy()
	 *
	 * This function will destroy this circuit from this node on, sending
	 * a destroy function to the next node in the circuit and then closing
	 * its data channels
	 */
	destroy() {
	}
}

/**
 * This default export object contains all the global functions
 */
export default {
	/** start()
	 *
	 * This function will startup the Onion Router, initializing all global
	 * state information for the node, and start to asynchronously build
	 * circuits as it gets connected to the network.
	 */
	start() {
		// generate local_id
		network.init(local_id);
	},

	/** used by OP to incrementall build a circuit
	 */
	buildCircuit() {
		return new Promise((accept, reject) => {
		});
	},

	/**
	handleCreateMessage(create_msg, channel) {
		circuits[prev_chan.id] = new Circuit(channel, create_msg);
	},

	/** sendRequest()
	 *
	 * This method is a high-level interface used to send a single request
	 * over the mesh network. It will pick a valid open circuit and tunnel
	 * the request over the circuit. If no valid open circuits are currently
	 * available, it will synchronously create one and then send the request.
	 */
	sendRequest() {
		// pick a circuit
		// or create one synchronously
		// send RELAY_{START,REQUEST}
	},

	/** addPeer()
	 *
	 * This method should be called whenever a message is received
	 * indicating a new peer
	 */
	addPeer() {
	}
};
