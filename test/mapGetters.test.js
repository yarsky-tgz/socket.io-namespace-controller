const { mapGetters } = require('../');
const getThat = () => ({
  emit: jest.fn()
});

describe("testing mapGetters helper", () => {
  test("it maps methods", () => {
    const map = {
      books: jest.fn(),
      letters: jest.fn()
    };
    const methods = mapGetters(map);
    expect(methods.loadBooks).toBeDefined();
    expect(methods.loadLetters).toBeDefined();
  });
  test("it maps methods and methods are emitting data", async () => {
    const that = getThat();
    const books = ['Forest book'];
    const letters = ['Confirmation'];
    const map = {
      books: jest.fn(() => books),
      letters: jest.fn(() => letters)
    };
    const methods = mapGetters(map);
    for (const method of Object.keys(methods)) {
      await methods[method].call(that);
    }
    expect(that.emit).toBeCalledWith('books', { books });
    expect(that.emit).toBeCalledWith('letters', { letters });
  });
  test("it maps methods and uses ack if provided", async () => {
    const that = getThat();
    const books = ['Forest book'];
    const letters = ['Confirmation'];
    const map = {
      books: jest.fn(() => books),
      letters: jest.fn(() => letters)
    };
    const methods = mapGetters(map);
    const ack = jest.fn();
    for (const method of Object.keys(methods)) {
      await methods[method].call(that, {}, ack);
    }
    expect(ack).toBeCalledWith(books);
    expect(ack).toBeCalledWith(letters);
  });
});
