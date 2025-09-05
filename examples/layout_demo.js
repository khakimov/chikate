#!/usr/bin/env node
const { Screen } = require('../src/screen/Screen');
const { Box } = require('../src/widgets/Box');
const { Text } = require('../src/widgets/Text');
const { layoutColumn } = require('../src/layout/Column');
const { layoutRow } = require('../src/layout/Row');
const { layoutStack } = require('../src/layout/Stack');

function main() {
  const screen = new Screen();
  const { width: W, height: H } = screen.size();
  screen.beginFrame();

  const margin = 2;
  const outer = { x: margin, y: margin, width: W - margin * 2, height: H - margin * 2 };
  Box(screen, { x: outer.x, y: outer.y, width: outer.width, height: outer.height, title: 'Layout Demo', style: { borderFg: { r: 180, g: 180, b: 180 } } });

  // Column with header (fixed), content (flex), footer (fixed)
  const colRects = layoutColumn({ x: outer.x + 1, y: outer.y + 1, width: outer.width - 2, height: outer.height - 2, gap: 1, children: [
    { minHeight: 3 },
    { flex: 1, minHeight: 5 },
    { minHeight: 3 }
  ]});

  Box(screen, { x: colRects[0].x, y: colRects[0].y, width: colRects[0].width, height: colRects[0].height, title: 'Header' });
  Box(screen, { x: colRects[1].x, y: colRects[1].y, width: colRects[1].width, height: colRects[1].height, title: 'Content' });
  Box(screen, { x: colRects[2].x, y: colRects[2].y, width: colRects[2].width, height: colRects[2].height, title: 'Footer' });

  // Row inside content: sidebar fixed, main flex
  const rowRects = layoutRow({ x: colRects[1].x + 1, y: colRects[1].y + 1, width: colRects[1].width - 2, height: colRects[1].height - 2, gap: 1, children: [
    { minWidth: 16 },
    { flex: 1, minWidth: 10 }
  ]});
  Box(screen, { x: rowRects[0].x, y: rowRects[0].y, width: rowRects[0].width, height: rowRects[0].height, title: 'Sidebar' });
  Box(screen, { x: rowRects[1].x, y: rowRects[1].y, width: rowRects[1].width, height: rowRects[1].height, title: 'Main' });

  // Stack in footer: centered label
  const stackRects = layoutStack({ x: colRects[2].x, y: colRects[2].y, width: colRects[2].width, height: colRects[2].height, children: [
    { align: 'center', width: 20, height: 1 }
  ]});
  Text(screen, { x: stackRects[0].x, y: stackRects[0].y + 1, text: 'Press any key to exit', style: { fg: { r: 160, g: 160, b: 160 } } });

  screen.endFrame();

  // alt screen and exit
  process.stdout.write('\u001b[?1049h');
  process.stdout.write('\u001b[2J');
  process.stdout.write('\u001b[H');
  const stdin = process.stdin;
  stdin.setRawMode && stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding('utf8');
  stdin.on('data', () => { cleanup(); process.exit(0); });
  process.on('SIGINT', () => { cleanup(); process.exit(0); });
  process.on('exit', cleanup);
}

let cleaned = false;
function cleanup() {
  if (cleaned) return;
  cleaned = true;
  try { process.stdin.setRawMode && process.stdin.setRawMode(false); } catch {}
  process.stdout.write('\u001b[0m');
  process.stdout.write('\u001b[?25h');
  process.stdout.write('\u001b[?1049l');
}

main();

