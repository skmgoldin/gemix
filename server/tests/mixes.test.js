/* global describe it */

const { expect } = require('chai');
const uuidValidate = require('uuid-validate');
const Mixes = require('../mixes.js');

describe('mixes', () => {
  describe('forEach', () => {
    it('should not crash if the list head is null', () => {
      const mixes = new Mixes();

      mixes.forEach(node => console.log(node));
    });

    it('should mutate all list elements when provided a mutator function',
      () => {
        const mixes = new Mixes();

        mixes.newMix([], 0);
        mixes.newMix([], 0);
        mixes.newMix([], 0);

        /* eslint-disable no-param-reassign */
        mixes.forEach((node) => {
          node.ttl = 100;
        });

        mixes.forEach((node) => {
          expect(node.ttl).to.be.equal(100);
        });
      });
  });

  describe('newMix', () => {
    it('should return a deposit address when adding a new mix', () => {
      const mixes = new Mixes();

      const res = mixes.newMix([], 0);
      expect(uuidValidate(res)).to.be.true; // eslint-disable-line
    });
  });
});
