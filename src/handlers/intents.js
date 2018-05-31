const { states } = require('../constants');

const intents = {
  initialYesIntent: (handlerInput) => {
    const { responseBuilder } = handlerInput;
    handlerInput.attributesManager.setSessionAttributes({ state: states.category })
    return responseBuilder
      .speak('You can ask me to search for recipes within a category such as "breakfast" or "Italian". What category would you like to search or say "more" for more categories?')
      .reprompt()
      .getResponse();

  },
  initialNoIntent:({ responseBuilder }) => {
    return responseBuilder
      .speak('What dish are you cooking right now?')
      .reprompt()
      .getResponse();
  },

};
module.exports = intents;
