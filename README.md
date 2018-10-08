# socket.io-namespace-controller [![Coverage Status](https://coveralls.io/repos/github/yarsky-tgz/socket.io-namespace-controller/badge.svg?branch=master)](https://coveralls.io/github/yarsky-tgz/socket.io-namespace-controller?branch=master) [![Build Status](https://travis-ci.org/yarsky-tgz/vuex-socket-sync.svg?branch=master)](https://travis-ci.org/yarsky-tgz/vuex-socket-sync)
Wrapper around Socket.IO namespaces which turn them into controller-like objects with advanced abilities

## Installation

```bash
npm i socket.io-namespace-controller
```

## Intro

Main purpose of this library is to compose socket event handlers into objects. So event handler **declaration** and **registration** are separated and logic is now **structured** and **encapsulated**. You are able to add optional **decorators** to event handlers, apply **mixins** or even use ES6 **classes**. 

## Getting started

First, you need to get `setupController` function from libray, giving it `socket.io` Server instance:

```javascript
const io = require('socket.io')(server);
const setupController = require('socket.io-namespace-controller').driver(io);
```

`setupController(namespace, definition)` takes two arguments:
 * `namespace` - name of socket.io namespace, your controller shall be assigned to
 * `definition` - object, describing your controller logic. It can consists from following properties:
   * `methods` - object of methods, which shall be assigned to same named events
   * `emitters` - object of methods, which shall store specific emitter logic and can be called by other controllers
   * `created` - hooks, which should be called after namespace created
   * `connected` - hook, which should be called after each socket connection to namespace
   
## Methods

Let's create very simple controller, which shall handle two events:
 * `load` - for settings loading by clients
 * `update` - for settings updating with broadcasting of changed settings to all connected clients.

```javascript
setupController('settings', {
  methods: {
    async load() {
      this.emit('data', await settingsService.all());
    },
    async update(data) {
      await settingsService.set(data);
      this.broadcast.emit('data', data);
    }
  }
})
``` 

As you can see, `Socket` instance has been bound as `this` to our methods.

## Emitters

Let's do something more complex and useful for our beloved clients. Client, which changes settings, shall be pleased to see nice green notification on update success. 

Such logic must be separated into own controller, do you agree? So let us create controller, which shall have two methods - for emit notifications to sender, and to all except sender:

```javascript
setupController('notifications', {
  emitters: {
    notify(message) {
      this.emit('message', message);
    },
    notifyOthers(message) {
      this.broadcast.emit('message', message);
    }
  }
});
```

and after that we can easily add usage of it into our `settings` controller by editing `update()` method:

```javascript
    async update(data) {
      await settingsService.set(data);
      this.as('notifications').notify('You have successfully updated settings!');
      this.as('notifications').notifyOthers('Settings updated.');
      this.broadcast.emit('data', data);
    }
```

All events of your namespace, ability of emitting which you want to share across other controllers, must be described as part of `emitters` object. Only `emitters` object is returned by calling `this.as()` from your controller method. You shall not have direct access to `emit` or `broadcast` of target controller, only through `emitters`.

It done such way for having all namespace events described only in controller they belong to.

Emitters can be used at their controller methods. For example let's add such method into described above `notifications` controller:

```javascript
  methods: {
    async getUnread(clientId) {
      const messages = await notificationsService.getUnreadFor(clientId);
      for (let message of messages) this.emitters.notify(message);
    } 
  }
```

## `this` Context

Each **method** and **emitter** is bound to connected `socket` instance with following additional properties assigned:
 * `as(namespaceControllerName)` - method which returns emitters of another controller
 * `methods` - your controller methods
 * `emitters` - your controller emitters
 
## Hooks 

`created(namespace)` - receives original `namespace`.

That's place for assigning middleware to namespace, etc.

Example:

```javascript
setupController('test', {
  methods: { ... },
  created(namespace) {
    namespace.use((socket, next) => {
      if (socket.request.headers.cookie) return next();
      next(new Error('Authentication error'));
    })
  }
})
``` 

`connected(socket)` -  receives `socket`.

That's place fro room joining, etc.