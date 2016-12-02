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
			 // add message listener
			 navigator.serviceWorker.onmessage = function(event) {
				 if (event.data.type == "FROM_WORKER") {
					 console.log("Page got message from worker.");
					 window.postMessage({ type: "FROM_PAGE", text: "Hello from the webpage!" }, "*");
				 }
			}
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

	 window.addEventListener("message", function(event) {
     // We only accept messages from ourselves
     if (event.source != window)
       return;

     if (event.data.type && (event.data.type == "FROM_EXTENSION")) {
       //window.postMessage({ type: "FROM_EXTENSION", text: "Hello from the extension content_script!" }, "*");
       console.log("Page got message from extension.");
			 navigator.serviceWorker.controller.postMessage({
            "message": "Hello from the page."
        });
     }
   }, false);

	 /* Automatically install workers on page load */
	 registerWorker();

 });
