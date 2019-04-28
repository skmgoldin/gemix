/* eslint-disable no-unused-expressions */
/* eslint-disable no-param-reassign */
/* global describe it */

const { expect } = require('chai');
const LinkedList = require('../LinkedList.js');

describe('LinkedList', () => {
  describe('forEach', () => {
    it('should not crash if the list head is null', () => {
      const ll = new LinkedList();

      ll.forEach(node => console.log(node));
    });

    it('should mutate all list elements when provided a mutator function',
      () => {
        const ll = new LinkedList();

        ll.append({ id: 'a' });
        ll.append({ id: 'b' });
        ll.append({ id: 'c' });

        ll.forEach((node) => {
          node.test = 'x';
        });

        const ids = [];

        // Check if all nodes were mutated, while recording each visited node
        ll.forEach((node) => {
          ids.push(node.id);
          expect(node.test).to.be.equal('x');
        });

        // Check if all nodes were visited
        expect(ids.includes('a')).to.be.true;
        expect(ids.includes('b')).to.be.true;
        expect(ids.includes('c')).to.be.true;
      });
  });

  describe('append', () => {
    it('should append a node to the end of the list', () => {
    });
  });
});
