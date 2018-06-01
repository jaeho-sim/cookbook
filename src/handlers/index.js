'use strict';

const _ = require('lodash');
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
      const { attributesManager } = handlerInput;
      const { request } = handlerInput.requestEnvelope;
      const intentName = request.intent.name;
      const cleanCategories = categories.map(category => category.toLowerCase());

      return request.type === 'IntentRequest' &&
        ['CategorySelectionIntent','MoreIntent'].includes(intentName) &&
        (
          utils.categorySelectionIntentValidMoreIntent(handlerInput, cleanCategories) ||
          utils.categorySelectionIntentValidIntentAndSlots(handlerInput, cleanCategories)
        );
    },
    handle(handlerInput) {
      const { request } = handlerInput.requestEnvelope;
      const { attributesManager, responseBuilder } = handlerInput;
      let sessionAttributes = attributesManager.getSessionAttributes();
      if (!(sessionAttributes && sessionAttributes.apiCache) || (request.intent.slots && request.intent.slots.FoodCategory && !_.isEqual(sessionAttributes.apiCache.query, { cuisine: request.intent.slots.FoodCategory.value }))) {
        // setup the apiCache schema
        sessionAttributes = sessionAttributes || {};
        sessionAttributes.apiCache = {
          offset: null,
          maxRecordCount: null,
          records: [],
          skillOffset: 0,
          query: { cuisine: request.intent.slots.FoodCategory.value }
        }
      }
      sessionAttributes.apiCache.skillOffset = sessionAttributes.apiCache.skillOffset ? parseInt(sessionAttributes.apiCache.skillOffset) : 0;
      sessionAttributes.apiCache.skillOffset += 3;
      return utils.updateApiCache(sessionAttributes.apiCache, attributesManager)
        .then((apiResponse) => {
          const speakPrefix = sessionAttributes.apiCache.skillOffset === 3 ? `We have found ${apiResponse.maxRecordCount} Results. `: `There are ${apiResponse.maxRecordCount - sessionAttributes.apiCache.skillOffset + 3} more recipes to choose from. `;
          const recipesText = utils.oxfordComma(apiResponse.records.slice(sessionAttributes.apiCache.skillOffset - 3, sessionAttributes.apiCache.skillOffset).map(item => item.title));
          return handlerInput.responseBuilder
            .speak(`${speakPrefix}Would you like the recipe for ${recipesText}`)
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
