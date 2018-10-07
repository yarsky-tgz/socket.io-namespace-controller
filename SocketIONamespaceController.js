'use strict';
const controllers = {};
class SocketIONamespaceController {
  constructor(io, namespace, { methods, emitters, connected }) {
    controllers[namespace] = this;
    this.io = io;
    this.connected = connected;
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
      const prepareEmitters = (controller, context) => controller.emittersKeys.reduce((accumulator, key) => {
        accumulator[key] = controller.emitters[key].bind(context);
        return accumulator;
      }, context.emitters = {});
      const to = namespace => {
        const controller = controllers[namespace];
        const toSocket = this.namespace.to(namespace + '#' + connectionId);
        const context = namespaceScopes[namespace] ||
          (namespaceScopes[namespace] = {
            emit: toSocket.emit.bind(toSocket),
            broadcast: controller.broadcast,
            to
          });
        return namespaceEmitters[namespace] || (namespaceEmitters[namespace] = prepareEmitters(controller, context));
      };
      const emitterContext = { emit, broadcast, to };
      const context = {
        emit,
        broadcast,
        methods: {},
        emitters: prepareEmitters(this, emitterContext),
        to
      };
      for (let method of this.methodsKeys) {
        context.methods[method] = this.methods[method].bind(context);
        if (method[0] !== '_') socket.on(method, context.methods[method]);
      }
      if (this.connected) this.connected({
        namespace: this.namespace,
        socket,
        context
      });
    });
  }
}

module.exports = SocketIONamespaceController;
