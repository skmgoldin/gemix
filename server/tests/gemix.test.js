/* global describe before after it */

const { spawn } = require('child_process');
const { expect } = require('chai');
const Axios = require('axios');
const uuid = require('uuid/v4');
const uuidValidate = require('uuid-validate');

describe('gemix server scan loop', () => {
  let server;
  const port = Math.floor(Math.random() * (49151 - 1024) + 1024);
  const api = `http://localhost:${port}`;
  const axios = Axios.create({
    baseURL: api,
  });

  // Start the gemix server
  before(async () => {
    server = spawn('node', ['index.js', '--port', port, '--scanInterval', '1'],
      { stdio: ['pipe', 1, 2] });

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

  it('returns a deposit addresses when a new mix is requested', async () => {
    const res = await axios.post('/gemix', { userAddrs: [uuid(), uuid(), uuid()] });

    expect(uuidValidate(res.data)).to.be.true; // eslint-disable-line
  });
  it('moves deposited tokens to the house address');
  it('uses all user addresses for mixing');
  it('finishes mixing deposits within the specified TTL');
});
