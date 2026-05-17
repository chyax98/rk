export interface AnchorDiff {
  added: string[];
  removed: string[];
  kept: string[];
}

export function diffAnchors(prev: string[], next: string[]): AnchorDiff {
  const prevSet = new Set(prev);
  const nextSet = new Set(next);
  return {
    added: next.filter((a) => !prevSet.has(a)),
    removed: prev.filter((a) => !nextSet.has(a)),
    kept: next.filter((a) => prevSet.has(a)),
  };
}
