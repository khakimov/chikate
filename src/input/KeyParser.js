// KeyParser: normalize stdin key sequences to friendly events and support bracketed paste.
// Emits events via on('key', cb) and on('paste', cb). cb receives objects:
//  - key: { type:'key', name:string, seq:string }
//  - paste: { type:'paste', data:string }

class KeyParser {
  constructor({ stdout = process.stdout, enableBracketedPaste = true, enableMouse = true } = {}) {
    this.stdout = stdout;
    this.enableBP = enableBracketedPaste;
    this.enableMouse = enableMouse;
    this._handlers = { key: new Set(), paste: new Set() };
    this._onData = this._onData.bind(this);
    this._attached = null;
    this._pasteBuf = '';
    this._pasting = false;
    this._mouseOn = !!enableMouse;
  }

  attach(stdin) {
    if (this._attached) this.detach();
    this._attached = stdin;
    stdin.on('data', this._onData);
    if (this.enableBP) this._enableBracketedPaste();
    if (this.enableMouse) { this._enableMouse(); this._mouseOn = true; }
    return () => this.detach();
  }

  detach() {
    if (!this._attached) return;
    try { this._attached.off('data', this._onData); } catch {}
    this._attached = null;
    if (this.enableBP) this._disableBracketedPaste();
    if (this.enableMouse) { this._disableMouse(); this._mouseOn = false; }
  }

  setMouseEnabled(on) {
    if (!this.enableMouse) return;
    if (on && !this._mouseOn) { this._enableMouse(); this._mouseOn = true; }
    if (!on && this._mouseOn) { this._disableMouse(); this._mouseOn = false; }
  }

  on(type, cb) { if (this._handlers[type]) this._handlers[type].add(cb); return () => this.off(type, cb); }
  off(type, cb) { if (this._handlers[type]) this._handlers[type].delete(cb); }

  _emit(type, payload) { for (const cb of this._handlers[type] || []) { try { cb(payload); } catch {} } }

  _onData(chunk) {
    // chunk is a string in 'utf8'
    let s = String(chunk);
    // Handle bracketed paste markers if present within chunk; can contain both start and end
    // Start: ESC [ 200 ~, End: ESC [ 201 ~
    while (s.length) {
      if (this._pasting) {
        const endIdx = s.indexOf('\u001b[201~');
        if (endIdx >= 0) {
          this._pasteBuf += s.slice(0, endIdx);
          this._emit('paste', { type: 'paste', data: this._pasteBuf });
          this._pasteBuf = '';
          this._pasting = false;
          s = s.slice(endIdx + 7); // length of ESC[201~ is 7 bytes
          continue;
        } else {
          this._pasteBuf += s;
          return;
        }
      }
      const startIdx = s.indexOf('\u001b[200~');
      if (startIdx >= 0) {
        // Emit keys before paste start
        const pre = s.slice(0, startIdx);
        this._emitKeysFrom(pre);
        s = s.slice(startIdx + 7); // skip marker (7 bytes)
        this._pasting = true;
        this._pasteBuf = '';
        continue;
      }
      // No paste markers: emit keys for remainder
      this._emitKeysFrom(s);
      break;
    }
  }

  _emitKeysFrom(s) {
    for (const evt of this._parseKeys(s)) this._emit('key', evt);
  }

  _parseKeys(s) {
    const events = [];
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      const code = s.charCodeAt(i);
      // ESC sequences (CSI etc.)
      if (ch === '\u001b') {
        // Try known CSI sequences
        const rest = s.slice(i);
        // Mouse (SGR) \x1b[<btn;x;y(M|m)
        const mm = rest.match(/^\u001b\x5b<(\d+);(\d+);(\d+)([Mm])/);
        if (mm) {
          const btn = parseInt(mm[1], 10);
          const x = parseInt(mm[2], 10) - 1;
          const y = parseInt(mm[3], 10) - 1;
          if (btn === 64) events.push({ type: 'key', name: 'WheelUp', seq: mm[0], x, y });
          else if (btn === 65) events.push({ type: 'key', name: 'WheelDown', seq: mm[0], x, y });
          else {
            const kind = mm[4] === 'M' ? 'MouseDown' : 'MouseUp';
            events.push({ type: 'mouse', name: kind, x, y, button: btn });
          }
          // Advance past the full mouse sequence
          i += mm[0].length - 1;
          continue;
        }
        // Mouse (X10) \x1b[M btn+32, x+32, y+32
        if (rest.startsWith('\u001b[M') && rest.length >= 6) {
          const b = rest.charCodeAt(3) - 32;
          if (b === 64) events.push({ type: 'key', name: 'WheelUp', seq: rest.slice(0, 6) });
          else if (b === 65) events.push({ type: 'key', name: 'WheelDown', seq: rest.slice(0, 6) });
          i += 5;
          continue;
        }
        const known = [
          ['\u001bOP', 'F1'], ['\u001b[11~', 'F1'],
          ['\u001b[A', 'Up'], ['\u001b[B', 'Down'], ['\u001b[C', 'Right'], ['\u001b[D', 'Left'],
          ['\u001b[H', 'Home'], ['\u001b[F', 'End'], ['\u001b[3~', 'Delete'],
          ['\u001b[5~', 'PageUp'], ['\u001b[6~', 'PageDown'],
          ['\u001b[12~', 'F2'], ['\u001b[13~', 'F3'],
          ['\u001b[Z', 'Shift+Tab'],
        ];
        let matched = false;
        for (const [seq, name] of known) {
          if (rest.startsWith(seq)) {
            events.push({ type: 'key', name, seq });
            i += seq.length - 1;
            matched = true;
            break;
          }
        }
        if (!matched) {
          // Bare ESC falls back to Esc
          events.push({ type: 'key', name: 'Esc', seq: '\u001b' });
        }
        continue;
      }
      // Control keys Ctrl+A..Ctrl+Z (1..26)
      if (code >= 1 && code <= 26) {
        const letter = String.fromCharCode(code + 64);
        events.push({ type: 'key', name: `Ctrl+${letter}`, seq: ch });
        continue;
      }
      if (code === 13) { events.push({ type: 'key', name: 'Enter', seq: '\r' }); continue; }
      if (code === 10) { events.push({ type: 'key', name: 'Ctrl+J', seq: '\n' }); continue; }
      if (code === 9) { events.push({ type: 'key', name: 'Tab', seq: '\t' }); continue; }
      if (code === 127) { events.push({ type: 'key', name: 'Backspace', seq: '\x7f' }); continue; }
      // Printable
      events.push({ type: 'key', name: ch, seq: ch });
    }
    return events;
  }

  _enableBracketedPaste() { try { this.stdout.write('\u001b[?2004h'); } catch {} }
  _disableBracketedPaste() { try { this.stdout.write('\u001b[?2004l'); } catch {} }
  _enableMouse() {
    try {
      // Enable basic mouse + SGR extended mode
      this.stdout.write('\u001b[?1000h');
      this.stdout.write('\u001b[?1006h');
    } catch {}
  }
  _disableMouse() {
    try {
      this.stdout.write('\u001b[?1006l');
      this.stdout.write('\u001b[?1000l');
    } catch {}
  }
}

module.exports = { KeyParser };
