const sinon = require('sinon');
const assert = require('chai').assert;
const utils = require('../../src/utils');

let sinonMocks = {};
let sinonStubs = {};
const fullArray = ['foo', 'baz', 'waldo', 'boo'];
describe('Utils', () => {
  beforeEach(() => {
    sinonMocks = {};
    sinonStubs = {};
  });

  describe('oxfordComma', () => {
    it('Test array default', () => {
      assert.strictEqual(utils.oxfordComma(fullArray), 'foo, baz, waldo or boo', 'Did not get the expected string');
    });
    it('Test array with \'and\' (second argument provided)', () => {
      assert.strictEqual(utils.oxfordComma(fullArray, 'and'), 'foo, baz, waldo and boo', 'Did not get the expected string');
    });
    it('Test array with only one item', () => {
      assert.strictEqual(utils.oxfordComma([ fullArray[0] ]), 'foo', 'Did not get the expected string');
    });
    it('Invalid Input', () => {
      assert.strictEqual(utils.oxfordComma([]), '', 'Did not get an empty string');
    });
  });

  describe('shuffleArray', () => {
    beforeEach(() => {
      sinonStubs.mathRandom = sinon.stub(Math, 'random');
    });
    it('Test array default', () => {
      sinonStubs.mathRandom.onCall(0).returns(0.55); // should become 2 (of 4)
      sinonStubs.mathRandom.onCall(1).returns(0.8); // should become 2 (of 3)
      sinonStubs.mathRandom.onCall(2).returns(0.01); // should become 0 (of 2)
      sinonStubs.mathRandom.onCall(3).returns(0.26); // should become 0 (of 1)
      assert.deepEqual(utils.shuffleArray(fullArray), [ 'baz', 'foo', 'boo', 'waldo' ], 'Did not get the expected string');
    });
  });

  afterEach(() => {
    Object.keys(sinonMocks).forEach((key) => {
      sinonMocks[key].restore();
    });
    Object.keys(sinonStubs).forEach((key) => {
      sinonStubs[key].restore();
    });
  });
});
