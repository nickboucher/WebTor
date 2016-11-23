/** index.js
 *
 * This file contains the interface between the code and the browser.
 * Functions in that should be exposed directly to the browser need
 * a mapping such as the example window.TestPrint object. This is the
 * only way that functions will be made accessible in the browser
 * for the current architecture.
 */
'use strict';

import op from './op';
import or from './or';

/** window.TestPrint
 *
 * Function which will print out the string "testing" to the browser
 * console when called. This is the form that any exposed functions
 * should take if they need to be called by the browser.
 */
window.TestPrint = function() {
	console.log('testing');
}

/** EventWorker installtion bindings
 * For example only -- to be moved for final release */
 $(document).ready(function() {
	 $("#register").click(function(){
		 if ('serviceWorker' in navigator) {
			 navigator.serviceWorker.register('worker.js').then(function(registration) {
				 // Registration was successful
				 alert('ServiceWorker registration successful with scope: ' + registration.scope);
			 }).catch(function(err) {
				 // registration failed :(
				 alert('ServiceWorker registration failed: ' + err);
			 });
		 } else {
			 alert("ServiceWorkers not supported.");
		 }
	 });
	 $("#unregister").click(function(){
		 navigator.serviceWorker.getRegistrations().then(function(registrations) {
			 for(let registration of registrations) {
				 registration.unregister();
			 }
			 alert("Removed all workers.")
		 });
	 });
	 $("#go").click(function(){
		 $(".iframe-body").attr("src", "example-request.html")
	 });
 });
