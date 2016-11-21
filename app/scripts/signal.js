/** signal.js
 *
 * This module handles the signaling mechanisms for the WebTor projects
 */

'use strict';

import {Connection, Channel} from './network';

class SignalingChannel extends Channel {
	/** sendSignal
	 *
	 * Send a signaling message on the channel.
	 */
	sendSignal(signal) {
	}

	/** sendSDP
	 *
	 * Send an SDP message on the channel
	 */
	sendSDP(desc) {
	}

	/** sendCandidate
	 *
	 * sends an ICE candidate on the channel
	 */
	sendCandidate(candidate) {
	}
}

export default {
}
