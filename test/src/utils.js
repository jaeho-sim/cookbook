const sinon = require('sinon');
const assert = require('chai').assert;
const utils = require('../../src/utils');
const API = require('../../src/foodapi');

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

  describe('Caching System', () => {
    let setSession;
    // let getSession;
    let fakeQuery;
    let fakeCache;
    let fakeApiResponse;
    let fakeCuisineString;
    beforeEach(() => {
      fakeCuisineString = 'chinese';
      fakeQuery = { cuisine: fakeCuisineString };
      fakeCache = {
        offset: null,
        maxRecordCount: null,
        records: [],
        skillOffset: null,
        query: fakeQuery
      };
      setSession = sinon.expectation.create('setSession');
    });

    describe('doUpdateWithApi', () => {
      describe('cache miss', () => {
        it('no cache set (first run)', () => {
          fakeCache.skillOffset = 3;
          assert.isTrue(utils.doUpdateWithApi(fakeCache), 'Cache did not miss due to inital');
        });
        it('cache set but retrieval necessary', () => {
          fakeCache.offset = 0;
          fakeCache.maxRecordCount = 100;
          fakeCache.records = [ 1, 2, 3, 4, 5, 6, 7, 8, 9 ];
          fakeCache.skillOffset = 12;
          assert.isTrue(utils.doUpdateWithApi(fakeCache), 'Cache did not miss due to unloaded content');
        });
      });
      describe('cache hit', () => {
        it('potential offset is higher than records', () => {
          fakeCache.offset = 0;
          fakeCache.maxRecordCount = 6;
          fakeCache.records = [ 1, 2, 3, 4, 5, 6 ];
          fakeCache.skillOffset = 9;
          assert.isFalse(utils.doUpdateWithApi(fakeCache), 'Cache did not hit due to end of records');
        });
      });
    });
    describe('updateApiCache', () => {
      beforeEach(() => {
        fakeApiResponse = {
          results: [
            { id: 1238, title: 'Waldo Soup' },
            { id: 38, title: 'Baz al Foo' },
            { id: 1122, title: 'Bar in a Blanket' },
            { id: 2211, title: 'Two two one one' },
            { id: 8899, title: 'Lipsum Yumsum' },
            { id: 9977, title: 'Dimsum Yumsum' },
            { id: 1177, title: 'Wrapper Donner' },
            { id: 177, title: 'Shwarma warm ya' },
            { id: 717, title: 'Chicken Balls' }
          ],
          offset: 0,
          totalResults: 9
        };

        sinonMocks.APISearch = sinon.mock(API);
        sinonMocks.APISearch.expects('searchRecipes').withExactArgs({ cuisine: fakeCuisineString }).resolves(fakeApiResponse);
      });

      it('Updates the session after Cache miss & API Call', () => {
        const promiseFinally = (result) => {
          assert.deepEqual(result, fakeApiResponse, 'Did not resolve the expected from the API');
          setSession.verify();
          sinonMocks.APISearch.verify();
        };

        sinonMocks.utilsDoUpdateWithApi = sinon.mock(utils);
        sinonMocks.utilsDoUpdateWithApi.expects('doUpdateWithApi').withExactArgs(fakeCache).returns(true);
        setSession.withExactArgs({ apiCache: Object.assign({}, fakeCache, { offset: 0, maxRecordCount: fakeApiResponse.totalResults, records: fakeApiResponse.results }) });

        return utils.updateApiCache(fakeCache, {setSessionAttributes: setSession})
          .then(promiseFinally)
          .catch(promiseFinally);
      });

      it('Updates the session after Cache miss', () => {
        const promiseFinally = (result) => {
          assert.deepEqual(result, fakeCache, 'Did not resolve the expected from the Cache');
          setSession.verify();
        };

        sinonMocks.utilsDoUpdateWithApi = sinon.mock(utils);
        sinonMocks.utilsDoUpdateWithApi.expects('doUpdateWithApi').withExactArgs(fakeCache).returns(false);
        setSession.withExactArgs({ apiCache: fakeCache });

        return utils.updateApiCache(fakeCache, {setSessionAttributes: setSession})
          .then(promiseFinally)
          .catch(promiseFinally);
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
