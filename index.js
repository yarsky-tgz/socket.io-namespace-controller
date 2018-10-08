const namespaces = {};
const prepare = (keys, target, socket, listen) => keys.reduce((acc, key) =>
  (acc[ key ] = target[ key ].bind(socket)) && (!listen || (key[ 0 ] === '_') || socket.on(key, acc[ key ])) && acc, {});
function setupController(io, name, { methods = {}, emitters = {}, connected, created }) {
  const methodsKeys = Object.keys(methods);
  const emittersKeys = Object.keys(emitters);
  const namespace = namespaces[ name ] = io.of(name);
  if (created) created(namespace);
  namespace.on('connect', (socket) => {
    const connectionId = socket.id.split('#')[ 1 ];
    socket.as = name => namespaces[ name ].connected[ name + '#' + connectionId ].emitters;
    socket.methods = prepare(methodsKeys, methods, socket, true);
    socket.emitters = prepare(emittersKeys, emitters, socket);
    if (connected) connected(socket);
  });
}
module.exports = {
  driver: io => (namespace, definition) => setupController(io, namespace, definition)
};
