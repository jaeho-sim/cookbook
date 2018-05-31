'use strict';


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
  doUpdateWithApi: (nextSkillOffset, {getSession}) => {
    const { apiCache } = getSession();
    return apiCache.offset === null || (apiCache.records.length < nextSkillOffset && apiCache.maxRecordCount > nextSkillOffset);
  },
  updateApiCache: (skillOffset, {setSession, getSession}) => {

    return true;
  }
};

module.exports = exportObj;
