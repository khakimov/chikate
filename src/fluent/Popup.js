const { PopupOverlay } = require('../widgets/PopupOverlay');

function Popup(title = 'Popup') {
  const popup = new PopupOverlay({ title });
  return {
    border(name = 'box') { popup.border = name; return this; },
    borderless() { popup.border = 'none'; return this; },
    body(text) { popup._rawBody = String(text || ''); popup._wrapBody(); return this; },
    footer(text) { popup.footer = text; return this; },
    size(w, h) { popup.width = w; popup.height = h; return this; },
    style(s) { Object.assign(popup.style, s || {}); return this; },
    open(overlays) { if (overlays && overlays.push) overlays.push(popup); return popup; },
    onClose(fn) { popup.onRequestClose(fn); return this; },
    draw(screen) { popup.paint(screen); },
    instance() { return popup; },
  };
}

module.exports = { Popup };

