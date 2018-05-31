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

  describe('doUpdateWithApi', () => {
    let setSession;
    let getSession;
    let fakeCache;
    beforeEach(() => {
      fakeCache = {
        offset: null,
        maxRecordCount: null,
        records: [],
        skillOffset: null,
      };
      setSession = sinon.expectation.create('setSession');
      // setSession.withExactArgs();
      getSession = sinon.expectation.create('getSession');
      getSession.withExactArgs().returns({ apiCache: fakeCache });
    });
    describe('cache miss', () => {
      it('no cache set (first run)', () => {
        assert.strictEqual(utils.doUpdateWithApi(3, {getSession}), true);
        // setSession.verify();
        getSession.verify();
      });
      it('cache set but retrieval necessary', () => {
        fakeCache.offset = 0;
        fakeCache.maxRecordCount = 100;
        fakeCache.records = [ 1, 2, 3, 4, 5, 6, 7, 8, 9 ];
        assert.strictEqual(utils.doUpdateWithApi(12, {getSession}), true);
        // setSession.verify();
        getSession.verify();
      });
    });
    describe('cache hit', () => {
      it('potential offset is higher than records', () => {
        fakeCache.offset = 0;
        fakeCache.maxRecordCount = 6;
        fakeCache.records = [ 1, 2, 3, 4, 5, 6 ];
        assert.strictEqual(utils.doUpdateWithApi(9, {getSession}), false);
        // setSession.verify();
        getSession.verify();
      });
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


// sinonMocks.fakeInputSetSessionAttributes = sinon.mock(fakeInput.attributesManager);
// sinonMocks.fakeInputSetSessionAttributes.expects('setSessionAttributes').withExactArgs({
//   queryApiAttributes: {
//     query: {
//       offset: 0,
//       number: 10,
//       records: 10,
//       cuisine: fakeCuisineString
//     },
//     records: fakeApiResponse.records
//   }
// });
