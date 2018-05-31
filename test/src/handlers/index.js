const sinon = require('sinon');
const assert = require('chai').assert;
const handlers = require('../../../src/handlers/index');
const { states } = require('../../../src/constants');
const utils = require('../../../src/utils');
const intents = require('../../../src/handlers/intents');
const API = require('../../../src/foodapi');


let sinonMocks = {};
let sinonStubs = {};
let fakeSpeakReturn;
let fakeInput = {};

describe('handlers', () => {
  beforeEach(() => {
    sinonMocks = {};
    sinonStubs = {};
    fakeGetResponseReturn = { baz: 'waldo' };
    fakeSpeakReturn = {
      reprompt: sinon.stub().callsFake(() => {
        return {
          getResponse: sinon.stub().callsFake(() => fakeGetResponseReturn)
        }
      })
    };
    fakeInput = {
      attributesManager: {
        getSessionAttributes: () => {},
        setSessionAttributes: () => {}
      },
      responseBuilder: {
        speak: () => {},
      },
      requestEnvelope: {
        request: {
          intent: {},
          type: null
        }
      }
    };
    // sinonStubs.allHandlers = sinon.stub(handlers);
  });
  describe('ErrorHandler', () => {
    describe('canHandle', () => {
      it('Matched request type', () => {
        assert.isTrue(handlers.ErrorHandler.canHandle(), 'Did not get the expected return');
      });
    });
    describe('handle', () => {
      let captureConsoleError = {};
      let fakeError;
      beforeEach(() => {
        fakeSpeakReturn = {
          getResponse: () => fakeGetResponseReturn
        };
        fakeError = new Error('Invalid something');
        sinonMocks.fakeInputSpeak = sinon.mock(fakeInput.responseBuilder);
        sinonMocks.fakeInputSpeak.expects('speak').withExactArgs('Something went wrong').returns(fakeSpeakReturn);
        sinonStubs.consoleError = sinon.stub(console, 'error').callsFake(function() {
          captureConsoleError = { ...arguments };
        });
      });
      it('Handles correctly', () => {
        assert.strictEqual(handlers.ErrorHandler.handle(fakeInput, fakeError), fakeGetResponseReturn, 'Did not get the expected return');
        sinonMocks.fakeInputSpeak.verify();
        assert.isTrue(Object.values(captureConsoleError).includes(fakeError), 'Console.error did not capture the error');
      });
    });
  });
  describe('LaunchRequestHandler', () => {
    describe('canHandle', () => {
      it('Matched request type', () => {
        fakeInput.requestEnvelope.request.type = 'LaunchRequest';
        assert.isTrue(handlers.LaunchRequestHandler.canHandle(fakeInput), 'Did not get the expected return');

      });
      it('Unmatched request type', () => {
        fakeInput.requestEnvelope.request.type = 'waldo-baz';
        assert.isFalse(handlers.LaunchRequestHandler.canHandle(fakeInput), 'Did not get the expected return');
      });
    });
    describe('handle', () => {
      beforeEach(() => {
        sinonMocks.fakeInputSetSessionAttributes = sinon.mock(fakeInput.attributesManager);
        sinonMocks.fakeInputSetSessionAttributes.expects('setSessionAttributes').withExactArgs({ state: states.init });

        sinonMocks.fakeInputSpeak = sinon.mock(fakeInput.responseBuilder);
        sinonMocks.fakeInputSpeak.expects('speak').withExactArgs('Welcome to cookbook. Would you like recommendations?').returns(fakeSpeakReturn);
      });
      it('Handles correctly', () => {
        assert.strictEqual(handlers.LaunchRequestHandler.handle(fakeInput), fakeGetResponseReturn, 'Did not get the expected return');
        sinonMocks.fakeInputSetSessionAttributes.verify();
        sinonMocks.fakeInputSpeak.verify();
      });
    });
  });
  describe('CategoryIntentHandler', () => {
    describe('canHandle', () => {
      it('Matched request type and intent name', () => {
        fakeInput.requestEnvelope.request.type = 'IntentRequest';
        fakeInput.requestEnvelope.request.intent = { name: 'MoreIntent' };
        sinonMocks.fakeInputGetSessionAttributes = sinon.mock(fakeInput.attributesManager);
        sinonMocks.fakeInputGetSessionAttributes.expects('getSessionAttributes').withArgs().returns({ state: states.category});

        assert.isTrue(handlers.CategoryIntentHandler.canHandle(fakeInput), 'Did not get the expected return');
        sinonMocks.fakeInputGetSessionAttributes.verify();
      });
      it('Unmatched request', () => {
        fakeInput.requestEnvelope.request.type = '';
        fakeInput.requestEnvelope.request.intent = { name: '' };
        sinonMocks.fakeInputGetSessionAttributes = sinon.mock(fakeInput.attributesManager);
        sinonMocks.fakeInputGetSessionAttributes.expects('getSessionAttributes').withArgs().returns({ state: '' });

        assert.isFalse(handlers.CategoryIntentHandler.canHandle(fakeInput), 'Did not get the expected return');
        // sinonMocks.fakeInputGetSessionAttributes.verify(); // && statements don't require this to be called
      });
    });
    describe('handle', () => {
      const oxfordReturn = 'foo, baz and waldo';
      beforeEach(() => {
        sinonStubs.untilsShuffleArray = sinon.stub(utils, 'shuffleArray').returns('');
        sinonStubs.untilsOxfordComma = sinon.stub(utils, 'oxfordComma').returns(oxfordReturn);

        sinonMocks.fakeInputSetSessionAttributes = sinon.mock(fakeInput.attributesManager);
        sinonMocks.fakeInputSetSessionAttributes.expects('setSessionAttributes').withExactArgs({ state: states.category_search });

        sinonMocks.fakeInputSpeak = sinon.mock(fakeInput.responseBuilder);
        sinonMocks.fakeInputSpeak.expects('speak').withExactArgs(`Other categories include ${oxfordReturn}`).returns(fakeSpeakReturn);
      });
      it('Handles correctly', () => {
        assert.strictEqual(handlers.CategoryIntentHandler.handle(fakeInput), fakeGetResponseReturn, 'Did not get the expected return');
        sinonMocks.fakeInputSetSessionAttributes.verify();
        sinonMocks.fakeInputSpeak.verify();
      });
    });
  });
  describe('CategorySelectionIntentHandler', () => {
    describe('canHandle', () => {
      describe('Valid Response Pattern', () => {
        beforeEach(() => {
          fakeInput.requestEnvelope.request.type = 'IntentRequest';
          fakeInput.requestEnvelope.request.intent = {
            name: 'CategorySelectionIntent',
            slots: {
              FoodCategory: { value: "chinese" }
            }
          };

        });
        it('Slot food category is correct and is the category selection intent type', () => {
          assert.isTrue(handlers.CategorySelectionIntentHandler.canHandle(fakeInput), 'Did not get the expected return');
        });
        it('Slot food category is correct and is the more intent type', () => {
          fakeInput.requestEnvelope.request.intent.name = 'MoreIntent'
          assert.isTrue(handlers.CategorySelectionIntentHandler.canHandle(fakeInput), 'Did not get the expected return');
        });
      });
      it('Slot food category is incorrect and is not the expected intent type', () => {
        fakeInput.requestEnvelope.request.type = 'foo';
        fakeInput.requestEnvelope.request.intent = {
          name: 'baz',
          slots: {
            FoodCategory: { name: "waldo" }
          }
        };

        assert.isFalse(handlers.CategorySelectionIntentHandler.canHandle(fakeInput), 'Did not get the expected return');
      });
    });
    describe('handle', () => {
      let fakeCuisineString = '';
      let fakeApiResponse = {};
      describe('Valid API Calls', () => {
        beforeEach(() => {
          fakeCuisineString = 'chinese';
          fakeApiResponse = {
            results: [
              { id: 1238, name: 'Waldo Soup' },
              { id: 38, name: 'Baz al Foo' },
              { id: 1122, name: 'Bar in a Blanket' },
              { id: 2211, name: 'Two two one one' },
              { id: 8899, name: 'Lipsum Yumsum' },
              { id: 9977, name: 'Dimsum Yumsum' },
              { id: 1177, name: 'Wrapper Donner' },
              { id: 177, name: 'Shwarma warm ya' },
              { id: 717, name: 'Chicken Balls' },
              { id: 99, name: 'Wall Nuts' }
            ],
            totalResults: 10
          };
          fakeInput.requestEnvelope.request.intent = {
            slots: {
              FoodCategory: { value: 'chinese' }
            }
          };
          sinonMocks.APISearch = sinon.mock(API);
          sinonMocks.APISearch.expects('searchRecipes').withExactArgs({ cuisine: fakeCuisineString }).resolves(fakeApiResponse);

          sinonMocks.fakeUtilsApiCaching = sinon.mock(utils);
          sinonMocks.fakeUtilsApiCaching.expects('updateApiCache').withExactArgs(fakeApiResponse, fakeInput.attributesManager.setSessionAttributes).returns(true);


          sinonMocks.fakeInputSpeak = sinon.mock(fakeInput.responseBuilder);
          sinonMocks.fakeInputSpeak.expects('speak')
            .withExactArgs(`We have found 10 Results. Would you like the recipe for ${fakeApiResponse.results[0].name}, ${fakeApiResponse.results[1].name} or ${fakeApiResponse.results[2].name}`)
            .returns(fakeSpeakReturn);

        });
        it('Responds as expected when selecting the category for the first time', () => {
          const promiseFinally = (result) => {
            assert.strictEqual(result, fakeGetResponseReturn, 'Did not get the expected return');
            sinonMocks.APISearch.verify();
            sinonMocks.fakeInputSpeak.verify();
          };
          return handlers.CategorySelectionIntentHandler.handle(fakeInput)
            .then(promiseFinally)
            .catch(promiseFinally);
        });
      });
    });
  });
  describe('SessionEndedRequestHandler', () => {
    describe('canHandle', () => {
      it('Matched request type', () => {
        fakeInput.requestEnvelope.request.type = 'SessionEndedRequest';
        assert.isTrue(handlers.SessionEndedRequestHandler.canHandle(fakeInput), 'Did not get the expected return');
      });
      it('Unmatched request', () => {
        fakeInput.requestEnvelope.request.type = '';
        assert.isFalse(handlers.SessionEndedRequestHandler.canHandle(fakeInput), 'Did not get the expected return');
      });
    });
    describe('handle', () => {
      beforeEach(() => {
        fakeInput.responseBuilder = {
          getResponse: () => {}
        }
        sinonMocks.fakeInputSpeak = sinon.mock(fakeInput.responseBuilder);
        sinonMocks.fakeInputSpeak.expects('getResponse').withExactArgs().returns(fakeGetResponseReturn);
      });
      it('Handles correctly', () => {
        assert.strictEqual(handlers.SessionEndedRequestHandler.handle(fakeInput), fakeGetResponseReturn, 'Did not get the expected return');
        sinonMocks.fakeInputSpeak.verify();
      });
    });
  });
  describe('YesIntent', () => {
    describe('canHandle', () => {
      it('Matched request type and intent name', () => {
        fakeInput.requestEnvelope.request.type = 'IntentRequest';
        fakeInput.requestEnvelope.request.intent = { name: 'AMAZON.YesIntent' };
        assert.isTrue(handlers.YesIntent.canHandle(fakeInput), 'Did not get the expected return');
      });
      it('Unmatched request', () => {
        fakeInput.requestEnvelope.request.type = '';
        fakeInput.requestEnvelope.request.intent = { name: '' };
        assert.isFalse(handlers.YesIntent.canHandle(fakeInput), 'Did not get the expected return');
      });
    });
    describe('handle', () => {
      let fakeSessionAttributes = {};
        beforeEach(() => {
          sinonMocks.intentsInitialYesIntent = sinon.mock(fakeInput.attributesManager);
          sinonMocks.intentsInitialYesIntent.expects('getSessionAttributes').withExactArgs().returns(fakeSessionAttributes);
        });

      describe('When the state is init', () => {
        beforeEach(() => {
          fakeSessionAttributes.state = states.init;

          sinonMocks.intentsInitialYesIntent = sinon.mock(intents);
          sinonMocks.intentsInitialYesIntent.expects('initialYesIntent').withExactArgs(fakeInput).returns(fakeGetResponseReturn);
        });
        it('Handles correctly when the state is initial', () => {
          assert.strictEqual(handlers.YesIntent.handle(fakeInput), fakeGetResponseReturn, 'Did not get the expected return');
          sinonMocks.intentsInitialYesIntent.verify();
        });

      });
      describe('When the state is not init', () => {
        let captureErrorHandlerHandle = {};
        beforeEach(() => {
          fakeSessionAttributes.state = null;

          sinonMocks.handlersErrorHandler = sinon.mock(handlers.ErrorHandler);
          sinonMocks.handlersErrorHandler.expects('handle').withArgs(fakeInput).callsFake((input, error) => {
            captureErrorHandlerHandle = {
              input,
              error
            };
            return fakeGetResponseReturn;
          });
        });
        it('Error Handles when the state is incorrect', () => {
          assert.strictEqual(handlers.YesIntent.handle(fakeInput), fakeGetResponseReturn, 'Did not get the expected return');
          sinonMocks.handlersErrorHandler.verify();
          assert.strictEqual(captureErrorHandlerHandle.error.message, 'Unhandled Yes');
        });
      });
    });
  });

  describe('NoIntent', () => {
    describe('canHandle', () => {
      it('Matched request type and intent name', () => {
        fakeInput.requestEnvelope.request.type = 'IntentRequest';
        fakeInput.requestEnvelope.request.intent = { name: 'AMAZON.NoIntent' };
        assert.isTrue(handlers.NoIntent.canHandle(fakeInput), 'Did not get the expected return');
      });
      it('Unmatched request', () => {
        fakeInput.requestEnvelope.request.type = '';
        fakeInput.requestEnvelope.request.intent = { name: '' };
        assert.isFalse(handlers.NoIntent.canHandle(fakeInput), 'Did not get the expected return');
      });
    });
    describe('handle', () => {
      let fakeSessionAttributes = {};
        beforeEach(() => {
          sinonMocks.intentsInitialNoIntent = sinon.mock(fakeInput.attributesManager);
          sinonMocks.intentsInitialNoIntent.expects('getSessionAttributes').withExactArgs().returns(fakeSessionAttributes);
        });

      describe('When the state is init', () => {
        beforeEach(() => {
          fakeSessionAttributes.state = states.init;

          sinonMocks.intentsInitialNoIntent = sinon.mock(intents);
          sinonMocks.intentsInitialNoIntent.expects('initialNoIntent').withExactArgs(fakeInput).returns(fakeGetResponseReturn);
        });
        it('Handles correctly when the state is initial', () => {
          assert.strictEqual(handlers.NoIntent.handle(fakeInput), fakeGetResponseReturn, 'Did not get the expected return');
          sinonMocks.intentsInitialNoIntent.verify();
        });

      });
      describe('When the state is not init', () => {
        let captureErrorHandlerHandle = {};
        beforeEach(() => {
          fakeSessionAttributes.state = null;

          sinonMocks.handlersErrorHandler = sinon.mock(handlers.ErrorHandler);
          sinonMocks.handlersErrorHandler.expects('handle').withArgs(fakeInput).callsFake((input, error) => {
            captureErrorHandlerHandle = {
              input,
              error
            };
            return fakeGetResponseReturn;
          });
        });
        it('Error Handles when the state is incorrect', () => {
          assert.strictEqual(handlers.NoIntent.handle(fakeInput), fakeGetResponseReturn, 'Did not get the expected return');
          sinonMocks.handlersErrorHandler.verify();
          assert.strictEqual(captureErrorHandlerHandle.error.message, 'Unhandled No');
        });
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
