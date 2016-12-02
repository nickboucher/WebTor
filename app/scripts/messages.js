/** messages.js
 *
 * This module implements the low-level message encoding and decoding,
 * providing function to translate from on-the-wire formats to JSON
 * formats.
 */
'use strict';

import types from './messagetypes';

export default {
	/** encodeMessage
	 *
	 * This function encodes a message object into an on-the-wire buffer
	 * format.
	 */
	encodeMessage(obj) {
		let buffer;
		if (!"type" in obj) {
			throw "Bad object";
			return null;
		}
		// constant version
		obj.version = 1;
		obj.size = 0;

		if ("payload" in obj) {
			obj.size = obj.payload.length;
		}

		buffer = Buffer.alloc(6);
		buffer.writeUInt8(obj.version, 0);
		buffer.writeUInt8(obj.type, 1);
		buffer.writeUInt32LE(obj.size, 2);

		// add the payload if it has one
		if ("payload" in obj) {
			buffer = Buffer.concat([buffer, obj.payload]);
	    }
		return buffer;
	},

	/** decodeMessage
	 *
	 * This function decodes a message buffer into a raw javascript object
	 * with properties `type`, `id`, `version`, and `payload`.
	 */
	decodeMessage(message) {
		let buffer = Buffer.from(message);

		let obj = {};

		obj.version = buffer.readUInt8(0);

		// error on wrong version
		if (obj.version != 1) {
			console.log(obj);
			throw "bad version";
			return null;
		}

		// otherwise continue
		obj.type = buffer.readUInt8(1);
		obj.size = buffer.readUInt32LE(2);

		if (buffer.length === 6 + obj.size) {
			// cut off the first 6 bytes for the payload
			obj.payload = buffer.slice(6);
		} else {
			throw "bad size message";
			return null;
		}

		return obj;
	},

	/** encodeRelayPayload
	 *
	 * This function encodes obj into the on-the-wire Buffer format
	 */
	encodeMessagePayload(type, obj) {
		let buffer;
		switch(type) {
			case types.SIGNAL:
				if (!"type" in obj || !"id" in obj) {
					throw "Bad object";
					return null;
				}

				buffer = Buffer.alloc(6);

				buffer.writeUInt16LE(obj.type, 0);
				buffer.writeUInt32LE(obj.id, 2);

				if ("payload" in obj) {
					buffer = Buffer.concat([buffer, obj.payload]);
				}

				return buffer;

			case types.DESTROY:
				throw "unimplemented";
				break;

			case types.CREATE2:
				throw "unimplemented";
				break;

			case types.CREATED2:
				throw "unimplemented";
				break;

			case types.RELAY:
				if (!"command" in obj || !"payload" in obj) {
					throw "Bad relay cell";
				}

				buffer = Buffer.alloc(2);
				buffer.writeUInt16LE(obj.command, 0);

				buffer = Buffer.concat([buffer, obj.payload]);
				return buffer;

			default:
				throw "bad type";
		}
	},

	/** decodeMessagePayload
	 *
	 * This function will decode the payload for a message from a
	 * raw Buffer to a javascript object.
	 */
	decodeMessagePayload(type, payload) {
		let buffer = Buffer.from(payload);
		let obj = {};

		switch(type) {
			case types.RELAY:
				obj.command = buffer.readUInt16LE(buffer, 0);
				obj.payload = buffer.slice(2);

				return obj;

			case types.DESTROY:
				throw "unimplemented";
				break;

			case types.CREATE2:
				throw "unimplemented";
				break;

			case types.CREATED2:
				throw "unimplemented";
				break;

			case types.SIGNAL:
				if (buffer.length < 6) {
					throw "payload too small";
					return null;
				}

				obj.type = buffer.readUInt16LE(0);
				obj.id = buffer.readUInt32LE(2);
				if (buffer.length > 6) {
					obj.payload = buffer.slice(6);
				}

				return obj;

			default:
				throw "Bad payload type";
				return null;
		}
	},

	encodeRelayPayload(command, relay) {
		let buffer;
		switch(command) {
			case types.RELAY_BEGIN:
				throw "unimplemented";
				return null;

			case types.RELAY_DATA:
				throw "unimplemented";
				return null;

			case types.RELAY_END:
				throw "unimplemented";
				return null;

			case types.RELAY_CONNECTED:
				throw "unimplemented";
				return null;

			case types.RELAY_SENDME:
				throw "unimplemented";
				return null;

			case types.RELAY_EXTEND:
				throw "unimplemented";
				return null;

			case types.RELAY_EXTENDED:
				throw "unimplemented";
				return null;

			case types.RELAY_TRUNCATE:
				throw "unimplemented";
				return null;

			case types.RELAY_TRUNCATED:
				throw "unimplemented";
				return null;

			case types.RELAY_RESOLVE:
				throw "unimplemented";
				return null;

			case types.RELAY_RESOLVED:
				throw "unimplemented";
				return null;

			case types.RELAY_EXTEND2:
				throw "unimplemented";
				return null;

			case types.RELAY_EXTENDED2:
				throw "unimplemented";
				return null;

			case types.RELAY_REQUEST:
				throw "unimplemented";
				return null;

			default:
				throw "bad relay command";
				return null;
		}
	},

	decodeRelayPayload(command, relay) {
		let buffer = Buffer.from(relay);
		let obj = {};

		switch(command) {
			case types.RELAY_BEGIN:
				throw "unimplemented";
				return null;

			case types.RELAY_DATA:
				throw "unimplemented";
				return null;

			case types.RELAY_END:
				throw "unimplemented";
				return null;

			case types.RELAY_CONNECTED:
				throw "unimplemented";
				return null;

			case types.RELAY_SENDME:
				throw "unimplemented";
				return null;

			case types.RELAY_EXTEND:
				throw "unimplemented";
				return null;

			case types.RELAY_EXTENDED:
				throw "unimplemented";
				return null;

			case types.RELAY_TRUNCATE:
				throw "unimplemented";
				return null;

			case types.RELAY_TRUNCATED:
				throw "unimplemented";
				return null;

			case types.RELAY_RESOLVE:
				throw "unimplemented";
				return null;

			case types.RELAY_RESOLVED:
				throw "unimplemented";
				return null;

			case types.RELAY_EXTEND2:
				throw "unimplemented";
				return null;

			case types.RELAY_EXTENDED2:
				throw "unimplemented";
				return null;

			case types.RELAY_REQUEST:
				throw "unimplemented";
				return null;

			default:
				throw "bad relay command";
				return null;
		}
	},

	encodeSignalPayload(type, signal) {
		switch(type) {
			case types.SIG_ID:
				return Buffer.from(JSON.stringify(signal));

			case types.SIG_SDP:
				return Buffer.from(JSON.stringify(signal));

			case types.SIG_ICE:
				return Buffer.from(JSON.stringify(signal));

			case types.SIG_NEW_PEER:
				throw "unimplemented";
				return buffer;

			case types.SIG_BAD_PEER:
				throw "unimplemented";
				return buffer;

			case types.SIG_REQ_PEERLIST:
				return Buffer.from(JSON.stringify(signal));

			case types.SIG_PEERLIST:
				return Buffer.from(JSON.stringify(signal));

			case types.SIG_ERROR:
				return Buffer.from(JSON.stringify(signal));

			default:
				throw "bad signal type";
				return null;
		}
	},

	decodeSignalPayload(type, signal) {
		let buffer = Buffer.from(signal);
		let obj = {};

		switch(type) {
			case types.SIG_ID:
				return JSON.parse(buffer.toString());

			case types.SIG_SDP:
				return JSON.parse(buffer.toString());

			case types.SIG_ICE:
				return JSON.parse(buffer.toString());

			case types.SIG_NEW_PEER:
				throw "unimplemented";
				return buffer.toString();

			case types.SIG_BAD_PEER:
				throw "unimplemented";
				return buffer.toString();

			case types.SIG_REQ_PEERLIST:
				return JSON.parse(buffer.toString());

			case types.SIG_PEERLIST:
				return JSON.parse(buffer.toString());

			case types.SIG_ERROR:
				return JSON.parse(buffer.toString());

			default:
				throw "bad signal type";
				return null;
		}
	},
}
