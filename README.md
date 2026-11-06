# @lp-labs/tree-selection

Dynamic hierarchical leaf selection with derived tri-state and disabled-subtree contracts.

Standalone original implementation with zero runtime, peer or sibling dependencies.
Library ID 440. ES2022, strict TypeScript, NodeNext ESM and CommonJS with declarations.

## Install

```bash
npm install @lp-labs/tree-selection
```

CommonJS: `const { createTreeSelection } = require('@lp-labs/tree-selection')`.

## Quickstart

```js
import { createTreeSelection } from '@lp-labs/tree-selection';

const tree = createTreeSelection([
  { id: 'root' },
  { id: 'a', parent: 'root' },
  { id: 'b', parent: 'root' },
]);
tree.toggle('a');
if (tree.state('root') !== 'mixed') throw new Error('Tri-state failed');
tree.toggle('root');
if (tree.selected().join(',') !== 'a,b') throw new Error('Cascade failed');
```

## API, customization and contracts

`createTreeSelection(nodes)` accepts a forest of unique nonempty IDs and optional parent
IDs. Input order is not required to be topological. Missing parents and cycles are rejected.
Limits: 10000 nodes and depth 128 including the root.

Only enabled terminal leaves are stored as checked IDs. A disabled node excludes its entire
subtree, even descendants not explicitly disabled. Aggregation ignores those excluded leaves.
A node with zero eligible leaves has state 'disabled'; otherwise zero selected = 'unchecked',
all selected = 'checked', partial = 'mixed'. A parent containing only disabled children
does not become an independently selectable leaf.
`toggle(id, selected?)` applies to eligible descendant leaves. Omitted selected fills an
unchecked/mixed subtree and clears a checked subtree; explicit true/false sets all leaves.
Toggling a disabled subtree is a no-op. `state(id)` returns the derived state.
`selected()` returns a detached array of checked leaf IDs in node input order, not branch IDs.

`replace(nodes)` validates and builds indexes atomically. Surviving eligible leaf IDs retain
selection; removed, disabled or newly nonterminal IDs lose it. Newly inserted/re-enabled
leaves start unchecked: a previously checked branch does not implicitly select new children.
Inputs and outputs are detached. Unknown IDs, missing parents, cycles and duplicates throw
TypeError; node/depth limits throw RangeError.

Building/replacement O(N * depth), memory O(N * depth) for descendant indexes;
toggle/state O(eligible descendants), selected O(N). The depth cap bounds this explicitly.
This is an original hierarchical model separate from selection-model's flat selection and
range semantics; neither package is imported or used as a renamed implementation.

## Complete public declarations

```ts
export interface TreeNode {
  id: string;
  parent?: string;
  disabled?: boolean;
}
export type CheckState = 'checked' | 'mixed' | 'unchecked' | 'disabled';
export interface TreeSelection {
  toggle(id: string, selected?: boolean): void;
  state(id: string): CheckState;
  selected(): string[];
  replace(nodes: readonly TreeNode[]): void;
}
/** Only enabled terminal leaves are stored; a disabled ancestor excludes its subtree. */
export declare function createTreeSelection(initial: readonly TreeNode[]): TreeSelection;
```

## Scope and performance

Parent-linked forest selection, not flat range selection, a tree renderer, expansion model or DOM accessibility layer.

Complexities and bounds above assume ordinary JavaScript number arithmetic and Map/Set
average constant-time lookup. No runtime or peer dependencies, automatic browser adapters,
global registries or hidden services are included. Importing the module has no browser effects.

## Development

```bash
npm ci --offline --no-audit --no-fund
npm run build
npm run typecheck
npm test
npm run format:check
```

## Support

If this library is useful to you, consider supporting its maintenance with a [donation via PayPal](https://www.paypal.me/LibinPrasanth).

## Author

Created by [Libin Prasanth](https://www.linkedin.com/in/libinprasanth/). Connect on LinkedIn for updates and discussion.
