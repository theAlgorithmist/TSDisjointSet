# Typescript Math Toolkit Disjoint Set Data Structure

A Disjoint Set is a data structure that is useful in graph algorithms (minimum spanning tree) and standalone application such as modeling group interactions as in social media.  My reason for including it in the Typescript Math Toolkit is more in line with the former use case, but I see opportunity for the latter.  For this reason, the TSMT implementation of Disjoint Set contains some methods that are useful beyond the applications of graph theory.

This repo contains the beta implementation of a Disjoint Set data structure in the _Typescript Math Toolkit_.  It also marks the beginning of a change in the test philosophy for the TSMT as I am switching to _jest_ as a test runner.  It's much easier to compile and test in a single step and integration of _Istanbul_ is so easy, even a mathematician (like me) can do it :)


Author:  Jim Armstrong - [The Algorithmist]

@algorithmist

theAlgorithmist [at] gmail [dot] com

Typescript: 3.1.2

Jest: 23.6.0

Version: 1.0


## Installation

Installation involves all the usual suspects

  - npm installed globally
  - Clone the repository
  - npm install
  - get coffee (this is the most important step)


### Building and running the tests

1. npm t (it really should not be this easy, but it is)

2. Standalone compilation only (npm build)

Specs (_ds.spec.ts) reside in the ___test___ folder.


### Introduction

The _Typescript Math Toolkit_ Disjoint Set data structure manages a collection (forest) of disjoint (non-intersecting) sets of _nodes_ that implement the _TSMT$IDSNode_ Interface.  A concrete implementation is provided in the library by the _TSMT$DSNode_ class.  A node is uniquely represented by a _string key_ and may have optional _Object_ data.  An optional _value_ property is provided that may be used in lieu of general _Object_ data.  The _value_ may also be used to help resolve equality tests between nodes in the event the _key_ is not unique.  In the latter case, the _TSMT$DSNode_ class must be subclassed and a new implementation of the _isEqual()_ method must be provided.

As with traditional implementations of this data structure, each disjoint set is identified by a representative node, which is the _parent_ of all other nodes in the set.  A _find_ operation on any node returns the representative node for the set and path compression is employed in the current implementation.  A reverse tree structure is used to represent the node hierarchy in a set.

Nodes in a disjoint set inside the _TSMT$DisjointSet_ class are circularly linked.  This allows the structure to be traversed (although not in any manner that bears resemblance to traditional tree traversal).  It is a convenience mechanism to quickly traverse through all nodes in a set, with no meaning applied to the actual order.  This is useful in standalone applications where it is necessary to find a node (actually the representative for the set in which the node is contained) and then quickly obtain references to all nodes in the set.  The _TSMT$DisjointSet_ class exposes a _copySet()_ method in its API that returns a list of clones of all nodes in a set that contain a specified node.  Node immutability is strictly maintained inside _TSMT$DisjointSet_.

A find by id (or _key_) method is provided, but the use cases for such a method are small, so it is currently unoptimized other than a cache for previously found nodes.

Sets may be joined via a _union_ operation and all unions are performed by rank.  It is possible to make a new set from either a singleton node or a node that already has an established hierarchy.  It is the user's responsibility in the latter case to ensure that all _parent_ and _next_ pointers for the set are properly set to avoid unpredictable results in subsequent calls to _TSMT$DisjointSet_ methods.

It is not currently possible to delete a node from a set once it has been added.  This capability may be added provided suitable use cases appear in subsequent development of the _Typescript Math Toolkit_ or in response to user requests.


### Contents

This current _TSMT$DisjointSet_ API is provided below.

The interface for all disjoint set nodes is


```
export interface TSMT$IDSNode
{
  key: string;                           // general key or id for this node
  value?: number | string;               // node value
  rank: number;                          // if this is the representative node in a set, this represents the rank of that set
  data?: Object;                         // some auxiliary data that is store with the node
  parent: TSMT$IDSNode;                  // reference to parent of this node
  next: TSMT$IDSNode;                    // next node in the set (circularly links back to root)

  isEqual(node: TSMT$DSNode): boolean;   // returns true if two nodes are equal
}
```

The provided concrete implementation of this interface is in the _TSMT$DSNode_


The public API of the _TSMT$DisjointSet_ class is

```
get size(): number
clear(): void
makeSet(node: TSMT$DSNode, singleton: boolean = false): void
find(node: TSMT$DSNode): TSMT$DSNode | null
findByID(key: string): TSMT$DSNode | null
union(x: TSMT$DSNode, y: TSMT$DSNode): void
copySet(node: TSMT$DSNode): Array<TSMT$DSNode>
byId(nodes: Array<TSMT$DSNode>): Array<string>
clone(): TSMT$DisjointSet
```

### Usage

A simple application is to build up a collection of singletons and then join (union) sets to group the nodes into non-intersecting sets in a forest.  The following examples are extracted from the specs.

```
const set: TSMT$DisjointSet = new TSMT$DisjointSet();
.
.
.

let n: TSMT$DSNode  = new TSMT$DSNode('1');
let n1: TSMT$DSNode = new TSMT$DSNode('2');
let n2: TSMT$DSNode = new TSMT$DSNode('3');
let n3: TSMT$DSNode = new TSMT$DSNode('4');
let n4: TSMT$DSNode = new TSMT$DSNode('5');
let n5: TSMT$DSNode = new TSMT$DSNode('6');
let n6: TSMT$DSNode = new TSMT$DSNode('7');
let n7: TSMT$DSNode = new TSMT$DSNode('8');
let n8: TSMT$DSNode = new TSMT$DSNode('9');
let n9: TSMT$DSNode = new TSMT$DSNode('10');
let n10: TSMT$DSNode = new TSMT$DSNode('11');

set.makeSet(n, true);
set.makeSet(n1, true);
set.makeSet(n2, true);
set.makeSet(n3, true);
set.makeSet(n4, true);
set.makeSet(n5, true);
set.makeSet(n6, true);
set.makeSet(n7, true);
set.makeSet(n8, true);
set.makeSet(n9, true);
set.makeSet(n10, true);

expect(set.size).toBe(11);

set.union(n, n1);
set.union(n2, n3);
set.union(n4, n5);
set.union(n6, n7);
set.union(n8, n9);
set.union(n8, n10);

expect(set.size).toBe(5);

set.union(n, n2);
set.union(n4, n6);

expect(set.size).toBe(3);

set.union(n4, n8);

expect(set.size).toBe(2);

```

It is also possible to imperatively construct a hierarchy and add that set to the forest


```
const set: TSMT$DisjointSet = new TSMT$DisjointSet();
.
.
.

let n: TSMT$DSNode  = new TSMT$DSNode('1');
let n1: TSMT$DSNode = new TSMT$DSNode('2');
let n2: TSMT$DSNode = new TSMT$DSNode('3');

n.parent  = n;
n1.parent = n;
n2.parent = n;
n.next    = n1;
n1.next   = n2;
n2.next   = n;

expect(set.size).toBe(0);

set.makeSet(n);
expect(set.size).toBe(1);

```

Refer to the remainder of the specs for more usage examples.


License
----

Apache 2.0

**Free Software? Yeah, Homey plays that**

[//]: # (kudos http://stackoverflow.com/questions/4823468/store-comments-in-markdown-syntax)

[The Algorithmist]: <https://www.linkedin.com/in/jimarmstrong>

