/* global describe it */

const axios = require('axios');
const uuid = require('uuid/v4');
const { expect } = require('chai');
const LinkedList = require('../LinkedList.js');
const { getDeposit } = require('../scanloop.js');

describe('scanloop', () => {
  const USER = 'Satoshi';

  describe('getDeposit', () => {
    it('moves deposits to the house address', async () => {
      const depositAmt = 1;
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
      const userStartingBalance = parseFloat((await axios.get(
        `http://jobcoin.gemini.com/crowbar/api/addresses/${USER}`,
      ))
        .data.balance);

      // Get the house's starting balance
      const houseStartingBalance = parseFloat((await axios.get(
        `http://jobcoin.gemini.com/crowbar/api/addresses/${houseAddr}`,
      ))
        .data.balance);

      await axios.post('http://jobcoin.gemini.com/crowbar/api/transactions', {
        fromAddress: USER,
        toAddress: job.depositAddr,
        amount: depositAmt,
      });

      await getDeposit(job, houseAddr, time);

      // Get the sending user's final balance
      const userFinalBalance = parseFloat((await axios.get(
        `http://jobcoin.gemini.com/crowbar/api/addresses/${USER}`,
      ))
        .data.balance);

      const houseFinalBalance = parseFloat((await axios.get(
        `http://jobcoin.gemini.com/crowbar/api/addresses/${houseAddr}`,
      ))
        .data.balance);

      expect(userFinalBalance).to.be.equal(userStartingBalance - depositAmt);
      expect(houseFinalBalance).to.be.equal(houseStartingBalance + depositAmt);
    });

    it('sets a job\'s status to "in-progress" after taking its deposit');
    it('does not process jobs whose status is not "registered"');
    it('does not change a job\'s state if no deposit is available');
  });

  describe('mixOut', () => {
    it('does not process jobs whose status is not "in-progress"');
    it('does not mix coins before the job\'s next release date');
  });

  describe('assessPrunable', () => {
    it('sets expired jobs as "prunable"');
    it('does not set jobs to "prunable" which have a depositRemaining');
  });

  describe('prune', () => {
    it('prunes jobs whose status is "prunable"');
    it('does not prune jobs whose status is not "prunable"');
  });

  describe('prepareNextMixOut', () => {
    it('assigns all remaining coins to the next mix if only one outAddr remains');
    it('sets the next mix release to before the job\'s finishBy date');
  });

  describe('scanloop', () => {
    it('mixes users\' coins over all provided addresses');
    it('mixes users\' coins within the provided ttls');
  });
});
