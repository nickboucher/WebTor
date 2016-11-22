/** bridge.js
 *
 * This module contains all the functions needed to run a
 * bridge service on an open socket. It uses Node sockets t
 * create a simple TCP/IP service that listens for SDP offers
 * in order to create WebRTC connections. The bridge also behaves
 * as an OR in its own right, using the node implementation of WebRTC.
 */

'use strict';

import Server from './server';

export default {
};
