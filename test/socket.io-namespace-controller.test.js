const subject = require('../');
const initIoMock = () => ({
  of: jest.fn((name) => ({
    connected: { [`${name}#007`]: initSocketMock(name)},
    emit: jest.fn(),
    on: jest.fn()
  }))
});
const initSocketMock = (name) => ({
  id: `${name}#007`,
  on: jest.fn(),
  emit: jest.fn()
});

describe("testing socket.io namespace controller wrapper", () => {
  test("it creates controller", () => {
    const io = initIoMock();
    const setup = subject.driver(io);
    setup('test', {});
    expect(io.of).toBeCalledWith('test');
    const { on } = io.of.mock.results[0].value;
    expect(on).toBeCalled();
    expect(on.mock.calls[0][0]).toBe('connect');
    expect(on.mock.calls[0][1]).toBeInstanceOf(Function);
  });
  test("it creates controller and connected hook is called on connect", () => {
    const io = initIoMock();
    const setup = subject.driver(io);
    const testController = {
      connected: jest.fn()
    };
    setup('test', testController);
    const namespace = io.of.mock.results[0].value;
    const socket = namespace.connected['test#007'];
    const initializer = namespace.on.mock.calls[0][1];
    initializer(socket);
    expect(testController.connected).toBeCalledWith(socket);
  });
  test("it creates controller and both connected hooks are called on connect", () => {
    const io = initIoMock();
    const setup = subject.driver(io);
    const mixinController = {
      connected: jest.fn()
    };
    const testController = {
      connected: jest.fn()
    };
    setup('test', testController, mixinController);
    const namespace = io.of.mock.results[0].value;
    const socket = namespace.connected['test#007'];
    const initializer = namespace.on.mock.calls[0][1];
    initializer(socket);
    expect(testController.connected).toBeCalledWith(socket);
    expect(mixinController.connected).toBeCalledWith(socket);
  });
  test("it creates controller and created hook is called", () => {
    const io = initIoMock();
    const setup = subject.driver(io);
    const testController = {
      created: jest.fn()
    };
    setup('test', testController);
    const namespace = io.of.mock.results[0].value;
    expect(testController.created).toBeCalledWith(namespace);
  });
  test("it creates controller and both created hooks are called", () => {
    const io = initIoMock();
    const setup = subject.driver(io);
    const mixinController = {
      created: jest.fn()
    };
    const testController = {
      created: jest.fn()
    };
    setup('test', testController, mixinController);
    const namespace = io.of.mock.results[0].value;
    expect(testController.created).toBeCalledWith(namespace);
    expect(mixinController.created).toBeCalledWith(namespace);
  });
  test("it creates controller and three created hooks are called", () => {
    const io = initIoMock();
    const setup = subject.driver(io);
    const mixinController = {
      created: jest.fn()
    };
    const thirdController = {
      created: jest.fn()
    };
    const testController = {
      created: jest.fn()
    };
    setup('test', testController, mixinController, thirdController);
    const namespace = io.of.mock.results[0].value;
    expect(testController.created).toBeCalledWith(namespace);
    expect(mixinController.created).toBeCalledWith(namespace);
    expect(thirdController.created).toBeCalledWith(namespace);
  });
  test("it creates controller and only mixed in hook is called", () => {
    const io = initIoMock();
    const setup = subject.driver(io);
    const mixinController = {
      created: jest.fn()
    };
    const testController = {};
    setup('test', testController, mixinController);
    const namespace = io.of.mock.results[0].value;
    expect(mixinController.created).toBeCalledWith(namespace);
  });
  test("it creates controller and method is assigned to corresponding event", () => {
    const io = initIoMock();
    const setup = subject.driver(io);
    const testController = {
      methods: {
        go: jest.fn()
      }
    };
    setup('test', testController);
    const { on, connected } = io.of.mock.results[0].value;
    const socket = connected['test#007'];
    const initializer = on.mock.calls[0][1];
    initializer(socket);
    expect(socket.on).toBeCalled();
    expect(socket.on.mock.calls[0][0]).toBe('go');
    socket.on.mock.calls[0][1]();
    expect(testController.methods.go).toBeCalled();
  });
  test("it creates controller and mixin method is assigned to corresponding event", () => {
    const io = initIoMock();
    const setup = subject.driver(io);
    const mixinController = {
      methods: {
        go: jest.fn()
      }
    };
    const testController = {};
    setup('test', testController, mixinController);
    const { on, connected } = io.of.mock.results[0].value;
    const socket = connected['test#007'];
    const initializer = on.mock.calls[0][1];
    initializer(socket);
    expect(socket.on).toBeCalled();
    expect(socket.on.mock.calls[0][0]).toBe('go');
    socket.on.mock.calls[0][1]();
    expect(mixinController.methods.go).toBeCalled();
  });
  test("it creates controller and underscored method is not assigned to event", () => {
    const io = initIoMock();
    const setup = subject.driver(io);
    const testController = {
      methods: {
        _protected: jest.fn()
      }
    };
    setup('test', testController);
    const { on, connected } = io.of.mock.results[0].value;
    const socket = connected['test#007'];
    const initializer = on.mock.calls[0][1];
    initializer(socket);
    expect(socket.on.mock.calls.length).toBe(0);
  });
  test("it creates controller and method calls emit on right socket instance", () => {
    const io = initIoMock();
    const setup = subject.driver(io);
    const testEvent = 'gone';
    const testPayload = 'to the Moon!';
    const testController = {
      methods: {
        go: function() {
          this.emit(testEvent, testPayload);
        }
      }
    };
    setup('test', testController);
    const { on, connected } = io.of.mock.results[0].value;
    const socket = connected['test#007'];
    const initializer = on.mock.calls[0][1];
    initializer(socket);
    socket.on.mock.calls[0][1]();
    expect(socket.emit).toBeCalledWith(testEvent, testPayload);
  });
  test("it creates controller and method can call emitter", () => {
    const io = initIoMock();
    const setup = subject.driver(io);
    const testController = {
      methods: {
        go: function() {
          this.emitters.walk();
        }
      },
      emitters: {
        walk: jest.fn()
      }
    };
    setup('test', testController);
    const { on, connected } = io.of.mock.results[0].value;
    const socket = connected['test#007'];
    const initializer = on.mock.calls[0][1];
    initializer(socket);
    socket.on.mock.calls[0][1]();
    expect(testController.emitters.walk).toBeCalled();
  });
  test("it creates controller and method can call mixed in emitter", () => {
    const io = initIoMock();
    const setup = subject.driver(io);
    const mixinController = {
      emitters: {
        walk: jest.fn()
      },
    };
    const testController = {
      methods: {
        go: function() {
          this.emitters.walk();
        }
      },
    };
    setup('test', testController, mixinController);
    const { on, connected } = io.of.mock.results[0].value;
    const socket = connected['test#007'];
    const initializer = on.mock.calls[0][1];
    initializer(socket);
    socket.on.mock.calls[0][1]();
    expect(mixinController.emitters.walk).toBeCalled();
  });
  test("it creates controller and emitter calls emit on right socket instance", () => {
    const io = initIoMock();
    const setup = subject.driver(io);
    const testEvent = 'gone';
    const testPayload = 'to the Moon!';
    const testController = {
      methods: {
        go: function() {
          this.emitters.walk();
        }
      },
      emitters: {
        walk: function() {
          this.emit(testEvent, testPayload);
        }
      }
    };
    setup('test', testController);
    const { on, connected } = io.of.mock.results[0].value;
    const socket = connected['test#007'];
    const initializer = on.mock.calls[0][1];
    initializer(socket);
    socket.on.mock.calls[0][1]();
    expect(socket.emit).toBeCalledWith(testEvent, testPayload);
  });
  test("it creates controller and method can call foreign controller's emitter", () => {
    const io = initIoMock();
    const setup = subject.driver(io);
    const testPayload = 'Moon';
    const testController = {
      methods: {
        go: function() {
          this.as('ticket').buy(testPayload);
        }
      }
    };
    const ticketController = {
      emitters: {
        buy: jest.fn()
      }
    };
    setup('test', testController);
    setup('ticket', ticketController);
    const { on, connected } = io.of.mock.results[0].value;
    const socket = connected['test#007'];
    const initializer = on.mock.calls[0][1];
    initializer(socket);
    const { on: onTicket, connected: connectedTicket } = io.of.mock.results[1].value;
    const socketTicket = connectedTicket['ticket#007'];
    const initializerTicket = onTicket.mock.calls[0][1];
    initializerTicket(socketTicket);
    socket.on.mock.calls[0][1]();
    expect(ticketController.emitters.buy).toBeCalledWith(testPayload);
  });
  test("it creates controller and foreign controller's emitter calls emit on right socket instance", () => {
    const io = initIoMock();
    const setup = subject.driver(io);
    const testEvent = 'buy';
    const testPayload = 'Moon';
    const testController = {
      methods: {
        go: function() {
          this.as('ticket').buy(testPayload);
        }
      }
    };
    const ticketController = {
      emitters: {
        buy: function (direction) {
          this.emit(testEvent, direction);
        }
      }
    };
    setup('test', testController);
    setup('ticket', ticketController);
    const { on, connected } = io.of.mock.results[0].value;
    const socket = connected['test#007'];
    const initializer = on.mock.calls[0][1];
    initializer(socket);
    const { on: onTicket, connected: connectedTicket } = io.of.mock.results[1].value;
    const socketTicket = connectedTicket['ticket#007'];
    const initializerTicket = onTicket.mock.calls[0][1];
    initializerTicket(socketTicket);
    socket.on.mock.calls[0][1]();
    const { emit } = io.of.mock.results[1].value.connected['ticket#007'];
    expect(emit).toBeCalledWith(testEvent, testPayload);
  });
});
