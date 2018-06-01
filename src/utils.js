'use strict';

const API = require('./foodapi');
const exportObj = {
  oxfordComma: (strArray, adjoinment = 'or') => {
    if(!strArray.length) {
      return '';
    }
    let output = '';
    let prefixArray = strArray.slice(0, strArray.length - 1);
    return prefixArray.length > 1 ? `${prefixArray.join(', ')} ${adjoinment} ${strArray.slice(-1)}` : strArray[0];
  },
  shuffleArray: (arr) => {
    let temp;
    let index;
    let ctr = arr.length;
    let output = arr.concat([]); // break ref

    while (ctr > 0) {
      index = Math.floor(Math.random() * ctr);// Pick a random index
      ctr--; // Decrease ctr by 1
      temp = output[ctr];// And swap the last element with it
      output[ctr] = arr[index];
      output[index] = temp;
    }
    return output;
  },
  categorySelectionIntentValidMoreIntent: (handlerInput, cleanCategories) => {
    const { attributesManager } = handlerInput;
    const { request } = handlerInput.requestEnvelope;
    const intentName = request.intent.name;
    const { apiCache } = attributesManager.getSessionAttributes();
    if (!apiCache || !apiCache.query || !apiCache.query.cuisine) {
      return false;
    }
    return intentName === 'MoreIntent' && cleanCategories.includes(apiCache.query.cuisine.toLowerCase());
  },
  categorySelectionIntentValidIntentAndSlots: (handlerInput, cleanCategories) => {
    const { attributesManager } = handlerInput;
    const { request } = handlerInput.requestEnvelope;
    const intentName = request.intent.name;
    if (!request.intent.slots || !request.intent.slots.FoodCategory) {
      return false;
    }
    return intentName === 'CategorySelectionIntent' && cleanCategories.includes(request.intent.slots.FoodCategory.value.toLowerCase());
  },
  doUpdateWithApi: (apiCache) => {
    return apiCache.offset === null || (apiCache.records.length < apiCache.skillOffset && apiCache.maxRecordCount > apiCache.skillOffset);
  },
  updateApiCache: (apiCache, {setSessionAttributes}) => {
    if (!exportObj.doUpdateWithApi(apiCache)) {
      setSessionAttributes({ apiCache });
      return Promise.resolve(apiCache);
    }
    return API.searchRecipes(apiCache.query)
      .then((apiResults) => {
        const newCache = {
          skillOffset: apiCache.skillOffset,
          offset: apiResults.offset,
          query: apiCache.query,
          maxRecordCount: apiResults.totalResults,
          records: apiCache.records.concat(apiResults.results.map(({id, title}) => ({id, title}) ))
        };
        setSessionAttributes({
          apiCache: newCache
        });
        apiResults.records = newCache.records;
        apiResults.maxRecordCount = newCache.maxRecordCount;
        return apiResults;
      });
  }
};

module.exports = exportObj;
