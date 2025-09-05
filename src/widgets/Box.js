const { drawBorder } = require('../widgets/border');

function Box(screen, { x, y, width, height, title, style = {} }) {
  drawBorder(screen, x, y, width, height, { title, style });
}

module.exports = { Box };

