/* eslint-disable no-param-reassign */

const axios = require('axios');

function prepareNextMixOut(job, time) {
  job.nextMixDate = (() => {
    const interval = Math.floor(Math.random() * (job.finishBy - time.now()));
    return time.now() + interval;
  })();
  job.nextMixAmt = (() => {
    let releaseAmt;
    if (job.outAddrs.length === 1) {
      releaseAmt = job.depositRemaining;
    } else {
      releaseAmt = Math.random() * job.depositRemaining;
    }
    job.depositRemaining -= releaseAmt;
    return releaseAmt;
  })();
}

async function getDeposit(job, houseAddr, time) {
  if (job.status === 'registered') {
    const depositAmt = parseFloat((await axios.get(
      `http://jobcoin.gemini.com/crowbar/api/addresses/${job.depositAddr}`,
    ))
      .data.balance);

    // If there is a balance in the deposit address, transfer it to the house
    // address.
    if (depositAmt > 0) {
      await axios.post('http://jobcoin.gemini.com/crowbar/api/transactions', {
        fromAddress: job.depositAddr,
        toAddress: houseAddr,
        amount: depositAmt,
      });

      // Update the mix job
      job.status = 'in-progress';
      job.depositRemaining = depositAmt;
      job.finishBy = time.now() + job.ttl;
      prepareNextMixOut(job, time);
    }
  }
}

async function mixOut(job, houseAddr, time) {
  if (job.status === 'in-progress'
    && job.nextMixDate <= time.now()
    && job.outAddrs.length > 0) {
    const outAddr = job.outAddrs.pop();
    try {
      await axios.post('http://jobcoin.gemini.com/crowbar/api/transactions', {
        fromAddress: houseAddr,
        toAddress: outAddr,
        amount: job.nextMixAmt,
      });
    } catch (err) {
      job.outAddrs.push(outAddr);
    }

    if (job.outAddrs.length > 0) {
      prepareNextMixOut(job, time);
    } else {
      job.status = 'prunable';
    }
  }
}

async function scanloop(mixJobs, houseAddr, time) {
  await mixJobs.forEach(async (job) => {
    // The first thing we'll check is if a mix still hasn't received its
    // deposit, whether a deposit has become available to transfer in to the
    // house address.
    await getDeposit(job, houseAddr, time);

    // Next we'll check if a job still has not received its deposit, and the
    // deposit deadline has passed. If so we'll just delete this mix.

    // Next, we'll check if a mix has a release ready. If so, we'll make the
    // release and compute parameters for the next one.
    await mixOut(job, houseAddr, time);

    // If the length of outAddrs is zero, this mix is complete and we can
    // delete it.
  });
}

module.exports = {
  scanloop,
  getDeposit,
  mixOut,
  prepareNextMixOut,
};
