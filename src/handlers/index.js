'use strict';

const utils = require('../utils');
const { states } = require('../constants');
const categories = require('../../static-data/category.json').map(category => category.name.value);
const intents = require('./intents');
const API = require('../foodapi');
const welcomeMessage = 'Welcome to Cookbook. Would you like recommendations?';
const repromptYnMessage = 'You can say Yes or No.';
const handlers = {
  // FallbackHandler:{ // new don't know how it works
  //   canHandle(handlerInput) {
  //     const { request } = handlerInput.requestEnvelope;
  //     console.log('FALLBACK handlerInput.requestEnvelope: ', handlerInput.requestEnvelope);
  //     return request.intent && request.intent.name === 'AMAZON.FallbackIntent';
  //   },
  //   handle(handlerInput) {
  //
  //     return handlerInput.responseBuilder
  //       .speak("I don't understand; I'm out of here")
  //       .getResponse();
  //   }
  // },
  ErrorHandler:{
    canHandle() {
      return true;
    },
    handle(handlerInput, error) {
      console.error(error);

      return handlerInput.responseBuilder
        .speak("Something went wrong")
        .getResponse();
    }
  },
  LaunchRequestHandler:{
    canHandle(handlerInput) {
      const { type } = handlerInput.requestEnvelope.request;
      return ['LaunchRequest'].includes(type);
    },
    handle(handlerInput) {
      handlerInput.attributesManager.setSessionAttributes({ state: states.init });
      return handlerInput.responseBuilder
        .speak("Welcome to cookbook. Would you like recommendations?")
        .reprompt()
        .getResponse();
    }
  },
  CategoryIntentHandler:{
    canHandle(handlerInput) {
      const { request } = handlerInput.requestEnvelope;
      const { attributesManager } = handlerInput;
      console.log('CategoryIntentHandler request', request);
      return request.type === 'IntentRequest' &&
        request.intent.name === 'MoreIntent' &&
        attributesManager.getSessionAttributes().state === states.category;
    },
    handle(handlerInput) {
      handlerInput.attributesManager.setSessionAttributes({ state: states.category_search })

      return handlerInput.responseBuilder
        .speak(`Other categories include ${utils.oxfordComma(utils.shuffleArray(categories))}`)
        .reprompt()
        .getResponse();
    }
  },
  CategorySelectionIntentHandler:{
    canHandle(handlerInput) {
      const { request } = handlerInput.requestEnvelope;
      console.log('CategorySelectionIntentHandler request: ', request);
      return request.type === 'IntentRequest' &&
        ['CategorySelectionIntent','MoreIntent'].includes(request.intent.name) &&
        categories.map(category => category.toLowerCase()).includes(request.intent.slots.FoodCategory.value.toLowerCase());
    },
    handle(handlerInput) {
      const { request } = handlerInput.requestEnvelope;
      return API.searchRecipes({ cuisine: request.intent.slots.FoodCategory.value })
        .then((apiResponse) => {
          const recipesText = utils.oxfordComma(apiResponse.results.slice(0, 3).map(item => item.name));
          return handlerInput.responseBuilder
            .speak(`We have found ${apiResponse.totalResults} Results. Would you like the recipe for ${recipesText}`)
            .reprompt()
            .getResponse();
        })
        .catch(handlers.ErrorHandler.handle.bind(null, handlerInput));

    }
  },
  SessionEndedRequestHandler:{
    canHandle(handlerInput) {
      return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
    },
    handle(handlerInput) {
      console.log("ending session!");
      return handlerInput.responseBuilder
        // .speak('Goodbye.')
        .getResponse();
    }
  },
  YesIntent:{
    canHandle(handlerInput) {
      const { request } = handlerInput.requestEnvelope;
      return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.YesIntent';
    },
    handle(handlerInput) {
      const { attributesManager, responseBuilder } = handlerInput;

      const sessionAttributes = attributesManager.getSessionAttributes();
      if(sessionAttributes.state === states.init) {
        return intents.initialYesIntent(handlerInput);
      }
      return handlers.ErrorHandler.handle(handlerInput, new Error('Unhandled Yes'));
    },
  },
  NoIntent:{
    canHandle(handlerInput) {
      const { request } = handlerInput.requestEnvelope;
      return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.NoIntent';
    },
    handle(handlerInput) {
      const { attributesManager, responseBuilder } = handlerInput;

      const sessionAttributes = attributesManager.getSessionAttributes();
      if(sessionAttributes.state === states.init) {
        return intents.initialNoIntent(handlerInput);
      }
      return handlers.ErrorHandler.handle(handlerInput, new Error('Unhandled No'));
    },
  }

};
module.exports = handlers;
