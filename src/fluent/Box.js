const { Box: BoxDraw } = require('../widgets/Box');

function Box() {
  let title = undefined;
  const style = { };
  return {
    titled(t) { title = t; return this; },
    rounded() { style.style = 'rounded'; return this; },
    heavy() { style.style = 'heavy'; return this; },
    double() { style.style = 'double'; return this; },
    borderless() { style.style = 'none'; return this; },
    titleAlign(a) { style.titleAlign = a; return this; },
    style(s) { Object.assign(style, s || {}); return this; },
    draw(screen, rect) {
      const { x, y, width, height } = rect;
      BoxDraw(screen, { x, y, width, height, title, style });
    },
  };
}

module.exports = { Box };

