const express = require('express');
const gemix = require('commander');

gemix
  .option('--port <port>', 'Port to run the gemix server on')
  .option('--scanInterval <scanInterval>',
    'Interval, in seconds, between JobCoin API scans')
  .option('--houseAddr <houseAddr>', 'House address to mix coins in')
  .parse(process.argv);

const server = express();
const { port } = gemix;

server.get('/ping', (req, res) => res.status(200).send('OK'));

server.listen(port, () => console.log(`Gemix server running on port ${port}`));
