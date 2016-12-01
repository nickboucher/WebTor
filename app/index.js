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
import {Manual, SockSigChannel} from './scripts/signal';
import network, {Connection} from './scripts/network';

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
		let url = "ws://" + hoststring;
		let sockSig = new SockSigChannel(url);
		sockSig.sock.onopen = () => {
			network.getChannel(url, 'sig', sockSig);
		};
	});
});

/** EventWorker installtion bindings
 * For example only -- to be moved for final release */
 $(document).ready(() =>  {
	 $("#register").click(() => {
		 if ('serviceWorker' in navigator) {
			 navigator.serviceWorker.register('worker.js').then((registration) => {
				 // Registration was successful
				 alert('ServiceWorker registration successful with scope: ' + registration.scope);
			 }).catch((err) => {
				 // registration failed :(
				 alert('ServiceWorker registration failed: ' + err);
			 });
		 } else {
			 alert("ServiceWorkers not supported.");
		 }
	 });
	 $("#unregister").click(() => {
		 navigator.serviceWorker.getRegistrations().then((registrations) => {
			 for(let registration of registrations) {
				 registration.unregister();
			 }
			 alert("Removed all workers.")
		 });
	 });
	 $("#go").click(() => {
		 $(".iframe-body").attr("src", "example-request.html")
	 });
 });
