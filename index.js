const SocketIONamespaceController = require('./SocketIONamespaceController');

module.exports = {
  driver: io => (namespace, methods, helpers) => new SocketIONamespaceController(io, namespace, methods, helpers),
  use: SocketIONamespaceController.use
};
