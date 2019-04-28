const uuid = require('uuid/v4');

function newMix(userAddrs, ttl) {
  const depositAddr = uuid();

  // Create a new node, representing a mix
  const mix = {
    userAddrs,
    ttl,
    depositAddr,
    creationTime: Date.now(),
  };

  // Insert the new node into the list
  if (this.head === null) {
    mix.next = mix;
    mix.prev = mix;
    this.head = mix;
  } else {
    mix.next = this.head;
    mix.prev = this.head.prev;
    this.head.prev.next = mix;
    this.head.prev = mix;
  }

  return depositAddr;
}

// Provide a function to operate asynchronously on all list elements
function forEach(f) {
  const innerForEach = (node) => {
    if (node === this.head) {
      return;
    }

    f(node);
    innerForEach(node.next);
  };

  f(this.head);
  innerForEach(this.head.next);
}

// Mixes is essentially an interface to a linked list of mix nodes
function Mixes() {
  this.head = null;
  this.newMix = newMix;
  this.forEach = forEach;
}

module.exports = Mixes;
