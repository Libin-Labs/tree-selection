import test from 'node:test';
import assert from 'node:assert/strict';
import { createTreeSelection } from '../dist/esm/index.js';

const nodes = [
  { id: 'root' },
  { id: 'branch', parent: 'root' },
  { id: 'a', parent: 'branch' },
  { id: 'b', parent: 'branch' },
  { id: 'c', parent: 'root' },
];
test('hierarchical leaves derive exact tri-state', () => {
  const s = createTreeSelection(nodes);
  assert.equal(s.state('root'), 'unchecked');
  s.toggle('a');
  assert.equal(s.state('branch'), 'mixed');
  assert.equal(s.state('root'), 'mixed');
  s.toggle('b');
  assert.equal(s.state('branch'), 'checked');
  assert.equal(s.state('root'), 'mixed');
  s.toggle('c');
  assert.equal(s.state('root'), 'checked');
  assert.deepEqual(s.selected(), ['a', 'b', 'c']);
});
test('branch toggle fills mixed subtree then clears checked descendants', () => {
  const s = createTreeSelection(nodes);
  s.toggle('a');
  s.toggle('branch');
  assert.deepEqual(s.selected(), ['a', 'b']);
  s.toggle('branch');
  assert.deepEqual(s.selected(), []);
  s.toggle('root', true);
  s.toggle('a', false);
  assert.equal(s.state('branch'), 'mixed');
});
test('disabled ancestor excludes entire subtree from aggregate and toggle', () => {
  const s = createTreeSelection(
    nodes.map((n) => (n.id === 'branch' ? { ...n, disabled: true } : n)),
  );
  assert.equal(s.state('a'), 'disabled');
  assert.equal(s.state('branch'), 'disabled');
  s.toggle('root');
  assert.deepEqual(s.selected(), ['c']);
  assert.equal(s.state('root'), 'checked');
  s.toggle('a', true);
  assert.deepEqual(s.selected(), ['c']);
});
test('dynamic nodes preserve surviving leaf IDs but new leaves start unchecked', () => {
  const s = createTreeSelection(nodes);
  s.toggle('root');
  s.replace([...nodes.filter((n) => n.id !== 'b'), { id: 'd', parent: 'branch' }]);
  assert.deepEqual(s.selected(), ['a', 'c']);
  assert.equal(s.state('branch'), 'mixed');
  s.replace([{ id: 'a' }, { id: 'child', parent: 'a' }]);
  assert.deepEqual(s.selected(), []);
  assert.equal(s.state('a'), 'unchecked');
});
test('disabled replacement clears stored state and reenable starts unchecked', () => {
  const s = createTreeSelection([{ id: 'a' }]);
  s.toggle('a');
  s.replace([{ id: 'a', disabled: true }]);
  assert.deepEqual(s.selected(), []);
  s.replace([{ id: 'a' }]);
  assert.equal(s.state('a'), 'unchecked');
});
test('copies inputs and selected results', () => {
  const source = [{ id: 'a' }];
  const s = createTreeSelection(source);
  source[0].disabled = true;
  s.toggle('a');
  s.selected().push('bad');
  assert.deepEqual(s.selected(), ['a']);
});
test('rejects duplicate IDs, missing parents, cycles, unknowns and oversized depth atomically', () => {
  const s = createTreeSelection(nodes);
  for (const invalid of [
    [{ id: 'a' }, { id: 'a' }],
    [{ id: 'a', parent: 'missing' }],
    [
      { id: 'a', parent: 'b' },
      { id: 'b', parent: 'a' },
    ],
  ]) {
    assert.throws(() => s.replace(invalid), TypeError);
  }
  assert.equal(s.state('root'), 'unchecked');
  assert.throws(() => s.toggle('missing'), TypeError);
  assert.throws(() => s.state('missing'), TypeError);
  const deep = Array.from({ length: 129 }, (_, i) =>
    i ? { id: String(i), parent: String(i - 1) } : { id: '0' },
  );
  assert.throws(() => createTreeSelection(deep), RangeError);
});
