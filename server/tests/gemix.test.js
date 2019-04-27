/* global describe before after it */

const { spawn } = require('child_process');
const Axios = require('axios');

describe('gemix server scan loop', () => {
  let server;
  const port = Math.floor(Math.random() * (49151 - 1024) + 1024);
  const api = `http://localhost:${port}`;
  const axios = Axios.create({
    baseURL: api,
  });

  // Start the gemix server
  before(async () => {
    server = spawn('node', ['index.js', '--port', port, '--scanInterval', '1']);

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

  it('');
});
