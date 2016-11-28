/** messages.js
 *
 * This module implements the low-level message encoding and decoding,
 * providing function to translate from on-the-wire formats to JSON
 * formats.
 */
'use strict';

import buf from 'buffer/';

let Buffer = buf.Buffer;

export default {
	/** encodeMessage
	 *
	 * This function encodes a message object into an on-the-wire buffer
	 * format.
	 */
	encodeMessage(obj) {
		if (!"type" in obj || !"id" in obj) {
			throw "Bad object";
			return null;
		}
		obj.version = 1;

		let buffer = Buffer.alloc(6);
		buffer.writeUInt8(obj.version, 0);
		buffer.writeUInt8(obj.type, 1);
		buffer.writeUInt32LE(obj.id, 2);

		// add the payload if it has one
		if (obj.payload) {
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
			throw "bad version";
			return null;
		}

		// otherwise continue
		obj.type = buffer.readUInt8(1);
		obj.id = buffer.readUInt32LE(2)

		if (buffer.length > 6) {
			// cut off the first 6 bytes for the payload
			obj.payload = buffer.slice(6);
		}

		return obj;
	},

	/** encodeRelayPayload
	 *
	 * This function encodes obj into the on-the-wire Buffer format
	 */
	encodeRelayPayload(obj) {
		if (!"command" in obj || !"payload" in obj) {
			throw "Bad relay cell";
		}
	},

	/** decodeRelayPayload
	 *
	 * This function will decode the payload for a relay message from a
	 * raw Buffer to a javascript object.
	 */
	decodeRelayPayload(payload) {
	},

	/** encodeSignalingPayload
	 *
	 * This function will encode the payload for a signaling message
	 * from this javascript object form to a raw buffer form appropriate
	 * for sending over the wire.
	 */
	encodeSignalingPayload(obj) {
		if (!"type" in obj || !"id" in obj) {
			throw "Bad object";
		}
	},

	/** decodeSignalingPayload
	 *
	 * This function will decode the payload for a signaling message
	 * from its on-the-wire raw buffer form (returned by decodeMessage)
	 * to a javascript object.
	 */
	decodeSignalingPayload(payload) {
	}
}
