const axios = require('axios');

/* eslint-disable no-param-reassign */
function prepareNextRelease(node) {
  node.nextReleaseDate = (() => {
    const interval = Math.floor(Math.random() * node.remainingTtl);
    node.remainingTtl -= interval;
    return node.releaseBy - interval;
  })();
  node.nextReleaseAmt = (() => {
    let releaseAmt;
    if (node.remainingAddrs.length === 1) {
      releaseAmt = node.remainingDeposit;
    } else {
      releaseAmt = Math.random() * node.remainingDeposit;
    }
    node.remainingDeposit -= releaseAmt;
    return releaseAmt;
  })();
}

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
        const now = Date.now();
        node.depositAmt = depositAmt;
        node.releaseBy = now + node.ttl;
        node.remainingDeposit = node.depositAmt;
        node.remainingTtl = node.ttl;
        node.remainingAddrs = node.userAddrs;
        prepareNextRelease(node);
      }
    }

    // Next we'll check if a node still has not received its deposit, and the
    // deposit deadline has passed. If so we'll just delete this mix.

    // Next, we'll check if a mix has a release ready. If so, we'll make the
    // release and compute parameters for the next one.
    if (node.nextReleaseDate < Date.now() && node.remainingAddrs.length > 0) {
      await axios.post('http://jobcoin.gemini.com/crowbar/api/transactions', {
        fromAddress: houseAddr,
        toAddress: node.remainingAddrs.pop(),
        amount: node.nextReleaseAmt,
      });

      if (node.remainingAddrs.length > 0) {
        prepareNextRelease(node);
      }
    }

    // If the length of remainingAddrs is zero, this mix is complete and we can
    // delete it.
  });
}

module.exports = scanloop;
