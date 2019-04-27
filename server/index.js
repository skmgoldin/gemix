const express = require('express');
const gemix = require('commander');
const bodyParser = require('body-parser');
const mixes = require('./mixes.js');

gemix
  .option('--port <port>', 'Port to run the gemix server on')
  .option('--scanInterval <scanInterval>',
    'Interval, in seconds, between JobCoin API scans')
  .option('--houseAddr <houseAddr>', 'House address to mix coins in')
  .parse(process.argv);

const server = express();
server.use(bodyParser.json());

const { port } = gemix;

server.get('/ping', (req, res) => res.status(200).send('OK'));

server.post('/gemix', (req, res) => {
  const depositAddr = mixes.newMix(req.body.userAddrs, req.body.ttl);
  res.send(depositAddr);
});

server.listen(port, () => console.log(`Gemix server running on port ${port}`));
