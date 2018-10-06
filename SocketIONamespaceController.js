'use strict';
const controllers = {};
class SocketIONamespaceController {
  constructor(io, namespace, { methods, emitters }) {
    controllers[namespace] = this;
    this.io = io;
    this.methods = methods || {};
    this.emitters = emitters || {};
    this.namespace = io.of(namespace);
    this.broadcast = this.namespace.emit.bind(this.namespace);
    this.methodsKeys = Object.keys(this.methods);
    this.emittersKeys = Object.keys(this.emitters);
    this.namespace.on('connect', (socket) => {
      const { id } = socket;
      const emit = socket.emit.bind(socket);
      const broadcast = this.broadcast;
      const [ , connectionId ] = id.split('#');
      const namespaceScopes = {};
      const namespaceEmitters = {};
      const prepareEmitters = (controller, that) => controller.emittersKeys.reduce((accumulator, key) => {
        accumulator[key] = controller.emitters[key].bind(that);
        return accumulator;
      }, {});
      const to = namespace => {
        const controller = controllers[namespace];
        const toSocket = this.namespace.to(namespace + '#' + connectionId);
        const that = namespaceScopes[namespace] ||
          (namespaceScopes[namespace] = {
            emit: toSocket.emit.bind(toSocket),
            broadcast: controller.broadcast,
            to
          });
        return namespaceEmitters[namespace] || (namespaceEmitters[namespace] = prepareEmitters(controller, that));
      };
      const that = {
        emit,
        broadcast,
        emitters: prepareEmitters(this, { emit, broadcast, to }),
        to,
        socket
      };
      for (let method of this.methodsKeys) {
        that[method] = this.methods[method].bind(that);
        if (method[0] !== '_') socket.on(method, that[method]);
      }
    });
  }
}

module.exports = SocketIONamespaceController;
