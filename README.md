# WebTor
Final Project for Harvard's CS263

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

### Module Structure

`index`: Provides the browser-visible interface.

`or`: Provides Onion Router functionality.

`op`: Provides Onion Proxy functionality.

`crypto`: Provides cryptographic functions.

`network.js`: Provides higher-level interface to WebRTC connections (using abstract-tls).

## Prior Art

[node-Tor](https://github.com/Ayms/node-Tor), [Peersm](http://www.peersm.com/)
