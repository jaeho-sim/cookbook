'use strict';


const exportObj = {
  oxfordComma: (strArray, adjoinment = 'or') => {
    if(!strArray.length) {
      return '';
    }
    let output = '';
    let prefixArray = strArray.slice(0, strArray.length - 1);
    return strArray.length > 1 ? `${prefixArray.join(', ')} ${adjoinment} ${strArray.slice(-1)}` : prefixArray[0];
  },
  shuffleArray: (arr) => {
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
};

module.exports = exportObj;
