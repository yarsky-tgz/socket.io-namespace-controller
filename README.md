# socket.io-namespace-controller [![Coverage Status](https://coveralls.io/repos/github/yarsky-tgz/socket.io-namespace-controller/badge.svg?branch=master)](https://coveralls.io/github/yarsky-tgz/socket.io-namespace-controller?branch=master) [![Build Status](https://travis-ci.org/yarsky-tgz/vuex-socket-sync.svg?branch=master)](https://travis-ci.org/yarsky-tgz/vuex-socket-sync)
Wrapper around Socket.IO namespaces which turn them into controller-like objects with advanced abilities

## Installation

```bash
npm i socket.io-namespace-controller
```

## Getting started

First, you get `setupController` function from libray, giving it  `socket.io` core object:

```javascript
const io = require('socket.io')(server);
const setupController = require('socket.io-namespace-controller').driver(io);
```

`setupController(namespace, definition)` takes two arguments:
 * `namespace` - name of socket.io namespace, your controller shall be assigned to
 * `definition` - object, describing your controller logic. It supports two properties:
   * `methods` - object of methods, which shall be assigned to same named events
   * `emitters` - object of methods, which shall store specific emitter logic and can be called by other controllers
   * `connected` - hook, which should be called after each namespace connection 

Let's create very simple controller, which shall have two events:
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
      this.broadcast('data', data);
    }
  }
})
``` 

Simple enough, isn't it? 

Let's do something more complex and useful for our beloved clients. Client, which changes settings, shall be pleased to see nice green notification on update success. 

Such logic must be separated into own controller, isn't it? So any controller shall have ability to send such messages.  

So let us create controller, which shall emit notifications:

```javascript
setupController('notifications', {
  methods: {
    async getUnread(clientId) {
      const messages = await notificationsService.getUnreadFor(clientId);
      for (let message of messages) this.emitters.notify(message);
    } 
  },
  emitters: {
    notify(message) {
      this.emit('message', message);
    }
  }
});
```

and after that we can easily add usage of it into our `settings` controller by editing `update()` method:

```javascript
    async update(data) {
      await settingsService.set(data);
      this.to('notifications').notify('You have successfully updated settings!');
      this.broadcast('data', data);
    }
```

All events of your namespace, ability of emitting which you want to share across other controllers, must be described as part of `emitters` object. Only object of `emitters` is returned by calling `this.to()` from your controller method. You shall not have direct access to `emit` or `broadcast` of target controller, only through `emitters`.

It done such way to have centralized definition of all shared events, so they are self-documented and well organized by default.

## Context (`this`)

Each **method** is bound to context object with following properties:
 * `emit(event, payload)` - for emitting events to socket. In fact that's `socket.emit` method just assigned to scope, but bound to socket object.
 * `broadcast(event, payload)` - for broadcasting events to namespace. Again, that's `namespace.emit` method, assigned to scope but bound to namespace object.
 * `to(namespaceControllerName)` - method which returns emitters of other controller
 * `methods` - your controller methods
 * `emitters` - your controller emitters
 
Each **emitter** is bound to context with same properties, but without `methods`. 

So methods can rely on emitters but not vice versa.

You haven't access to original `socket` or `namespace` by default. But you can add them to context at `connected` hook.

## Hooks 

`connected({ namespace, socket, context })` -  receives original `namespace`, `socket` and `context` bound to methods.

Example of controller with `connected` hook, which is adding `socket` to context: 

```javascript
setupController('test', {
  methods: { ... },
  connected({ socket, context }) {
    context.socket = socket;
  }
});
```
