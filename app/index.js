/** index.js
 *
 * This file contains the interface between the code and the browser.
 * Functions in that should be exposed directly to the browser need
 * a mapping such as the example window.TestPrint object. This is the
 * only way that functions will be made accessible in the browser
 * for the current architecture.
 */
'use strict';

import 'webrtc';
import $ from 'jquery';
import 'buffer';

import op from './scripts/op';
import or from './scripts/or';
import {Router, Manual, SockSigChannel} from './scripts/signal';
import network, {Connection} from './scripts/network';
import {local_id, public_key} from './scripts/crypto';
import types from './scripts/messagetypes';

// init the network layer
network.init();

let debug = (string) => {
	console.log(string);
};

/** window.TestPrint
 *
 * Function which will print out the string "testing" to the browser
 * console when called. This is the form that any exposed functions
 * should take if they need to be called by the browser.
 * XXX: remove before deploy
 */
window.TestPrint = () =>  {
	console.log('testing');
}

//XXX: remove before deploy
$(document).ready(() =>  {
	// set the display hook for the manual signaling channel
	Manual.addDisplayHook((string) => {
		$("#sig-send").text(string);
	});
	$("#man-recv").click(() => {
		let conn = new Connection(1234, Manual);
	});
	$("#man-start").click(() => {
		let chan = network.getChannel(1234, 'testing', Manual);
	});
	$("#man-next").click(() => {
		Manual.next();
	});
	$("#man-accept").click(() => {
		let data = $("#sig-recv").val();
		// invoke the onSignal command with the received string
		if (data.length > 0) {
			try {
				Manual.onSignal(data);
			} catch(e) {
				// show the error if it failed
				$("#sig-error").text("ERROR: " + e);
			}
		}
	});
});

//XXX: remove before deploy
$(document).ready(() => {
	$("#bridge-connect").click(() => {
		// grab the current hoststring
		let hoststring = $("#hoststring").val();
		// make a urgl
		let url = "ws://" + hoststring;
		// open a signaling channel
		let sockSig = new SockSigChannel(url);

		sockSig.on(types.SIG_PEERLIST, null, (peers) => {
			// if we get a peerlist back, indicating that the server has
			// connected peers, try to open a random channel to one
			let index = Math.floor(Math.random() * (peers.length));

			// try to create a new signaling channel to a random peer
			network.getChannel(peers[index].id, 'sig', sockSig);
		});

		sockSig.on(types.SIG_ERROR, null, (error) => {
			// if there's an error just hang out and wait to see if someone
			// tries to connect to us
			debug(JSON.stringify(error.reason));

			Router.addBridgeChannel(sockSig);
		});

		sockSig.on(types.SIG_SDP, null, (desc) => {
			debug(desc);
		});

		sockSig.on(types.SIG_ICE, null, (candidate) => {
			debug(candidate);
		});

		sockSig.sock.onopen = () => {
			// identify ourselves
			sockSig.sendSignal(types.SIG_ID, local_id, { id: local_id, pub: public_key });
			// request a peerlist
			sockSig.sendSignal(types.SIG_REQ_PEERLIST, local_id, null);
		};
	});
});


 $(document).ready(() =>  {

	 /** EventWorker installtion Function */
	 function registerWorker() {
		 if ('serviceWorker' in navigator) {
			 navigator.serviceWorker.register('worker.js').then((registration) => {
			 }).catch((err) => {
				 // registration failed :(
				 $("#status").text("Worker Installation Failed");
				 return;
			 });
			 // Registration was successful
			 $('#status').text("Worker Installed and Running");
		 } else {
			 $("body").html("<h1>Failure</h1><h3>Your browser is not currently supported. Please use a current version of Google Chrome or Firefox.</h3>");
		 }
	 }

	 /** Debugging use only -- unregisters all workers */
	 $("#unregister").click(() => {
		 navigator.serviceWorker.getRegistrations().then((registrations) => {
			 for(let registration of registrations) {
				 registration.unregister();
			 }
			 $("#status").text("Workers Uninstalled");
			 $("#status").css("color", "red");
		 });
	 });
	 $("#go").click(() => {
		 $(".iframe-body").attr("src", "example-request.html")
	 });

	 /* Automatically install workers on page load */
	 registerWorker();
 });
