
require('dotenv').config(process.env.NODE_ENV && process.env.NODE_ENV !== 'development' ? { path: `.env.${process.env.NODE_ENV}` } : {});
