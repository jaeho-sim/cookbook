const sinon = require('sinon');
const assert = require('chai').assert;
const handlers = require('../../../src/handlers/index');
const { states } = require('../../../src/constants');
const utils = require('../../../src/utils');
const intents = require('../../../src/handlers/intents');

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
        assert.isTrue(handlers.CategoryIntentHandler.canHandle(fakeInput), 'Did not get the expected return');
      });
      it('Unmatched request', () => {
        fakeInput.requestEnvelope.request.type = '';
        fakeInput.requestEnvelope.request.intent = { name: '' };
        assert.isFalse(handlers.CategoryIntentHandler.canHandle(fakeInput), 'Did not get the expected return');
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
          sinonMocks.intentsInitialYesIntent.expects('initalYesIntent').withExactArgs(fakeInput).returns(fakeGetResponseReturn);
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
          sinonMocks.intentsInitialNoIntent.expects('initalNoIntent').withExactArgs(fakeInput).returns(fakeGetResponseReturn);
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
