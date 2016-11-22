/** messages.js
 *
 * This module implements the low-level message encoding and decoding,
 * providing function to translate from on-the-wire formats to JSON
 * formats.
 */
'use strict';

export default {
	/** decodeMessage
	 *
	 * This function decodes a message blob into a raw javascript object
	 * with properties `type`, `id`, `version`, and `payload`.
	 */
	decodeMessage(message) {
	}

	/** encodeMessage
	 *
	 * This function encodes a message object into an on-the-wire blob
	 * format.
	 */
	encodeMessage(obj) {
	}

	/** decodeRelayPayload
	 *
	 * This function will decode the payload for a relay message from a
	 * raw Blob to a javascript object.
	 */
	decodeRelayPayload(payload) {
	}

	/** encodeRelayPayload
	 *
	 * This function encodes obj into the on-the-wire Blob format
	 */
	encodeRelayPayload(obj) {
	}

	/** decodeSignalingPayload
	 *
	 * This function will decode the payload for a signaling message
	 * from its on-the-wire raw blob form (returned by decodeMessage)
	 * to a javascript object.
	 */
	decodeSignalingPayload(payload) {
	}

	/** encodeSignalingPayload
	 *
	 * This function will encode the payload for a signaling message
	 * from this javascript object form to a raw blob form appropriate
	 * for sending over the wire.
	 */
	encodeSignalingPayload(obj) {
	}
}
