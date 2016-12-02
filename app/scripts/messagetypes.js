/** messages.js
 *
 * This module contains all helper functions for constructing
 * each message type, and defines constants for message types
 * that can be used by the rest of the application.
 */

'use strict';

export default {
	// tor messages
	//PADDING: 0,
	//CREATE: 1,
	//CREATED: 2,
	RELAY: 3,
	DESTROY: 4,
	//CREATE_FAST: 5,
	//CREATED_FAST: 6,
	//VERSIONS: 7,
	//NETINFO: 8,
	//RELAY_EARLY: 9,
	CREATE2: 10,
	CREATED2: 11,

	SIGNAL: 12,			// message code for a signaling channel
	
	//VPADDING: 128,
	//CERTS: 129,
	//AUTH_CHALLENGE: 130,
	//AUTHENTICATE: 131,
	//AUTHORIZE: 132,

	// signaling message types
	SIG_ID: 256, 		// signal for identification, payload includes public key
	SIG_SDP: 257,		// SDP message for signaling
	SIG_ICE: 258,		// ICE Candidate message
	SIG_NEW_PEER: 259,
	SIG_BAD_PEER: 260,	// indicates a bad peer (left or malicious)
	SIG_REQ_PEERLIST: 261, // requests a peerlist
	SIG_PEERLIST: 262, 	// list of valid peers
	SIG_ERROR: 263,		// signaling error

	// DESTROY/TRUNCATED error codes
	NONE: 0,
	//PROTOCOL: 1,
	INTERNAL: 2,
	REQUESTED: 3,
	//HIBERNATING: 4,
	RESOURCELIMIT: 5,
	CONNECTFAILED: 6,
	//OR_IDENTITY: 7,
	OR_CONN_CLOSED: 8,
	FINISHED: 9,
	TIMEOUT: 10,
	DESTROYED: 11,
	//NOSUCHSERVICE: 12,

	// relay messages
	RELAY_BEGIN: 1,
	RELAY_DATA: 2,
	RELAY_END: 3,
	RELAY_CONNECTED: 4,
	RELAY_SENDME: 5,
	RELAY_EXTEND: 6,
	RELAY_EXTENDED: 7,
	RELAY_TRUNCATE: 8,
	RELAY_TRUNCATED: 9,
	//RELAY_DROP: 10,
	RELAY_RESOLVE: 11,
	RELAY_RESOLVED: 12,
	//RELAY_BEGIN_DIR: 13,
	RELAY_EXTEND2: 14,
	RELAY_EXTENDED2: 15,

	RELAY_REQUEST: 16,	// message to perform an entire HTTP request

	// RELAY_END reasons
	REASON_MISC: 1,
	REASON_RESOLVEFAILED: 2,
	REASON_CONNECTREFUSED: 3,
	REASON_EXITPOLICY: 4,
	REASON_DESTROY: 5,
	REASON_DONE: 6,
	REASON_TIMEOUT: 7,
	REASON_NOROUTE: 8,
	//REASON_HIBERNATING: 9,
	REASON_INTERNAL: 10,
	REASON_RESOURCELIMIT: 11,
	REASON_CONNRESET: 12,
	//REASON_TORPROTOCOL: 13,
	//REASON_NOTDIRECTORY: 14,
	REASON_NOPEERS: 15,
}
