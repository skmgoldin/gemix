const axios = require('axios');

/* eslint-disable no-param-reassign */
function scanloop(mixes, houseAddr) {
  mixes.forEach(async (node) => {

    // The first thing we'll check is if a mix still hasn't received its
    // deposit, whether a deposit has become available to transfer in to the
    // house address.
    if (node.depositAmt === undefined) {
      const depositAmt = parseInt((await axios.get(
        `http://jobcoin.gemini.com/crowbar/api/addresses/${node.depositAddr}`,
      ))
        .data.balance, 10);

      // If there is a balance in the deposit address, transfer it to the house
      // address.
      if (depositAmt > 0) {
        await axios.post('http://jobcoin.gemini.com/crowbar/api/transactions', {
          fromAddress: node.depositAddr,
          toAddress: houseAddr,
          amount: depositAmt,
        });

        // Update the mix node
        node.depositAmt = depositAmt;
        node.releaseBy = Date.now() + node.ttl;
        node.remainingAddrs = node.userAddrs;
      }
    }

    // Next we'll check if a node still has not received its deposit, and the
    // deposit deadline has passed. If so we'll just delete this mix.

    // Next, we'll check if a mix has a release ready. If so, we'll make the
    // release and compute parameters for the next one.
    
    // If the length of remainingAddrs is zero, this mix is complete and we can
    // delete it.
  });
}

module.exports = scanloop;
