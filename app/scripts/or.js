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
node that creates a circuit has:
- list of the ip address of the circuit
- list of symmetric key to communicate with
- circid for the connection with the next node
(-onion key g? of the next node)
the construction will
- send create to the next node to set up symmetric key by deffie-hellman
- send create embedded in relay_extend commands (symmetrically encrypted)
- send something to do to the last node of the circuit by encrypting in reverse order
the truncation will
- send truncate embedded in relays
-update lists
the destroy will
- send a destroy to the next
- delete the lists
if:
- receives a created -> continue building circuit
- receives a relay -> decrypt in order */

/*
relay node has:
- hash table of the circId incoming and outcoming, and symmetric key with incoming
this node will do
- if receives a create, set the symmetric key + send created back
- if receives an extend then create a new connection with the next node
- if receives a relay: if it is from incoming side then decrypt and change circId
if it is from outcoming side then encrypt and change circid
- if receives destroy, send destroy to next with next circid and delete entry in table
- if receives a truncate, send destroy to next with correct circid, and becomes an exit node */

/*
shall we further discuss exit nodes?
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
 				encrypt_aes(password, buffer)
	 		},
	 		(buffer) => {
	 			decrypt_aes(password, buffer)
	 		});
	}

	/** relay()
	 *
	 * This function implements the TOR Relay method, passing messages
	 * back and forth along the circuit, wrapping or unwrapping them
	 * with encryption as appropriate.
	 */
	relay(forward) {
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
		this.next.on(types.RELAY, this.relay_backward)
		// do a DH exchange

	}

	/** truncate()
	 *
	 * This function will truncate the TOR circuit from this node, sending
	 * a destroy request to the next node in the circuit.
	 */
	truncate() {
	}

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
