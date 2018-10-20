const namespaces = {};
const mapGetters = (map, prefix) => Object.keys(map).reduce((accumulator, entity) => {
  prefix = prefix || 'load';
  const event = prefix + entity[ 0 ].toUpperCase() + entity.slice(1);
  const resolver = map[ entity ];
  accumulator[ event ] = async function (payload, ack) {
    payload = payload || {};
    payload[ entity ] = await resolver(payload);
    if (ack) ack(payload[ entity ]);
    else this.emit(entity, payload);
  };
  return accumulator;
}, {});
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
  driver: io => (namespace, definition) => setupController(io, namespace, definition),
  mapGetters
};
