Title: API — Layout

Overview
- Minimal layout helpers for rows, columns, stacks, and constraints.

Modules
- `src/layout/Row.js` — `layoutRow(opts)`
- `src/layout/Column.js` — `layoutColumn(opts)`
- `src/layout/Stack.js` — `layoutStack(opts)`
- `src/layout/Constraints.js` — `{ Constraints, Size, Rect }`

Row
- `layoutRow({ x, y, width, height, gap=0, children=[...] }) => Rect[]`
- Child: `{ minWidth=0, flex=0, marginLeft=0, marginRight=0 }`

Column
- `layoutColumn({ x, y, width, height, gap=0, children=[...] }) => Rect[]`
- Child: `{ minHeight=0, flex=0, marginTop=0, marginBottom=0 }`

Stack
- `layoutStack({ x, y, width, height, children=[...] }) => Rect[]`
- Child: `{ align='top-left'|'center'|'bottom', dx=0, dy=0, width?, height? }`

Constraints
- `new Constraints({ minW=0, maxW=∞, minH=0, maxH=∞ })`
- `constrainW(w)`, `constrainH(h)`, `constrainSize({width,height})`
- Helpers: `Size(width, height)`, `Rect(x, y, width, height)`

