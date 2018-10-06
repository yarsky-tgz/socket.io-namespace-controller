const controllers = {};
const socketMiddlewares = [];
class SocketIONamespaceController {
  constructor(io, namespace, { methods, emitters }) {
    controllers[namespace] = this;
    this.io = io;
    this.methods = methods || {};
    this.emitters = emitters || {};
    this.namespace = io.of(namespace);
    this.methodsKeys = Object.keys(methods);
    this.emittersKeys = Object.keys(emitters);
    this.namespace.on('connect', ({ id, use, on, emit, broadcast: { emit: broadcast } }) => {
      const [ , connectionId ] = id.split('#');
      const namespaceScopes = {};
      const namespaceEmitters = {};
      const prepareEmitters = (controller, that) => controller.emittersKeys.reduce((accumulator, key) => {
        accumulator[key] = controller.emitters[key].bind(that);
        return accumulator;
      }, {});
      const to = namespace => {
        const controller = controllers[namespace];
        const that = namespaceScopes[namespace] ||
          (namespaceScopes[namespace] = {
            emit: this.namespace.to(namespace + '#' + connectionId).emit,
            broadcast: controller.namespace.emit,
            to
          });
        return namespaceEmitters[namespace] || (namespaceEmitters[namespace] = prepareEmitters(controller, that));
      };
      const that = {
        emit,
        broadcast,
        emitters: prepareEmitters(this, { emit, broadcast, to }),
        to
      };
      for (let middleware of socketMiddlewares) use(middleware.bind(that));
      for (let method of this.methodsKeys) {
        that[method] = this.methods[method].bind(that);
        if (method[0] !== '_') on(method, that[method]);
      }
    });
  }
  
  static use(middleware) {
    socketMiddlewares.push(middleware);
  }
}

module.exports = SocketIONamespaceController;
