const express = require('express');
const gemix = require('commander');
const bodyParser = require('body-parser');
const Mixes = require('./mixes.js');
const scanloop = require('./scanloop.js');

gemix
  .option('--port <port>', 'Port to run the gemix server on')
  .option('--scanInterval <scanInterval>',
    'Interval, in seconds, between JobCoin API scans')
  .option('--houseAddr <houseAddr>', 'House address to mix coins in')
  .parse(process.argv);

const server = express();
server.use(bodyParser.json());

const mixes = new Mixes();

setInterval(scanloop, gemix.scanInterval * 1000, mixes, gemix.houseAddr);

server.get('/ping', (req, res) => res.status(200).send('OK'));

server.post('/gemix', (req, res) => {
  // Check if the rquest is malformed or missing anything
  if (req.body.userAddrs === undefined
    || !Array.isArray(req.body.userAddrs)
    || req.body.userAddrs.length <= 1) {
    res.status(400).send();
  } else {
    if (req.body.ttl === undefined) {
      req.body.ttl = 259200; // Default to three days TTL
    }
    const depositAddr = mixes.newMix(req.body.userAddrs, req.body.ttl);
    res.send(depositAddr);
  }
});

const { port } = gemix;
server.listen(port, () => console.log(`Gemix server running on port ${port}`));
