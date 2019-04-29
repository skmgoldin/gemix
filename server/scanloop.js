/* eslint-disable no-param-reassign */

const axios = require('axios');
const BN = require('bignumber.js');

BN.config({ DECIMAL_PLACES: 5 });

function prepareNextMixOut(job, time) {
  // Set the next mix date by generating a random number between 0 and the
  // number of seconds remaining before this job is due to finish. Add that
  // number to the current time, and that is the next mix date.
  job.nextMixDate = (() => {
    const interval = Math.floor(Math.random() * (job.finishBy - time.now()));
    return time.now() + interval;
  })();

  // Set the next mix amount either by multiplying the remaining deposit by a
  // random fraction between 0 and 1 or, if only one out address remains,
  // sending the whole remaining amount.
  job.nextMixAmt = (() => {
    let releaseAmt;
    if (job.outAddrs.length === 1) {
      releaseAmt = job.depositRemaining;
    } else {
      releaseAmt = BN.random().times(job.depositRemaining);
    }

    job.depositRemaining = job.depositRemaining.minus(releaseAmt);
    return releaseAmt;
  })();
}

async function getDeposit(job, houseAddr, time) {
  if (job.status === 'registered') {
    // See if a balance exists in the deposit address
    const depositAmt = new BN((await axios.get(
      `http://jobcoin.gemini.com/crowbar/api/addresses/${job.depositAddr}`,
    ))
      .data.balance);

    // If there is a balance in the deposit address, transfer it to the house
    // address.
    if (depositAmt > 0) {
      await axios.post('http://jobcoin.gemini.com/crowbar/api/transactions', {
        fromAddress: job.depositAddr,
        toAddress: houseAddr,
        amount: depositAmt.toString(),
      });

      // Log some information
      console.log(`[${(new Date(Date.now())).toUTCString()}] scooped `
      + `${depositAmt.toString()} coins to the house address for `
      + `job ${job.depositAddr}`);

      // Update the mix job to reflect its new status
      job.status = 'in-progress';
      job.depositRemaining = depositAmt;
      job.finishBy = time.now() + job.ttl;

      prepareNextMixOut(job, time);
    }
  }
}

async function mixOut(job, houseAddr, time) {
  // If the job is in-progress, we've passed the next mix date, and we have
  // addresses left, make a mix.
  if (job.status === 'in-progress'
    && job.nextMixDate <= time.now()
    && job.outAddrs.length > 0) {
    // Pop an outAddr off the stack
    const outAddr = job.outAddrs.pop();

    // Log some information
    console.log(`[${(new Date(Date.now())).toUTCString()}] sending `
    + `${job.nextMixAmt.toString()} coins to address ${outAddr} for `
    + `job ${job.depositAddr}`);

    // Attempt to do the mix, transfering the precomputed outlay to the outAddr.
    // If this fails in any way we'll re-add the outAddr to the stack, recompute
    // the mix and try again in the next round.
    try {
      await axios.post('http://jobcoin.gemini.com/crowbar/api/transactions', {
        fromAddress: houseAddr,
        toAddress: outAddr,
        amount: job.nextMixAmt.toString(),
      });
    } catch (err) {
      // TODO: Not every failure of this API call will mean funds weren't
      // transferred, nor will every success. Would need to handle this more
      // thoughtfully IRL.
      job.outAddrs.push(outAddr);
    }

    if (job.outAddrs.length > 0) {
      prepareNextMixOut(job, time);
    } else {
      // Log some information
      console.log(`[${(new Date(Date.now())).toUTCString()}] job `
      + `${job.depositAddr} has become prunable because it finished`);

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
    if (time.now() > job.creationTime + job.ttl && job.status === 'registered') {
      // Log some information
      console.log(`[${(new Date(Date.now())).toUTCString()}] job `
      + `${job.depositAddr} has become prunable because it never received a `
      + 'deposit');

      job.status = 'prunable';
    }

    // Next, we'll check if a mix has a release ready. If so, we'll make the
    // release and compute parameters for the next one.
    await mixOut(job, houseAddr, time);

    // If the length of outAddrs is zero, this mix is complete and we can
    // delete it.
    if (job.status === 'prunable') {
      mixJobs.remove(job);

      // Log some information
      console.log(`[${(new Date(Date.now())).toUTCString()}] job `
      + `${job.depositAddr} has been pruned`);
    }
  });
}

module.exports = {
  scanloop,
  getDeposit,
  mixOut,
  prepareNextMixOut,
};
