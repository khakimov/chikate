// Unicode-aware wrapping and measuring with a simple wcwidth and grapheme segmentation.

function getSegmenter() {
  try {
    if (typeof Intl !== 'undefined' && Intl.Segmenter) {
      return new Intl.Segmenter(undefined, { granularity: 'grapheme' });
    }
  } catch {}
  return null;
}

const SEG = getSegmenter();

function splitGraphemes(str) {
  const s = String(str || '');
  if (!s) return [];
  if (SEG) {
    return Array.from(SEG.segment(s), seg => seg.segment);
  }
  // Fallback: split by code points (does not fully respect ZWJ sequences)
  return Array.from(s);
}

// Heuristic wcwidth for a grapheme cluster. Not perfect, but good enough
// for most emoji/CJK. Control chars -> 0; wide/emoji -> 2; others -> 1.
function wcwidthGrapheme(gr) {
  if (!gr) return 0;
  const cp = gr.codePointAt(0);
  if (cp == null) return 0;
  // C0/C1 control
  if (cp === 0) return 0;
  if (cp < 32 || (cp >= 0x7f && cp < 0xa0)) return 0;
  // Combining mark as starter (rare)
  if (cp >= 0x0300 && cp <= 0x036F) return 0;
  // Zero-width joiner presence suggests multi-codepoint emoji
  if (gr.indexOf('\u200d') >= 0) return 2;
  // Emoji ranges
  if ((cp >= 0x1F300 && cp <= 0x1FAFF) ||
      (cp >= 0x1F1E6 && cp <= 0x1F1FF) ||
      (cp >= 0x2600 && cp <= 0x26FF)) {
    return 2;
  }
  // East Asian Wide/Fullwidth
  if (cp >= 0x1100 && (
      cp <= 0x115F ||
      cp === 0x2329 || cp === 0x232A ||
      (cp >= 0x2E80 && cp <= 0xA4CF) ||
      (cp >= 0xAC00 && cp <= 0xD7A3) ||
      (cp >= 0xF900 && cp <= 0xFAFF) ||
      (cp >= 0xFE10 && cp <= 0xFE19) ||
      (cp >= 0xFE30 && cp <= 0xFE6F) ||
      (cp >= 0xFF00 && cp <= 0xFF60) ||
      (cp >= 0xFFE0 && cp <= 0xFFE6)
    )) return 2;
  return 1;
}

function measureWidth(text) {
  const gs = splitGraphemes(text);
  let w = 0;
  for (const g of gs) w += wcwidthGrapheme(g);
  return w;
}

function isSpace(gr) {
  return gr === ' ' || gr === '\t' || gr === '\u00A0';
}

function wrapToWidth(text, width) {
  const W = Math.max(1, width | 0);
  const out = [];
  const paras = String(text || '').split('\n');
  for (const para of paras) {
    const gs = splitGraphemes(para);
    if (gs.length === 0) { out.push(''); continue; }
    let line = [];
    let lineW = 0;
    let lastSpaceIdx = -1;
    for (let i = 0; i < gs.length; i++) {
      const g = gs[i];
      const w = wcwidthGrapheme(g);
      const would = lineW + w;
      if (would > W && line.length > 0) {
        if (lastSpaceIdx >= 0) {
          // Break at last space in the current line window
          out.push(line.slice(0, lastSpaceIdx).join(''));
          // Remainder from last space onward becomes start of new line
          const rem = line.slice(lastSpaceIdx); // may include spaces
          line = rem;
          lineW = rem.reduce((s, gg) => s + wcwidthGrapheme(gg), 0);
          lastSpaceIdx = -1;
        } else {
          out.push(line.join(''));
          line = [];
          lineW = 0;
        }
      }
      line.push(g);
      lineW += w;
      if (isSpace(g)) lastSpaceIdx = line.length; // index after the space
    }
    if (line.length) out.push(line.join(''));
  }
  return out;
}

module.exports = { wrapToWidth, measureWidth };
