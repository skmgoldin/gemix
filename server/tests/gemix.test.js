/* global describe before after it */

const { spawn } = require('child_process');
const { expect } = require('chai');
const Axios = require('axios');
const uuid = require('uuid/v4');
const uuidValidate = require('uuid-validate');

describe('ENDPOINT: /gemix', () => {
  const houseAddr = uuid();
  const scanInterval = 1;

  let server;
  const port = Math.floor(Math.random() * (49151 - 1024) + 1024);
  const gemixApi = `http://localhost:${port}`;
  const axios = Axios.create({
    baseURL: gemixApi,
  });

  // Start the gemix server
  before(async () => {
    server = spawn('node', ['index.js', '--port', port, '--scanInterval',
      scanInterval, 'houseAddr', houseAddr], { stdio: ['pipe', 1, 2] });

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
  after(() => {
    server.kill();
  });

  it('rejects empty mix requests', async () => {
    const res = await axios.post('/gemix');

    expect(res.status).to.equal(400); // eslint-disable-line
  });

  it('rejects malformed mix requests', async () => {
    let res = await axios.post('/gemix', { userAddrz: [uuid(), uuid(), uuid()] });

    expect(res.status).to.equal(400); // eslint-disable-line

    res = await axios.post('/gemix', { userAddrs: uuid() });

    expect(res.status).to.equal(400); // eslint-disable-line
  });

  it('rejects mix requests that provide no user addresses', async () => {
    const res = await axios.post('/gemix', { userAddrs: [] });

    expect(res.status).to.equal(400); // eslint-disable-line
  });

  it('rejects mix requests that provide only one user address', async () => {
    const res = await axios.post('/gemix', { userAddrs: [uuid()] });

    expect(res.status).to.equal(400); // eslint-disable-line
  });

  it('returns a deposit addresses when a new mix is requested', async () => {
    const res = await axios.post('/gemix', { userAddrs: [uuid(), uuid(), uuid()] });

    expect(uuidValidate(res.data)).to.be.true; // eslint-disable-line
  });
});
