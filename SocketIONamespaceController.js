'use strict';
const controllers = {};

class SocketIONamespaceController {
  constructor(io, name, { methods = {}, emitters = {}, connected, created }) {
    controllers[ name ] = this;
    const methodsKeys = Object.keys(methods);
    const emittersKeys = Object.keys(emitters);
    const namespace = this.namespace = io.of(name);
    if (created) created(namespace);
    this.namespace.on('connect', (socket) => {
      const { id } = socket;
      const [ , connectionId ] = id.split('#');
      const prepare = (keys, target, socket, listen) => keys.reduce((acc, key) =>
        (acc[ key ] = target[ key ].bind(socket)) && (!listen || (key[0] === '_') || socket.on(key, acc[ key ])) && acc, {});
      socket.as = name => controllers[ name ].namespace.connected[ name + '#' + connectionId ].emitters;
      socket.methods = prepare(methodsKeys, methods, socket, true);
      socket.emitters = prepare(emittersKeys, emitters, socket);
      if (connected) connected(socket);
    });
  }
}

module.exports = SocketIONamespaceController;
