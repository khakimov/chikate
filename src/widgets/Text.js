function Text(screen, { x, y, text, style = {} }) {
  const { fg = null, bg = null, attrs = 0, maxWidth } = style;
  if (text == null) return;
  const lines = String(text).split('\n');
  for (let i = 0; i < lines.length; i++) {
    screen.writeText(x, y + i, lines[i], { fg, bg, attrs, maxWidth });
  }
}

module.exports = { Text };

