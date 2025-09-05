// chikate public API entry

// Core
const { Screen } = require('./screen/Screen');
const { Scheduler } = require('./scheduler/Scheduler');

// Facades
const { withApp } = require('./facade/withApp');
const { Page } = require('./facade/Page');

// Input
const { FocusManager } = require('./input/FocusManager');
const { KeyParser } = require('./input/KeyParser');
const { Keys } = require('./input/Keys');

// Time
const { TimerRegistry } = require('./time/Timer');

// Theme
const { getTheme, setTheme, cycleTheme, overrideTheme, DARK, LIGHT, LEGACY } = require('./theme/theme');

// Overlay
const { OverlayStack } = require('./overlay/OverlayStack');
const { StatusManager } = require('./status/StatusManager');

// Widgets
const { Box } = require('./widgets/Box');
const { Text } = require('./widgets/Text');
const { InputField } = require('./widgets/InputField');
const { PopupOverlay } = require('./widgets/PopupOverlay');
const { HistoryView } = require('./widgets/HistoryView');
const { ThinkingIndicator } = require('./widgets/Thinking');
const { Logo } = require('./widgets/Logo');
const { ProgressBar } = require('./widgets/ProgressBar');

// Utils
const { wrapToWidth, measureWidth } = require('./util/wrap');
const { times } = require('./util/lang');

// Layout (optional, handy)
const { layoutColumn } = require('./layout/Column');
const { layoutRow } = require('./layout/Row');
const { layoutStack } = require('./layout/Stack');
const { Constraints, Size, Rect } = require('./layout/Constraints');

// Fluent (experimental)
const { Box: FBox } = require('./fluent/Box');
const { Input: FInput } = require('./fluent/Input');
const { Popup: FPopup } = require('./fluent/Popup');
const { Progress: FProgress } = require('./fluent/Progress');

// Grouped namespaces for ergonomics
const theme = { getTheme, setTheme, cycleTheme, overrideTheme, DARK, LIGHT, LEGACY };
const widgets = { Box, Text, InputField, PopupOverlay, HistoryView, ThinkingIndicator, Logo, ProgressBar };
const utils = { wrapToWidth, measureWidth, times };
const layout = { column: layoutColumn, row: layoutRow, stack: layoutStack, Constraints, Size, Rect };
const fluent = { Box: FBox, Input: FInput, Popup: FPopup, Progress: FProgress };

module.exports = {
  // Core
  Screen,
  Scheduler,
  // Facades
  withApp,
  Page,
  // Input
  FocusManager,
  KeyParser,
  Keys,
  // Time
  TimerRegistry,
  // Overlay
  OverlayStack,
  StatusManager,
  // Grouped
  theme,
  widgets,
  utils,
  layout,
  fluent,
};
