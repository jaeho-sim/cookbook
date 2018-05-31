'use strict';

const Alexa = require('ask-sdk');
require('./src/env');
const handlers = require('./src/handlers');
const categories = require('./static-data/category.json').map(category => category.name.value);

exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers( ...Object.values(handlers).filter(handler => handler !== handlers.ErrorHandler) )
    .addErrorHandlers(handlers.ErrorHandler)
    .lambda();
