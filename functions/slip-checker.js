// Url: {host}/.netlify/functions/slip-checker
//Library
const express = require('express');
const serverless = require('serverless-http');

const axios = require('axios');
const QrCode = require('qrcode-reader');
const Jimp = require('jimp');

const numeral = require('numeral');
const moment = require('moment-timezone');

//Constant
//- LINE API
const LINE_ACCESS_TOKEN = "7wFj1n0TuAteJ+H+k3Bvm+u4VKIIgmUg6+eZBjdQzSXVZrIzQ35HJchRWjNqXD8N33vPbf9DpAg7u/lzRrgpq0MXKYkneoXoKA7YgGEljY4d1/eVVK2G0ORHJcZmFI9icLD6HvE5dKFZgBLScm9w6gdB04t89/1O/w1cDnyilFU=";
const LINE_SECRET = "5b2d1f0542770a2c32082faa39974866";
const LINE_BEARER_TOKEN = "Bearer " + LINE_ACCESS_TOKEN;

//- SlipOK
const SLIPOK_BRANCH_ID = "12976";
const SLIPOK_API_KEY = "SLIPOKL3J6SCA";
const SLIPOK_HOST = "https://api.slipok.com/api/line/apikey/";
const SLIPOK_CHECK_URL = SLIPOK_HOST + SLIPOK_BRANCH_ID;
const SLIPOK_QUATA_URL = SLIPOK_CHECK_URL + "/quota";

//Initial
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Set the timezone to 'Asia/Bangkok'
moment.tz.setDefault('Asia/Bangkok');
// Set Local format
moment.locale('th');

// Function to download the image using axios
async function downloadImage(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        'Authorization': LINE_BEARER_TOKEN,
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

async function checkQuata() {
  try {
    const res = await axios.get(SLIPOK_QUATA_URL,
      {
        headers: {
          'x-authorization': SLIPOK_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log(res.data);
    return res.data.data;
  } catch (error) {
    const edata = error.response.data;
    if (edata) {
      console.error('Error check quata:', edata);
      return edata;
    } else {
      console.error('Error check quata:', error.message);
      throw new Error(error.message);
    }
  }
}

async function checkSlip(qrString) {
  try {
    const res = await axios.post(SLIPOK_CHECK_URL,
      {
        data: qrString,
      },
      {
        headers: {
          'x-authorization': SLIPOK_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log(res.data);
    return res.data.data;
  } catch (error) {
    const edata = error.response.data;
    if (edata) {
      console.error('Error check slip:', edata);
      return edata;
    } else {
      console.error('Error check slip:', error.message);
      throw new Error(error.message);
    }
  }
}

async function checkSlipFromImageUrl(imageUrl) {
  try {
    const qrCodeValue = await readQrFromImageUrl(imageUrl);
    const quota = await checkQuata();
    let res = { success: false, qrCode: qrCodeValue };
    if (quota.quota == 0) {
      res.message = '😟 ระบบไม่สามารถตรวจสอบสลิปได้ เนื่องจากเกินโคต้าแล้ว';
    } else {
      const slip = await checkSlip(qrCodeValue);
      if (slip.code > 0) {
        //Error
        res.message = '⚠️ ' + slip.message;
      } else {
        //OK
        let tstamp = moment(slip.transTimestamp);
        res.success = true;
        res.message = "✅ สลิปถูกต้องจำนวนเงิน " + numeral(slip.amount).format('0,0.00') + " บาท";
        res.message += " ชำระเมื่อ " + tstamp.format("DD/MM/YYYY HH:mm") + " (" + tstamp.fromNow() + ")";
      }
    }
    return res;
  } catch (error) {
    //console.error('Error:', error.message);
    throw error;
  }
}

function replyText(replyToken, text) {
  axios.post("https://api.line.me/v2/bot/message/reply",
    {
      replyToken: replyToken,
      messages: [
        {
          type: "text",
          text: text,
        }
      ]
    },
    {
      headers: {
        Authorization: LINE_BEARER_TOKEN,
        'Content-Type': 'application/json',
      },
    })
    .then((res) => {
      console.log("Reply:", res.data);
    })
    .catch((err) => {
      console.error("Error reply:", err.message);
    });
}

app.post('/.netlify/functions/slip-checker', (req, res) => {
  console.log(req.body);
  // Accessing the entire headers object
  const headers = req.headers;
  // Accessing a specific header
  const userAgent = headers['user-agent'];
  if (userAgent.startsWith("LineBotWebhook")) {
    //httpResp(res, 'OK', 200);

    //Reply to LINE
    const events = req.body.events;
    //httpResp(res, data);
    if (events && events.length>0 && events[0].type === "message" && events[0].message.type === "image") {
      const data = events[0];
      //Try read QR code
      const imgUrl = 'https://api-data.line.me/v2/bot/message/' + data.message.id + '/content';
      console.log("Reading QR code from:", imgUrl);
      checkSlipFromImageUrl(imgUrl).then(result => {
        console.log('Result:', result);
        httpResp(res, result.message);
        //Reply
        replyText(data.replyToken, result.message);
      }).catch(error => {
        console.error('Error:', error.message);
      });
    }else {
      httpResp(res, 'We support a image message only.');
    }
  } else {
    httpResp(res, 'We support request from LineBotWebhook only.', 500);
  }
});

function httpResp(res, data, code = 200) {
  res.status(code).json({ success: code == 200, data: data });
}

module.exports.handler = serverless(app);