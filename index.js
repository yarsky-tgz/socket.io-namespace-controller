const SocketIONamespaceController = require('./SocketIONamespaceController');

module.exports = {
  driver: io => (namespace, definition) => new SocketIONamespaceController(io, namespace, definition)
};
