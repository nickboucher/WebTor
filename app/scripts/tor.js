/** tor.js
 *
 * This module contains shared TOR abstractions used by
 * both ORs and OPs.
 */

'use strict';

/** Circuit
 *
 * The Circuit class encapsulates the TOR
 * circuit abstraction.
 */
export class Circuit {
	constructor() {
		this.prev = null;
		this.next = null;
	}

	create() {
	}

	relay() {
	}

	extend() {
	}

	truncate() {
	}

	destroy() {
	}
}

export default {
}
