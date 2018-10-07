const subject = require('../');
const initIoMock = () => ({
  of: jest.fn(() => ({
    emit: jest.fn(),
    on: jest.fn(),
    to: jest.fn(() => ({
      emit: jest.fn()
    }))
  }))
});
const initSocketMock = () => ({
  id: 'test#007',
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
  test("it creates controller and method is assigned to corresponding event", () => {
    const io = initIoMock();
    const socket = initSocketMock();
    const setup = subject.driver(io);
    const testController = {
      methods: {
        go: jest.fn()
      }
    };
    setup('test', testController);
    const { on } = io.of.mock.results[0].value;
    const initializer = on.mock.calls[0][1];
    initializer(socket);
    expect(socket.on).toBeCalled();
    expect(socket.on.mock.calls[0][0]).toBe('go');
    socket.on.mock.calls[0][1]();
    expect(testController.methods.go).toBeCalled();
  });
  test("it creates controller and underscored method is not assigned to event", () => {
    const io = initIoMock();
    const socket = initSocketMock();
    const setup = subject.driver(io);
    const testController = {
      methods: {
        _protected: jest.fn()
      }
    };
    setup('test', testController);
    const { on } = io.of.mock.results[0].value;
    const initializer = on.mock.calls[0][1];
    initializer(socket);
    expect(socket.on.mock.calls.length).toBe(0);
  });
  test("it creates controller and method calls emit on right socket instance", () => {
    const io = initIoMock();
    const socket = initSocketMock();
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
    const { on } = io.of.mock.results[0].value;
    const initializer = on.mock.calls[0][1];
    initializer(socket);
    socket.on.mock.calls[0][1]();
    expect(socket.emit).toBeCalledWith(testEvent, testPayload);
  });
  test("it creates controller and method calls broadcast on right namespace instance", () => {
    const io = initIoMock();
    const socket = initSocketMock();
    const setup = subject.driver(io);
    const testEvent = 'gone';
    const testPayload = 'to the Moon!';
    const testController = {
      methods: {
        go: function() {
          this.broadcast(testEvent, testPayload);
        }
      }
    };
    setup('test', testController);
    const { on, emit } = io.of.mock.results[0].value;
    const initializer = on.mock.calls[0][1];
    initializer(socket);
    socket.on.mock.calls[0][1]();
    expect(emit).toBeCalledWith(testEvent, testPayload);
  });
  test("it creates controller and method can call emitter", () => {
    const io = initIoMock();
    const socket = initSocketMock();
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
    const { on } = io.of.mock.results[0].value;
    const initializer = on.mock.calls[0][1];
    initializer(socket);
    socket.on.mock.calls[0][1]();
    expect(testController.emitters.walk).toBeCalled();
  });
  test("it creates controller and emitter calls emit on right socket instance", () => {
    const io = initIoMock();
    const socket = initSocketMock();
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
    const { on } = io.of.mock.results[0].value;
    const initializer = on.mock.calls[0][1];
    initializer(socket);
    socket.on.mock.calls[0][1]();
    expect(socket.emit).toBeCalledWith(testEvent, testPayload);
  });
  test("it creates controller and emitter calls broadcast on right namespace instance", () => {
    const io = initIoMock();
    const socket = initSocketMock();
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
          this.broadcast(testEvent, testPayload);
        }
      }
    };
    setup('test', testController);
    const { on, emit } = io.of.mock.results[0].value;
    const initializer = on.mock.calls[0][1];
    initializer(socket);
    socket.on.mock.calls[0][1]();
    expect(emit).toBeCalledWith(testEvent, testPayload);
  });
  test("it creates controller and method can call foreign controller's emitter", () => {
    const io = initIoMock();
    const socket = initSocketMock();
    const setup = subject.driver(io);
    const testPayload = 'Moon';
    const testController = {
      methods: {
        go: function() {
          this.to('ticket').buy(testPayload);
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
    const { on, to } = io.of.mock.results[0].value;
    const initializer = on.mock.calls[0][1];
    initializer(socket);
    socket.on.mock.calls[0][1]();
    expect(to).toBeCalledWith('ticket#007');
    expect(ticketController.emitters.buy).toBeCalledWith(testPayload);
  });
  test("it creates controller and foreign controller's emitter calls emit on right socket instance", () => {
    const io = initIoMock();
    const socket = initSocketMock();
    const setup = subject.driver(io);
    const testEvent = 'buy';
    const testPayload = 'Moon';
    const testController = {
      methods: {
        go: function() {
          this.to('ticket').buy(testPayload);
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
    const { on, to } = io.of.mock.results[0].value;
    const initializer = on.mock.calls[0][1];
    initializer(socket);
    socket.on.mock.calls[0][1]();
    const { emit } = to.mock.results[0].value;
    expect(emit).toBeCalledWith(testEvent, testPayload);
  });
  test("it creates controller and foreign controller's emitter calls broadcast on right namespace instance", () => {
    const io = initIoMock();
    const socket = initSocketMock();
    const setup = subject.driver(io);
    const testEvent = 'buy';
    const testPayload = 'Moon';
    const testController = {
      methods: {
        go: function() {
          this.to('ticket').buy(testPayload);
        }
      }
    };
    const ticketController = {
      emitters: {
        buy: function (direction) {
          this.broadcast(testEvent, direction);
        }
      }
    };
    setup('test', testController);
    setup('ticket', ticketController);
    const { on } = io.of.mock.results[0].value;
    const { emit } = io.of.mock.results[1].value;
    const initializer = on.mock.calls[0][1];
    initializer(socket);
    socket.on.mock.calls[0][1]();
    expect(emit).toBeCalledWith(testEvent, testPayload);
  });
});
