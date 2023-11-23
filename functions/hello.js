const express = require('express');
const serverless = require('serverless-http');
const bodyParser = require('body-parser');

const app = express();

// Use body-parser middleware to parse JSON and URL-encoded data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/.netlify/functions/hello', (req, res) => {
  res.json({ message: 'Hello, World!' });
});

app.post('/pay-confirm', (req, res) => {
    let raw = req.body;
    res.json({ message: raw });

    res.send('Data received successfully');
});

module.exports.handler = serverless(app);
