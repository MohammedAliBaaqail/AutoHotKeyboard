/**
 * AutoHotKeyboard Frontend - Refactored into Modular Architecture
 * 
 * This monolithic 12.8k-line file has been cleanly modularized into discrete files:
 * 
 * Core Subsystems:
 *  - ui/js/state.js                    : Application state, defaults, and cached DOM element queries
 *  - ui/js/bridge.js                   : IPC communication with AutoHotkey backend, toasts, and status
 *  - ui/js/profiles.js                 : Profile switcher, ribbon, glider, auto-switching, and scanner
 *  - ui/js/theme.js                    : Neumorphic theme engine, presets, and color algorithms
 * 
 * Discrete Automation Feature Modules:
 *  - ui/js/modules/textExpander.js     : Text expander snippets, multiline modal, and tests
 *  - ui/js/modules/keyRemapper.js      : Key rebinding, custom shortcuts, and key recorders
 *  - ui/js/modules/systemTools.js      : Window manager, OCR, color picker, sleep timer, and audio
 *  - ui/js/modules/gesturesAndCorners.js: Hot corners and mouse gesture recognition
 *  - ui/js/modules/radialMenu.js       : Pie wheel command palette and canvas preview
 *  - ui/js/modules/appLauncher.js      : Quick application runner and file picker
 *  - ui/js/modules/folderCreator.js    : Scaffolding tree generator and seed files
 *  - ui/js/modules/mouseStudio.js      : Rapid clicker and precision mouse path recorder
 *  - ui/js/modules/macroRecorder.js    : Hardware-level macro timeline, sequencer, and editor
 *  - ui/js/modules/screenScanner.js    : Visual pattern search, pixel watcher, and area snip
 * 
 * Master Orchestrator:
 *  - ui/js/main.js                     : Tab navigation, window title bar, and application bootstrap
 */