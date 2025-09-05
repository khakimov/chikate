#!/usr/bin/env node
const { Screen } = require('../src/screen/Screen');
const { Scheduler } = require('../src/scheduler/Scheduler');
const { Box } = require('../src/widgets/Box');
const { Text } = require('../src/widgets/Text');
const { InputField } = require('../src/widgets/InputField');
const { OverlayStack } = require('../src/overlay/OverlayStack');
const { PopupOverlay } = require('../src/widgets/PopupOverlay');

function main() {
  const screen = new Screen();
  const sched = new Scheduler({ fps: 30 });
  const overlays = new OverlayStack();
  const { width: W, height: H } = screen.size();

  // History box area
  const hx = 2;
  const hy = 2;
  const hw = Math.max(40, W - 4);
  const hh = Math.max(6, H - 10);

  // Input bottom anchored
  const iw = hw;
  const ih = 3;
  const ix = hx;
  const iy = hy + hh + 1;

  const history = [];

  const commands = [
    { text: '/help', desc: 'Open help popup' },
    { text: '/think', desc: 'Toggle thinking (not implemented here)' },
    { text: '/clear', desc: 'Clear history' },
    { text: '/about', desc: 'About this demo' },
  ];

  const { getTheme } = require('../src/theme/theme');
  const t = getTheme();
  const input = new InputField({
    x: ix, y: iy, width: iw, height: ih, title: 'Message',
    placeholder: 'Type a message, use / for commands. Enter to submit. Esc cancels.',
    hint: 'Type /help for help • q to quit',
    readOnly: false,
    suggestionProvider: (token) => {
      const q = token.toLowerCase();
      return commands.filter(c => c.text.toLowerCase().startsWith(q)).map(c => `${c.text} — ${c.desc}`);
    },
    onSubmit: (val) => {
      const trimmed = String(val || '').trim();
      if (!trimmed) return;
      if (trimmed === '/help') {
        openHelp();
        return;
      }
      if (trimmed === '/clear') {
        history.length = 0;
      } else {
        history.push({ who: 'you', text: trimmed });
      }
      input.setValue('');
      sched.requestFrame();
    },
    onCancel: () => {
      // Clear input on Esc
      input.setValue('');
      sched.requestFrame();
    }
  });

  function openHelp() {
    const body = `Interactive Input Demo\n\n` +
      `- Type text and press Enter to add to history.\n` +
      `- Use / to open command suggestions.\n` +
      `- Commands: /help, /clear, /about.\n` +
      `- Esc clears input.\n` +
      `- Press q to quit.\n\n` +
      Array.from({ length: 40 }, (_, i) => `Line ${i + 1} lorem ipsum`).join('\n');
    const popup = new PopupOverlay({ title: 'Help', body, width: 60, height: 14 });
    popup.onRequestClose(() => { overlays.pop(); sched.requestFrame(); });
    overlays.push(popup);
    sched.requestFrame();
  }

  sched.on('paint', () => {
    screen.beginFrame();
    // History container
    Box(screen, { x: hx, y: hy, width: hw, height: hh, title: 'History', style: { borderFg: t.border, titleFg: t.title, titleAttrs: t.titleAttrs } });
    // Paint last few history lines
    const innerX = hx + 2, innerY = hy + 1, innerW = hw - 4, innerH = hh - 2;
    let row = innerY;
    const start = Math.max(0, history.length - innerH);
    for (let i = start; i < history.length; i++) {
      const msg = history[i];
      const runs = `${msg.who}: ${msg.text}`;
      Text(screen, { x: innerX, y: row++, text: runs, style: { fg: { r: 210, g: 210, b: 210 }, maxWidth: innerW } });
    }
    // Input
    input.paint(screen);
  });

  sched.on('render', () => {
    const { x, y } = input.getCursorScreenPos();
    screen.endFrame({ cursor: { x, y }, showCursor: true });
  });

  const stdin = process.stdin;
  stdin.setRawMode && stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding('utf8');
  stdin.on('data', (key) => {
    if (overlays.isOpen()) {
      overlays.handleKey(key);
      sched.requestFrame();
      return;
    }
    if (key === 'q' || key === '\u0003') { cleanup(); process.exit(0); }
    const consumed = input.handleKey(key);
    if (consumed) sched.requestFrame();
  });

  // Alt screen & clear
  process.stdout.write('\u001b[?1049h');
  process.stdout.write('\u001b[2J');
  process.stdout.write('\u001b[H');

  process.on('SIGINT', () => { cleanup(); process.exit(0); });
  process.on('exit', cleanup);

  function loop() { sched.requestFrame(); setTimeout(loop, 0); }
  loop();
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
