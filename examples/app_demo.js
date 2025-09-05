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
    const historyView = new HistoryView({ items: history, showTimestamps: false, title: '', timestampMode: 'time', border: 'none', anchorBottom: true, itemGap: 1, paddingX: 2, barFor: 'all', selectionEnabled: true });
    let firstMessageSent = false;
    const logo = new Logo({ text: 'CHIKATE' });
    // Fancy ASCII logo (ported from scripts/logo_input_combo.js)
    let asciiLogoOn = false;
    const CHAR_RAMP = ' .:-=+*#%@';
    const NOISE_SCALE = 20;
    const ASPECT = 0.5; // vertical stretch to look round-ish in cells
    function lerp(a,b,t){ return a+(b-a)*t; }
    function clamp01(x){ return x<0?0:(x>1?1:x); }
    function makeSimplex2(seed){
      let s = seed>>>0; function rnd(){ s=(s*1664525+1013904223)>>>0; return s/0xffffffff; }
      const perm = new Uint8Array(512); const p=new Uint8Array(256);
      for(let i=0;i<256;i++) p[i]=i;
      for(let i=255;i>0;i--){ const j=Math.floor(rnd()*(i+1)); const t=p[i]; p[i]=p[j]; p[j]=t; }
      for(let i=0;i<512;i++) perm[i]=p[i&255];
      const F2=0.5*(Math.sqrt(3)-1), G2=(3-Math.sqrt(3))/6;
      function dot(gx,gy,x,y){ return gx*x+gy*y; }
      function grad2(h){ h&=7; const gx=[1,-1,1,-1,1,-1,0,0][h]; const gy=[1,1,-1,-1,0,0,1,-1][h]; return [gx,gy]; }
      return function(xin,yin){ let n0=0,n1=0,n2=0; const s=(xin+yin)*F2; const i=Math.floor(xin+s), j=Math.floor(yin+s);
        const t=(i+j)*G2; const X0=i-t, Y0=j-t; const x0=xin-X0, y0=yin-Y0; let i1,j1; if(x0>y0){i1=1;j1=0;} else {i1=0;j1=1;}
        const x1=x0-i1+G2, y1=y0-j1+G2, x2=x0-1+2*G2, y2=y0-1+2*G2; const ii=i&255, jj=j&255;
        const gi0=perm[ii+perm[jj]], gi1=perm[ii+i1+perm[jj+j1]], gi2=perm[ii+1+perm[jj+1]];
        let t0=0.5-x0*x0-y0*y0; if(t0>=0){ t0*=t0; const [gx,gy]=grad2(gi0); n0=t0*t0*dot(gx,gy,x0,y0); }
        let t1=0.5-x1*x1-y1*y1; if(t1>=0){ t1*=t1; const [gx,gy]=grad2(gi1); n1=t1*t1*dot(gx,gy,x1,y1); }
        let t2=0.5-x2*x2-y2*y2; if(t2>=0){ t2*=t2; const [gx,gy]=grad2(gi2); n2=t2*t2*dot(gx,gy,x2,y2); }
        return 70*(n0+n1+n2);
      };
    }
    const noise2 = makeSimplex2(Date.now()>>>0);
    function palette(c){ // gpt5-like palette
      const stops = [[0,153,255],[255,140,0],[255,0,136],[55,0,42]];
      const B = clamp01(c); const D=stops.length-1; const G=B*D; const X=Math.min(Math.floor(G), D-1); const Y=G-X;
      const K=stops[X], Z=stops[X+1];
      return [0,1,2].map(i=>Math.round(lerp(K[i], Z[i], Y)));
    }
    function drawAsciiLogo(screen, { x, y, width, height, tSec }){
      const D = Math.max(8, width);
      const G = Math.max(6, height);
      const Xc = D/2, Yc = G/2;
      const K = Math.max(1, D/2 - 1);
      const Z = Math.max(1, G/(2*ASPECT) - 1);
      const q = Math.min(K, Z);
      for (let U=0; U<G; U++){
        for (let E=0; E<D; E++){
          const w0 = E - Xc;
          const I = (U - Yc)/ASPECT;
          const V = Math.sqrt(w0*w0 + I*I)/q;
          if (V >= 1) { screen.setCell(x+E, y+U, ' '); continue; }
          const L = 1 - V*V;
          const n = noise2(E/NOISE_SCALE, U/NOISE_SCALE + tSec);
          const C = ((n+1)*0.5) * L;
          const idx = Math.max(0, Math.min(CHAR_RAMP.length-1, Math.floor(C*CHAR_RAMP.length)));
          const ch = CHAR_RAMP[idx] || ' ';
          const [r,g,b] = palette(C);
          screen.setCell(x+E, y+U, ch, { r, g, b }, null, 0);
        }
      }
    }

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
      { text: '/selection on', desc: 'Enable zoned mouse selection (UI zones)' },
      { text: '/selection off', desc: 'Disable zoned selection (native selection)' },
      { text: '/logo', desc: 'Toggle logo visibility' },
      { text: '/status <label>', desc: 'Show a status banner with label' },
      { text: '/status off', desc: 'Close dynamic statuses' },
      { text: '/scene <name>', desc: 'Set current scene' },
      { text: '/think', desc: 'Toggle thinking' },
      { text: '/typing', desc: 'Toggle typing' },
      { text: '/demo', desc: 'Run interactive demo' },
      { text: '/clear', desc: 'Clear history' },
    ];

    // Exit confirmation (double Ctrl+C)
    const baseHint = 'F1 help • /help command • T theme';
    let exitConfirm = false;
    let exitConfirmTimer = null;

    // Input widget
    const input = new InputField({
      x: outer.x, y: outer.y, width: outer.width, height: 3, title: 'Message',
      placeholder: 'Type your message...',
      hint: baseHint,
      borderStyle: 'rounded',
      borderFooter: 'Enter to send',
      readOnly: false,
      allowNewlines: true,
      suggestionSubmitOnPick: true,
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
        if (trimmed.startsWith('/status ')) {
          const arg = trimmed.slice('/status '.length).trim();
          if (!arg || arg.toLowerCase() === 'off') {
            const active = statuses.getActive();
            for (const e of active) { if (e.key.startsWith('dyn:')) statuses.close(e.key); }
          } else {
            const key = `dyn:${arg.toLowerCase()}`;
            if (!statuses.isOpen(key)) {
              const ind = new ThinkingIndicator({ text: arg, animateColors: true });
              statuses.add(key, ind, { label: arg }); ind.start(); ind.setOpen(true); statuses.open(key); ensureAnimTicker();
            } else { statuses.close(key); }
          }
          input.setValue(''); sched.requestFrame(); return; }
        if (trimmed.startsWith('/scene ')) { const name = trimmed.slice('/scene '.length).trim(); if (name) history.push({ who: 'status', text: `Scene: ${name}`, ts: Date.now() }); input.setValue(''); sched.requestFrame(); return; }
        if (trimmed === '/selection' || trimmed.startsWith('/selection ')) {
          const arg = trimmed.slice('/selection'.length).trim().toLowerCase();
          let next;
          if (arg === 'on') next = true; else if (arg === 'off') next = false; else next = !zonedSelect;
          zonedSelect = next;
          try { keys.setMouseEnabled(zonedSelect); } catch {}
          input.setValue(''); sched.requestFrame(); return;
        }
        if (trimmed === '/clear') { history.length = 0; input.setValue(''); sched.requestFrame(); return; }
        if (trimmed === '/demo') { runDemo(); input.setValue(''); sched.requestFrame(); return; }
        if (trimmed.startsWith('/think')) { toggleThinking(); input.setValue(''); sched.requestFrame(); return; }
        if (trimmed === '/logo') { asciiLogoOn = !asciiLogoOn; logo.setVisible(!asciiLogoOn); ensureAnimTicker(); input.setValue(''); sched.requestFrame(); return; }
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
        `- Commands: /help, /selection on|off, /logo, /think, /typing, /clear.\n` +
        `- Keys: F1 help, F2 or Ctrl+T toggle thinking; F3 or Ctrl+Y toggle typing.\n` +
        `- Selection: /selection on zones selection to history/input; /selection off restores native selection.\n\n` +
        Array.from({ length: 40 }, (_, i) => `Tip ${i + 1}`).join('\n');
      const popup = new PopupOverlay({ title: 'Help', body, width: 60, height: 14, border: popupBorder, style: { style: 'rounded', borderFooter: 'F1 Help', borderFooterAlign: 'right', borderFooterPosition: 'top' } });
      popup.onRequestClose(() => { overlays.pop(); sched.requestFrame(); });
      overlays.push(popup);
      sched.requestFrame();
    }
    function openAscii(filePath = null) {
      const fs = require('fs'); const path = require('path');
      let body = '';
      try {
        const p = filePath ? path.resolve(process.cwd(), filePath) : path.join(__dirname, '..', 'docs', 'ascii.md');
        body = fs.readFileSync(p, 'utf8');
      } catch (e) {
        body = `Failed to read file.\n\n${e?.message || e}`;
      }
      const { width: W, height: H } = screen.size();
      // Downscale the ASCII to a smaller representation that fits nicely
      function scaleAscii(text, targetW, targetH) {
        const lines = String(text || '').replace(/\r/g, '').split('\n');
        const srcH = lines.length;
        const srcW = lines.reduce((m, l) => Math.max(m, l.length), 0);
        if (srcW === 0 || srcH === 0) return text;
        const sx = Math.max(1, Math.ceil(srcW / targetW));
        const sy = Math.max(1, Math.ceil(srcH / targetH));
        const ramp = [' ', '░', '▒', '▓', '█'];
        const weight = (ch) => {
          if (ch === '█') return 1.0; if (ch === '▓') return 0.8; if (ch === '▒') return 0.55; if (ch === '░') return 0.35;
          if (ch === ' ' || ch === '\\t') return 0.0; return 0.6;
        };
        const padded = lines.map(l => l.padEnd(srcW, ' '));
        const out = [];
        for (let y = 0; y < srcH; y += sy) {
          let row = '';
          for (let x = 0; x < srcW; x += sx) {
            let acc = 0, cnt = 0;
            for (let yy = 0; yy < sy; yy++) {
              const ly = y + yy; if (ly >= srcH) break;
              const line = padded[ly];
              for (let xx = 0; xx < sx; xx++) {
                const lx = x + xx; if (lx >= srcW) break;
                acc += weight(line[lx]); cnt++;
              }
            }
            const avg = cnt ? acc / cnt : 0;
            const idx = Math.max(0, Math.min(ramp.length - 1, Math.round(avg * (ramp.length - 1))));
            row += ramp[idx];
          }
          out.push(row.replace(/\s+$/,''));
          if (out.length >= targetH) break;
        }
        return out.join('\n');
      }
      // Aim for ~60% of the current window size for a nicer "poster" instead of full-screen
      const innerW = Math.max(20, Math.floor((W - 6) * 0.6));
      const innerH = Math.max(10, Math.floor((H - 6) * 0.6));
      const scaled = scaleAscii(body, innerW, innerH);
      // Build a centered, borderless popup sized around the scaled content
      const boxW = Math.min(W - 2, scaled.split('\n').reduce((m,l)=>Math.max(m,l.length),0) + 4);
      const boxH = Math.min(H - 2, scaled.split('\n').length + 4);
      const popup = new PopupOverlay({ title: '', body: scaled, width: boxW, height: boxH, border: 'none', backdrop: true, wrap: false, center: true, style: { fg: getTheme().fg } });
      popup.onRequestClose(() => { overlays.pop(); sched.requestFrame(); });
      overlays.push(popup);
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
      // Draw startup logo/ASCII before input so suggestions overlay it
      if (!firstMessageSent) {
        if (asciiLogoOn) {
          const tSec = (Date.now()>>>0) / 1000;
          const pad = 2;
          const ax = histBox.x + pad;
          const ay = histBox.y + pad;
          const aw = Math.max(10, histBox.width - pad*2);
          const ah = Math.max(6, histBox.height - pad*2 - 2);
          drawAsciiLogo(screen, { x: ax, y: ay, width: aw, height: ah, tSec });
        } else {
          const logoY = histBox.y + Math.floor(histBox.height / 2);
          logo.paint(screen, { x: histBox.x + 2, y: logoY, width: histBox.width - 4 });
        }
      }
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
      // Mouse wheel: scroll overlay or history
      if (evt.name === 'WheelUp' || evt.name === 'WheelDown') {
        if (overlays.isOpen()) {
          overlays.handleKey(evt.name === 'WheelUp' ? '\u001b[A' : '\u001b[B');
          sched.requestFrame();
          return;
        }
        const sc = historyView.handleKey(evt.name === 'WheelUp' ? '\u001b[A' : '\u001b[B');
        if (sc) { sched.requestFrame(); return; }
      }
      if (overlays.isOpen()) return;
      if (evt.name === 'F1') { openHelp(); return; }
      if (evt.name === 'F4') { focus.setFocus(historyNode); historyView.handleKey('v'); sched.requestFrame(); return; }
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
      // Prefer history scrolling for PgUp/PgDn regardless of focus
      if (key === '\u001b[5~' || key === '\u001b[6~') {
        const sc = historyView.handleKey(key);
        if (sc) { sched.requestFrame(); return; }
      }
      let consumed = focus.handleKey(key);
      if (!consumed) {
        const cur = focus.current();
        if (cur && cur.id === 'history') consumed = historyView.handleKey(key);
      }
      if (consumed) sched.requestFrame();
    });

    // Zoned selection: default to native selection; enable app-driven selection via /selection on
    let zonedSelect = false;
    try { keys.setMouseEnabled(false); } catch {}
    keys.on('key', (evt) => {
      if (!zonedSelect) return;
      if (evt.name === 'MouseDown' || evt.name === 'MouseUp') {
        if (overlays.isOpen()) return;
        const within = (rect) => evt.x >= rect.x && evt.x < rect.x + rect.width && evt.y >= rect.y && evt.y < rect.y + rect.height;
        if (within(histBox)) { if (historyView.handleMouse(evt)) sched.requestFrame(); return; }
        if (within(inputBox)) { if (input.handleMouse(evt)) sched.requestFrame(); return; }
      }
    });

    // Animation ticker only when needed
    let animTicker = null;
    function ensureAnimTicker() {
      if (animTicker) return;
      animTicker = timers.every(100, () => {
        const anyStatus = statuses.getActive().length > 0;
        const showLogo = !firstMessageSent && logo.visible;
        const showAscii = !firstMessageSent && asciiLogoOn;
        if (anyStatus || showLogo || showAscii) sched.requestFrame();
        else { timers.clear(animTicker); animTicker = null; }
      });
    }
    // Start animation so logo shows animated at startup
    ensureAnimTicker();

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
      say('First: Help popup. It is modal, blocks input, and supports scrolling. Close with Esc.');
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
      say('History view: scroll with Up/Down or PgUp/PgDn.');

      // Wrap up
      timers.after(t0, () => pushU('Thanks! Type /help to explore.'));
      timers.after(t0 + 500, () => { demoRunning = false; });
    }

    // Hint in history
    history.push({ who: 'assistant', text: 'Tip: Press Shift+D or type /demo to run a quick tour.', ts: Date.now() });

    return () => { try { timers.dispose(); } catch {} };

  }, { loop: false, enableMouse: true });
}

main();
