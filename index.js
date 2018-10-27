const namespaces = {};
const mapGetters = (map, prefix) => Object.keys(map).reduce((accumulator, entity) => {
  prefix = prefix || 'load';
  const event = prefix + entity[ 0 ].toUpperCase() + entity.slice(1);
  const resolver = map[ entity ];
  accumulator[ event ] = async function (payload, ack) {
    payload = payload || {};
    payload[ entity ] = await resolver.call(this, payload);
    if (ack) ack(payload[ entity ]);
    else this.emit(entity, payload);
  };
  return accumulator;
}, {});
const prepare = (keys, target, socket, listen) => keys.reduce((acc, key) =>
  (acc[ key ] = target[ key ].bind(socket)) && (!listen || (key[ 0 ] === '_') || socket.on(key, acc[ key ])) && acc, {});
const addHook = (original, mixin) => {
  if (!original) return mixin;
  if (!Array.isArray(original)) original = [original];
  original.push(mixin);
  return original;
};
const runHook = (hook, ...args) => {
  if (!Array.isArray(hook)) return hook(...args);
  hook.forEach(child => child(...args));
};
function setupController(io, name, { methods = {}, emitters = {}, connected, created }, ...mixins) {
  for (const mixin of mixins) {
    if (mixin.methods) Object.assign(methods, mixin.methods);
    if (mixin.emitters) Object.assign(emitters, mixin.emitters);
    if (mixin.created) created = addHook(created, mixin.created);
    if (mixin.connected) connected = addHook(connected, mixin.connected);
  }
  const methodsKeys = Object.keys(methods);
  const emittersKeys = Object.keys(emitters);
  const namespace = namespaces[ name ] = io.of(name);
  if (created) runHook(created, namespace);
  namespace.on('connect', (socket) => {
    const connectionId = socket.id.split('#')[ 1 ];
    socket.as = name => namespaces[ name ].connected[ name + '#' + connectionId ].emitters;
    socket.methods = prepare(methodsKeys, methods, socket, true);
    socket.emitters = prepare(emittersKeys, emitters, socket);
    if (connected) runHook(connected, socket);
  });
}
module.exports = {
  driver: io => (namespace, definition, ...mixins) => setupController(io, namespace, definition, ...mixins),
  mapGetters
};
