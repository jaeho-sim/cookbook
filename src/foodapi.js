const axios = require('axios');
const querystring = require('querystring');
require('./env');
// const { NUM_RECIPES } = require('../constants/constants.js');

const BASE_URL = 'https://spoonacular-recipe-food-nutrition-v1.p.mashape.com/recipes/';
const config = {
  headers: {
    'X-Mashape-Key': process.env.X_MASHAPE_KEY,
    'X-Mashape-Host': process.env.X_MASHAPE_HOST
  }
};

if(!process.env.X_MASHAPE_KEY || !process.env.X_MASHAPE_HOST) {
  throw new Error("API keys are Undefined");
}

const searchRecipes = function (query) {
  const cleanQuery = Object.assign({}, { offset: 0, number: 9 }, query);
  return axios.get(`${BASE_URL}search?${querystring.stringify(query)}&instructionsRequired=false&type=main+course`, config)
    .then((response) => {
      return response.data;
    })
    .catch((error) => {
      const err = new Error(error);
      throw err;
    });
};

const getRecipe = function (id, axiosInstance = axios) {
  return new Promise((resolve, reject) => {
    axiosInstance.get(`${BASE_URL}${id}/information`, config)
      .then((response) => {
        resolve(response.data);
      })
      .catch((error) => {
        const err = new Error(error);
        reject(err);
      });
  });
};

module.exports = {
  searchRecipes,
  getRecipe
};
