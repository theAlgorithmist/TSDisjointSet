/** 
 * Copyright 2018 Jim Armstrong (www.algorithmist.net)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Typescript Math Toolkit: Disjoint Set data structure.  A reverse tree structure is used for each set in the forest;
 * the representative node is at the head of a circularly-linked list that allows each individual set to be easily
 * traversed.  The representative node of a set may be queried from any member or a reference to a specific node may
 * be queried by {key}.  This operation is O(n) (where n is the total number of nodes in the forest) in the worst case,
 * but is is O(1) in the best case for multiple fetches of the same node.
 *
 * This class implements both path compression and union by rank.
 *
 * NOTE: The {key} property of every node in every set MUST be globally unique.
 *
 * @author Jim Armstrong (www.algorithmist.net)
 *
 * @version 1.0
 */

import { TSMT$DSNode } from './DSNodeImpl';

export class TSMT$DisjointSet
{
  protected _sets: Array<TSMT$DSNode>;                  // collection of disjoint sets

  protected _searchById: Record<string, TSMT$DSNode>;   // cached searches for representative node by key or id

 /**
  * Construct a new TSMT$DisjointSet
  *
  * @returns {nothing}
  */
  constructor()
  {
    this.clear();
  }

 /**
  * Access the size or number of individual disjoint sets in the forest
  *
  * @returns {number}
  */
  public get size(): number
  {
    return this._sets !== undefined && this._sets != null ? this._sets.length : 0;
  }

  /**
   * Clear the current collection of disjoint sets
   *
   * @returns {nothing}
   */
  public clear(): void
  {
    this._sets       = this._sets || new Array<TSMT$DSNode>();
    this._searchById = this._searchById || {};

    this._sets.forEach( (node: TSMT$DSNode): void => {node.parent = node.next = null} );
    this._sets.length = 0;

    Object.keys(this._searchById).forEach( (key: string): void => {(<TSMT$DSNode> this._searchById[key]) = null} );
    this._searchById = {};
  }

  /**
   * Make a single set from the input node
   *
   * @param {TSMT$DSNode} node Node which may or may not already have established linkages
   *
   * @param {boolean} singleton True if the node is a singleton; otherwise, the node should have {parent} and {next}
   * pointers properly set.  Failure to do so will result in unpredictable behavior
   *
   * @returns {nothing}
   */
  public makeSet(node: TSMT$DSNode, singleton: boolean = false): void
  {
    if (singleton)
    {
      // new set is build from a single node
      node.parent = node;
      node.next   = node;
      node.rank   = 0;
    }

    // accept a new set (singleton or fully populated) into the forest
    this._sets.push(node);
  }

  /**
   * Find the representative node of the set in which the input node resides
   *
   * @param {TSMT$DSNode} node input node
   *
   * @returns {TSMT$DSNode | null} Representative node of the set or {null} for bad inputs.
   */
  public find(node: TSMT$DSNode): TSMT$DSNode | null
  {
    if (node === undefined || node == null) {
      return null;
    }

    const n: TSMT$DSNode = this.__find(node);

    // path compression may reduce the rank of the representative node by 1
    if (n.rank > 1) {
      n.rank = n.rank-1;
    }

    return n;
  }

  /**
   * Recursively find the representative node based on the supplied input node
   *
   * @param {TSMT$DSNode} node Input node in a set
   *
   * @returns {TSMT$DSNode | null} Representative node of the set
   * @private
   */
  protected __find(node: TSMT$DSNode): TSMT$DSNode | null
  {
    if (!node.parent.isEqual(node)) {
      node.parent = this.__find( <TSMT$DSNode> node.parent );
    }

    return <TSMT$DSNode> node.parent;
  }

  /**
   * Return the specific reference to a node in a set based on its {key}
   *
   * @param {string} key Key or id of the desired node
   *
   * @returns {TSMT$DSNode | null} A clone of the node with the specified {key} or null if no such node can be found.
   * Caching is employed to improve performance in cases where the same node is fetched often by its {key}
   */
  public findByID(key: string): TSMT$DSNode | null
  {
    // check the cache
    let node: TSMT$DSNode = this._searchById[key];
    if (node !== undefined) {
      return node;
    }

    const n: number = this._sets.length;
    let i: number;

    for (i = 0; i < n; ++i)
    {
      node = this._sets[i];

      // did we get lucky and the search was for a representative node?
      if (node.key === key)
      {
        this._searchById[key] = node;

        return node;
      }
      else
      {
        // traverse the remainder of the tree and manually check
        let n: TSMT$DSNode = <TSMT$DSNode> node.next;
        while (n && !n.isEqual(node))
        {
          if (n.key === key)
          {
            let result: TSMT$DSNode = n.clone();
            this._searchById[key]   = result;

            return result;
          }

          n = <TSMT$DSNode> n.next;
        }
      }
    }

    return null;
  }

  /**
   * Join or form the union of two disjoint sets in the collection and create a single, individual set from that union
   *
   * @param {TSMT$DSNode} x Reference to first node (need not be representative)
   *
   * @param {TSMT$DSNode} y Reference to second node (need not be representative)
   *
   * @returns {nothing} Finds the representative of each node and then executes a union by rank.
   */
  public union(x: TSMT$DSNode, y: TSMT$DSNode): void
  {
    const rootX: TSMT$DSNode = this.find(x);
    const rootY: TSMT$DSNode = this.find(y);

    if (rootX == null || rootY == null) {
      return;
    }

    if (!rootX.isEqual(rootY)) {
      this.__join(rootX, rootY)
    }
  }

  /**
   * Fill the search-by-id cache
   *
   * @param {Record<string, TSMT$DSNode>} cache {Record} of {TSMT$DSNode} references by {key}
   *
   * @returns {nothing} This is used in cloning and may be used for rare cases in which a pre-populated cache is
   * available
   *
   * @internal
   */
  public fillCache(cache: Record<string, TSMT$DSNode>): void
  {
    Object.keys(cache).forEach( (key: string): void => {(<TSMT$DSNode> this._searchById[key]) = cache[key].clone()} );
  }

  /**
   * Return a copy of the entire disjoint set associated with the input node
   *
   * @param {TSMT$DSNode} node A node in the desired set
   *
   * @returns {Array<TSMT$DSNode>} Collection of all members of the set; the 'traversal' of the set is in an arbitrary
   * order that depends on the number of union operations used to create the set.
   */
  public copySet(node: TSMT$DSNode): Array<TSMT$DSNode>
  {
    const result: Array<TSMT$DSNode> = new Array<TSMT$DSNode>();

    if (node !== undefined && node != null)
    {
      // find representative
      let root: TSMT$DSNode = this.find(node);

      // traverse until at end of circular linkage
      if (root != null)
      {
        result.push(root.clone());

        let n: TSMT$DSNode = <TSMT$DSNode> root.next;
        while (n && !root.isEqual(n))
        {
          result.push(n.clone());
          n = <TSMT$DSNode> n.next;
        }
      }
    }

    return result;
  }

  /**
   * Extract the {key} properties of a collection of nodes and return them in a separate collection
   *
   * @param {Array<TSMT$DSNode>} nodes Node collection (typically a complete disjoint set in a forest)
   *
   * @returns {Array<string>} Array of {key} properties associated with each node
   */
  public byId(nodes: Array<TSMT$DSNode>): Array<string>
  {
    const result: Array<string> = new Array<string>();

    if (nodes && nodes.length > 0)
    {
      const n: number = nodes.length;
      let i: number;
      for (i = 0; i < n; ++i) {
        result.push(nodes[i].key);
      }
    }

    return result;
  }

  /**
   * Return a copy of the current {TSMT$DisjointSet}
   *
   * @returns {TSMT$DisjointSet}
   */
  public clone(): TSMT$DisjointSet
  {
    const set: TSMT$DisjointSet = new TSMT$DisjointSet();

    const n: number = this._sets.length;
    let i: number;
    let root: TSMT$DSNode;
    let rootClone: TSMT$DSNode;
    let node: TSMT$DSNode;
    let prev: TSMT$DSNode;

    for (i = 0; i < n; ++i)
    {
      node        = this._sets[i];
      root        = this.find(node).clone();
      root.parent = root;
      rootClone   = root;

      prev = node;
      node = <TSMT$DSNode> node.next;

      // traverse this particular set
      while (node && !node.isEqual(root))
      {
        prev.next = node.clone();
        prev      = node;
        node      = <TSMT$DSNode> node.next;
      }

      // add the entire set
      set.makeSet(rootClone, false);
    }

    // fill any prior cached searches with references to cloned nodes
    set.fillCache(this._searchById);

    return set;
  }

  /**
   * Create a linkage between the two sets as part of a union operation
   *
   * @param {TSMT$DSNode} x Representative node of the first set
   *
   * @param {TSMT$DSNode} y Representative node of the second set
   * @private
   */
  protected __join(x: TSMT$DSNode, y: TSMT$DSNode): void
  {
    let index: number;
    let temp: TSMT$DSNode = <TSMT$DSNode> y.next;
    y.next                = x.next;
    x.next                = temp;

    // note that x and y are expected to be representative nodes and thus roots of a tree
    if (x.rank >= y.rank)
    {
      // y is rooted to x
      y.parent = x;

      index = this.__indexOf(y);
      if (index != -1) {
        this._sets.splice(index,1);
      }

      x.rank = x.rank == 0 ? 1 : x.rank;
    }
    else
    {
      // x is rooted to y
      x.parent = y;

      index = this.__indexOf(x);
      if (index != -1) {
        this._sets.splice(index,1);
      }

      y.rank = y.rank == 0 ? 1 : y.rank;
    }
  }

  /**
   * Find the index of the supplied representative node in the forest
   *
   * @param {TSMT$DSNode} node A representative node
   *
   * @returns {number} Index of the node in the collection
   * @private
   */
  protected __indexOf(node: TSMT$DSNode): number
  {
    const n: number   = this._sets.length;
    let index: number = -1;
    let i: number;
    let nd: TSMT$DSNode;

    for (i = 0; i < n; ++i)
    {
      nd = this._sets[i]; // representative node for a set

      if (node.isEqual(nd))
      {
        index = i;
        break;
      }
    }

    return index;
  }

}