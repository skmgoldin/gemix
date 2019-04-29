/* global describe it */

const axios = require('axios');
const uuid = require('uuid/v4');
const { expect } = require('chai');
const BN = require('bignumber.js');
const LinkedList = require('../../gemix-server/LinkedList.js');
const {
  getDeposit,
} = require('../../gemix-server/scanloopHelpers.js');

describe('scanloopHelpers', () => {
  const USER = 'Satoshi';

  describe('getDeposit', () => {
    it('moves deposits to the house address', async () => {
      const depositAmt = new BN(1);
      const houseAddr = uuid();
      const mixJobs = new LinkedList();
      const job = {
        status: 'registered',
        ttl: 0,
        outAddrs: [],
        depositAddr: uuid(),
      };
      mixJobs.append(job);
      const time = { now: (() => Date.now()) };

      // Get the sending user's starting balance
      const userStartingBalance = new BN((await axios.get(
        `http://jobcoin.gemini.com/crowbar/api/addresses/${USER}`,
      ))
        .data.balance);

      // Get the house's starting balance
      const houseStartingBalance = new BN((await axios.get(
        `http://jobcoin.gemini.com/crowbar/api/addresses/${houseAddr}`,
      ))
        .data.balance);

      // Send user's coins to the deposit address
      await axios.post('http://jobcoin.gemini.com/crowbar/api/transactions', {
        fromAddress: USER,
        toAddress: job.depositAddr,
        amount: depositAmt,
      });

      await getDeposit(job, houseAddr, time);

      // Get the sending user's final balance
      const userFinalBalance = new BN((await axios.get(
        `http://jobcoin.gemini.com/crowbar/api/addresses/${USER}`,
      ))
        .data.balance);

      // Get the house's final balance
      const houseFinalBalance = new BN((await axios.get(
        `http://jobcoin.gemini.com/crowbar/api/addresses/${houseAddr}`,
      ))
        .data.balance);

      expect(userFinalBalance.toString()).to.be
        .equal(userStartingBalance.minus(depositAmt).toString());
      expect(houseFinalBalance.toString()).to.be
        .equal(houseStartingBalance.plus(depositAmt).toString());
    });

    it('sets a job\'s status to "in-progress" after taking its deposit');
    it('does not process jobs whose status is not "registered"');
    it('does not change a job\'s state if no deposit is available');
  });

  describe('mixOut', () => {
    it('gracefully handles sends of zero');
    it('does not process jobs whose status is not "in-progress"');
    it('does not mix coins before the job\'s next release date');
  });

  describe('prepareNextMixOut', () => {
    it('assigns all remaining coins to the next mix if only one outAddr remains');
    it('sets the next mix release to before the job\'s finishBy date');
  });
});
