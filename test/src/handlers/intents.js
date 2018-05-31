const sinon = require('sinon');
const assert = require('chai').assert;
const intents = require('../../../src/handlers/intents');
const { states } = require('../../../src/constants');

let sinonMocks = {};
let sinonStubs = {};
let fakeSpeakReturn;
let fakeInput = {};

describe('intents', () => {
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
  });
  describe('initialYesIntent', () => {
    it('works as expected', () => {
      sinonMocks.fakeInputSetSessionAttributes = sinon.mock(fakeInput.attributesManager);
      sinonMocks.fakeInputSetSessionAttributes.expects('setSessionAttributes').withExactArgs({ state: states.category });

      sinonMocks.fakeInputSpeak = sinon.mock(fakeInput.responseBuilder);
      sinonMocks.fakeInputSpeak.expects('speak').withExactArgs('You can ask me to search for recipes within a category such as "breakfast" or "Italian". What category would you like to search or say "more" for more categories?').returns(fakeSpeakReturn);

      assert.strictEqual(intents.initialYesIntent(fakeInput), fakeGetResponseReturn, 'Did not get the expected return');
      sinonMocks.fakeInputSetSessionAttributes.verify();
      sinonMocks.fakeInputSpeak.verify();
    });
  });
  describe('initialNoIntent', () => {
    it('works as expected', () => {
      sinonMocks.fakeInputSpeak = sinon.mock(fakeInput.responseBuilder);
      sinonMocks.fakeInputSpeak.expects('speak').withExactArgs('What dish are you cooking right now?').returns(fakeSpeakReturn);

      assert.strictEqual(intents.initialNoIntent(fakeInput), fakeGetResponseReturn, 'Did not get the expected return');
      sinonMocks.fakeInputSpeak.verify();
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
