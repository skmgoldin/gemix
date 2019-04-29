const express = require('express');
const commander = require('commander');
const bodyParser = require('body-parser');
const uuid = require('uuid/v4');
const LinkedList = require('./LinkedList.js');
const { scanloop } = require('./scanloop.js');

const server = express();
server.use(bodyParser.json());

// The mix TTL is the maximum duration (+/- the scan interval) which the service
// will take to fully disburse a user's coins.
const DEFAULT_MIX_TTL = 259200000;
const MAX_TTL = 604800000;

// This just helps us get CLI options from the user.
commander
  .option('--port <port>', 'Port to run the gemix server on')
  .option('--scanInterval <scanInterval>',
    'Interval, in seconds, between JobCoin API scans')
  .option('--houseAddr <houseAddr>', 'House address to mix coins in')
  .parse(process.argv);

// mixJobs is a linked list of active mix jobs. The scanloop iterates over it
// periodically and moves jobs through state transitions as it works to
// complete them. It deletes jobs when they are completed, or when they
// expire without a deposit being made.
const mixJobs = new LinkedList();
setInterval(scanloop, commander.scanInterval * 1000, mixJobs,
  commander.houseAddr, { now: (() => Date.now()) });

// gemix is the endpoint used for creating a new mix. It adds the mix job to the
// mixJobs linked list, and returns a deposit address to the sender.
server.post('/gemix', (req, res) => {
  // Check if the request is malformed or missing anything. If it is, return
  // a 400.
  if (req.body.userAddrs === undefined
    || !Array.isArray(req.body.userAddrs)
    || req.body.userAddrs.length <= 1
    || (req.body.ttl !== undefined && req.body.ttl > MAX_TTL)) {
    res.status(400).send();
    return;
  }

  // Submitting a TTL is optional. We use the default if it's missing.
  if (req.body.ttl === undefined) {
    req.body.ttl = DEFAULT_MIX_TTL;
  }

  // Add this job to the list of mix jobs, and return a deposit address to the
  // sender.
  const depositAddr = uuid();
  const job = {
    status: 'registered',
    outAddrs: req.body.userAddrs,
    ttl: req.body.ttl,
    depositAddr,
    creationTime: Date.now(),
  };
  mixJobs.append(job);

  // Log some information
  console.log(`[${(new Date(Date.now())).toUTCString()}] Got a new job with ID `
  + `${job.depositAddr}`);

  res.send(job.depositAddr);
});

// Just a healthcheck endpoint
server.get('/ping', (req, res) => res.status(200).send('OK'));

// Start the server!
const { port } = commander;
server.listen(port, () => console.log(`Gemix server running on port ${port}`));
