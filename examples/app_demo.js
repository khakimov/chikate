#!/usr/bin/env node
const { withApp } = require('../src/facade/withApp');
const { Box } = require('../src/widgets/Box');
const { Text } = require('../src/widgets/Text');
const { HistoryView } = require('../src/widgets/HistoryView');
const { InputField } = require('../src/widgets/InputField');
const { OverlayStack } = require('../src/overlay/OverlayStack');
const { PopupOverlay } = require('../src/widgets/PopupOverlay');
const { ThinkingIndicator } = require('../src/widgets/Thinking');
const { Logo } = require('../src/widgets/Logo');
const { StatusManager } = require('../src/status/StatusManager');
const { getTheme, setTheme } = require('../src/theme/theme');

function main() {
  withApp(({ screen, sched, stdin, keys, timers }) => {
    // Theme
    // Use a color theme so animated status colors are visible
    setTheme('dark');

    // State and systems
    const overlays = new OverlayStack();
    const { FocusManager } = require('../src/input/FocusManager');
    const focus = new FocusManager();
    const statuses = new StatusManager();

    // Layout model
    const { layoutColumn } = require('../src/layout/Column');
    const margin = 2;
    let outer = { x: 0, y: 0, width: 0, height: 0 };
    let histBox = { x: 0, y: 0, width: 0, height: 0 };
    let inputBox = { x: 0, y: 0, width: 0, height: 0 };
    let thinkY = 0;

    // History + logo
    const history = [];
    const historyView = new HistoryView({ items: history, showTimestamps: false, title: '', timestampMode: 'time', border: 'none', anchorBottom: true, itemGap: 1 });
    let firstMessageSent = false;
    const logo = new Logo({ text: 'CHIKATE' });

    // Status indicators
    const t = getTheme();
    const thinking = new ThinkingIndicator({ text: 'Thinking', animateColors: true });
    statuses.add('thinking', thinking, { label: 'Thinking' });
    // Warm palette for Typing
    const warm = [ { r: 255, g: 200, b: 150 }, { r: 255, g: 170, b: 120 }, { r: 255, g: 140, b: 100 }, { r: 255, g: 180, b: 140 } ];
    const typing = new ThinkingIndicator({ text: 'Typing', animateColors: true, palette: warm });
    statuses.add('typing', typing, { label: 'Typing' });

    // Commands
    const commands = [
      { text: '/help', desc: 'Open help popup' },
      { text: '/think', desc: 'Toggle thinking' },
      { text: '/typing', desc: 'Toggle typing' },
      { text: '/demo', desc: 'Run interactive demo' },
      { text: '/clear', desc: 'Clear history' },
    ];

    // Exit confirmation (double Ctrl+C)
    const baseHint = 'F2/Ctrl+T toggle thinking • /help for help';
    let exitConfirm = false;
    let exitConfirmTimer = null;

    // Input widget
    const input = new InputField({
      x: outer.x, y: outer.y, width: outer.width, height: 3, title: 'Message',
      placeholder: 'Type a message. Use / for commands. Enter to submit. Esc clears.',
      hint: baseHint,
      borderStyle: 'rounded',
      readOnly: false,
      allowNewlines: true,
      autoResize: true,
      minRows: 3,
      maxRows: 6,
      suggestionProvider: (token) => {
        const q = token.toLowerCase();
        return commands
          .filter(c => c.text.toLowerCase().startsWith(q))
          .map(c => ({ text: c.text, label: `${c.text} — ${c.desc}` }));
      },
      onSubmit: (val) => {
        const trimmed = String(val || '').trim();
        if (!trimmed) return;
        if (trimmed === '/help') { openHelp(); input.setValue(''); sched.requestFrame(); return; }
        if (trimmed === '/clear') { history.length = 0; input.setValue(''); sched.requestFrame(); return; }
        if (trimmed === '/demo') { runDemo(); input.setValue(''); sched.requestFrame(); return; }
        if (trimmed.startsWith('/think')) { toggleThinking(); input.setValue(''); sched.requestFrame(); return; }
        if (trimmed.startsWith('/typing')) { toggleTyping(); input.setValue(''); sched.requestFrame(); return; }

        // User message
        history.push({ who: 'you', text: trimmed, ts: Date.now() });
        input.setValue('');

        if (!firstMessageSent) { logo.setVisible(false); firstMessageSent = true; }

        // Simulated assistant
        if (!statuses.isOpen('thinking')) { thinking.start(); thinking.setOpen(true); statuses.open('thinking'); ensureAnimTicker(); }
        timers.after(400, () => { if (!statuses.isOpen('typing')) { typing.start(); typing.setOpen(true); statuses.open('typing'); ensureAnimTicker(); } sched.requestFrame(); });
        timers.after(1000, () => { thinking.stop(); thinking.setOpen(false); statuses.close('thinking'); sched.requestFrame(); });
        timers.after(1600, () => { typing.stop(); typing.setOpen(false); statuses.close('typing'); history.push({ who: 'assistant', text: 'Got it! (simulated response)', ts: Date.now() }); sched.requestFrame(); });

        sched.requestFrame();
      },
      onCancel: () => { input.setValue(''); sched.requestFrame(); }
    });

    // Focus: default to input so typing works immediately
    const inputNode = focus.add({ id: 'input', handleKey: (k) => input.handleKey(k), onFocus: () => {}, onBlur: () => {}, isEnabled: () => !overlays.isOpen() });
    const historyNode = focus.add({ id: 'history', handleKey: (k) => historyView.handleKey(k), isEnabled: () => !overlays.isOpen() });
    focus.setFocus(inputNode);

    // Status toggles
    function toggleThinking() {
      if (statuses.isOpen('thinking')) { thinking.stop(); thinking.setOpen(false); statuses.close('thinking'); }
      else { thinking.start(); thinking.setOpen(true); statuses.open('thinking'); ensureAnimTicker(); }
    }
    function toggleTyping() {
      if (statuses.isOpen('typing')) { typing.stop(); typing.setOpen(false); statuses.close('typing'); }
      else { typing.start(); typing.setOpen(true); statuses.open('typing'); ensureAnimTicker(); }
    }

    // Help
    let popupBorder = 'box';
    function openHelp() {
      const body = `Demo App\n\n` +
        `- Startup logo hides on first message.\n` +
        `- Thinking and Typing show above input; they can overlap and stack.\n` +
        `- /help, /think, /typing, /clear commands.\n` +
        `- F2 or Ctrl+T toggle thinking; F3 or Ctrl+Y toggle typing.\n\n` + Array.from({ length: 40 }, (_, i) => `Tip ${i + 1}`).join('\n');
      const popup = new PopupOverlay({ title: 'Help', body, width: 60, height: 14, border: popupBorder });
      popup.onRequestClose(() => { overlays.pop(); sched.requestFrame(); });
      overlays.push(popup);
      sched.requestFrame();
    }

    // Paint
    sched.on('paint', () => {
      screen.beginFrame();
      const { width: W, height: H } = screen.size();
      outer = { x: margin, y: margin, width: W - margin * 2, height: H - margin * 2 };
      const inputHeight = input.measureHeightForWidth(outer.width);
      const [histRect, inputRect] = layoutColumn({ x: outer.x, y: outer.y, width: outer.width, height: outer.height, gap: 1, children: [
        { flex: 1, minHeight: 8 },
        { minHeight: inputHeight }
      ]});
      histBox = histRect; inputBox = inputRect; thinkY = inputBox.y - 1;
      input.cfg.x = inputBox.x; input.cfg.y = inputBox.y; input.cfg.width = inputBox.width; input.cfg.height = inputHeight;
      historyView.setItems(history);
      historyView.paint(screen, histBox);
      // Status entries above input
      const active = statuses.getActive();
      let sy = thinkY;
      for (let i = 0; i < active.length; i++) {
        const e = active[i];
        const widget = e.widget;
        if (widget && typeof widget.paint === 'function') widget.paint(screen, { x: inputBox.x + 2, y: sy, width: inputBox.width - 4 });
        sy -= 1; if (sy < 0) break;
      }
      input.paint(screen);
      // Draw colored Ctrl+C confirmation hint centered below input
      if (exitConfirm) {
        const hintY = (inputBox.y + inputHeight) < H ? (inputBox.y + inputHeight) : (H - 1);
        const full = 'Ctrl+C again to exit';
        const startX = Math.max(0, inputBox.x + Math.floor((inputBox.width - full.length) / 2));
        const tcolors = getTheme();
        // Key segment: Ctrl+C
        Text(screen, { x: startX, y: hintY, text: 'Ctrl+C', style: { fg: tcolors.title, attrs: tcolors.titleAttrs || 0 } });
        // Rest:  again to exit
        Text(screen, { x: startX + 'Ctrl+C'.length, y: hintY, text: ' again to exit', style: { fg: tcolors.hint } });
      }
      if (!firstMessageSent) {
        const logoY = histBox.y + Math.floor(histBox.height / 2);
        logo.paint(screen, { x: histBox.x + 2, y: logoY, width: histBox.width - 4 });
      }
      overlays.paint(screen);
    });
    sched.on('render', () => {
      const cursor = overlays.isOpen() ? null : input.getCursorScreenPos();
      screen.endFrame({ cursor: cursor || { x: 0, y: 0 }, showCursor: !!cursor });
    });

    function requestExit() {
      if (exitConfirm) { process.exit(0); return; }
      exitConfirm = true;
      // Hide built-in hint while showing colored Ctrl+C message
      input.cfg.hint = '';
      if (exitConfirmTimer) { timers.clear(exitConfirmTimer); exitConfirmTimer = null; }
      exitConfirmTimer = timers.after(1000, () => {
        exitConfirm = false; input.cfg.hint = baseHint; sched.requestFrame();
      });
      sched.requestFrame();
    }

    // Key bindings (normalized)
    keys.on('key', (evt) => {
      if (overlays.isOpen()) return;
      if (evt.name === 'Ctrl+T' || evt.name === 'F2') { toggleThinking(); sched.requestFrame(); return; }
      if (evt.name === 'Ctrl+Y' || evt.name === 'F3') { toggleTyping(); sched.requestFrame(); return; }
      if (evt.name === 'T') { require('../src/theme/theme').cycleTheme(); sched.requestFrame(); return; }
      if (evt.name === 'B') { popupBorder = (popupBorder === 'box') ? 'none' : 'box'; openHelp(); return; }
      if (evt.name === 'D') { runDemo(); return; }
      if (evt.name === 'Ctrl+C') { requestExit(); }
    });
    // Raw input for editing
    stdin.on('data', (key) => {
      // Allow Ctrl+C to trigger exit confirmation even when an overlay is open
      if (overlays.isOpen() && key === '\u0003') { requestExit(); return; }
      if (overlays.isOpen()) {
        const used = overlays.handleKey(key);
        // Repaint to reflect scroll or content changes while popup remains open
        sched.requestFrame();
        return;
      }
      let consumed = focus.handleKey(key);
      if (!consumed) {
        const cur = focus.current();
        if (cur && cur.id === 'history') consumed = historyView.handleKey(key);
      }
      if (consumed) sched.requestFrame();
    });

    // Animation ticker only when needed
    let animTicker = null;
    function ensureAnimTicker() {
      if (animTicker) return;
      animTicker = timers.every(80, () => {
        if (statuses.getActive().length > 0) sched.requestFrame();
        else { timers.clear(animTicker); animTicker = null; }
      });
    }

    // Guided demo: narrates features and shows them.
    let demoRunning = false;
    function runDemo() {
      if (demoRunning) return; demoRunning = true;
      const pushA = (text) => { history.push({ who: 'assistant', text, ts: Date.now() }); sched.requestFrame(); };
      const pushU = (text) => { history.push({ who: 'you', text, ts: Date.now() }); sched.requestFrame(); };
      const addA = (delay, text) => timers.after(delay, () => pushA(text));
      const addU = (delay, text) => timers.after(delay, () => pushU(text));
      const readMs = (text) => {
        const words = Math.max(1, String(text).trim().split(/\s+/).length);
        const est = (words / 220) * 60000; // 220 wpm baseline
        return Math.max(1000, Math.min(6000, Math.round(est)));
      };
      let t0 = 0;
      const say = (text) => { addA(t0, text); t0 += readMs(text) + 350; };
      const act = (fn, dwell = 0, lead = 250) => { timers.after(t0 + lead, () => { try { fn(); } catch {} sched.requestFrame(); }); t0 += lead + dwell; };

      // Intro
      say('Welcome! This is a short tour of the TUI. I will show popups, statuses, suggestions, themes, and how to scroll history.');
      say('You can interrupt the tour any time and type normally.');

      // Help popup
      say('First: Help popup. It is modal, blocks input, and supports scrolling. Close with Esc or q.');
      act(() => openHelp(), /*dwell*/ 2600);
      act(() => overlays.pop());

      // Countdown popup (3 seconds)
      say('Next: a small popup that updates live (3‑second countdown).');
      act(() => {
        const pop = new PopupOverlay({ title: 'Countdown', width: 30, height: 6, border: 'box' });
        let n = 3;
        pop._rawBody = `Closing in ${n}…`; pop._wrapBody(); overlays.push(pop);
        const id = timers.every(1000, () => {
          n -= 1; pop._rawBody = n > 0 ? `Closing in ${n}…` : 'Done!'; pop._wrapBody(); sched.requestFrame();
          if (n <= 0) { timers.clear(id); overlays.pop(); sched.requestFrame(); }
        });
      }, /*dwell*/ 3400);
      say('Popups block input while open. Use Up/Down or PgUp/PgDn to scroll long content.');

      // Thinking/Typing statuses
      say('Now: transient status banners (Thinking, then Typing). They stack above the input and stop automatically.');
      act(() => { if (!statuses.isOpen('thinking')) { thinking.start(); thinking.setOpen(true); statuses.open('thinking'); ensureAnimTicker(); } }, /*dwell*/ 1200);
      act(() => { if (!statuses.isOpen('typing')) { typing.start(); typing.setOpen(true); statuses.open('typing'); ensureAnimTicker(); } }, /*dwell*/ 1600);
      act(() => { thinking.stop(); statuses.close('thinking'); });
      act(() => { typing.stop(); statuses.close('typing'); });

      // Suggestions
      say('Type "/" to open suggestions. Navigate with Up/Down (or j/k). Enter/Tab accepts. Esc closes.');
      act(() => { input.setValue('/'); }, /*dwell*/ 2000);
      act(() => { input.setValue(''); });

      // Themes
      say('Themes: legacy (attribute‑first), dark, and light. Cycling through them now…');
      act(() => { require('../src/theme/theme').cycleTheme(); }, /*dwell*/ 700);
      act(() => { require('../src/theme/theme').cycleTheme(); }, /*dwell*/ 800);
      act(() => { require('../src/theme/theme').cycleTheme(); }, /*dwell*/ 800);
      say('Tip: press Shift+T anytime to change themes.');

      // History hint
      say('History view: scroll with Up/Down or PgUp/PgDn. Try it now; timestamps are on.');

      // Wrap up
      timers.after(t0, () => pushU('Thanks! Type /help to explore.'));
      timers.after(t0 + 500, () => { demoRunning = false; });
    }

    // Hint in history
    history.push({ who: 'assistant', text: 'Tip: Press Shift+D or type /demo to run a quick tour.', ts: Date.now() });

    return () => { try { timers.dispose(); } catch {} };
  }, { loop: false });
}

main();
