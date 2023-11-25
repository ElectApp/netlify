const index = require('./index.js');
const https = require('https');
const fs = require('fs');

const HOST = "aircontrol.tasaki.co.th";
const PORT = 2023;

const options = {
  key: fs.readFileSync('/etc/letsencrypt/live/'+HOST+'/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/'+HOST+'/fullchain.pem'),
};

// Your Express routes and middleware go here...

const server = https.createServer(options, index.app);

server.listen(PORT, () => {
  console.log(`Server running on https://${HOST}:${PORT}`);
});