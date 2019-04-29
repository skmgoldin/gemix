/* eslint-disable no-param-reassign */

const {
  mixOut,
  getDeposit,
} = require('./scanloopHelpers.js');

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
};
