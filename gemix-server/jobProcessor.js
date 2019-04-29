/* eslint-disable no-param-reassign */

const {
  mixOut,
  getDeposit,
} = require('./jobProcessorHelpers.js');

async function jobProcessor(jobs, houseAddr, time) {
  await jobs.forEach(async (job) => {
    // The first thing we'll check is, if a mix still hasn't received its
    // deposit, whether a deposit has become available to transfer in to the
    // house address.
    await getDeposit(job, houseAddr, time);

    // Next we'll check if a job still has not received its deposit, and the
    // deposit deadline has passed. If so we'll mark this mix as prunable.
    if (time.now() > job.creationTime + job.ttl && job.status === 'registered') {
      // Log some information
      console.log(`[${(new Date(Date.now())).toUTCString()}] job `
      + `${job.depositAddr} has become prunable because it never received a `
      + 'deposit');

      job.status = 'prunable';
    }

    // Next, we'll check if a mix has a release ready. If so, we'll make the
    // release and compute parameters for the next release.
    await mixOut(job, houseAddr, time);

    // If the job is prunable, we delete it.
    if (job.status === 'prunable') {
      jobs.remove(job);

      // Log some information
      console.log(`[${(new Date(Date.now())).toUTCString()}] job `
      + `${job.depositAddr} has been pruned`);
    }
  });
}

module.exports = {
  jobProcessor,
};
