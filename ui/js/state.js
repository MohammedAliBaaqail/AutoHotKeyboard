/**
 * AutoHotKeyboard - Complete Frontend Multi-Module Engine
 * Modules: Text Expander (Multiline), Key Remapper, Window Manager, App Launcher, Auto Clicker
 */

  'use strict';

  window.addEventListener('error', (e) => {
    console.error('AutoHotKeyboard UI Error:', e.message, e.filename, e.lineno);
  });

  // Global CapsLock modifier state tracking
  let isCapsLockHeld = false;
  window.addEventListener('keydown', (e) => {
    if (e.key === 'CapsLock') isCapsLockHeld = true;
  }, true);
  window.addEventListener('keyup', (e) => {
    if (e.key === 'CapsLock') isCapsLockHeld = false;
  }, true);
  window.addEventListener('blur', () => {
    isCapsLockHeld = false;
  });
  window.isCapsLockHeld = () => isCapsLockHeld;

  // Application State
  const initialTheme = (() => {
    try {
      if (window.__INITIAL_CONFIG__ && window.__INITIAL_CONFIG__.theme) {
        const t = window.__INITIAL_CONFIG__.theme;
        if (t.bgColor && t.accentColor) {
          return {
            bgColor: t.bgColor,
            accentColor: t.accentColor,
            radius: typeof t.radius !== 'undefined' ? parseInt(t.radius, 10) : 5,
            distance: typeof t.distance !== 'undefined' ? parseInt(t.distance, 10) : 3,
            lightIntensity: typeof t.lightIntensity !== 'undefined' ? parseInt(t.lightIntensity, 10) : (typeof t.intensity !== 'undefined' ? parseInt(t.intensity, 10) : 22),
            darkIntensity: typeof t.darkIntensity !== 'undefined' ? parseInt(t.darkIntensity, 10) : (typeof t.intensity !== 'undefined' ? parseInt(t.intensity, 10) : 6),
            intensity: typeof t.intensity !== 'undefined' ? parseInt(t.intensity, 10) : 14,
            blur: typeof t.blur !== 'undefined' ? parseInt(t.blur, 10) : 10,
            customPresets: Array.isArray(t.customPresets) ? t.customPresets : []
          };
        }
      }
      const cached = localStorage.getItem('ahk_theme');
      let cachedCustom = [];
      try {
        const cPresets = localStorage.getItem('ahk_custom_theme_presets');
        if (cPresets) cachedCustom = JSON.parse(cPresets) || [];
      } catch (e) { }

      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && (parsed.bgColor === '#b85d68' || !parsed.bgColor)) {
          parsed.bgColor = '#e8dfd5';
          parsed.accentColor = '#d97706';
          parsed.radius = 5;
          parsed.distance = 4;
          parsed.lightIntensity = 39;
          parsed.darkIntensity = 5;
          parsed.intensity = 22;
          parsed.blur = 9;
          try { localStorage.setItem('ahk_theme', JSON.stringify(parsed)); } catch (e) { }
        }
        if (parsed && parsed.bgColor && parsed.accentColor) {
          return {
            bgColor: parsed.bgColor,
            accentColor: parsed.accentColor,
            radius: typeof parsed.radius !== 'undefined' ? parseInt(parsed.radius, 10) : 5,
            distance: typeof parsed.distance !== 'undefined' ? parseInt(parsed.distance, 10) : 4,
            lightIntensity: typeof parsed.lightIntensity !== 'undefined' ? parseInt(parsed.lightIntensity, 10) : 39,
            darkIntensity: typeof parsed.darkIntensity !== 'undefined' ? parseInt(parsed.darkIntensity, 10) : 5,
            intensity: typeof parsed.intensity !== 'undefined' ? parseInt(parsed.intensity, 10) : 22,
            blur: typeof parsed.blur !== 'undefined' ? parseInt(parsed.blur, 10) : 9,
            customPresets: Array.isArray(parsed.customPresets) ? parsed.customPresets : cachedCustom
          };
        }
      }
    } catch (e) { }
    return { bgColor: '#e8dfd5', accentColor: '#d97706', radius: 5, distance: 4, lightIntensity: 39, darkIntensity: 5, intensity: 22, blur: 9, customPresets: [] };
  })();

  let isInitialized = false;

  let state = {
    enabled: true,
    activeTab: 'textExpander',
    autoClickerRunning: false,
    config: {
      enabled: true,
      activeProfile: 'Default',
      activeTab: 'textExpander',
      profiles: {
        Default: {
          id: 'default',
          name: 'Default',
          icon: 'monitor',
          color: '#d97706',
          enabled: 1
        }
      },
      textExpander: {
        enabled: true,
        items: [
          { id: 'te-1', input: '@@email', output: 'user@example.com', multiline: false, enabled: 1 }
        ]
      },
      keyRemapper: {
        enabled: true,
        items: [
          { id: 'kr-1', source: 'CapsLock', target: 'Control', name: 'CapsLock to Control' }
        ]
      },
      windowManager: {
        enabled: true,
        alwaysOnTopHotkey: '^SPACE',
        centerWindowHotkey: '^!c',
        hideWindowHotkey: '^!h',
        transparencyWheel: true,
        opacity: 215,
        masterAudioMuteEnabled: 1,
        masterAudioMuteHotkey: '^!m',
        textTransformEnabled: 1,
        textTransformUpperHotkey: '^!u',
        textTransformLowerHotkey: '^!l',
        textTransformTitleHotkey: '^!t',
        textTransformCleanEnabled: 1,
        textTransformCleanHotkey: '^!k',
        screenOcrEnabled: 1,
        screenOcrHotkey: '^!o',
        colorPickerEnabled: 1,
        colorPickerHotkey: '^!p',
        virtualDesktopsEnabled: 1,
        taskbarScrollEnabled: 1,
        sleepEnabled: 1,
        sleepHotkey: '#s',
        sleepModeHibernate: 0
      },
      mouseGestures: {
        cornersEnabled: 1,
        dwellDuration: 250,
        cornerTopLeft: 'TaskView',
        cornerTopRight: 'ActionCenter',
        cornerBottomLeft: 'StartMenu',
        cornerBottomRight: 'ShowDesktop',
        gesturesEnabled: 1,
        triggerButton: 'RButton',
        gestureTimeout: 700,
        strokeThreshold: 45,
        actionLeft: 'Back',
        actionRight: 'Forward',
        actionUp: 'MaximizeWindow',
        actionDown: 'MinimizeWindow',
        actionDownRight: 'CloseWindow'
      },
      radialMenu: {
        enabled: 1,
        triggerButton: 'MButton',
        wheelRadius: 190,
        slices: [
          'ScreenOcr',
          'NextDesktop',
          'ColorPicker',
          'AlwaysOnTop',
          'MuteVolume',
          'CleanText',
          'PrevDesktop',
          'TaskView'
        ]
      },
      appLauncher: {
        enabled: true,
        items: [
          { id: 'al-1', trigger: '@calc', triggerType: 'string', target: 'calc.exe', name: 'Calculator' },
          { id: 'al-2', trigger: '@yt', triggerType: 'string', target: 'https://www.youtube.com', name: 'YouTube' },
          { id: 'al-3', trigger: '@gh', triggerType: 'string', target: 'https://github.com', name: 'GitHub' }
        ]
      },
      folderCreator: {
        enabled: true,
        items: [
          {
            id: 'fc-1',
            name: 'Project Scaffolding',
            trigger: '@mkproj',
            triggerType: 'string',
            targetLocation: 'activeExplorer',
            customPath: '',
            folderPaths: '{Name}\n{Name}\\src\n{Name}\\docs\n{Name}\\assets\\images',
            seedFiles: 'README.md, notes.txt',
            autoOpen: 1,
            enabled: 1
          },
          {
            id: 'fc-2',
            name: 'Dated Archive Batch',
            trigger: 'Ctrl+Alt+Shift+F',
            triggerType: 'hotkey',
            targetLocation: 'activeExplorer',
            customPath: '',
            folderPaths: 'Backup-{Date}\nBackup-{Date}\\Part [01-05]',
            seedFiles: 'manifest.txt',
            autoOpen: 1,
            enabled: 1
          }
        ]
      },
      autoClicker: {
        enabled: true,
        hotkey: 'F8',
        button: 'Left',
        clickType: 'Single',
        cps: 20,
        limit: 0
      },
      macroRecorder: {
        enabled: true,
        items: [
          {
            id: 'macro-1',
            name: 'Fast Reload Combo',
            trigger: 'F9',
            playbackMode: 'NoRepeat',
            repeatInterval: 50,
            enabled: 1,
            steps: [
              { action: 'Down', key: 'r', delay: 40 },
              { action: 'Up', key: 'r', delay: 100 },
              { action: 'Down', key: '1', delay: 40 },
              { action: 'Up', key: '1', delay: 50 }
            ]
          }
        ]
      },
      theme: initialTheme
    },
    editingTeId: null,
    isMultiline: false
  };

  if (window.__INITIAL_CONFIG__) {
    state.config = { ...state.config, ...window.__INITIAL_CONFIG__ };
    state.activeTab = 'textExpander';
    if (typeof window.__INITIAL_CONFIG__.enabled === 'boolean') state.enabled = window.__INITIAL_CONFIG__.enabled;
    isInitialized = true;
  }

  // DOM Elements
  const dragHeader = document.getElementById('dragHeader');
  const appCard = document.getElementById('appCard');
  const btnClose = document.getElementById('btnClose');
  const btnMinimize = document.getElementById('btnMinimize');
  const btnMaximize = document.getElementById('btnMaximize');
  const svgMaximizeIcon = document.getElementById('svgMaximizeIcon');
  const btnRefresh = document.getElementById('btnRefresh');
  const btnTheme = document.getElementById('btnTheme');
  const themeModal = document.getElementById('themeModal');
  const btnCloseThemeModal = document.getElementById('btnCloseThemeModal');
  const btnResetTheme = document.getElementById('btnResetTheme');
  const btnSaveTheme = document.getElementById('btnSaveTheme');
  const themeBgColorPicker = document.getElementById('themeBgColorPicker');
  const themeBgHex = document.getElementById('themeBgHex');
  const themeAccentColorPicker = document.getElementById('themeAccentColorPicker');
  const themeAccentHex = document.getElementById('themeAccentHex');
  const bgSwatchesGrid = document.getElementById('bgSwatchesGrid');
  const accentSwatchesGrid = document.getElementById('accentSwatchesGrid');
  const themeSliderRadius = document.getElementById('themeSliderRadius');
  const badgeRadius = document.getElementById('badgeRadius');
  const themeSliderDistance = document.getElementById('themeSliderDistance');
  const badgeDistance = document.getElementById('badgeDistance');
  const themeSliderLightIntensity = document.getElementById('themeSliderLightIntensity');
  const badgeLightIntensity = document.getElementById('badgeLightIntensity');
  const themeSliderDarkIntensity = document.getElementById('themeSliderDarkIntensity');
  const badgeDarkIntensity = document.getElementById('badgeDarkIntensity');
  const themeSliderBlur = document.getElementById('themeSliderBlur');
  const badgeBlur = document.getElementById('badgeBlur');
  const customPresetsGrid = document.getElementById('customPresetsGrid');
  const inputCustomPresetName = document.getElementById('inputCustomPresetName');
  const btnSaveCustomPreset = document.getElementById('btnSaveCustomPreset');
  const segmentedBar = document.getElementById('segmentedBar');
  const mainEngineSwitch = document.getElementById('mainEngineSwitch');
  const switchCaptionText = document.getElementById('switchCaptionText');
  const statusSubtitle = document.getElementById('statusSubtitle');
  const activeCountBadge = document.getElementById('activeCountBadge');
  const profileSelect = document.getElementById('profileSelect');
  const btnAddProfile = document.getElementById('btnAddProfile');
  const btnRenameProfile = document.getElementById('btnRenameProfile');
  const btnDeleteProfile = document.getElementById('btnDeleteProfile');
  const profileModal = document.getElementById('profileModal');
  const profileModalTitle = document.getElementById('profileModalTitle');
  const profileModalDesc = document.getElementById('profileModalDesc');
  const profileNameInput = document.getElementById('profileNameInput');
  const btnConfirmProfileModal = document.getElementById('btnConfirmProfileModal');
  const btnCancelProfileModal = document.getElementById('btnCancelProfileModal');
  const btnCloseProfileModal = document.getElementById('btnCloseProfileModal');
  const gaugeCircle = document.getElementById('gaugeCircle');
  const radialDotsDial = document.getElementById('radialDotsDial');
  const btnExport = document.getElementById('btnExport');
  const btnHelp = document.getElementById('btnHelp');

  // Text Expander Elements
  const teInputTrigger = document.getElementById('teInputTrigger');
  const teInputOutput = document.getElementById('teInputOutput');
  const teTextareaOutput = document.getElementById('teTextareaOutput');
  const teOutputContainer = document.getElementById('teOutputContainer');
  const teToggleMultiline = document.getElementById('teToggleMultiline');
  const teBtnSubmit = document.getElementById('teBtnSubmit');
  const teBtnSubmitText = document.getElementById('teBtnSubmitText');
  const teSearchFilter = document.getElementById('teSearchFilter');
  const teShortcutsContainer = document.getElementById('teShortcutsContainer');

  // Key Remapper Elements (Pure Key Combination Recorders)
  const krInputSource = document.getElementById('krInputSource');
  const krInputTarget = document.getElementById('krInputTarget');
  const krSourceBox = document.getElementById('krSourceBox');
  const krTargetBox = document.getElementById('krTargetBox');
  const krBtnClearSource = document.getElementById('krBtnClearSource');
  const krBtnClearTarget = document.getElementById('krBtnClearTarget');
  const krBtnSubmit = document.getElementById('krBtnSubmit');
  const krRemapsContainer = document.getElementById('krRemapsContainer');

  // Window Manager Elements
  const wmOpacitySlider = document.getElementById('wmOpacitySlider');
  const wmOpacityValue = document.getElementById('wmOpacityValue');
  const wmAppVolumeSlider = document.getElementById('wmAppVolumeSlider');
  const wmAppVolumeValue = document.getElementById('wmAppVolumeValue');
  const wmAppTargetBadge = document.getElementById('wmAppTargetBadge');
  const wmBtnMuteActiveApp = document.getElementById('wmBtnMuteActiveApp');
  const wmBtnMuteActiveAppText = document.getElementById('wmBtnMuteActiveAppText');

  let activeAppState = {
    pid: 0,
    name: '',
    volume: 100,
    muted: false
  };

  // App Launcher Elements
  const alTriggerTypeSelector = document.getElementById('alTriggerTypeSelector');
  const alTypeString = document.getElementById('alTypeString');
  const alTypeHotkey = document.getElementById('alTypeHotkey');
  const alTriggerIcon = document.getElementById('alTriggerIcon');
  const alInputTrigger = document.getElementById('alInputTrigger');
  const alInputTarget = document.getElementById('alInputTarget');
  const alOutputBox = document.getElementById('alOutputBox');
  const alBtnBrowse = document.getElementById('alBtnBrowse');
  const alInputName = document.getElementById('alInputName');
  const alBtnSubmit = document.getElementById('alBtnSubmit');
  const alBtnSubmitText = document.getElementById('alBtnSubmitText');
  const alHintTag = document.getElementById('alHintTag');
  const alLaunchersContainer = document.getElementById('alLaunchersContainer');

  // Folder Creator Elements
  const fcTriggerTypeSelector = document.getElementById('fcTriggerTypeSelector');
  const fcTypeHotkey = document.getElementById('fcTypeHotkey');
  const fcTypeString = document.getElementById('fcTypeString');
  const fcTriggerIcon = document.getElementById('fcTriggerIcon');
  const fcTriggerBox = document.getElementById('fcTriggerBox');
  const fcInputTrigger = document.getElementById('fcInputTrigger');
  const fcBtnClearTrigger = document.getElementById('fcBtnClearTrigger');
  const fcInputName = document.getElementById('fcInputName');
  const fcLocationTypeSelector = document.getElementById('fcLocationTypeSelector');
  const fcLocActive = document.getElementById('fcLocActive');
  const fcLocCustom = document.getElementById('fcLocCustom');
  const fcCustomPathRow = document.getElementById('fcCustomPathRow');
  const fcCustomPathBox = document.getElementById('fcCustomPathBox');
  const fcInputCustomPath = document.getElementById('fcInputCustomPath');
  const fcBtnBrowseTarget = document.getElementById('fcBtnBrowseTarget');
  const fcToggleAutoOpen = document.getElementById('fcToggleAutoOpen');
  const fcTextareaFolders = document.getElementById('fcTextareaFolders');
  const fcInputSeedFiles = document.getElementById('fcInputSeedFiles');
  const fcBtnSubmit = document.getElementById('fcBtnSubmit');
  const fcBtnSubmitText = document.getElementById('fcBtnSubmitText');
  const fcContainer = document.getElementById('fcContainer');

  let currentFcType = 'string';
  let currentFcLocation = 'activeExplorer';
  let fcAutoOpen = true;
  let editingFcId = null;

  // Auto Clicker Elements
  // Auto Clicker & Mouse Recorder Elements
  const acMasterSwitch = document.getElementById('acMasterSwitch');
  const acContainer = document.querySelector('#panel-autoClicker .ac-container');
  const acHotkeyBox = document.getElementById('acHotkeyBox');
  const acHotkeyLabel = document.getElementById('acHotkeyLabel');
  const mrHotkeyBox = document.getElementById('mrHotkeyBox');
  const mrHotkeyLabel = document.getElementById('mrHotkeyLabel');
  const mrRecordCountdownSelector = document.getElementById('mrRecordCountdownSelector');
  const acButtonSelector = document.getElementById('acButtonSelector');
  const acTypeSelector = document.getElementById('acTypeSelector');
  const acCpsSlider = document.getElementById('acCpsSlider');
  const acCpsValue = document.getElementById('acCpsValue');
  const acToggleBtn = document.getElementById('acToggleBtn');
  const acToggleBtnText = document.getElementById('acToggleBtnText');
  const acStatusHint = document.getElementById('acStatusHint');
  const mouseModeSelector = document.getElementById('mouseModeSelector');
  const acClickerSection = document.getElementById('acClickerSection');
  const acRecorderSection = document.getElementById('acRecorderSection');
  const techniquePolling = document.getElementById('techniquePolling');
  const techniqueHook = document.getElementById('techniqueHook');
  const mrActiveTechniqueTag = document.getElementById('mrActiveTechniqueTag');
  const mrPollingRateSelector = document.getElementById('mrPollingRateSelector');
  const mrPlaybackSpeedSelector = document.getElementById('mrPlaybackSpeedSelector');
  const mrOriginSelector = document.getElementById('mrOriginSelector');
  const mrRepeatInfinite = document.getElementById('mrRepeatInfinite');
  const mrRepeatCountInput = document.getElementById('mrRepeatCountInput');
  const mrRepeatBox = document.getElementById('mrRepeatBox');
  const mrLoopSelector = document.getElementById('mrLoopSelector');
  const mrStatPoints = document.getElementById('mrStatPoints');
  const mrStatDuration = document.getElementById('mrStatDuration');
  const mrStatClicks = document.getElementById('mrStatClicks');
  const mrStatKeys = document.getElementById('mrStatKeys');
  const mrOptClicksOnly = document.getElementById('mrOptClicksOnly');
  const mrOptHumanize = document.getElementById('mrOptHumanize');
  const mrOptBezier = document.getElementById('mrOptBezier');
  const mrOptEmergencyStop = document.getElementById('mrOptEmergencyStop');
  const mrOptRecordKeys = document.getElementById('mrOptRecordKeys');
  const mrCountdownSelector = document.getElementById('mrCountdownSelector');
  const mrRecordBtn = document.getElementById('mrRecordBtn');
  const mrRecordBtnText = document.getElementById('mrRecordBtnText');
  const mrPlayBtn = document.getElementById('mrPlayBtn');
  const mrPlayBtnText = document.getElementById('mrPlayBtnText');
  const mrClearBtn = document.getElementById('mrClearBtn');
  const mrStatusHint = document.getElementById('mrStatusHint');
  const mrListSection = document.getElementById('mrListSection');
  const mrCountBadge = document.getElementById('mrCountBadge');
  const mrSearchFilter = document.getElementById('mrSearchFilter');
  const mrListContainer = document.getElementById('mrListContainer');
  let mousePlaybackScriptId = '';
  let activeRunningScreenTriggers = new Map(); // id -> { name, action, mouseScriptId, macroId, startTime, timer }
  let activeScanningScreenTriggers = new Set(); // set of itemIds currently actively scanning
  let screenScannerRunning = false;

  // Helper: Post message to AutoHotkey host with resilient offline queue
  let ahkMsgQueue = [];
