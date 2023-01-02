import express, { Router } from 'express';
import serverless from 'serverless-http';

const router = require('./router');
const bodyParser = require("body-parser");
const cors = require('cors');

const app = express();

app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use('/.netlify/functions/api', router);

export const handler = serverless(app);
