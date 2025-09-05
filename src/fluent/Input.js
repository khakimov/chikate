const { InputField } = require('../widgets/InputField');

function Input(cfg = {}) {
  const input = new InputField(cfg);
  return {
    placeholder(s) { input.cfg.placeholder = s; return this; },
    multiline(on = true) { input.cfg.allowNewlines = !!on; return this; },
    autoHeight(on = true) { input.cfg.autoResize = !!on; return this; },
    minRows(n) { input.cfg.minRows = n; return this; },
    maxRows(n) { input.cfg.maxRows = n; return this; },
    suggestions(provider) { input.cfg.suggestionProvider = provider; return this; },
    onSubmit(fn) { input.cfg.onSubmit = fn; return this; },
    onChange(fn) { input.cfg.onChange = fn; return this; },
    onCancel(fn) { input.cfg.onCancel = fn; return this; },
    useInputWidthForSuggestions(on = true) { input.cfg.suggestionUseInputWidth = !!on; return this; },
    alignSuggestions(a) { input.cfg.suggestionAlign = a; return this; },
    build() { return input; },
    draw(screen, rect) {
      input.cfg.x = rect.x; input.cfg.y = rect.y; input.cfg.width = rect.width; input.cfg.height = input.measureHeightForWidth(rect.width);
      input.paint(screen);
    },
  };
}

module.exports = { Input };

