/** crypto.js
 *
 * This module contains all the cryptographic functions that are used by
 * the rest of the application.
 */
'use strict'; //what does this mean?

import NodeRSA from 'node-rsa';
import crypto from 'crypto';

//RSA
//uses rsa implementation by Tom Wy http://www-cs-students.stanford.edu/~tjw/jsbn/
//creation of a RSA environment, key management has to be improved
var key = new NodeRSA({b: 512});

// // or load from a .pem file see https://www.npmjs.com/package/node-rsa
// var key = new NodeRSA('-----BEGIN RSA PRIVATE KEY-----\n'+
//                   'MIIBOQIBAAJAVY6quuzCwyOWzymJ7C4zXjeV/232wt2ZgJZ1kHzjI73wnhQ3WQcL\n'+
//                   'DFCSoi2lPUW8/zspk0qWvPdtp6Jg5Lu7hwIDAQABAkBEws9mQahZ6r1mq2zEm3D/\n'+
//                   'VM9BpV//xtd6p/G+eRCYBT2qshGx42ucdgZCYJptFoW+HEx/jtzWe74yK6jGIkWJ\n'+
//                   'AiEAoNAMsPqwWwTyjDZCo9iKvfIQvd3MWnmtFmjiHoPtjx0CIQCIMypAEEkZuQUi\n'+
//                   'pMoreJrOlLJWdc0bfhzNAJjxsTv/8wIgQG0ZqI3GubBxu9rBOAM5EoA4VNjXVigJ\n'+
//                   'QEEk1jTkp8ECIQCHhsoq90mWM/p9L5cQzLDWkTYoPI49Ji+Iemi2T5MRqwIgQl07\n'+
//                   'Es+KCn25OKXR/FJ5fu6A6A+MptABL3r8SEjlpLc=\n'+
//                   '-----END RSA PRIVATE KEY-----');
// key.importKey(keyData, [format]);
// key.exportKey([format]);

export default {
	/*
	encrypt_rsa(key, text)
	computes the rsa encryption with 512b key

	arguments:
	- key is a key instance (512b)
	- text is a plaintext in utf8
	*/
	encrypt_rsa(key, text) {
		return encrypted = key.encrypt(text, 'base64');
	},

	/*
	decrypt_rsa(key, encrypted)
	computes the rsa encryption with 512b key

	arguments:
	- key is a key instance (512b)
	- encrypted is the cypher text (with 512b key)
	*/
	decrypt_rsa(key, encrypted) {
		return decrypted = key.decrypt(encrypted, 'utf8');
	},

	//AES
	//uses aes implementation from Node API crypto
	//creation of an AES128 environment from a password

	/*
	encrypt_aes(password, text)
	computes the aes128 encryption of the plaintext

	arguments:
	- password utf8
	- plaintext utf8
	*/
	encrypt_aes(password, text) {
		const cipher = crypto.createCipher('aes128', password);
		var encrypted = cipher.update(text, 'utf8', 'hex');
		encrypted += cipher.final('hex');
		return encrypted;
	},

	/*
	decrypt_aes(password, encrypted)
	computes the aes128 decrytion of the cyphertext

	arguments:
	- password utf8
	- encrypted cypher text aes128
	*/
	decrypt_aes(password, encrypted) {
		const decipher = crypto.createDecipher('aes128', password);
		var decrypted = decipher.update(encrypted, 'hex', 'utf8');
		decrypted += decipher.final('utf8');
		return decrypted;
	},
}
