/* global describe it */

const axios = require('axios');
const uuid = require('uuid/v4');
const { expect } = require('chai');
const LinkedList = require('../LinkedList.js');
const { getDeposit, scanloop } = require('../scanloop.js');

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

      // Send user's coins to the deposit address
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

      // Get the house's final balance
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
    it('gracefully handles sends of zero');
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
    it('mixes users\' coins over all provided addresses', async () => {
      const depositAmt = 10;
      const houseAddr = uuid();
      const outAddrOne = uuid();
      const outAddrTwo = uuid();
      const outAddrThree = uuid();
      const mixJobs = new LinkedList();
      const job = {
        status: 'registered',
        ttl: 0,
        outAddrs: [outAddrOne, outAddrTwo, outAddrThree],
        depositAddr: uuid(),
      };
      mixJobs.append(job);
      const now = Date.now();
      const time = { now: (() => now) };

      // Send user's coins to the deposit address
      await axios.post('http://jobcoin.gemini.com/crowbar/api/transactions', {
        fromAddress: USER,
        toAddress: job.depositAddr,
        amount: depositAmt,
      });

      // We sent in three addresses, so we need to run the scanloop three times
      await scanloop(mixJobs, houseAddr, time);
      await scanloop(mixJobs, houseAddr, time);
      await scanloop(mixJobs, houseAddr, time);

      // Get the final balance of the outAddrs
      const outAddrOneBal = parseFloat((await axios.get(
        `http://jobcoin.gemini.com/crowbar/api/addresses/${outAddrOne}`,
      ))
        .data.balance);
      const outAddrTwoBal = parseFloat((await axios.get(
        `http://jobcoin.gemini.com/crowbar/api/addresses/${outAddrTwo}`,
      ))
        .data.balance);
      const outAddrThreeBal = parseFloat((await axios.get(
        `http://jobcoin.gemini.com/crowbar/api/addresses/${outAddrThree}`,
      ))
        .data.balance);

      expect(outAddrOneBal).to.be.above(0);
      expect(outAddrTwoBal).to.be.above(0);
      expect(outAddrThreeBal).to.be.above(0);
      expect(outAddrOneBal + outAddrTwoBal + outAddrThreeBal)
        .to.equal(depositAmt);
    });

    it('mixes users\' coins within the provided ttls');
  });
});
