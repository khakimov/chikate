#!/usr/bin/env node
const { Screen } = require('../src/screen/Screen');
const { Box } = require('../src/widgets/Box');
const { Text } = require('../src/widgets/Text');

function main() {
  const screen = new Screen();
  const { width: W, height: H } = screen.size();

  // Simple scene: centered box with text
  const bw = Math.min(40, Math.max(20, Math.floor(W * 0.6)));
  const bh = 7;
  const bx = Math.floor((W - bw) / 2);
  const by = Math.floor((H - bh) / 2);

  screen.beginFrame();
  const { getTheme } = require('../src/theme/theme');
  const t = getTheme();
  Box(screen, { x: bx, y: by, width: bw, height: bh, title: 'Hello', style: { borderFg: t.border, titleFg: t.title, titleAttrs: t.titleAttrs } });
  const msg = 'Welcome to the minimal TUI framework.\nThis is a static scene.';
  Text(screen, { x: bx + 2, y: by + 2, text: msg, style: { fg: t.fg, maxWidth: bw - 4 } });
  screen.endFrame();
}

// Enable alt screen and clear
process.stdout.write('\u001b[?1049h'); // alt screen
process.stdout.write('\u001b[2J'); // clear
process.stdout.write('\u001b[H'); // home

process.on('SIGINT', cleanup);
process.on('exit', cleanup);

let cleaned = false;
function cleanup() {
  if (cleaned) return;
  cleaned = true;
  process.stdout.write('\u001b[0m'); // reset SGR
  process.stdout.write('\u001b[?25h'); // show cursor
  process.stdout.write('\u001b[?1049l'); // leave alt screen
}

// simple wait for a key to exit
const stdin = process.stdin;
stdin.setRawMode && stdin.setRawMode(true);
stdin.resume();
stdin.setEncoding('utf8');
stdin.on('data', () => { cleanup(); process.exit(0); });

main();
