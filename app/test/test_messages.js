/** test/messages.js
 *
 * This library provides test functions for the message.js library
 */
'use strict';

import {expect} from 'chai';
import mess from '../scripts/messages';
import types from '../scripts/messagetypes';

describe('scripts/messages.js', _ => {
	it('encode and decode are inverses', () => {
		let payload = Buffer.from("testing");

		let obj = {
			version: 1,
			type: types.SIGNAL,
			id: 12345667,
			payload: payload
		};

		let message = mess.encodeMessage(obj);

		let decoded = mess.decodeMessage(message);
		expect(decoded.version).to.equal(obj.version);
		expect(decoded.type).to.equal(obj.type);
		expect(decoded.id).to.equal(obj.id);
		expect(payload.compare(decoded.payload)).to.equal(0);
	});

	it('encodeSig and decodeSig are inverses', () => {
		let payload = Buffer.from("testing");
		let obj = {
			type: types.SIG_SDP,
			id: 1234567,
			payload: payload
		};

		let message = mess.encodeMessagePayload(types.SIGNAL, obj);
		let decoded = mess.decodeMessagePayload(types.SIGNAL, message);

		expect(decoded.type).to.equal(obj.type);
		expect(decoded.id).to.equal(obj.id);
		expect(payload.compare(decoded.payload)).to.equal(0);
	});

	it('encodeRelay and decodeRelay are inverses', () => {
		let payload = Buffer.from("testing");
		let obj = {
			command: types.RELAY_END,
			payload: payload
		};

		let message = mess.encodeMessagePayload(types.RELAY, obj);
		let decoded = mess.decodeMessagePayload(types.RELAY, message);

		expect(decoded.command).to.equal(obj.command);
		expect(payload.compare(decoded.payload)).to.equal(0);
	});

	it('encodeMessage and encodeSignalingPayload are composable', () => {
		let payload = Buffer.from("testing");
		let sig = { 
			type: types.SIG_SDP,
			id: 1234567,
			payload: payload
	    };

		let message_payload = mess.encodeMessagePayload(types.SIGNAL, sig);

		let message = {
			type: types.SIGNAL,
			id: 1234567,
			payload: message_payload
		};

		let msg = mess.encodeMessage(message);

		let decoded = mess.decodeMessage(msg);
		let dec_sig = mess.decodeMessagePayload(types.SIGNAL, decoded.payload);

		expect(dec_sig.type).to.equal(sig.type);
		expect(dec_sig.id).to.equal(sig.id);
		expect(dec_sig.payload.compare(sig.payload)).to.equal(0);
	});
});
