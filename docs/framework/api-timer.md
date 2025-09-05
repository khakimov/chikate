Title: API — Timer

Overview
- Small registry for time-based tasks with easy cleanup.

Module
- Path: `src/time/Timer.js`
- Export: `class TimerRegistry`

Methods
- `after(ms, fn): id` — run once after `ms` milliseconds.
- `every(ms, fn): id` — run repeatedly every `ms` milliseconds.
- `clear(id): void` — cancel a timeout/interval by id.
- `dispose(): void` — cancel all registered timeouts/intervals.

withApp Integration
- `withApp` provides `timers` to your `run` function for convenience.

Example
- In `examples/keyparser_timer_demo.js`, a timer drives a progress bar: `timers.every(200, tick)`.

