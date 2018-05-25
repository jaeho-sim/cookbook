'use strict';

var intentHandlers = {};

exports.handler = (event, context, callback) => {
  try {
    // check application ID
    if (APP_ID !== '' && event.session.application.applicationId !== APP_ID) {
      context.fail('Invalid Application ID');
    }
    // initialize session if not exist
    if (!event.session.attributes) {
      event.session.attributes = {};
    }
    if (event.session.new) {
      onSessionStarted({requestId: event.request.requestId}, event.session);
    }
    // launch request
    if (event.request.type === 'LaunchRequest') {
      onLaunch(event.request, event.session, new Response(context,event.session));
    }
    // intent request
    else if (event.request.type === 'IntentRequest') {
      var response =  new Response(context,event.session);
      // if the intent name exists
      if (event.request.intent.name in intentHandlers) {
        intentHandlers[event.request.intent.name](event.request, event.session, response,getSlots(event.request));
      }
      else {
        response.speechText = 'Unknown intent';
        response.shouldEndSession = true;
        response.done();
      }
    }
    // session end request
    else if (event.request.type === 'SessionEndedRequest') {
      onSessionEnded(event.request, event.session);
      context.succeed();
    }
  }
  catch (e) {
    context.fail('Exception: ' + getError(e));
  }
};

var getSlots = (req) => {
  var slots = {}
  for(var key in req.intent.slots) {
    slots[key] = req.intent.slots[key].value;
  }
  return slots;
}

class Response {
  constructor(context, session) {
    this.speechText = '';
    this.shouldEndSession = true;
    this.ssmlEn = true;
    this._context = context;
    this._session = session;

    this.done = (options) => {

      if(options && options.speechText) {
        this.speechText = options.speechText;
      }
      if(options && options.repromptText) {
        this.repromptText = options.repromptText;
      }
      if(options && options.ssmlEn) {
        this.ssmlEn = options.ssmlEn;
      }
      if(options && options.shouldEndSession) {
        this.shouldEndSession = options.shouldEndSession;
      }
      this._context.succeed(buildAlexaResponse(this));
    }

    this.fail = (msg) => {
      this._context.fail(msg);
    }
  }
};

var createSpeechObject = (text,ssmlEn) => {
  if(ssmlEn) {
    return {
      type: 'SSML',
      ssml: '<speak>'+text+'</speak>'
    }
  } else {
    return {
      type: 'PlainText',
      text: text
    }
  }
}

var buildAlexaResponse = (response) => {
  var alexaResponse = {
    version: '1.0',
    response: {
      outputSpeech: createSpeechObject(response.speechText,response.ssmlEn),
      shouldEndSession: response.shouldEndSession
    }
  };

  if(response.repromptText) {
    alexaResponse.response.reprompt = {
      outputSpeech: createSpeechObject(response.repromptText,response.ssmlEn)
    };
  }

  if(response.cardTitle) {
    alexaResponse.response.card = {
      type: 'Simple',
      title: response.cardTitle
    };

    if(response.imageUrl) {
      alexaResponse.response.card.type = 'Standard';
      alexaResponse.response.card.text = response.cardContent;
      alexaResponse.response.card.image = {
        smallImageUrl: response.imageUrl,
        largeImageUrl: response.imageUrl
      };
    } else {
      alexaResponse.response.card.content = response.cardContent;
    }
  }

  if (!response.shouldEndSession && response._session && response._session.attributes) {
    alexaResponse.sessionAttributes = response._session.attributes;
  }
  return alexaResponse;
}

var getError = (err) => {
  var msg='';
  if (typeof err === 'object') {
    if (err.message) {
      msg = ': Message : ' + err.message;
    }
    if (err.stack) {
      msg += '\nStacktrace:';
      msg += '\n====================\n';
      msg += err.stack;
    }
  } else {
    msg = err;
    msg += ' - This error is not object';
  }
  return msg;
}


//--------------------------------------------- Skill specific logic starts here ----------------------------------------- 

//Add your skill application ID from amazon devloper portal
var APP_ID = '';

var onSessionStarted = (sessionStartedRequest, session) => {
  // add any session init logic here
    
}

var onSessionEnded = (sessionEndedRequest, session) => {
// Add any cleanup logic here
  
}

var onLaunch = (launchRequest, session, response) => {
  response.speechText = 'Welcome to Cookbook. Would you like recommendations?';
  response.repromptText = 'You can say Yes or No.';
  response.shouldEndSession = false;
  // might have called this function by saying "previous step" or "main menu",
  // so set the previousStep according to it
  session.attributes.previousStep = session.attributes.currentStep ? session.attributes.currentStep : null;
  session.attributes.currentStep = 'recommendation-yn';
  response.done();
}

intentHandlers['AMAZON.NoIntent'] = (request, session, response, slots) => {
  if(session.attributes.currentStep === 'recommendation-yn') {
    response.speechText ='What dish are you cooking right now?';
    response.repromptText ='You can say the dish name you want to cook.';
    session.attributes.previousStep = 'recommendation-yn';
    session.attributes.currentStep = 'recipe-ask';
    response.shouldEndSession = false;
    response.done();
  }
  else {
    response.speechText ='Unknown command.';
    response.shouldEndSession = true;
    response.done();
  }
}

intentHandlers['AMAZON.YesIntent'] = (request, session, response, slots) => {
  if(session.attributes.currentStep === 'recommendation-yn') {
    response.speechText = `You can ask me to search for recipes within a category such as "breakfast" or "italian". What category would you like to search?`;
    response.repromptText ='Please say a category you would like to search within.';
    session.attributes.previousStep = 'recommendation-yn';
    session.attributes.currentStep = 'category-ask';
    response.shouldEndSession = false;
    response.done();
  }
  else {
    response.speechText ='Unknown command.';
    response.shouldEndSession = true;
    response.done();
  }
}






/** For each intent write a intentHandlers
Example:
intentHandlers['HelloIntent'] = (request,session,response,slots) => {
  //Intent logic
  
}
**/
