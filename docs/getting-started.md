Getting Started

Goal: get a working UI on screen in minutes and keep your head clear while you add real features.

Prerequisites
- Node.js 18+.
- A modern terminal (iTerm2, Windows Terminal, Alacritty, Kitty, WezTerm, or recent macOS Terminal).

Run the demo
- Clone this repo, then run: `node chikate/examples/app_demo.js`
- Try: typing, arrow keys, PageUp/PageDown, mouse selection in history, Ctrl+C to copy selection, and Ctrl+C again to exit.

Hello, box
```js
const { Screen, widgets: { Box, Text } } = require('chikate');

const screen = new Screen();
const { width: W, height: H } = screen.size();
screen.beginFrame();
Box(screen, { x: 2, y: 2, width: Math.min(40, W-4), height: 7, title: 'Hello' });
Text(screen, { x: 4, y: 4, text: 'Welcome to chikate.' });
screen.endFrame();
```

Ergonomic loop: withApp
- Use `withApp` to set up input, a fast scheduler, timers, and cleanup without boilerplate.
```js
const { withApp } = require('chikate');

withApp(({ screen, sched, keys }) => {
  function paint() {
    const { width: W, height: H } = screen.size();
    screen.beginFrame();
    // draw your scene here
    screen.endFrame();
  }
  keys.on('key', (k) => { if (k.name === 'Ctrl+C') process.exit(0); });
  sched.onFrame(paint);
});
```

Next steps
- Skim Concepts to see how Screen, Scheduler, Layout, Widgets, and Input fit together — see ./concepts.md
- Jump to the recipes you need — selection, copy, input, layout, theming — see ./guides.md
