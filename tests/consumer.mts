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

// @ts-expect-error invalid public API input must be rejected
createTreeSelection([]).toggle('a', 'checked');
