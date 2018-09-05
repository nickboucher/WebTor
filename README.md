# WebTor
Final Project for Harvard's CS263

We attempted to implement a TOR-like network that operates entirely within the
browser in which peers act as relay nodes. Peers have the option of acting as a
normal relay node (default) or an exit node (requires installation of Chrome
Extension).

This project is not yet fully implemented and does not have a timeline for
completion at this time. Most components are partially implemented and
directions for running the in-progress build can be found below.

A formal research paper documenting this project can be found at the root
of the repository.

## Installation

To install WebRTC, execute

```
$ npm install
```

in the project root directory (where 'package.json') is. As long as your
`node` is up-to-date, this will pull in all dependencies for the project.

Once that's done, you can build the project from source using Gulp with

```
$ gulp
```

which will transpile everything to es5, compile it all into a bundle, and
put everything into the `dist/` directory. To test it in a browser you can
issue the command:

```
$ gulp serve
```

which will start a lightweight http server that you can access in the browser.

## Usage

## Design

### Modules

`index`: Provides the browser-visible interface.

`or`: Provides Onion Router functionality.

`op`: Provides Onion Proxy functionality.

`crypto`: Provides cryptographic functions.

`network`: Provides higher-level interface to WebRTC connections (using abstract-tls).

`storage`: Provides high level interface to local storage components, including keeping track of known peer lists and possibly filesharing applications.

### Onion Routing

The onion routing behavior is the simpler part of the project. It utilitzes the circuits described later in order to make single direct requests over the anonymizing network. When behaving as an Exit Node in a circuite, a relay will use either WebSockets or XHR to connect to the Real World. Working as an onion router does not require any installation, only requiring navigating to the website and initializing the network.

### Onion Proxy

Implementing the onion proxy behavior is much more complicated. Creating circuits and establishing these connections is rather straightforward. Furthermore, single direct requests are straightforward, as well. However, it's more complicated to be able to intercept all network requests from the page that we are attempting to load. We can tackle this in two ways.

The first way is to implement an in-browser SOCKS proxy using WebSockets. This has largely been accomplished, so the work required would be to port this to make it actually run in a browser, and then write an extension that creates such a proxy and then changes the proxy settings for the browser inplace to use the newly created websocket SOCKS5 proxy. Note that this does require installation of an extensions, so doesn't satisfy our ideals of the project.

The other way is essentially to create something of our own renderer. We can easily intercept all XHRHttp requests by injecting our own version into any code that we load, forcing it to use our circuits instead of the normal AJAX request. This doesn't cover browser rendered requests, however. The idea here would be that for a web request, our in-browser OP would scan the HTTP data for any `src=""` attributes that would normally cause the renderer to make a fetch for that data. Instead, we will replace this with a recognizable template that will prevent the element from rendering, and make our own fetch for that source. We will do this recursively (in the case of html), until we have resolved all dependencies for that. We will then use those to generate a (probably large) data url that we will replace the calue of the `src=""` attribute with. This will probably be very buggy.

### Initialization

Each node must go through an initialization process in order to be able to function within the network. This involves the following things:

1. Generate a public/private keypair for identity and encryption.
1. Bootstrap into the network
1. Begin building circuits to use for connections.

### Signaling

The signaling layer of the network is the most complicated, because we require some signaling mechanism in order to establish peer WebRTC connection with peers to build circuits. We will assume for this section that the client who is building a circuit is already connected to at least one node in the network, and that the network is not partitioned. We will discuss both bootstrapping, and whether that is a valid assumption later.

We want to assume that each of our peers is maintaining an open RTCDataConnection with at least the _k_ peers who have public keys closest (by some measure of distance) to their own, where _k_ is a constant that we will tune empirically in order to find a balance between data usage and connectivity properties.

Let our node be Alice. Alice is trying to extend a circuit to include Bob. She has Bob's public key and an open RTCDataConnection to at least one node in the network. In order to start an RTCDataConnection with Bob, she need to exchange SDP strings with him, as well as ICE candidate data. She will send this data, encrypted with Bob's public key to Charlie, her connected node, along with Bob's public key. If Charlie has an open RTCDataConnection with Bob, then he can send this directly to Bob. If Charlie does not have an open RTCDataConnection to Bob, then he will send it to the person that he is connected to whose public key is closest (by some measure of distance) to Bob's. If Bob is indeed part of the network, then this will eventually reach him, given our assumed network connectivity properties. Bob can then use the same process to get his own signaling messages back to Alice.

If Bob has dropped out of the network, then eventually the two nodes with public keys (ids) closest to his will relay the message back to one another infinitely. To prevent this, if the closest peer to the destination is the node that the request was received from, then the node will instead drop the message and broadcast a message to its closest connected nodes that Bob is no longer part of the network, and should be removed from the peer list. Each peer will relay this message to its connected peers, except for the peer they received it from. Peers will keep track of message id's and won't relay any such message more than once.

#### Bootstrapping

The bootstrapping mechanism is used for establishing connections to peers not known to be in the network. It is also used to create the initial connection for a new node in the network during the initialization process. There are many possible solutions for the bootstrapping process, but this in particular requires an external server--in this case the same one used to serve the webapp in the first place. The webserver in this repo keeps a short list of privileged nodes in the network which are more long-running (and could even be running on node for longevity, instead of in the browser). The server provides a RESTful interface that may be used for signaling to these privileged nodes, replacing the signaling used for the above default case.


#### Fallback Signaling

We also provide a fallback signaling mechanism, in case the privileged nodes are offline or known to be compromised. The web app provides a manual connection establishment protocol via which signaling may be done using some out-of-band communication mechanism, so that signaling may be done manually in these extreme cases.

### Network Properties

### Messages

#### Object Representation

Base cells have the format:

```json
{
	"version": (byte),
	"type": (byte),
	"payload": (Buffer)
}
```

where "type" is an integer encoding the message type--"command" in the TOR spec, but extended to include `SIGNAL` messages, with some other message types deprecated.

Relay cells are of the form:

```json
{
	"command": (byte),
	"payload": (Buffer)
}
```

and signal cells are of the form:

```json
{
	"type": (byte),
	"id": (long),
	"payload": (Buffer)
}
```

where `id` is the destination id for all but the `SIG_ID` message, in which case it's the sender's `id`. This should only be used for direct connections.

#### Binary Encoding

## References

### Documentation

[ECMAScript 2015](http://git.io/es6features), [WebRTC](https://webrtc.org/start/),[node-socksv5](https://github.com/mscdex/socksv5)

### Prior Art

[node-Tor](https://github.com/Ayms/node-Tor), [Peersm](http://www.peersm.com/)
