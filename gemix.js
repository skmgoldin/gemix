const commander = require('commander');
const axios = require('axios');

const API_LOC = 'http://gemix.hidden.computer';
const DEFAULT_TTL = 30;

// This just helps us get CLI options from the user.
commander
  .option('--ttl [secs]', 'Number of seconds to mix the coins over, default 30, '
    + 'max 604800 (7 days)')
  .option('--api [serverLoc]', 'A local server to use the CLI with, like '
    + 'http://localhost:3000')
  .parse(process.argv);

let api;
if (commander.api !== undefined) {
  api = commander.api;
} else {
  api = API_LOC;
}

let ttl;
if (commander.ttl !== undefined) {
  ttl = commander.ttl * 1000;
} else {
  ttl = DEFAULT_TTL * 1000;
}

async function postMixRequest() {
  const res = await axios.post(`${api}/gemix`, { userAddrs: commander.args,
    ttl: ttl });

  console.log(`${res.data} <- your deposit address`);
}

postMixRequest().catch((err) => {
  console.log('Something went wrong and your request could not be completed');
});

