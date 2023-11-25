const axios = require('axios');
const QrCode = require('qrcode-reader');
const Jimp = require('jimp');

const imgUrl = 'https://api-data.line.me/v2/bot/message/483289489863606309/content';
//const imageUrl = 'https://proiot.xyz/53454.jpg';

const LINE_ACCESS_TOKEN = "7wFj1n0TuAteJ+H+k3Bvm+u4VKIIgmUg6+eZBjdQzSXVZrIzQ35HJchRWjNqXD8N33vPbf9DpAg7u/lzRrgpq0MXKYkneoXoKA7YgGEljY4d1/eVVK2G0ORHJcZmFI9icLD6HvE5dKFZgBLScm9w6gdB04t89/1O/w1cDnyilFU=";
const LINE_SECRET = "5b2d1f0542770a2c32082faa39974866";

// Function to download the image using axios
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

function main() {
    readQrFromImageUrl(imgUrl).then(qrCodeValue => {
        console.log('QR Code Value:', qrCodeValue);
    }).catch(error => {
        console.error('Error:', error.message);
    })
}

// Run the main function
main();

