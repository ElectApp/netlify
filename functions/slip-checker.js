// Url: {host}/.netlify/functions/slip-checker
//Library
const express = require('express');
const serverless = require('serverless-http');
const bodyParser = require('body-parser');

const request = require('request');
const axios = require('axios');
const QrCode = require('qrcode-reader');
const Jimp = require('jimp');

//Initial
const app = express();

//- LINE API
const LINE_ACCESS_TOKEN = "7wFj1n0TuAteJ+H+k3Bvm+u4VKIIgmUg6+eZBjdQzSXVZrIzQ35HJchRWjNqXD8N33vPbf9DpAg7u/lzRrgpq0MXKYkneoXoKA7YgGEljY4d1/eVVK2G0ORHJcZmFI9icLD6HvE5dKFZgBLScm9w6gdB04t89/1O/w1cDnyilFU=";
const LINE_SECRET = "5b2d1f0542770a2c32082faa39974866";

async function downloadImage(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        'Authorization': "Bearer " + LINE_ACCESS_TOKEN,
        'Content-Type': 'application/json'
      }, responseType: 'arraybuffer'
    });
    return response.data;
  } catch (error) {
    console.error('Error downloading image:', error.message);
    throw error;
  }
}

// Function to read QR code from image
async function readQrCode(imageBuffer) {
  try {
    const qrCode = new QrCode();
    const image = await Jimp.read(imageBuffer);

    const value = await new Promise((resolve, reject) => {
      qrCode.callback = (err, value) => (err != null ? reject(err) : resolve(value));
      qrCode.decode(image.bitmap);
    });

    return value.result;
  } catch (error) {
    console.error('Error reading QR code:', error.message);
    throw error;
  }
}

async function readQrFromImageUrl(imageUrl) {
  try {
    const imageBuffer = await downloadImage(imageUrl);
    const qrCodeValue = await readQrCode(imageBuffer);
    //console.log('QR Code Value:', qrCodeValue);
    return qrCodeValue;
  } catch (error) {
    //console.error('Error:', error.message);
    throw error;
  }
}

// Use body-parser middleware to parse JSON and URL-encoded data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/slip-checker/test', (req, res) => {
  console.log(req.body);
  // Accessing the entire headers object
  const headers = req.headers;
  // Accessing a specific header
  const userAgent = headers['user-agent'];
  if (userAgent.startsWith("LineBotWebhook")) {
    const data = req.body.events[0];
    //httpResp(res, data);
    if (data.type == "message") {
      if (data.message.type == "image") {
        //Try read QR code
        const imgUrl = 'https://api-data.line.me/v2/bot/message/' + data.message.id + '/content';
        console.log("Reading QR code from:", imgUrl);
        readQrFromImageUrl(imgUrl).then(qrCodeValue => {
          console.log('QR Code Value:', qrCodeValue);
          //res.json({ susccess: true, message: qrCodeValue });
          httpResp(res, { qrCode: qrCodeValue });
        }).catch(error => {
          console.error('Error:', error.message);
          httpResp(res, error.message, 500);
        });
      }
    } else {
      httpResp(res, 'We support message event only.', 500);
    }
  } else {
    httpResp(res, 'We support request from LineBotWebhook only.', 500);
  }
});

function httpResp(res, data, code = 200) {
  res.status(code).json({ success: code == 200, data: data });
}

function reply(reply_token) {
  let headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + LINE_ACCESS_TOKEN
  }
  let body = JSON.stringify({
    replyToken: reply_token,
    messages: [{
      type: 'text',
      text: 'Hello'
    }]
  })
  request.post({
    url: 'https://api.line.me/v2/bot/message/reply',
    headers: headers,
    body: body
  }, (err, res, body) => {
    console.log('replay_status: ' + res.statusCode);
  });
}

module.exports.handler = serverless(app);

/*
exports.handler = async function (event, context) {
  try {
    // Parse JSON data from the request body
    const requestData = JSON.parse(event.body);
    console.log("got data:", event.body);

    // Perform actions with the received data
    // ...


    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'POST request received successfully', data: requestData }),
    };
  } catch (error) {
    console.error("error:", error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error', error: error.message }),
    };
  }
};
*/