// Simple theme system with light/dark palettes and overridable tokens

const DARK = {
  name: 'dark',
  fg: { r: 220, g: 220, b: 220 },
  bg: null,
  border: { r: 160, g: 160, b: 160 },
  title: { r: 235, g: 235, b: 235 },
  titleAttrs: 1,
  hint: { r: 150, g: 150, b: 150 },
  placeholder: { r: 140, g: 140, b: 140 },
  suggest: { r: 200, g: 200, b: 200 },
  suggestSelFg: { r: 30, g: 30, b: 30 },
  suggestSelBg: { r: 180, g: 220, b: 255 },
  statusUseColors: true,
  statusThinking: { r: 160, g: 200, b: 255 },
  statusTyping: { r: 250, g: 220, b: 160 },
  historyUser: { r: 210, g: 210, b: 210 },
  historyAssistant: { r: 180, g: 220, b: 180 },
  historyStatus: { r: 160, g: 200, b: 255 },
};

const LIGHT = {
  name: 'light',
  fg: { r: 30, g: 30, b: 30 },
  bg: null,
  border: { r: 80, g: 80, b: 80 },
  title: { r: 0, g: 0, b: 0 },
  titleAttrs: 1,
  hint: { r: 100, g: 100, b: 100 },
  placeholder: { r: 120, g: 120, b: 120 },
  suggest: { r: 20, g: 20, b: 20 },
  suggestSelFg: { r: 250, g: 250, b: 250 },
  suggestSelBg: { r: 60, g: 120, b: 200 },
  statusUseColors: true,
  statusThinking: { r: 40, g: 90, b: 160 },
  statusTyping: { r: 160, g: 120, b: 40 },
  historyUser: { r: 30, g: 30, b: 30 },
  historyAssistant: { r: 40, g: 120, b: 40 },
  historyStatus: { r: 40, g: 90, b: 160 },
};

const LEGACY = {
  name: 'legacy',
  // Attribute-driven look: dim borders, normal text, bold titles, invert selection
  fg: { r: 220, g: 220, b: 220 },
  bg: null,
  border: { r: 220, g: 220, b: 220 },
  borderAttrs: 2, // dim
  title: { r: 220, g: 220, b: 220 },
  titleAttrs: 1, // bold (popup), can override per widget
  hint: { r: 160, g: 160, b: 160 },
  placeholder: { r: 140, g: 140, b: 140 },
  suggest: { r: 220, g: 220, b: 220 },
  suggestSelFg: { r: 220, g: 220, b: 220 },
  suggestSelBg: null,
  useInvertSelection: true,
  statusUseColors: false,
  statusThinking: null,
  statusTyping:   null,
  historyUser: { r: 210, g: 210, b: 210 },
  historyAssistant: { r: 180, g: 220, b: 180 },
  historyStatus: { r: 160, g: 200, b: 255 },
};

let current = DARK;
const PRESETS = ['legacy', 'dark', 'light'];
let _cycleIndex = 1; // dark

function setTheme(t) {
  if (typeof t === 'string') {
    current = t === 'light' ? LIGHT : t === 'legacy' ? LEGACY : DARK;
    _cycleIndex = PRESETS.indexOf(current.name) >= 0 ? PRESETS.indexOf(current.name) : 1;
    return;
  }
  if (t && typeof t === 'object') {
    current = { ...DARK, ...t };
  }
}

function getTheme() { return current; }
function cycleTheme() {
  _cycleIndex = (_cycleIndex + 1) % PRESETS.length;
  const name = PRESETS[_cycleIndex];
  setTheme(name);
  return current;
}

function overrideTheme(overrides) {
  if (!overrides || typeof overrides !== 'object') return current;
  current = { ...current, ...overrides };
  return current;
}

module.exports = { getTheme, setTheme, cycleTheme, overrideTheme, DARK, LIGHT, LEGACY };
