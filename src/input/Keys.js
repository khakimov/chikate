// Minimal key mapping utility: map symbolic names to raw key sequences and dispatch handlers.

const MAP = new Map([
  ['Ctrl+C', '\u0003'],
  ['Ctrl+T', '\u0014'],
  ['Ctrl+Y', '\u0019'],
  ['Esc', '\u001b'],
  ['Tab', '\t'],
  ['Shift+Tab', '\u001b[Z'],
  ['Up', '\u001b[A'],
  ['Down', '\u001b[B'],
  ['Left', '\u001b[D'],
  ['Right', '\u001b[C'],
  ['F2', '\u001b[12~'],
  ['F3', '\u001b[13~'],
]);

function resolve(name) {
  if (name.length === 1) return [name];
  const s = MAP.get(name);
  return s ? [s] : [];
}

function map(bindings = {}) {
  // bindings: { 'F2|Ctrl+T': fn, '?': fn }
  const table = new Map();
  for (const spec in bindings) {
    const handler = bindings[spec];
    const alts = spec.split('|').map(s => s.trim()).filter(Boolean);
    for (const alt of alts) {
      for (const seq of resolve(alt)) table.set(seq, handler);
    }
  }
  return function handleKey(key) {
    const h = table.get(key);
    if (h) { h(key); return true; }
    // literal single-char fallthrough (e.g., '?', '/')
    const hc = table.get(String(key));
    if (hc) { hc(key); return true; }
    return false;
  };
}

module.exports = { Keys: { map, resolve } };

