const express = require('express');
const serverless = require('serverless-http');

const app = express();

// Use body-parser middleware to parse JSON and URL-encoded data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/.netlify/functions/hello', (req, res) => {
  res.json({ message: 'Hello, World!' });
});

module.exports.handler = serverless(app);
