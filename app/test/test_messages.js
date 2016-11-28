/** test/messages.js
 *
 * This library provides test functions for the message.js library
 */
'use strict';

import {expect} from 'chai';
import mess from '../scripts/messages';
import types from '../scripts/messagetypes';

import buf from 'buffer/';

var Buffer = buf.Buffer;

describe('scripts/messages.js', _ => {
	it('should encode and decode messages predictably', () => {
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
});
