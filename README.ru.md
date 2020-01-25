# socket.io-namespace-controller [![Coverage Status](https://coveralls.io/repos/github/yarsky-tgz/socket.io-namespace-controller/badge.svg?branch=master&v=1)](https://coveralls.io/github/yarsky-tgz/socket.io-namespace-controller?branch=master) [![Build Status](https://travis-ci.org/yarsky-tgz/vuex-socket-sync.svg?branch=master)](https://travis-ci.org/yarsky-tgz/vuex-socket-sync)

Обёртка вокруг Socket.IO namespaces, которая позволяет организовать функции обработчики события в объекты.  

## Установка

```bash
npm i socket.io-namespace-controller
```

## Введение

Main purpose of this library is to compose socket event handlers into objects. So event handler **declaration** and **registration** are
separated and logic is now **structured** and **encapsulated**. Now you can group them into **mixins** and reuse code across controllers.
Also you can easily **wrap** your methods at one centralized place. 

Главная цель этой библиотеки объединить обработчики событий сокета в объекты. Поэтому **декларация** и **регистрация** обработчиков событий отдельны и логика теперь **структурирована** и **инкапсулирована**. Теперь вы можете сгруппировать их в **примеси** и использовать код заново через контроллеры.
Также вы можете легко **свернуть** ваши методы в одно централизованное место.

## Getting started

## Начало

First, you need to get `setupController` function from library, giving it `socket.io` Server instance:

Сначала вам необходимо установить функцию `setupController` из библиотеки, давая ей экземпляр Сервера  через `socket.io`

```javascript
const io = require('socket.io')(server);
const setupController = require('socket.io-namespace-controller').driver(io);
```

`setupController(namespace, definition)` takes two arguments:
 * `namespace` - name of socket.io namespace, your controller will be assigned to
 * `definition` - object, describing your controller logic. It can consists from following properties:
   * `methods` - object of methods, which will be assigned to same named events
   * `emitters` - object of methods, which will store specific emitter logic and can be called by other controllers
   * `created` - hooks, which should be called after namespace created
   * `connected` - hook, which should be called after each socket connection to namespace  
  
 `setupController(namespace, definition)` берет два аргумента:
 * `namespace` - имя пространства имён сокета, к которому будет приписан ваш контроллёр
 * `definition` - объект, описывающий логику вашего контроллёра. Он может состоять из следующих свойств:
   * `methods` - объекты методов, которые будут приписаны так званым событиям
   * `emitters` - объекты методов, которые сохранят конкретную логику отправителя и могут быть вызваны другими контроллёрами
   * `created` - хуки, которые следует вызывать после созданного пространства имён
   * `connected` - хук, который следует вызвать после каждого соединения сокет с пространством имён
   
## Methods

## Методы

Let's create very simple controller, which will handle two events:
 * `load` - for settings loading by clients
 * `update` - for settings updating with broadcasting of changed settings to all connected clients.
 
Давайте создадим очень простой контроллер, который будет обрабатывать два события:
* `load` - для настроек, загруженных клиентами
* `update` - для настроек обновления с оповещением изменения настроек для всех подсоединённых клиентов.

```javascript
setupController('/settings', {
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

Как вы видите, экземпляр `Socket` был указан как `this` в наших методах.

## Emitters

## Эмиттеры


Let's do something more complex and useful for our beloved clients. Client, which changes settings, will be pleased to see nice green notification on update success. 

Давайте сделаем что-то более сложное и полезное для наших любимых клиентов. Клиенту, который меняет настройки, будет приятно увидеть красивое зелёное уведомление на обновлении успеха.

Such logic must be separated into own controller, do you agree? So let us create controller, which will have two methods - for emit notifications to sender, and to all except sender:

Такая логика должна быть отделена в собственного контроллера, вы согласны? Итак давайте создадим контроллера который будет иметь два метода - для отправки уведомлений отправителю и всем, кроме отправителя:

```javascript
setupController('/notifications', {
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

и после этого мы можем легко добавить ено использование в наши `settings` контроллеры, редакитруя `update()` метод:

```javascript
    async update(data) {
      await settingsService.set(data);
      this.as('/notifications').notify('You have successfully updated settings!');
      this.as('/notifications').notifyOthers('Settings updated.');
      this.broadcast.emit('data', data);
    }
```

All events of your namespace, ability of emitting which you want to share across other controllers, must be described as part of `emitters` object. Only `emitters` object is returned by calling `this.as()` from your controller method. You will not have direct access to `emit` or `broadcast` of target controller, only through `emitters`.

все события вашего пространства имён, возможность отправки, которой вы хотите поделиться через других контроллеров, должна быть описана как часть объекта `emitters`. Только `emitters` объект возвращается вызовом `this.as()`из вашего метода контроллера. 

It was done in such way for having all namespace events described only in controller they belong to.

Это было сделано таким образом для описания всего пространства имён только в контроллере, к которому они принадлежат. 

Emitters can be used at their controller methods. For example let's add such method into described above `notifications` controller:

Эмиттеры могут быть использованы в своих методах контроллеров. Например, давайте добавим такой метод в описанный выше `notifications`
контроллер:

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
 
 Каждый **метод** и **эмиттер** связан с подключенным `socket` экхемпляром следующими дополнительными возможностями, назначенными:
 * `as(namespaceControllerName)` - метод, который возвращает эмиттеров другого контроллера
 * `methods` - ваши контроллер методы
 * `emitters` - ваши контроллер эмитеры
 
## Hooks 

## Хуки

`created(namespace)` - is called after `namespace` creation. receives original socket.io `Namespace` instance.

`created(namespace)` - названо по созданному `namespace`. получает первоисточник socket.io `Namespace` экземпляр.

That's place for assigning middleware to namespace, etc.

Это место для назначения промежуточного слоя к простоанству имён, и т.д.

Example:

Пример:

```javascript
setupController('/test', {
  methods: { ... },
  created(namespace) {
    namespace.use((socket, next) => {
      if (socket.request.headers.cookie) return next();
      next(new Error('Authentication error'));
    })
  }
})
``` 

`connected(socket)` - is called after client connected, receives original socket.io `Socket` instance.

`connected(socket)` - называется в соответствии с подключенным клиентом, получает первоисточник socket.io `Socket` экземпляр.

That's place for room joining, etc.

Это место для присоединения к 
