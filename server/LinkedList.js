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
function forEach(f) {
  if (this.head === null) {
    return;
  }

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

function LinkedList() {
  this.head = null;
  this.append = append;
  this.forEach = forEach;
}

module.exports = LinkedList;
