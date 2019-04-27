/* global describe beforeEach afterEach it */

const { spawn } = require('child_process');
const { expect } = require('chai');
const Axios = require('axios');
const uuid = require('uuid/v4');
const sleep = require('sleep');

describe('gemix server scan loop', () => {
  const houseAddr = uuid();
  const jobcoinApi = 'http://jobcoin.gemini.com';
  const user = 'Satoshi';
  const scanInterval = 1;

  let server;
  const port = Math.floor(Math.random() * (49151 - 1024) + 1024);
  const gemixApi = `http://localhost:${port}`;
  const axios = Axios.create({
    baseURL: gemixApi,
  });

  // Start the gemix server
  beforeEach(async () => {
    server = spawn('node', ['index.js', '--port', port, '--scanInterval',
      scanInterval, '--houseAddr', houseAddr], { stdio: ['pipe', 1, 2] });

    const ping = async () => {
      try {
        const resp = await axios.get('/ping');
        if (resp.status === 200) {
          return;
        }
      } catch (err) {
        if (err.code !== 'ECONNREFUSED') {
          throw err;
        }

        await ping();
      }
    };

    await ping();
  });

  // Stop the gemix server
  afterEach(() => {
    server.kill();
  });

  it('moves deposited tokens to the house address', async () => {
    const depositAmt = 1;

    // Get the starting balance of the house address as an int
    const houseAddrStartingBalance = parseInt((await axios.get(
      `/crowbar/api/addresses/${houseAddr}`, { baseURL: jobcoinApi },
    ))
      .data.balance, 10);

    // Get a new deposit address
    const depositAddr = (await axios.post('/gemix',
      { userAddrs: [uuid(), uuid(), uuid()] }))
      .data;

    // Make a deposit to the deposit address
    await axios.post('/crowbar/api/transactions', {
      fromAddress: user,
      toAddress: depositAddr,
      amount: depositAmt,
    }, { baseURL: jobcoinApi });

    // Get the final balance of the house address
    const houseAddrFinalBalance = parseInt((await axios.get(
      `/crowbar/api/addresses/${houseAddr}`, { baseURL: jobcoinApi },
    ))
      .data.balance, 10);

    // Wait for the scan interval to elapse
    sleep.sleep(scanInterval * 2);

    // The house address' final balance should be its starting balance plus
    // the deposit amount.
    expect(houseAddrFinalBalance)
      .to.be.equal(houseAddrStartingBalance + depositAmt); // eslint-disable-line
  });

  it('uses all user addresses for mixing', async () => {
    const depositAmt = 1;
    const ttl = 0;
    const addrOne = uuid();
    const addrTwo = uuid();
    const addrThree = uuid();

    // Get a new deposit address
    const depositAddr = (await axios.post('/gemix',
      { userAddrs: [addrOne, addrTwo, addrThree], ttl }))
      .data;

    // Make a deposit to the deposit address
    await axios.post('/crowbar/api/transactions', {
      fromAddress: user,
      toAddress: depositAddr,
      amount: depositAmt,
    }, { baseURL: jobcoinApi });

    // Get the balances of the user-provided addresses
    const addrOneBalance = parseInt((await axios.get(
      `/crowbar/api/addresses/${addrOne}`, { baseURL: jobcoinApi },
    ))
      .data.balance, 10);
    const addrTwoBalance = parseInt((await axios.get(
      `/crowbar/api/addresses/${addrTwo}`, { baseURL: jobcoinApi },
    ))
      .data.balance, 10);
    const addrThreeBalance = parseInt((await axios.get(
      `/crowbar/api/addresses/${addrThree}`, { baseURL: jobcoinApi },
    ))
      .data.balance, 10);

    // Wait for the scan interval * the number of addrs + 1 to elapse
    sleep.sleep(scanInterval * 4);

    // Each user address should have a balance
    expect(addrOneBalance)
      .to.be.above(0); // eslint-disable-line
    expect(addrTwoBalance)
      .to.be.above(0); // eslint-disable-line
    expect(addrThreeBalance)
      .to.be.above(0); // eslint-disable-line

    // The sum of deposits in the user addresses should equal the original
    // deposit amount
    expect(addrOneBalance + addrTwoBalance + addrThreeBalance).to.be.equal(depositAmt);
  });

  it('finishes mixing deposits within the specified TTL', async () => {
    const depositAmt = 1;
    const ttl = 10;
    const addrOne = uuid();
    const addrTwo = uuid();
    const addrThree = uuid();

    // Get a new deposit address
    const depositAddr = (await axios.post('/gemix',
      { userAddrs: [addrOne, addrTwo, addrThree], ttl }))
      .data;

    // Make a deposit to the deposit address
    await axios.post('/crowbar/api/transactions', {
      fromAddress: user,
      toAddress: depositAddr,
      amount: depositAmt,
    }, { baseURL: jobcoinApi });

    // Get the balances of the user-provided addresses
    const addrOneBalance = parseInt((await axios.get(
      `/crowbar/api/addresses/${addrOne}`, { baseURL: jobcoinApi },
    ))
      .data.balance, 10);
    const addrTwoBalance = parseInt((await axios.get(
      `/crowbar/api/addresses/${addrTwo}`, { baseURL: jobcoinApi },
    ))
      .data.balance, 10);
    const addrThreeBalance = parseInt((await axios.get(
      `/crowbar/api/addresses/${addrThree}`, { baseURL: jobcoinApi },
    ))
      .data.balance, 10);

    // Wait for the ttl to elapse
    sleep.sleep(ttl);

    // The sum of deposits in the user addresses should equal the original
    // deposit amount
    expect(addrOneBalance + addrTwoBalance + addrThreeBalance).to.be.equal(depositAmt);
  });
});
