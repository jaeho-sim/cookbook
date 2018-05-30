'use strict';

require('dotenv').config(process.env.NODE_ENV ? { path: `.env.${process.env.NODE_ENV}` } : {});
const Alexa = require('ask-sdk');

const handlers = require('./src/handlers');
const categories = require('./static-data/category.json').map(category => category.name.value);

exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers( ...Object.values(handlers).filter(handler => handler !== handlers.ErrorHandler) )
    .addErrorHandlers(handlers.ErrorHandler)
    .lambda();
