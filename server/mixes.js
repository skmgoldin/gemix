const uuid = require('uuid/v4');

const newMix = (userAddrs, ttl) => {
  console.log(ttl);
  return uuid();
};

module.exports = { newMix };
