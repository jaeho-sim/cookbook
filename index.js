'use strict';
require('dotenv').config(process.env.NODE_ENV ? { path: `.env.${process.env.NODE_ENV}` } : {});
const Alexa = require('ask-sdk');
var categories = require('./src/category.json').map(category => category.name.value);

const states = {
  init: 'INITIAL',
  category: 'CATEGORY',
  category_search: 'CATEGORY_SEARCH',
  pagination: 'PAGINATION'
}
const initalYesIntent = (handlerInput) => {
  const { responseBuilder } = handlerInput;
  handlerInput.attributesManager.setSessionAttributes({ state: states.category })
  return responseBuilder
    .speak('You can ask me to search for recipes within a category such as "breakfast" or "Italian". What category would you like to search or say "more" for more categories?')
    .reprompt()
    .getResponse();

};
const initalNoIntent = ({ responseBuilder }) => {
  return responseBuilder
    .speak('What dish are you cooking right now?')
    .reprompt()
    .getResponse();

};
/*
const FallbackHandler = {
  canHandle(handlerInput) {
    const { request } = handlerInput.requestEnvelope;
    console.log('FALLBACK handlerInput.requestEnvelope: ', handlerInput.requestEnvelope);
    return request.intent && request.intent.name === 'AMAZON.FallbackIntent';
  },
  handle(handlerInput) {

    return handlerInput.responseBuilder
      .speak("I don't understand; I'm out of here")
      .getResponse();
  }
};*/
const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log("Inside ErrorHandler - handle");
    // console.log(`Error handled: ${JSON.stringify(error)}`);
    console.log('error', error);
    console.log(`Handler Input: ${JSON.stringify(handlerInput)}`);

    return handlerInput.responseBuilder
      .speak("Something went wrong")
      .getResponse();
  }
};

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    const { type } = handlerInput.requestEnvelope.request;
    return ['LaunchRequest'].includes(type);
  },
  handle(handlerInput) {
    handlerInput.attributesManager.setSessionAttributes({ state: states.init })
    console.log('DEFAULT HANDLE');
    return handlerInput.responseBuilder
      .speak("Welcome to cookbook. Would you like recommendations?")
      .reprompt()
      .getResponse();
  }
};

const CategoryIntentHandler = {
  canHandle(handlerInput) {
    const { request } = handlerInput.requestEnvelope;
    console.log('CATEGORYINTENTHANDLER request: ', request)
    return request.type === 'IntentRequest' && request.intent.name === 'MoreIntent';
  },
  handle(handlerInput) {
    handlerInput.attributesManager.setSessionAttributes({ state: states.category_search })
    console.log('CATEGORYINTENTHANDLER HANDLE');
    return handlerInput.responseBuilder
      .speak(`Other categories include ${oxfordComma(shuffleArray(categories))}`)
      .reprompt()
      .getResponse();
  }
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    console.log("SESSION END?", handlerInput.requestEnvelope.request);
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log("ending session!");
    return handlerInput.responseBuilder
      // .speak('Goodbye.')
      .getResponse();
  },
};
const YesIntent = {
  canHandle(handlerInput) {
    const { request } = handlerInput.requestEnvelope;
    return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.YesIntent';
  },
  handle(handlerInput) {
    const { attributesManager, responseBuilder } = handlerInput;

    const sessionAttributes = attributesManager.getSessionAttributes();
    if(sessionAttributes.state === states.init) {
      return initalYesIntent(handlerInput);
    }
    return ErrorHandler.handle(handlerInput, new Error('Unhandled Yes'));
  },
};
const NoIntent = {
  canHandle(handlerInput) {
    const { request } = handlerInput.requestEnvelope;
    return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.NoIntent';
  },
  handle(handlerInput) {
    const { attributesManager, responseBuilder } = handlerInput;

    const sessionAttributes = attributesManager.getSessionAttributes();
    if(sessionAttributes.state === states.init) {
      return initalNoIntent(handlerInput);
    }
    return ErrorHandler.handle(handlerInput, new Error('Unhandled No'));
  },
};

exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(LaunchRequestHandler, CategoryIntentHandler, YesIntent, NoIntent, SessionEndedRequestHandler) /* FallbackHandler, */
    // .addErrorHandlers(ErrorHandler)
    .lambda();

const welcomeMessage = 'Welcome to Cookbook. Would you like recommendations?';
const repromptYnMessage = 'You can say Yes or No.';




const oxfordComma = (strArray, adjoinment = 'or') => {
  if(!strArray.length) {
    return '';
  }
  let output = '';
  let prefixArray = strArray.slice(0, strArray.length - 1);
  return strArray.length > 1 ? `${prefixArray.join(', ')} ${adjoinment} ${strArray.slice(-1)}` : prefixArray[0];
};
const shuffleArray = (arr) => {
    let temp;
    let index;
    let ctr = arr.length;

    while (ctr > 0) {
        index = Math.floor(Math.random() * ctr);// Pick a random index
        ctr--; // Decrease ctr by 1
        temp = arr[ctr];// And swap the last element with it
        arr[ctr] = arr[index];
        arr[index] = temp;
    }
    return arr;
}
