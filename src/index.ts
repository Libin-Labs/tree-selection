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
export function createTreeSelection(initial: readonly TreeNode[]): TreeSelection {
  let nodes = new Map<string, TreeNode>();
  let leaves = new Map<string, string[]>();
  let checked = new Set<string>();
  function replace(next: readonly TreeNode[]): void {
    if (next.length > 10000) throw new RangeError('Tree exceeds 10000 nodes');
    const map = new Map<string, TreeNode>();
    for (const n of next) {
      if (
        typeof n.id !== 'string' ||
        !n.id ||
        map.has(n.id) ||
        (n.parent !== undefined && typeof n.parent !== 'string') ||
        (n.disabled !== undefined && typeof n.disabled !== 'boolean')
      )
        throw new TypeError('Invalid node ID');
      map.set(n.id, { ...n });
    }
    const parents = new Set<string>();
    for (const n of map.values()) {
      if (n.parent !== undefined) {
        if (!map.has(n.parent)) throw new TypeError('Unknown parent');
        parents.add(n.parent);
      }
      const seen = new Set<string>();
      let current: TreeNode | undefined = n;
      while (current) {
        if (seen.has(current.id)) throw new TypeError('Tree cycle');
        seen.add(current.id);
        if (seen.size > 128) throw new RangeError('Tree depth exceeds 128');
        current = current.parent === undefined ? undefined : map.get(current.parent);
      }
    }
    const index = new Map([...map.keys()].map((id) => [id, [] as string[]]));
    for (const n of map.values()) {
      if (parents.has(n.id)) continue;
      const chain: TreeNode[] = [];
      let current: TreeNode | undefined = n;
      while (current) {
        chain.push(current);
        current = current.parent === undefined ? undefined : map.get(current.parent);
      }
      if (chain.some((node) => node.disabled)) continue;
      for (const node of chain) index.get(node.id)!.push(n.id);
    }
    nodes = map;
    leaves = index;
    checked = new Set([...checked].filter((id) => index.get(id)?.includes(id)));
  }
  function eligible(id: string): string[] {
    if (!nodes.has(id)) throw new TypeError('Unknown node');
    return leaves.get(id)!;
  }
  function state(id: string): CheckState {
    const descendants = eligible(id);
    if (!descendants.length) return 'disabled';
    const count = descendants.filter((leaf) => checked.has(leaf)).length;
    return count === 0 ? 'unchecked' : count === descendants.length ? 'checked' : 'mixed';
  }
  replace(initial);
  return {
    replace,
    state,
    toggle(id, selected) {
      if (selected !== undefined && typeof selected !== 'boolean')
        throw new TypeError('Invalid selected state');
      const descendants = eligible(id);
      const value = selected ?? state(id) !== 'checked';
      for (const leaf of descendants) {
        if (value) checked.add(leaf);
        else checked.delete(leaf);
      }
    },
    selected: () => [...nodes.keys()].filter((id) => checked.has(id)),
  };
}
