#!/usr/bin/env node
const { withApp } = require('../src/facade/withApp');
const { Page } = require('../src/facade/Page');
const { Box } = require('../src/fluent/Box');
const { Progress } = require('../src/fluent/Progress');
const { Text } = require('../src/widgets/Text');
const { setTheme } = require('../src/theme/theme');

withApp(({ screen, sched, timers, keys }) => {
  setTheme('legacy');
  const page = Page.full(screen).margin(2);
  let ticks = 0; const total = 20;
  const progress = Progress('Timer').solid().value(0, total);
  const lines = [];

  // Timer: increment every 200ms
  timers.every(200, () => { ticks = Math.min(total, ticks + 1); progress.value(ticks, total); sched.requestFrame(); });

  // Keys: log normalized key names and detect paste
  keys.on('key', (evt) => {
    if (evt.name === 'Ctrl+C' || evt.name === 'q') process.exit(0);
    lines.push(`key: ${evt.name}`);
    if (lines.length > 6) lines.shift();
    sched.requestFrame();
  });
  keys.on('paste', (evt) => {
    lines.push(`paste: ${JSON.stringify(evt.data).slice(0, 40)}…`);
    if (lines.length > 6) lines.shift();
    sched.requestFrame();
  });

  sched.on('paint', () => {
    screen.beginFrame();
    const [top, mid] = page.column(1).add({ minHeight: 5 }, { minHeight: 3 });
    Box().titled('KeyParser + Timer').rounded().draw(screen, top);
    progress.draw(screen, { x: top.x + 2, y: top.y + 2, width: Math.min(40, top.width - 4) });
    for (let i = 0; i < lines.length; i++) {
      Text(screen, { x: top.x + 2, y: top.y + 3 + i, text: lines[i] });
    }
    Text(screen, { x: mid.x, y: mid.y, text: 'Try keys, paste (bracketed), or press q/Ctrl+C to exit.' });
  });
});

