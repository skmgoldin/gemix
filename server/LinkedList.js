/* eslint-disable no-param-reassign */

// Add a node to the end of the list
function append(node) {
  if (this.head === null) {
    node.next = node;
    node.prev = node;
    this.head = node;
  } else {
    node.next = this.head;
    node.prev = this.head.prev;
    this.head.prev.next = node;
    this.head.prev = node;
  }
}

// Provide a function to be applied over all list elements
async function forEach(f) {
  if (this.head === null) {
    return;
  }

  const promises = [];

  const innerForEach = (node) => {
    if (node === this.head) {
      return;
    }

    promises.push(f(node));
    innerForEach(node.next);
  };

  promises.push(f(this.head));
  innerForEach(this.head.next);
  await Promise.all(promises);
}

function LinkedList() {
  this.head = null;
  this.append = append;
  this.forEach = forEach;
}

module.exports = LinkedList;
