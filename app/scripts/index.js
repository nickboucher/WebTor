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
