/** or.js
 *
 * This module implements the Onion Router functionality
 * of relay nodes in the Tor network in the browser.
 */
'use strict';

import crypto from './crypto';
import network from './network';

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
	constructor() {
	}

	/** relay()
	 *
	 * This function implements the TOR Relay method, passing messages
	 * back and forth along the circuit, wrapping or unwrapping them
	 * with encryption as appropriate.
	 */
	relay() {
	}

	/** extend()
	 *
	 * This function implements the TOR extend method, which will send
	 * a create request to the next node in the circuit.
	 */
	extend() {
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
	},

	/** sendRequest()
	 *
	 * This method is a high-level interface used to send a single request
	 * over the mesh network. It will pick a valid open circuit and tunnel
	 * the request over the circuit. If no valid open circuits are currently
	 * available, it will synchronously create one and then send the request.
	 */
	sendRequest() {
	}
};
