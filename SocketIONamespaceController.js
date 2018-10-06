const controllers = {};
const socketMiddlewares = [];
class SocketIONamespaceController {
  constructor(io, namespace, { methods, helpers }) {
    controllers[namespace] = this;
    this.io = io;
    this.methods = methods || {};
    this.helpers = helpers || {};
    this.namespace = io.of(namespace);
    this.methodsKeys = Object.keys(methods);
    this.helpersKeys = Object.keys(helpers);
    this.namespace.on('connect', ({ id, use, on, emit, broadcast: { emit: broadcast } }) => {
      const [ , connectionId ] = id.split('#');
      const namespaceScopes = {};
      const namespaceHelpers = {};
      const prepareHelpers = (controller, that) => controller.helpersKeys.reduce((accumulator, key) => {
        accumulator[key] = controller.helpers[key].bind(that);
        return accumulator;
      }, {});
      const that = {
        emit,
        broadcast,
        helpers: prepareHelpers(this, { emit }),
        to: namespace => {
          const controller = controllers[namespace];
          const that = namespaceScopes[namespace] ||
            (namespaceScopes[namespace] = { emit: this.namespace.to(namespace + '#' + connectionId).emit });
          return namespaceHelpers[namespace] || (namespaceHelpers[namespace] = prepareHelpers(controller, that));
        }
      };
      for (let middleware of socketMiddlewares) use(middleware.bind(that));
      for (let method of this.methodsKeys) on(this.methods[method].bind(that));
    });
  }
  
  static use(middleware) {
    socketMiddlewares.push(middleware);
  }
}

module.exports = SocketIONamespaceController;
