// Id generation for nodes and edges. UUID-backed so pasted/imported docs
// never collide the way Math.random slices eventually would.

export const newId = (prefix: string) =>
  prefix + crypto.randomUUID().slice(0, 8);
