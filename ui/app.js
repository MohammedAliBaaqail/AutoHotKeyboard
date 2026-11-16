/**
 * AutoHotKeyboard - Complete Frontend Multi-Module Engine
 * Modules: Text Expander (Multiline), Key Remapper, Window Manager, App Launcher, Auto Clicker
 */

(function () {
  'use strict';

  window.addEventListener('error', (e) => {
    console.error('AutoHotKeyboard UI Error:', e.message, e.filename, e.lineno);
  });

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
      activeTab: 'textExpander',
      textExpander: {
        enabled: true,
        items: [
          { id: 'te-1', input: '@@1', output: 'myemail@gmail.com', multiline: false },
          { id: 'te-2', input: '@@sig', output: "Best regards,\nYour Name\nSenior Engineer", multiline: true }
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
  const acButtonSelector = document.getElementById('acButtonSelector');
  const acTypeSelector = document.getElementById('acTypeSelector');
  const acCpsSlider = document.getElementById('acCpsSlider');
  const acCpsValue = document.getElementById('acCpsValue');
  const acToggleBtn = document.getElementById('acToggleBtn');
  const acToggleBtnText = document.getElementById('acToggleBtnText');
  const acStatusHint = document.getElementById('acStatusHint');

  // Helper: Post message to AutoHotkey host with resilient offline queue
  let ahkMsgQueue = [];
  function sendToAhk(action, data = {}) {
    if (window.chrome && window.chrome.webview) {
      window.chrome.webview.postMessage(JSON.stringify({ action, ...data }));
    } else {
      ahkMsgQueue.push({ action, data });
    }
  }

  function flushAhkQueue() {
    if (window.chrome && window.chrome.webview && ahkMsgQueue.length > 0) {
      const queue = [...ahkMsgQueue];
      ahkMsgQueue = [];
      queue.forEach(item => {
        try {
          window.chrome.webview.postMessage(JSON.stringify({ action: item.action, ...item.data }));
        } catch (e) { }
      });
    }
  }

  function syncConfig() {
    if (!isInitialized) {
      // Never overwrite saved config in AHK before initial state is received!
      return;
    }
    saveCurrentProfileState();
    state.config.enabled = state.enabled;
    state.config.activeTab = state.activeTab;
    const cfgToSend = { ...state.config };
    delete cfgToSend.window;
    sendToAhk('saveState', { config: cfgToSend });
    updateGlobalIndicators();
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Global Toast Notification System
  function showToast(message, type = 'info', duration = 2500) {
    if (!message) return;
    try {
      let container = document.getElementById('toastContainer');
      if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
      }

      const toast = document.createElement('div');
      toast.className = `toast-item toast-${type}`;

      let iconSvg = '';
      const lower = String(message).toLowerCase();
      if (type === 'error' || lower.includes('please') || lower.includes('error')) {
        toast.classList.add('toast-warning');
        iconSvg = `<svg viewBox="0 0 24 24" class="toast-icon-svg" fill="none" stroke="#f59e0b" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
      } else if (lower.includes('created') || lower.includes('updated') || lower.includes('saved')) {
        toast.classList.add('toast-success');
        iconSvg = `<svg viewBox="0 0 24 24" class="toast-icon-svg" fill="none" stroke="var(--accent-primary)" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="9 12 11 14 15 10"></polyline></svg>`;
      } else {
        iconSvg = `<svg viewBox="0 0 24 24" class="toast-icon-svg" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
      }

      toast.innerHTML = `${iconSvg}<span>${escapeHtml(message)}</span>`;
      container.appendChild(toast);

      requestAnimationFrame(() => {
        toast.classList.add('show');
      });

      const removeTimer = setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
          if (toast.parentElement) toast.parentElement.removeChild(toast);
        }, 300);
      }, duration);

      toast.addEventListener('click', () => {
        clearTimeout(removeTimer);
        toast.classList.remove('show');
        setTimeout(() => {
          if (toast.parentElement) toast.parentElement.removeChild(toast);
        }, 200);
      });
    } catch (err) {
      console.warn('Toast display failed:', err);
    }
  }

  // ============================================================================
  // Profile Management System
  // ============================================================================

  function ensureProfilesConfig(cfg) {
    if (!cfg) return;
    if (!cfg.profiles || typeof cfg.profiles !== 'object') {
      cfg.profiles = {};
    }
    // If cfg.profiles is an Array, convert to an object map keyed by profile name
    if (Array.isArray(cfg.profiles)) {
      const converted = {};
      cfg.profiles.forEach(p => {
        if (!p) return;
        const name = p.name || p.id || 'Default';
        converted[name] = p;
      });
      cfg.profiles = converted;
    }
    if (!cfg.activeProfile || typeof cfg.activeProfile !== 'string' || !cfg.profiles[cfg.activeProfile]) {
      const keys = Object.keys(cfg.profiles);
      if (keys.length > 0 && keys.includes('Default')) {
        cfg.activeProfile = 'Default';
      } else if (keys.length > 0) {
        cfg.activeProfile = keys[0];
      } else {
        cfg.activeProfile = 'Default';
      }
    }
    if (!cfg.profiles['Default']) {
      cfg.profiles['Default'] = {
        name: 'Default',
        textExpander: JSON.parse(JSON.stringify(cfg.textExpander || { enabled: 1, items: [] })),
        keyRemapper: JSON.parse(JSON.stringify(cfg.keyRemapper || { enabled: 1, items: [] })),
        appLauncher: JSON.parse(JSON.stringify(cfg.appLauncher || { enabled: 1, items: [] })),
        folderCreator: JSON.parse(JSON.stringify(cfg.folderCreator || { enabled: 1, items: [] })),
        macroRecorder: JSON.parse(JSON.stringify(cfg.macroRecorder || { enabled: 1, items: [] })),
        windowManager: JSON.parse(JSON.stringify(cfg.windowManager || {})),
        mouseGestures: JSON.parse(JSON.stringify(cfg.mouseGestures || {})),
        radialMenu: JSON.parse(JSON.stringify(cfg.radialMenu || {})),
        autoClicker: JSON.parse(JSON.stringify(cfg.autoClicker || {}))
      };
    }

    // Ensure all items across all modules in all profiles have an enabled property
    Object.keys(cfg.profiles).forEach(pName => {
      const p = cfg.profiles[pName];
      ['textExpander', 'keyRemapper', 'appLauncher', 'folderCreator', 'macroRecorder'].forEach(m => {
        if (p[m] && Array.isArray(p[m].items)) {
          p[m].items.forEach(item => {
            if (typeof item.enabled === 'undefined') {
              item.enabled = (pName === 'Default') ? 1 : 0;
            }
          });
        }
      });
    });

    const activeName = cfg.activeProfile;
    if (!cfg.profiles[activeName]) {
      cfg.activeProfile = 'Default';
    }
    const activeProf = cfg.profiles[cfg.activeProfile];
    cfg.textExpander = activeProf.textExpander;
    cfg.keyRemapper = activeProf.keyRemapper;
    cfg.appLauncher = activeProf.appLauncher;
    cfg.folderCreator = activeProf.folderCreator;
    cfg.macroRecorder = activeProf.macroRecorder;
    cfg.windowManager = activeProf.windowManager;
    cfg.mouseGestures = activeProf.mouseGestures;
    cfg.radialMenu = activeProf.radialMenu;
    cfg.autoClicker = activeProf.autoClicker;
  }

  function saveCurrentProfileState() {
    if (!state.config) return;
    const currentProf = state.config.activeProfile || 'Default';
    if (!state.config.profiles || !state.config.profiles[currentProf]) return;
    const existing = state.config.profiles[currentProf];
    state.config.profiles[currentProf] = {
      ...existing,
      textExpander: JSON.parse(JSON.stringify(state.config.textExpander || { enabled: 1, items: [] })),
      keyRemapper: JSON.parse(JSON.stringify(state.config.keyRemapper || { enabled: 1, items: [] })),
      appLauncher: JSON.parse(JSON.stringify(state.config.appLauncher || { enabled: 1, items: [] })),
      folderCreator: JSON.parse(JSON.stringify(state.config.folderCreator || { enabled: 1, items: [] })),
      macroRecorder: JSON.parse(JSON.stringify(state.config.macroRecorder || { enabled: 1, items: [] })),
      windowManager: JSON.parse(JSON.stringify(state.config.windowManager || {})),
      mouseGestures: JSON.parse(JSON.stringify(state.config.mouseGestures || {})),
      radialMenu: JSON.parse(JSON.stringify(state.config.radialMenu || {})),
      autoClicker: JSON.parse(JSON.stringify(state.config.autoClicker || {}))
    };
  }

  function getProfileIconHtml(pName, prof) {
    const isDefault = (pName === 'Default');
    if (isDefault) {
      return `<svg class="profile-card-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
        <line x1="8" y1="21" x2="16" y2="21"></line>
        <line x1="12" y1="17" x2="12" y2="21"></line>
      </svg>`;
    }

    const targetExe = (prof && prof.targetExe) ? prof.targetExe.trim() : '';
    const firstExe = targetExe ? targetExe.split(',')[0].trim().replace(/\.exe$/i, '') : '';

    const candidates = [];
    if (firstExe) {
      candidates.push(`icons/${encodeURIComponent(firstExe)}.png`);
      candidates.push(`icons/${encodeURIComponent(firstExe.toLowerCase())}.png`);
    }
    if (pName) {
      candidates.push(`icons/${encodeURIComponent(pName)}.png`);
      candidates.push(`icons/${encodeURIComponent(pName.toLowerCase())}.png`);
    }

    const uniqueCandidates = [];
    candidates.forEach(c => {
      if (!uniqueCandidates.includes(c)) uniqueCandidates.push(c);
    });

    if (uniqueCandidates.length > 0) {
      const primary = uniqueCandidates[0];
      const alts = uniqueCandidates.slice(1);
      const altsJson = JSON.stringify(alts).replace(/"/g, '&quot;');
      return `
        <img class="profile-card-img" src="${primary}" data-alts="${altsJson}" alt="${escapeHtml(pName)}"
             onerror="
               try {
                 var a = JSON.parse(this.getAttribute('data-alts') || '[]');
                 if (a && a.length > 0) {
                   var next = a.shift();
                   this.setAttribute('data-alts', JSON.stringify(a));
                   this.src = next;
                   return;
                 }
               } catch(e) {}
               this.style.display='none';
               if (this.nextElementSibling) this.nextElementSibling.style.display='flex';
             " />
        <div class="profile-card-fallback-badge" style="display:none;">
          <span>${escapeHtml(pName.charAt(0).toUpperCase())}</span>
        </div>`;
    }

    return `
      <div class="profile-card-fallback-badge">
        <span>${escapeHtml(pName.charAt(0).toUpperCase())}</span>
      </div>`;
  }

  function renderItemProfileBadges(moduleName, itemId) {
    if (!state.config) return '';
    // Ensure current profile in state.config.profiles reflects live in-memory module changes
    saveCurrentProfileState();
    if (!state.config.profiles) return '';
    const profiles = state.config.profiles;
    const currentProf = state.config.activeProfile || 'Default';
    const totalProfCount = Object.keys(profiles).length;

    let isForcedAll = false;
    const curProf = profiles[currentProf];
    if (curProf && curProf[moduleName] && Array.isArray(curProf[moduleName].items)) {
      const it = curProf[moduleName].items.find(i => i.id === itemId);
      if (it && (it.forcedAllProfiles || it.allProfiles)) isForcedAll = true;
    }

    // Find all profiles where this item is enabled
    const activeProfiles = [];
    Object.keys(profiles).forEach(pName => {
      const prof = profiles[pName];
      if (prof && prof[moduleName] && Array.isArray(prof[moduleName].items)) {
        const found = prof[moduleName].items.find(i => i.id === itemId);
        if (found && found.enabled !== false && found.enabled !== 0) {
          activeProfiles.push(pName);
          if (found.forcedAllProfiles || found.allProfiles) isForcedAll = true;
        }
      }
    });

    if (activeProfiles.length === 0) return '';

    // If forced on all profiles: ONLY SHOW ONE ICON, NOT ALL PROFILES ICON!
    if (isForcedAll || (totalProfCount > 1 && activeProfiles.length === totalProfCount)) {
      return `<div class="item-profiles-badges is-forced-all" data-count="1" data-forced-all="true" data-module="${escapeHtml(moduleName)}" data-id="${escapeHtml(itemId)}"><div class="item-profile-badge is-all-profiles is-current" title="Forced on All Profiles (${activeProfiles.length}/${totalProfCount}) • Right-click to manage" data-forced-all="true" data-module="${escapeHtml(moduleName)}" data-id="${escapeHtml(itemId)}"><svg class="profile-badge-svg all-profiles-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg></div></div>`;
    }

    const badgesHtml = activeProfiles.map(pName => {
      const prof = profiles[pName] || {};
      const isCur = (pName === currentProf);
      const iconHtml = getProfileIconHtml(pName, prof);
      const tooltip = isCur ? `Active in Profile: ${pName} (Current Profile)` : `Active in Profile: ${pName} (Click to switch)`;
      return `<div class="item-profile-badge ${isCur ? 'is-current' : ''}" title="${escapeHtml(tooltip)}" data-switch-profile="${escapeHtml(pName)}">${iconHtml}</div>`;
    }).join('');

    const hasScrollbar = activeProfiles.length > 4;
    return `<div class="item-profiles-badges ${hasScrollbar ? 'has-scrollbar' : ''}" data-count="${activeProfiles.length}" data-module="${escapeHtml(moduleName)}" data-id="${escapeHtml(itemId)}">${badgesHtml}</div>`;
  }

  function updateCardProfileBadges(cardEl, moduleName, itemId) {
    if (!cardEl) return;
    let container = cardEl.querySelector('.item-profiles-badges');
    const newHtml = renderItemProfileBadges(moduleName, itemId);
    if (newHtml) {
      if (container) {
        container.outerHTML = newHtml;
      } else {
        // Find best insertion target depending on card structure
        const actions = cardEl.querySelector('.card-actions');
        if (actions) {
          actions.insertAdjacentHTML('beforebegin', newHtml);
        } else {
          const cardInfo = cardEl.querySelector('.card-info') || cardEl.querySelector('.macro-card-top');
          if (cardInfo) {
            cardInfo.insertAdjacentHTML('beforeend', newHtml);
          }
        }
      }
    } else if (container) {
      container.remove();
    }
  }

  const FEATURE_SWITCH_DEFINITIONS = [
    // Gestures & Corners
    { id: 'hcMasterSwitch', module: 'mouseGestures', key: 'cornersEnabled' },
    { id: 'mgMasterSwitch', module: 'mouseGestures', key: 'gesturesEnabled' },
    { id: 'mgRockerSwitch', module: 'mouseGestures', key: 'rockerEnabled' },
    { id: 'mgWheelSwitch', module: 'mouseGestures', key: 'wheelGestureEnabled' },
    // Radial Menu
    { id: 'rmMasterSwitch', module: 'radialMenu', key: 'enabled' },
    // System Tools (Window Manager)
    { id: 'wmSwitchAlwaysOnTop', module: 'windowManager', key: 'alwaysOnTopEnabled' },
    { id: 'wmSwitchCenterWindow', module: 'windowManager', key: 'centerWindowEnabled' },
    { id: 'wmSwitchHideWindow', module: 'windowManager', key: 'hideWindowEnabled' },
    { id: 'wmSwitchTransparencyWheel', module: 'windowManager', key: 'transparencyWheel' },
    { id: 'wmSwitchAppVolumeWheel', module: 'windowManager', key: 'appVolumeWheel' },
    { id: 'wmSwitchAppVolumeMute', module: 'windowManager', key: 'appVolumeMuteEnabled' },
    { id: 'wmSwitchMasterAudioMute', module: 'windowManager', key: 'masterAudioMuteEnabled' },
    { id: 'wmSwitchWindowShade', module: 'windowManager', key: 'windowShadeEnabled' },
    { id: 'wmSwitchBorderless', module: 'windowManager', key: 'borderlessEnabled' },
    { id: 'wmSwitchTextTransform', module: 'windowManager', key: 'textTransformEnabled' },
    { id: 'wmSwitchCleanText', module: 'windowManager', key: 'textTransformCleanEnabled' },
    { id: 'wmSwitchScreenOcr', module: 'windowManager', key: 'screenOcrEnabled' },
    { id: 'wmSwitchColorPicker', module: 'windowManager', key: 'colorPickerEnabled' },
    { id: 'wmSwitchVirtualDesktops', module: 'windowManager', key: 'virtualDesktopsEnabled' },
    { id: 'wmSwitchSleep', module: 'windowManager', key: 'sleepEnabled' }
  ];

  function updateAllFeatureProfileBadges() {
    if (!state.config) return;
    saveCurrentProfileState();
    if (!state.config.profiles) return;

    const profiles = state.config.profiles;
    const currentProf = state.config.activeProfile || 'Default';

    FEATURE_SWITCH_DEFINITIONS.forEach(({ id, module, key }) => {
      const sw = document.getElementById(id);
      if (!sw) return;

      const toggleWrapper = sw.closest('.toggle-wrapper');
      if (!toggleWrapper) return;

      const parent = toggleWrapper.parentElement;
      if (!parent) return;

      let container = parent.querySelector(`.item-profiles-badges[data-feature-key="${key}"]`);
      if (!container) {
        container = document.createElement('div');
        container.className = 'item-profiles-badges';
        container.setAttribute('data-feature-key', key);
        parent.insertBefore(container, toggleWrapper);
      }

      const activeProfiles = [];
      Object.keys(profiles).forEach(pName => {
        const prof = profiles[pName];
        if (prof) {
          const mod = prof[module] || (pName === 'Default' ? state.config[module] : null);
          if (mod) {
            let isEnabled = false;
            if (key === 'enabled') {
              isEnabled = (mod.enabled !== false && mod.enabled !== 0);
            } else if (key === 'cornersEnabled' || key === 'gesturesEnabled') {
              isEnabled = (mod[key] !== false && mod[key] !== 0);
            } else {
              isEnabled = (mod[key] === true || mod[key] === 1);
            }
            if (isEnabled) {
              activeProfiles.push(pName);
            }
          }
        }
      });

      if (activeProfiles.length === 0) {
        container.innerHTML = '';
        container.style.display = 'none';
        container.classList.remove('has-scrollbar');
        return;
      }

      const totalProfCount = Object.keys(profiles).length;
      const isForcedFeature = Boolean((state.config.forcedFeatures && state.config.forcedFeatures[`${module}.${key}`]) ||
        (totalProfCount > 1 && activeProfiles.length === totalProfCount));

      if (isForcedFeature) {
        container.className = 'item-profiles-badges is-forced-all';
        container.setAttribute('data-count', '1');
        container.setAttribute('data-forced-all', 'true');
        container.setAttribute('data-module', module);
        container.setAttribute('data-feature-key', key);
        container.style.display = 'grid';
        container.innerHTML = `
          <div class="item-profile-badge is-all-profiles is-current" 
               title="Forced on All Profiles (${activeProfiles.length}/${totalProfCount}) • Right-click to manage" 
               data-forced-all="true" 
               data-module="${escapeHtml(module)}" 
               data-feature-key="${escapeHtml(key)}">
            <svg class="profile-badge-svg all-profiles-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
          </div>
        `;
        return;
      }

      const hasMoreThan4 = activeProfiles.length > 4;
      container.className = `item-profiles-badges ${hasMoreThan4 ? 'has-scrollbar' : ''}`;
      container.setAttribute('data-count', activeProfiles.length);
      container.setAttribute('data-module', module);
      container.setAttribute('data-feature-key', key);

      const badgesHtml = activeProfiles.map(pName => {
        const prof = profiles[pName] || {};
        const isCur = (pName === currentProf);
        const iconHtml = getProfileIconHtml(pName, prof);
        const tooltip = isCur
          ? `Active in Profile: ${pName} (Current Profile)`
          : `Active in Profile: ${pName} (Click to switch)`;
        return `<div class="item-profile-badge ${isCur ? 'is-current' : ''}" title="${escapeHtml(tooltip)}" data-switch-profile="${escapeHtml(pName)}">${iconHtml}</div>`;
      }).join('');

      container.innerHTML = badgesHtml;
      container.style.display = 'grid';
    });
  }

  function renderProfilesRibbon() {
    const track = document.getElementById('lgsProfilesTrack');
    const defaultSlot = document.getElementById('lgsDefaultProfileSlot');
    const select = document.getElementById('profileSelect');
    if (!track) return;

    const currentProfName = (state.config && state.config.activeProfile) || 'Default';
    const profiles = (state.config && state.config.profiles) ? state.config.profiles : { 'Default': {} };
    const allProfileNames = Object.keys(profiles);

    if (select) {
      select.innerHTML = '';
      allProfileNames.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p;
        opt.textContent = p;
        if (p === currentProfName) opt.selected = true;
        select.appendChild(opt);
      });
    }

    const queryInput = document.getElementById('profileSearchInput');
    const query = (queryInput ? queryInput.value : '').trim().toLowerCase();

    const btnDelete = document.getElementById('btnDeleteProfile');
    if (btnDelete) {
      const canDelete = (currentProfName !== 'Default' && allProfileNames.length > 1);
      btnDelete.disabled = !canDelete;
      btnDelete.classList.toggle('is-disabled', !canDelete);
      btnDelete.title = canDelete ? `Delete Profile "${currentProfName}"` : 'Cannot delete Default profile';
    }

    function createProfileCard(pName, isDef) {
      const prof = profiles[pName] || {};
      const isActive = (pName === currentProfName);
      const card = document.createElement('div');
      card.className = `lgs-profile-card ${isDef ? 'is-default' : ''} ${isActive ? 'active' : ''}`;
      card.setAttribute('data-profile', pName);
      card.title = isDef ? 'Default Profile (System Fallback)' : (prof.targetExe ? `${pName} (${prof.targetExe})` : pName);

      const iconBox = document.createElement('div');
      iconBox.className = 'lgs-icon-box';
      iconBox.innerHTML = getProfileIconHtml(pName, prof);

      const infoCol = document.createElement('div');
      infoCol.className = 'lgs-profile-info';

      const nameEl = document.createElement('div');
      nameEl.className = 'lgs-profile-name';
      nameEl.textContent = pName;

      const exeEl = document.createElement('div');
      exeEl.className = 'lgs-profile-exe';
      exeEl.textContent = isDef ? 'Default (System)' : (prof.targetExe ? prof.targetExe.split(',')[0].trim() : 'Manual Switch');

      infoCol.appendChild(nameEl);
      infoCol.appendChild(exeEl);

      card.appendChild(iconBox);
      card.appendChild(infoCol);

      card.addEventListener('click', () => {
        if (state.config.activeProfile !== pName) {
          switchProfile(pName);
        } else {
          updateGlobalIndicators();
        }
      });

      card.addEventListener('dblclick', () => {
        openProfileModal('edit');
      });

      return card;
    }

    // 1. Render Fixed Default Profile Slot
    if (defaultSlot) {
      const existingDefCard = defaultSlot.querySelector('.lgs-profile-card');
      const showDef = (!query || 'default'.includes(query) || ((profiles['Default'] && profiles['Default'].targetExe) || '').toLowerCase().includes(query));
      if (showDef) {
        defaultSlot.style.display = 'flex';
        if (existingDefCard) {
          existingDefCard.classList.toggle('active', currentProfName === 'Default');
        } else {
          defaultSlot.innerHTML = '';
          defaultSlot.appendChild(createProfileCard('Default', true));
        }
      } else {
        defaultSlot.style.display = 'none';
      }
    }

    // 2. Render App Profiles Track & Preserve Glider for True Bi-Directional Animation
    let glider = document.getElementById('lgsProfilesGlider');
    if (!glider) {
      glider = document.createElement('div');
      glider.className = 'lgs-profiles-glider';
      glider.id = 'lgsProfilesGlider';
      track.appendChild(glider);
    }

    const otherNames = allProfileNames.filter(n => n !== 'Default');
    const visibleNames = otherNames.filter(pName => {
      const prof = profiles[pName] || {};
      const targetLower = (prof.targetExe || '').toLowerCase();
      return !(query && !pName.toLowerCase().includes(query) && !targetLower.includes(query));
    });

    const existingCards = Array.from(track.querySelectorAll('.lgs-profile-card'));
    const existingNames = existingCards.map(c => c.getAttribute('data-profile'));

    const isSameStructure = (existingNames.length === visibleNames.length &&
      existingNames.every((n, i) => n === visibleNames[i]));

    if (isSameStructure) {
      // Structure didn't change: preserve existing DOM cards & glider
      // Update active state and subtitle text so CSS transition glides seamlessly in BOTH directions
      existingCards.forEach(card => {
        const pName = card.getAttribute('data-profile');
        const isActive = (pName === currentProfName);
        card.classList.toggle('active', isActive);
        const prof = profiles[pName] || {};
        const exeEl = card.querySelector('.lgs-profile-exe');
        if (exeEl) {
          exeEl.textContent = prof.targetExe ? prof.targetExe.split(',')[0].trim() : 'Manual Switch';
        }
      });
      updateProfileGlider(false);
      updateProfilesScrollButtons();
    } else {
      // Structure changed: remove cards only (glider remains!) and re-append cards
      existingCards.forEach(c => c.remove());
      visibleNames.forEach(pName => {
        track.appendChild(createProfileCard(pName, false));
      });
      requestAnimationFrame(() => {
        updateProfileGlider(false);
        updateProfilesScrollButtons();
      });
    }
  }

  function updateProfilesScrollButtons() {
    const track = document.getElementById('lgsProfilesTrack');
    const btnLeft = document.getElementById('btnScrollProfilesLeft');
    const btnRight = document.getElementById('btnScrollProfilesRight');
    if (!track) return;

    const cards = track.querySelectorAll('.lgs-profile-card');
    const profileCount = cards.length;
    // Don't show scrollbar/scroll buttons unless the icons don't fit AND there are more than 4 profile icons
    const isOverflowing = track.scrollWidth > (track.clientWidth + 4);
    const shouldShow = (profileCount > 4) && isOverflowing;

    if (btnLeft) {
      btnLeft.style.display = shouldShow ? 'flex' : 'none';
      btnLeft.classList.toggle('disabled-scroll', track.scrollLeft <= 2);
    }
    if (btnRight) {
      btnRight.style.display = shouldShow ? 'flex' : 'none';
      btnRight.classList.toggle('disabled-scroll', track.scrollLeft + track.clientWidth >= track.scrollWidth - 2);
    }
  }

  function updateProfileGlider(instant = false) {
    const track = document.getElementById('lgsProfilesTrack');
    const glider = document.getElementById('lgsProfilesGlider');
    if (!track || !glider) return;

    const activeCard = track.querySelector('.lgs-profile-card.active');
    if (!activeCard) {
      glider.style.opacity = '0';
      return;
    }

    const left = activeCard.offsetLeft;
    const width = activeCard.offsetWidth;

    if (width === 0) {
      requestAnimationFrame(() => updateProfileGlider(instant));
      return;
    }

    const wasHidden = (glider.style.opacity === '0' || !glider.style.opacity);

    if (instant || wasHidden) {
      glider.style.transition = 'none';
      glider.style.transform = `translateX(${left}px)`;
      glider.style.width = `${width}px`;
      if (wasHidden) {
        void glider.offsetWidth;
        glider.style.transition = 'opacity 0.25s ease';
      }
      glider.style.opacity = '1';
    } else {
      glider.style.transition = 'transform 0.32s cubic-bezier(0.25, 1, 0.5, 1), width 0.32s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.2s ease';
      glider.style.transform = `translateX(${left}px)`;
      glider.style.width = `${width}px`;
      glider.style.opacity = '1';
    }
  }

  function renderProfileSelect() {
    renderProfilesRibbon();
  }

  function switchProfile(name, shouldSync = true) {
    if (!state.config.profiles || !state.config.profiles[name]) return;
    try {
      if (typeof stopActiveBadgeRecording === 'function') stopActiveBadgeRecording(true);
      saveCurrentProfileState();
    } catch (e) {
      console.warn('saveCurrentProfileState error:', e);
    }

    state.config.activeProfile = name;

    const prof = state.config.profiles[name];
    state.config.textExpander = prof.textExpander || { enabled: 1, items: [] };
    state.config.keyRemapper = prof.keyRemapper || { enabled: 1, items: [] };
    state.config.appLauncher = prof.appLauncher || { enabled: 1, items: [] };
    state.config.folderCreator = prof.folderCreator || { enabled: 1, items: [] };
    state.config.macroRecorder = prof.macroRecorder || { enabled: 1, items: [] };
    state.config.windowManager = prof.windowManager || {};
    state.config.mouseGestures = prof.mouseGestures || {};
    state.config.radialMenu = prof.radialMenu || {};
    state.config.autoClicker = prof.autoClicker || {};

    // 1. Immediately update global active indicators so count badge refreshes instantaneously
    updateGlobalIndicators();

    // 2. Render each component safely inside individual try-catch blocks
    const renderSteps = [
      ['renderProfileSelect', renderProfileSelect],
      ['renderTextExpander', renderTextExpander],
      ['renderKeyRemapper', renderKeyRemapper],
      ['initWindowManager', initWindowManager],
      ['initMouseGestures', initMouseGestures],
      ['initRadialMenu', initRadialMenu],
      ['renderAppLauncher', renderAppLauncher],
      ['renderFolderCreator', renderFolderCreator],
      ['renderMacroRecorder', renderMacroRecorder],
      ['updateAutoClickerUI', updateAutoClickerUI],
      ['refreshAllActionSelects', refreshAllActionSelects],
      ['updateAllFeatureProfileBadges', updateAllFeatureProfileBadges]
    ];

    for (const [stepName, fn] of renderSteps) {
      try {
        if (typeof fn === 'function') fn();
      } catch (err) {
        console.error(`Error in ${stepName}:`, err);
      }
    }

    // 3. Ensure indicators are updated again in case a renderer modified any item state
    updateGlobalIndicators();

    if (shouldSync) {
      try {
        syncConfig();
      } catch (err) {
        console.error('Error syncing config in switchProfile:', err);
      }
    }
    showToast(`Profile: ${name}`);
  }

  function createNewProfile(name, targetExe = '', switchOnHover = false, showOsdIcon = true, switchTriggerEnabled = true, switchOnFocus = true) {
    name = (name || '').trim();
    if (!name) return false;
    if (state.config.profiles && state.config.profiles[name]) {
      showToast(`Profile "${name}" already exists!`);
      return false;
    }
    saveCurrentProfileState();

    const cloneItems = (items) => (items || []).map(i => ({ ...JSON.parse(JSON.stringify(i)), enabled: 0 }));

    const defaultWm = (state.config.profiles && state.config.profiles.Default && state.config.profiles.Default.windowManager)
      ? state.config.profiles.Default.windowManager
      : (state.config.windowManager || {});
    const newWm = JSON.parse(JSON.stringify(defaultWm));

    const curAc = state.config.autoClicker || {};
    const newAc = { ...JSON.parse(JSON.stringify(curAc)), enabled: 0 };

    const curMg = state.config.mouseGestures || {};
    const newMg = { ...JSON.parse(JSON.stringify(curMg)), cornersEnabled: 0, gesturesEnabled: 0 };

    const curRm = state.config.radialMenu || {};
    const newRm = { ...JSON.parse(JSON.stringify(curRm)), enabled: 0 };

    const newProfile = {
      targetExe: targetExe,
      switchTriggerEnabled: Boolean(switchTriggerEnabled),
      switchOnFocus: Boolean(switchOnFocus),
      switchOnHover: Boolean(switchOnHover),
      showOsdIcon: Boolean(showOsdIcon),
      textExpander: {
        enabled: 1,
        items: cloneItems(state.config.textExpander && state.config.textExpander.items)
      },
      keyRemapper: {
        enabled: 1,
        items: cloneItems(state.config.keyRemapper && state.config.keyRemapper.items)
      },
      appLauncher: {
        enabled: 1,
        items: cloneItems(state.config.appLauncher && state.config.appLauncher.items)
      },
      folderCreator: {
        enabled: 1,
        items: cloneItems(state.config.folderCreator && state.config.folderCreator.items)
      },
      macroRecorder: {
        enabled: 1,
        items: cloneItems(state.config.macroRecorder && state.config.macroRecorder.items),
        useStandardDelays: (state.config.macroRecorder && state.config.macroRecorder.useStandardDelays) || 1
      },
      windowManager: newWm,
      mouseGestures: newMg,
      radialMenu: newRm,
      autoClicker: newAc
    };

    if (!state.config.profiles) state.config.profiles = {};
    state.config.profiles[name] = newProfile;
    switchProfile(name);
    showToast(`Created & switched to profile "${name}"`);
    closeProfileModal();
    return true;
  }

  function updateProfileSettings(name, targetExe, switchOnHover, showOsdIcon, switchTriggerEnabled = true, switchOnFocus = true) {
    name = (name || '').trim();
    if (!name || !state.config.profiles || !state.config.profiles[name]) return false;
    saveCurrentProfileState();
    const prof = state.config.profiles[name];
    if (name !== 'Default') {
      prof.targetExe = targetExe;
      prof.showOsdIcon = Boolean(showOsdIcon);
    }
    prof.switchTriggerEnabled = Boolean(switchTriggerEnabled);
    prof.switchOnFocus = Boolean(switchOnFocus);
    prof.switchOnHover = Boolean(switchOnHover);
    renderProfilesRibbon();
    syncConfig();
    showToast(`Updated settings for "${name}"`);
    return true;
  }

  function renameProfile(oldName, newName) {
    newName = (newName || '').trim();
    if (!newName || newName === oldName) return false;
    if (state.config.profiles[newName]) {
      showToast(`Profile "${newName}" already exists!`);
      return false;
    }
    saveCurrentProfileState();
    state.config.profiles[newName] = state.config.profiles[oldName];
    delete state.config.profiles[oldName];
    if (state.config.activeProfile === oldName) {
      state.config.activeProfile = newName;
    }
    renderProfileSelect();
    syncConfig();
    showToast(`Renamed profile to "${newName}"`);
    return true;
  }

  function deleteProfile(name) {
    if (!state.config || !state.config.profiles) return false;
    const profileNames = Object.keys(state.config.profiles);
    if (profileNames.length <= 1) {
      showToast('Cannot delete the only profile!');
      return false;
    }
    if (name === 'Default') {
      showToast('Cannot delete System Default profile!');
      return false;
    }

    // Always close the modal window immediately
    closeProfileModal();

    delete state.config.profiles[name];

    if (state.config.activeProfile === name) {
      const remaining = Object.keys(state.config.profiles);
      const fallback = remaining.includes('Default') ? 'Default' : remaining[0];
      switchProfile(fallback, true);
    } else {
      renderProfileSelect();
      syncConfig();
    }
    showToast(`Profile "${name}" deleted`);
    return true;
  }

  // ==========================================================================
  // Profile Context Menu & Active Scripts Copy / Paste Engine
  // ==========================================================================
  let activeContextProfile = null;
  let profileScriptsClipboard = null;
  try {
    const saved = localStorage.getItem('ahk_profile_clipboard');
    if (saved) profileScriptsClipboard = JSON.parse(saved);
  } catch (e) { }

  function getProfileActiveScriptsCount(pName) {
    if (!state.config) return 0;
    const currentName = pName || state.config.activeProfile || 'Default';
    if (state.config.activeProfile === currentName) {
      saveCurrentProfileState();
    }
    let prof = null;
    if (state.config.profiles) {
      if (!Array.isArray(state.config.profiles) && state.config.profiles[currentName]) {
        prof = state.config.profiles[currentName];
      } else if (Array.isArray(state.config.profiles)) {
        prof = state.config.profiles.find(p => p && (p.name === currentName || p.id === currentName));
      }
    }
    if (!prof) prof = state.config;
    if (!prof) return 0;

    let count = 0;
    const listModules = ['textExpander', 'keyRemapper', 'appLauncher', 'folderCreator', 'macroRecorder'];
    listModules.forEach(mod => {
      const m = prof[mod] || (state.config && state.config[mod]);
      if (m && Array.isArray(m.items)) {
        m.items.forEach(item => {
          if (item && item.enabled !== false && item.enabled !== 0) {
            count++;
          }
        });
      }
    });

    const wm = prof.windowManager || prof.systemTools || (state.config && (state.config.windowManager || state.config.systemTools));
    if (wm) {
      const wmKeys = [
        'alwaysOnTopEnabled', 'centerWindowEnabled', 'hideWindowEnabled',
        'appVolumeMuteEnabled', 'masterAudioMuteEnabled', 'windowShadeEnabled',
        'borderlessEnabled', 'textTransformEnabled', 'textTransformCleanEnabled',
        'screenOcrEnabled', 'colorPickerEnabled', 'virtualDesktopsEnabled', 'sleepEnabled',
        'appVolumeWheel', 'transparencyWheel', 'clickThroughGhost', 'taskbarScrollEnabled'
      ];
      wmKeys.forEach(k => {
        if (wm[k] === 1 || wm[k] === true) count++;
      });
    }

    const mg = prof.mouseGestures || prof.gesturesAndCorners || (state.config && (state.config.mouseGestures || state.config.gesturesAndCorners));
    if (mg) {
      if (mg.cornersEnabled === 1 || mg.cornersEnabled === true) count++;
      if (mg.gesturesEnabled === 1 || mg.gesturesEnabled === true) count++;
    }

    const rm = prof.radialMenu || (state.config && state.config.radialMenu);
    if (rm && (rm.enabled === 1 || rm.enabled === true)) count++;

    const ac = prof.autoClicker || (state.config && state.config.autoClicker);
    if (ac && (ac.enabled === 1 || ac.enabled === true)) count++;

    return count;
  }

  function copyProfileActiveScripts(pName) {
    if (!state.config || !state.config.profiles || !state.config.profiles[pName]) return;
    if (state.config.activeProfile === pName) {
      saveCurrentProfileState();
    }
    const prof = state.config.profiles[pName];

    const snapshot = {
      sourceProfile: pName,
      copiedAt: Date.now(),
      listModules: {},
      windowManager: {},
      mouseGestures: {},
      radialMenu: {},
      autoClicker: {}
    };

    let totalActive = 0;

    const listModules = ['textExpander', 'keyRemapper', 'appLauncher', 'folderCreator', 'macroRecorder'];
    listModules.forEach(mod => {
      snapshot.listModules[mod] = [];
      if (prof[mod] && Array.isArray(prof[mod].items)) {
        prof[mod].items.forEach(item => {
          if (item && item.enabled !== false && item.enabled !== 0) {
            snapshot.listModules[mod].push(JSON.parse(JSON.stringify(item)));
            totalActive++;
          }
        });
      }
    });

    if (prof.windowManager) {
      const wmKeys = [
        'alwaysOnTopEnabled', 'centerWindowEnabled', 'hideWindowEnabled',
        'appVolumeMuteEnabled', 'masterAudioMuteEnabled', 'windowShadeEnabled',
        'borderlessEnabled', 'textTransformEnabled', 'textTransformCleanEnabled',
        'screenOcrEnabled', 'colorPickerEnabled', 'virtualDesktopsEnabled', 'sleepEnabled'
      ];
      wmKeys.forEach(k => {
        if (prof.windowManager[k] === 1 || prof.windowManager[k] === true) {
          snapshot.windowManager[k] = 1;
          totalActive++;
        }
      });
      const hkFields = [
        'alwaysOnTopHotkey', 'centerWindowHotkey', 'hideWindowHotkey',
        'appVolumeMuteHotkey', 'masterAudioMuteHotkey', 'windowShadeHotkey',
        'borderlessHotkey', 'textTransformHotkey', 'textTransformCleanHotkey',
        'screenOcrHotkey', 'colorPickerHotkey', 'sleepHotkey', 'sleepModeHibernate',
        'sleepTimerSeconds'
      ];
      hkFields.forEach(hk => {
        if (prof.windowManager[hk] !== undefined) {
          snapshot.windowManager[hk] = prof.windowManager[hk];
        }
      });
    }

    if (prof.mouseGestures) {
      if (prof.mouseGestures.cornersEnabled === 1 || prof.mouseGestures.cornersEnabled === true) {
        snapshot.mouseGestures.cornersEnabled = 1;
        totalActive++;
      }
      if (prof.mouseGestures.gesturesEnabled === 1 || prof.mouseGestures.gesturesEnabled === true) {
        snapshot.mouseGestures.gesturesEnabled = 1;
        totalActive++;
      }
      Object.keys(prof.mouseGestures).forEach(k => {
        if (k !== 'cornersEnabled' && k !== 'gesturesEnabled') {
          snapshot.mouseGestures[k] = prof.mouseGestures[k];
        }
      });
    }

    if (prof.radialMenu && (prof.radialMenu.enabled === 1 || prof.radialMenu.enabled === true)) {
      snapshot.radialMenu = JSON.parse(JSON.stringify(prof.radialMenu));
      snapshot.radialMenu.enabled = 1;
      totalActive++;
    }

    if (prof.autoClicker && (prof.autoClicker.enabled === 1 || prof.autoClicker.enabled === true)) {
      snapshot.autoClicker = JSON.parse(JSON.stringify(prof.autoClicker));
      snapshot.autoClicker.enabled = 1;
      totalActive++;
    }

    snapshot.activeCount = totalActive;
    profileScriptsClipboard = snapshot;
    window.__profileScriptsClipboard = snapshot;
    try {
      localStorage.setItem('ahk_profile_clipboard', JSON.stringify(snapshot));
    } catch (e) { }

    showToast(`Copied ${totalActive} active script${totalActive === 1 ? '' : 's'} from "${pName}"`);
  }

  function pasteProfileActiveScripts(targetProfileName) {
    const clipboard = profileScriptsClipboard || window.__profileScriptsClipboard;
    if (!clipboard) {
      showToast('Clipboard is empty. Right-click a profile to copy first.', 'error');
      return;
    }
    if (!state.config || !state.config.profiles || !state.config.profiles[targetProfileName]) {
      showToast(`Target profile "${targetProfileName}" does not exist.`, 'error');
      return;
    }

    const targetProf = state.config.profiles[targetProfileName];
    let pastedCount = 0;

    const listModules = ['textExpander', 'keyRemapper', 'appLauncher', 'folderCreator', 'macroRecorder'];
    listModules.forEach(mod => {
      const sourceActiveItems = (clipboard.listModules && clipboard.listModules[mod]) || [];
      if (!targetProf[mod]) {
        targetProf[mod] = { enabled: 1, items: [] };
      }
      if (!Array.isArray(targetProf[mod].items)) {
        targetProf[mod].items = [];
      }

      sourceActiveItems.forEach(srcItem => {
        let match = null;
        if (srcItem.id) {
          match = targetProf[mod].items.find(t => t.id === srcItem.id);
        }
        if (!match) {
          if (mod === 'textExpander') {
            match = targetProf[mod].items.find(t => t.trigger === srcItem.trigger);
          } else if (mod === 'keyRemapper') {
            match = targetProf[mod].items.find(t => t.originalKey === srcItem.originalKey);
          } else if (mod === 'appLauncher' || mod === 'folderCreator') {
            match = targetProf[mod].items.find(t => t.path === srcItem.path || t.name === srcItem.name);
          } else if (mod === 'macroRecorder') {
            match = targetProf[mod].items.find(t => t.name === srcItem.name);
          }
        }

        if (match) {
          match.enabled = 1;
          pastedCount++;
        } else {
          const newItem = JSON.parse(JSON.stringify(srcItem));
          newItem.enabled = 1;
          targetProf[mod].items.push(newItem);
          pastedCount++;
        }
      });
    });

    if (clipboard.windowManager && Object.keys(clipboard.windowManager).length > 0) {
      if (!targetProf.windowManager) targetProf.windowManager = {};
      Object.keys(clipboard.windowManager).forEach(k => {
        targetProf.windowManager[k] = clipboard.windowManager[k];
        if (k.endsWith('Enabled') && clipboard.windowManager[k] === 1) {
          pastedCount++;
        }
      });
    }

    if (clipboard.mouseGestures && Object.keys(clipboard.mouseGestures).length > 0) {
      if (!targetProf.mouseGestures) targetProf.mouseGestures = {};
      Object.keys(clipboard.mouseGestures).forEach(k => {
        targetProf.mouseGestures[k] = clipboard.mouseGestures[k];
        if ((k === 'cornersEnabled' || k === 'gesturesEnabled') && clipboard.mouseGestures[k] === 1) {
          pastedCount++;
        }
      });
    }

    if (clipboard.radialMenu && clipboard.radialMenu.enabled === 1) {
      targetProf.radialMenu = JSON.parse(JSON.stringify(clipboard.radialMenu));
      pastedCount++;
    }

    if (clipboard.autoClicker && clipboard.autoClicker.enabled === 1) {
      targetProf.autoClicker = JSON.parse(JSON.stringify(clipboard.autoClicker));
      pastedCount++;
    }

    if (state.config.activeProfile === targetProfileName) {
      state.config.textExpander = targetProf.textExpander;
      state.config.keyRemapper = targetProf.keyRemapper;
      state.config.appLauncher = targetProf.appLauncher;
      state.config.folderCreator = targetProf.folderCreator;
      state.config.macroRecorder = targetProf.macroRecorder;
      state.config.windowManager = targetProf.windowManager;
      state.config.mouseGestures = targetProf.mouseGestures;
      state.config.radialMenu = targetProf.radialMenu;
      state.config.autoClicker = targetProf.autoClicker;

      renderAll(true);
    } else {
      updateAllFeatureProfileBadges();
      syncConfig();
    }

    showToast(`Pasted active scripts from "${clipboard.sourceProfile}" into "${targetProfileName}"!`);
  }

  function showProfileContextMenu(e, pName) {
    const menu = document.getElementById('profileContextMenu');
    if (!menu) return;

    activeContextProfile = pName;
    const prof = (state.config && state.config.profiles && state.config.profiles[pName]) || {};
    const count = getProfileActiveScriptsCount(pName);

    const titleEl = document.getElementById('profileCtxTitle');
    const iconEl = document.getElementById('profileCtxIcon');
    const subEl = document.getElementById('profileCtxSub');
    const copyHintEl = document.getElementById('profileCtxCopyHint');
    const btnPaste = document.getElementById('btnCtxPasteProfile');
    const pasteHintEl = document.getElementById('profileCtxPasteHint');
    const btnSwitch = document.getElementById('btnCtxSwitchProfile');

    if (titleEl) titleEl.textContent = pName;
    if (iconEl) iconEl.innerHTML = getProfileIconHtml(pName, prof);
    if (subEl) subEl.textContent = `${count} active script${count === 1 ? '' : 's'}`;

    if (copyHintEl) {
      copyHintEl.textContent = count > 0
        ? `Copy ${count} active script${count === 1 ? '' : 's'} from this profile`
        : 'Copy active scripts from this profile';
    }

    const clipboard = profileScriptsClipboard || window.__profileScriptsClipboard;
    if (btnPaste) {
      if (!clipboard || !clipboard.sourceProfile) {
        btnPaste.classList.add('is-disabled');
        if (pasteHintEl) pasteHintEl.textContent = 'Clipboard is empty. Copy a profile first';
      } else {
        btnPaste.classList.remove('is-disabled');
        if (pasteHintEl) {
          pasteHintEl.textContent = `Apply ${clipboard.activeCount || 0} active script(s) from "${clipboard.sourceProfile}"`;
        }
      }
    }

    if (btnSwitch) {
      const isCur = (state.config && state.config.activeProfile === pName);
      btnSwitch.classList.toggle('is-disabled', isCur);
    }

    menu.classList.add('is-visible');
    const menuW = 270;
    const menuH = 190;
    let posX = e.clientX;
    let posY = e.clientY;

    if (posX + menuW > window.innerWidth - 10) {
      posX = window.innerWidth - menuW - 10;
    }
    if (posY + menuH > window.innerHeight - 10) {
      posY = window.innerHeight - menuH - 10;
    }
    posX = Math.max(10, posX);
    posY = Math.max(10, posY);

    menu.style.left = `${posX}px`;
    menu.style.top = `${posY}px`;
  }

  function closeProfileContextMenu() {
    const menu = document.getElementById('profileContextMenu');
    if (menu) {
      menu.classList.remove('is-visible');
      menu.style.display = 'none';
    }
    activeContextProfile = null;
  }

  function initProfileContextMenu() {
    const menu = document.getElementById('profileContextMenu');
    const btnCopy = document.getElementById('btnCtxCopyProfile');
    const btnPaste = document.getElementById('btnCtxPasteProfile');
    const btnSwitch = document.getElementById('btnCtxSwitchProfile');

    if (btnCopy) {
      btnCopy.addEventListener('click', (e) => {
        e.stopPropagation();
        if (activeContextProfile) {
          copyProfileActiveScripts(activeContextProfile);
        }
        closeProfileContextMenu();
      });
    }

    if (btnPaste) {
      btnPaste.addEventListener('click', (e) => {
        e.stopPropagation();
        if (activeContextProfile) {
          pasteProfileActiveScripts(activeContextProfile);
        }
        closeProfileContextMenu();
      });
    }

    if (btnSwitch) {
      btnSwitch.addEventListener('click', (e) => {
        e.stopPropagation();
        if (activeContextProfile && state.config && state.config.activeProfile !== activeContextProfile) {
          switchProfile(activeContextProfile);
        }
        closeProfileContextMenu();
      });
    }

    // Dismiss context menu on click-outside, escape, or resize
    function onDismissProfileMenu(e) {
      if (menu && menu.classList.contains('is-visible') && !menu.contains(e.target)) {
        closeProfileContextMenu();
      }
    }
    document.addEventListener('pointerdown', onDismissProfileMenu, true);
    document.addEventListener('mousedown', onDismissProfileMenu, true);
    document.addEventListener('click', onDismissProfileMenu, true);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeProfileContextMenu();
    });

    window.addEventListener('resize', closeProfileContextMenu);
    window.addEventListener('scroll', closeProfileContextMenu, true);

    // Global right-click delegation
    document.addEventListener('contextmenu', (e) => {
      // 1. Profile cards in top ribbon
      const profCard = e.target.closest('.lgs-profile-card');
      if (profCard) {
        e.preventDefault();
        e.stopPropagation();
        closeScriptContextMenu();
        const pName = profCard.getAttribute('data-profile');
        if (pName) showProfileContextMenu(e, pName);
        return;
      }

      // 2. Script or item with switch / profile badge
      const scriptInfo = getScriptInfo(e.target);
      if (scriptInfo) {
        e.preventDefault();
        e.stopPropagation();
        closeProfileContextMenu();
        showScriptContextMenu(e, scriptInfo);
        return;
      }

      // 3. Normal profile badge fallback
      const badge = e.target.closest('.item-profile-badge');
      if (badge) {
        const pName = badge.getAttribute('data-switch-profile');
        if (pName) {
          e.preventDefault();
          e.stopPropagation();
          showProfileContextMenu(e, pName);
        }
      }
    });
  }

  // ============================================================================
  // Script / Switch Neumorphic Context Menu (Force on All Profiles)
  // ============================================================================

  let activeScriptContextInfo = null;

  function closeScriptContextMenu() {
    const menu = document.getElementById('scriptContextMenu');
    if (menu) {
      menu.classList.remove('is-visible');
      menu.style.display = 'none';
    }
    activeScriptContextInfo = null;
  }

  function getModuleDisplayName(mod) {
    switch (mod) {
      case 'textExpander': return 'Text Expander';
      case 'keyRemapper': return 'Key Remapper';
      case 'appLauncher': return 'App Launcher';
      case 'folderCreator': return 'Folder Creator';
      case 'macroRecorder': return 'Macro Recorder';
      case 'windowManager': return 'System Tools';
      case 'mouseGestures': return 'Gestures & Corners';
      case 'radialMenu': return 'Radial Menu';
      case 'autoClicker': return 'Auto Clicker';
      default: return mod;
    }
  }

  function getFeatureFriendlyTitle(mod, key) {
    const titles = {
      alwaysOnTopEnabled: 'Pin Always on Top',
      centerWindowEnabled: 'Center Active Window',
      hideWindowEnabled: 'Boss Key (Hide Window)',
      transparencyWheel: 'Scrollwheel Transparency',
      appVolumeWheel: 'Hover App Volume Wheel',
      appVolumeMuteEnabled: 'Mute Active App',
      masterAudioMuteEnabled: 'Mute Master Audio',
      windowShadeEnabled: 'Window Shade Roll-Up',
      borderlessEnabled: 'Borderless Fullscreen',
      textTransformEnabled: 'Text Case Transformer',
      textTransformCleanEnabled: 'Clean Plain Text',
      screenOcrEnabled: 'Instant Screen OCR',
      colorPickerEnabled: 'Color Picker Eyedropper',
      virtualDesktopsEnabled: 'Virtual Desktop Navigation',
      sleepEnabled: 'Quick Sleep / Hibernate',
      cornersEnabled: 'Screen Hot Corners',
      gesturesEnabled: 'Mouse Gestures',
      rockerEnabled: 'Rocker Gestures',
      wheelGestureEnabled: 'Gesture Wheel Action'
    };
    if (titles[key]) return titles[key];
    if (key === 'enabled') return mod === 'radialMenu' ? 'Radial Menu' : 'Auto Clicker';
    return key;
  }

  function resolveScriptInfo(moduleName, itemId, featureKey, cardEl, switchEl) {
    if (!state.config) return null;
    saveCurrentProfileState();
    const currentProfName = state.config.activeProfile || 'Default';
    const prof = (state.config.profiles && state.config.profiles[currentProfName]) || state.config;

    if (!switchEl && cardEl) {
      switchEl = cardEl.querySelector('.toggle-checkbox');
    }

    if (itemId) {
      const items = (prof[moduleName] && prof[moduleName].items) || [];
      const item = items.find(i => i.id === itemId);
      if (!item) return null;

      let title = item.name || '';
      if (!title) {
        if (moduleName === 'textExpander') title = item.input ? `${item.input} → ${item.output.slice(0, 24)}` : 'Text Expander';
        else if (moduleName === 'keyRemapper') title = `${formatKeyDisplay(item.source)} → ${formatKeyDisplay(item.target)}`;
        else if (moduleName === 'appLauncher') title = item.trigger ? `${item.trigger} (Launch)` : (item.target || 'Launcher');
        else if (moduleName === 'folderCreator') title = item.trigger ? `${item.trigger} (Folder)` : 'Folder Creator';
        else if (moduleName === 'macroRecorder') title = item.trigger ? `${item.trigger} (Macro)` : 'Macro';
        else title = 'Script Item';
      }

      const modDisplayName = getModuleDisplayName(moduleName);
      const isForced = Boolean(item.forcedAllProfiles || item.allProfiles);
      const isEnabled = (item.enabled !== false && item.enabled !== 0);

      return {
        type: 'item',
        moduleName,
        itemId,
        featureKey: null,
        item,
        title,
        sub: modDisplayName,
        isForced,
        isEnabled,
        cardEl,
        switchEl
      };
    } else if (featureKey) {
      const mod = prof[moduleName] || {};
      let isEnabled = false;
      if (featureKey === 'enabled' || featureKey === 'cornersEnabled' || featureKey === 'gesturesEnabled') {
        isEnabled = (mod[featureKey] !== false && mod[featureKey] !== 0);
      } else {
        isEnabled = (mod[featureKey] === 1 || mod[featureKey] === true);
      }

      const featureId = `${moduleName}.${featureKey}`;
      const isForced = Boolean((state.config.forcedFeatures && state.config.forcedFeatures[featureId]) ||
        (prof[moduleName] && prof[moduleName].forcedAllProfiles && prof[moduleName].forcedAllProfiles[featureKey]));

      const title = getFeatureFriendlyTitle(moduleName, featureKey);
      const modDisplayName = getModuleDisplayName(moduleName);

      return {
        type: 'feature',
        moduleName,
        itemId: null,
        featureKey,
        item: null,
        title,
        sub: modDisplayName,
        isForced,
        isEnabled,
        cardEl,
        switchEl
      };
    }

    return null;
  }

  function getScriptInfo(target) {
    if (!target) return null;

    // Check if directly clicking a badge with module info
    const badge = target.closest('.item-profile-badge, .item-profiles-badges');
    if (badge && badge.dataset.module && (badge.dataset.id || badge.dataset.featureKey)) {
      return resolveScriptInfo(badge.dataset.module, badge.dataset.id, badge.dataset.featureKey, badge);
    }

    // Check if inside a card with data-module
    const card = target.closest('.shortcut-card, .key-remap-card, .app-card, .folder-card, .macro-card, .wm-card, .active-script-card');
    if (card) {
      const mod = card.dataset.module;
      const itemId = card.dataset.id;
      const fKey = card.dataset.featureKey;
      if (mod && (itemId || fKey)) {
        return resolveScriptInfo(mod, itemId, fKey, card);
      }

      // Check if card has a switch in FEATURE_SWITCH_DEFINITIONS
      const sw = card.querySelector('.toggle-checkbox');
      if (sw && sw.id) {
        const def = FEATURE_SWITCH_DEFINITIONS.find(d => d.id === sw.id);
        if (def) {
          return resolveScriptInfo(def.module, null, def.key, card, sw);
        }
      }
    }

    // Check if directly on or inside a toggle-wrapper
    const toggleWrap = target.closest('.toggle-wrapper');
    if (toggleWrap) {
      const sw = toggleWrap.querySelector('.toggle-checkbox');
      if (sw && sw.id) {
        const def = FEATURE_SWITCH_DEFINITIONS.find(d => d.id === sw.id);
        if (def) {
          return resolveScriptInfo(def.module, null, def.key, toggleWrap, sw);
        }
      }
      const parentCard = toggleWrap.closest('[data-module]');
      if (parentCard) {
        return resolveScriptInfo(parentCard.dataset.module, parentCard.dataset.id, parentCard.dataset.featureKey, parentCard, sw);
      }
    }

    return null;
  }

  function showScriptContextMenu(e, info) {
    const menu = document.getElementById('scriptContextMenu');
    if (!menu || !info) return;

    closeProfileContextMenu();
    activeScriptContextInfo = info;

    const titleEl = document.getElementById('scriptCtxTitle');
    const subEl = document.getElementById('scriptCtxSub');
    const forceTitleEl = document.getElementById('scriptCtxForceTitle');
    const forceHintEl = document.getElementById('scriptCtxForceHint');
    const toggleTitleEl = document.getElementById('scriptCtxToggleTitle');
    const toggleHintEl = document.getElementById('scriptCtxToggleHint');

    if (titleEl) titleEl.textContent = info.title;
    if (subEl) {
      subEl.textContent = info.isForced
        ? `⚡ Forced on All Profiles • ${info.sub}`
        : `${info.sub} • Active in: ${state.config.activeProfile || 'Default'}`;
    }

    if (forceTitleEl) {
      forceTitleEl.textContent = info.isForced
        ? 'Unforce from All Profiles'
        : 'Force on All Profiles';
    }
    if (forceHintEl) {
      forceHintEl.textContent = info.isForced
        ? `Restore to run only in "${state.config.activeProfile || 'Default'}"`
        : 'Force this script to run active across every profile';
    }

    if (toggleTitleEl) {
      toggleTitleEl.textContent = info.isEnabled ? 'Turn Off Script' : 'Turn On Script';
    }
    if (toggleHintEl) {
      toggleHintEl.textContent = info.isEnabled ? 'Currently Active' : 'Currently Disabled';
    }

    menu.style.display = 'flex';
    menu.classList.add('is-visible');

    const menuW = 270;
    const menuH = 150;
    let posX = e.clientX;
    let posY = e.clientY;

    if (posX + menuW > window.innerWidth - 12) {
      posX = window.innerWidth - menuW - 12;
    }
    if (posY + menuH > window.innerHeight - 12) {
      posY = window.innerHeight - menuH - 12;
    }
    if (posX < 8) posX = 8;
    if (posY < 8) posY = 8;

    menu.style.left = `${posX}px`;
    menu.style.top = `${posY}px`;
  }

  function toggleForceScript(info) {
    if (!info) return;
    const newForcedState = !info.isForced;
    const profiles = state.config.profiles || {};
    const curProfName = state.config.activeProfile || 'Default';

    if (info.type === 'item') {
      const { moduleName, itemId } = info;
      const targetItem = info.item;
      targetItem.forcedAllProfiles = newForcedState;
      if (newForcedState) targetItem.enabled = 1;

      Object.keys(profiles).forEach(pName => {
        const p = profiles[pName];
        if (!p[moduleName]) p[moduleName] = { items: [] };
        if (!Array.isArray(p[moduleName].items)) p[moduleName].items = [];

        const existingIdx = p[moduleName].items.findIndex(i => i.id === itemId);
        if (newForcedState) {
          const cloned = JSON.parse(JSON.stringify(targetItem));
          cloned.enabled = 1;
          cloned.forcedAllProfiles = true;
          if (existingIdx !== -1) {
            p[moduleName].items[existingIdx] = cloned;
          } else {
            p[moduleName].items.unshift(cloned);
          }
        } else {
          if (existingIdx !== -1) {
            p[moduleName].items[existingIdx].forcedAllProfiles = false;
            if (pName !== curProfName) {
              p[moduleName].items[existingIdx].enabled = 0;
            }
          }
        }
      });

      if (state.config[moduleName] && Array.isArray(state.config[moduleName].items)) {
        const mem = state.config[moduleName].items.find(i => i.id === itemId);
        if (mem) {
          mem.forcedAllProfiles = newForcedState;
          if (newForcedState) mem.enabled = 1;
        }
      }

      if (info.cardEl) {
        updateCardProfileBadges(info.cardEl, moduleName, itemId);
        if (newForcedState) {
          info.cardEl.classList.remove('is-disabled');
          const sw = info.cardEl.querySelector('.toggle-checkbox');
          if (sw) sw.checked = true;
          const badge = info.cardEl.querySelector('.trigger-badge');
          if (badge) badge.classList.remove('is-disabled');
        }
      }

      showToast(newForcedState
        ? `⚡ "${info.title}" is now forced on ALL profiles!`
        : `"${info.title}" will now run only in "${curProfName}".`
      );
    } else if (info.type === 'feature') {
      const { moduleName, featureKey } = info;
      if (!state.config.forcedFeatures) state.config.forcedFeatures = {};
      const fId = `${moduleName}.${featureKey}`;
      state.config.forcedFeatures[fId] = newForcedState;

      Object.keys(profiles).forEach(pName => {
        const p = profiles[pName];
        if (!p[moduleName]) p[moduleName] = {};
        if (newForcedState) {
          p[moduleName][featureKey] = 1;
          p[moduleName].forcedAllProfiles = p[moduleName].forcedAllProfiles || {};
          p[moduleName].forcedAllProfiles[featureKey] = true;
        } else {
          if (p[moduleName].forcedAllProfiles) {
            delete p[moduleName].forcedAllProfiles[featureKey];
          }
          if (pName !== curProfName) {
            p[moduleName][featureKey] = 0;
          }
        }
      });

      if (state.config[moduleName]) {
        if (newForcedState) state.config[moduleName][featureKey] = 1;
      }

      if (info.switchEl) {
        if (newForcedState) {
          info.switchEl.checked = true;
          const col = info.switchEl.closest('.mg-column, .wm-card');
          if (col) col.classList.remove('is-disabled');
        }
      }

      updateAllFeatureProfileBadges();

      showToast(newForcedState
        ? `⚡ "${info.title}" is now forced on ALL profiles!`
        : `"${info.title}" will now run only in "${curProfName}".`
      );
    }

    saveCurrentProfileState();
    syncConfig();
    updateGlobalIndicators();
  }

  function initScriptContextMenu() {
    const menu = document.getElementById('scriptContextMenu');
    const btnForce = document.getElementById('btnCtxForceAllProfiles');
    const btnToggle = document.getElementById('btnCtxToggleScript');

    if (btnForce) {
      btnForce.addEventListener('click', (e) => {
        e.stopPropagation();
        if (activeScriptContextInfo) {
          toggleForceScript(activeScriptContextInfo);
        }
        closeScriptContextMenu();
      });
    }

    if (btnToggle) {
      btnToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        if (activeScriptContextInfo && activeScriptContextInfo.switchEl) {
          activeScriptContextInfo.switchEl.checked = !activeScriptContextInfo.switchEl.checked;
          activeScriptContextInfo.switchEl.dispatchEvent(new Event('change'));
        }
        closeScriptContextMenu();
      });
    }

    function onDismissScriptMenu(e) {
      if (menu && menu.classList.contains('is-visible') && !menu.contains(e.target)) {
        closeScriptContextMenu();
      }
    }
    document.addEventListener('pointerdown', onDismissScriptMenu, true);
    document.addEventListener('mousedown', onDismissScriptMenu, true);
    document.addEventListener('click', onDismissScriptMenu, true);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeScriptContextMenu();
    });

    window.addEventListener('resize', closeScriptContextMenu);
    window.addEventListener('scroll', closeScriptContextMenu, true);
  }

  function addItemAcrossProfiles(moduleName, item) {
    if (state.config && state.config.profiles) {
      const currentProf = state.config.activeProfile || 'Default';
      Object.keys(state.config.profiles).forEach(pName => {
        if (pName !== currentProf) {
          const prof = state.config.profiles[pName];
          if (prof && prof[moduleName] && Array.isArray(prof[moduleName].items)) {
            if (!prof[moduleName].items.some(i => i.id === item.id)) {
              prof[moduleName].items.unshift({ ...JSON.parse(JSON.stringify(item)), enabled: 0 });
            }
          }
        }
      });
    }
  }

  function deleteItemAcrossProfiles(moduleName, itemId) {
    if (state.config && state.config.profiles) {
      Object.keys(state.config.profiles).forEach(pName => {
        const prof = state.config.profiles[pName];
        if (prof && prof[moduleName] && Array.isArray(prof[moduleName].items)) {
          prof[moduleName].items = prof[moduleName].items.filter(i => i.id !== itemId);
        }
      });
    }
  }

  function updateItemAcrossProfiles(moduleName, updatedItem) {
    if (state.config && state.config.profiles) {
      const currentProf = state.config.activeProfile || 'Default';
      Object.keys(state.config.profiles).forEach(pName => {
        if (pName !== currentProf) {
          const prof = state.config.profiles[pName];
          if (prof && prof[moduleName] && Array.isArray(prof[moduleName].items)) {
            const idx = prof[moduleName].items.findIndex(i => i.id === updatedItem.id);
            if (idx !== -1) {
              const prevEnabled = prof[moduleName].items[idx].enabled;
              prof[moduleName].items[idx] = { ...JSON.parse(JSON.stringify(updatedItem)), enabled: prevEnabled };
            }
          }
        }
      });
    }
  }

  function updateAutoClickerUI() {
    const ac = (state.config && state.config.autoClicker) || {};
    if (acCpsSlider) {
      acCpsSlider.value = ac.cps || 20;
      if (acCpsValue) acCpsValue.textContent = `${ac.cps || 20} CPS`;
      updateSliderProgress(acCpsSlider);
    }
    if (acButtonSelector) {
      acButtonSelector.querySelectorAll('.ac-pill-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.val === ac.button);
      });
    }
    if (acTypeSelector) {
      acTypeSelector.querySelectorAll('.ac-pill-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.val === ac.clickType);
      });
    }
    if (acHotkeyInput) {
      acHotkeyInput.value = ac.hotkey || 'F8';
    }
  }

  let profileModalMode = 'add'; // 'add' | 'edit' | 'rename' | 'delete'
  let cachedRunningApps = [];

  // Profile Trigger Mode: 'off' | 'focus' | 'hover'
  let modalTriggerMode = 'focus';
  let modalLastActiveTrigger = 'focus';

  function updateProfileTriggerModeUI(mode) {
    if (mode === 'off' || mode === 'focus' || mode === 'hover') {
      modalTriggerMode = mode;
      if (mode !== 'off') modalLastActiveTrigger = mode;
    } else if (typeof mode === 'boolean') {
      modalTriggerMode = mode ? modalLastActiveTrigger : 'off';
    }

    const profSwitchAutoSwitch = document.getElementById('profSwitchAutoSwitch');
    const chipTriggerFocus = document.getElementById('chipTriggerFocus');
    const chipTriggerHover = document.getElementById('chipTriggerHover');
    const profAutoSwitchPills = document.getElementById('profAutoSwitchPills');
    const profTriggerDesc = document.getElementById('profTriggerDesc');

    const isAutoOn = (modalTriggerMode !== 'off');
    if (profSwitchAutoSwitch) {
      profSwitchAutoSwitch.checked = isAutoOn;
    }

    if (profAutoSwitchPills) {
      profAutoSwitchPills.classList.toggle('disabled-pills', !isAutoOn);
    }

    if (chipTriggerFocus) {
      chipTriggerFocus.classList.toggle('active', modalTriggerMode === 'focus');
    }
    if (chipTriggerHover) {
      chipTriggerHover.classList.toggle('active', modalTriggerMode === 'hover');
    }

    if (profTriggerDesc) {
      if (!isAutoOn) {
        profTriggerDesc.textContent = 'Disabled. This profile will only be activated manually.';
      } else if (modalTriggerMode === 'focus') {
        profTriggerDesc.textContent = 'Active. Automatically switches to this profile whenever its target window gains focus.';
      } else if (modalTriggerMode === 'hover') {
        profTriggerDesc.textContent = 'Active. Automatically switches to this profile whenever your mouse cursor hovers over its window.';
      }
    }
  }

  function openProfileModal(mode) {
    profileModalMode = mode;
    const curName = (state.config && state.config.activeProfile) || 'Default';
    if (!profileModal) return;

    const profileConfigCard = document.getElementById('profileConfigCard');
    const profileDeleteNotice = document.getElementById('profileDeleteNotice');
    const profileNameGroup = document.getElementById('profileNameGroup');
    const defaultProfileBadgeNotice = document.getElementById('defaultProfileBadgeNotice');
    const profileExeGroup = document.getElementById('profileExeGroup');
    const profHoverRow = document.getElementById('profHoverRow');
    const profOsdRow = document.getElementById('profOsdRow');
    const profileAppsColumn = document.getElementById('profileAppsColumn');
    const profileInfoTip = document.getElementById('profileInfoTip');

    const profInputExe = document.getElementById('profInputExe');
    const profSwitchOsdIcon = document.getElementById('profSwitchOsdIcon');
    const runningAppsFilterInput = document.getElementById('runningAppsFilterInput');

    if (runningAppsFilterInput) runningAppsFilterInput.value = '';

    const isCompact = (mode === 'delete' || mode === 'rename');
    profileModal.classList.toggle('has-mode-delete', isCompact);

    if (mode === 'delete') {
      if (profileConfigCard) {
        profileConfigCard.classList.add('mode-delete');
        profileConfigCard.classList.remove('is-default-mode');
      }
      if (profileModalTitle) profileModalTitle.textContent = 'DELETE PROFILE';
      if (profileDeleteNotice) profileDeleteNotice.classList.remove('hidden-field');
      if (profileModalDesc) profileModalDesc.textContent = `Are you sure you want to delete profile "${curName}"?`;
      if (profileNameGroup) profileNameGroup.classList.add('hidden-field');
      if (defaultProfileBadgeNotice) defaultProfileBadgeNotice.classList.add('hidden-field');
      if (profileExeGroup) profileExeGroup.classList.add('hidden-field');
      if (profHoverRow) profHoverRow.classList.add('hidden-field');
      if (profOsdRow) profOsdRow.classList.add('hidden-field');
      if (profileAppsColumn) profileAppsColumn.classList.add('hidden-field');
      if (profileInfoTip) profileInfoTip.classList.add('hidden-field');
      if (btnConfirmProfileModal) {
        btnConfirmProfileModal.textContent = 'Delete Profile';
        btnConfirmProfileModal.classList.add('danger');
      }
    } else {
      const isDefault = (mode === 'edit' && curName === 'Default');
      if (profileConfigCard) {
        profileConfigCard.classList.toggle('mode-delete', isCompact);
        profileConfigCard.classList.toggle('is-default-mode', isDefault);
      }
      if (profileDeleteNotice) profileDeleteNotice.classList.add('hidden-field');
      if (profileNameGroup) profileNameGroup.classList.remove('hidden-field');
      if (profileExeGroup) profileExeGroup.classList.remove('hidden-field');
      if (profHoverRow) profHoverRow.classList.remove('hidden-field');
      if (profOsdRow) profOsdRow.classList.remove('hidden-field');
      if (profileAppsColumn) profileAppsColumn.classList.remove('hidden-field');
      if (profileInfoTip) profileInfoTip.classList.remove('hidden-field');
      if (btnConfirmProfileModal) {
        btnConfirmProfileModal.classList.remove('danger');
      }

      if (defaultProfileBadgeNotice) {
        defaultProfileBadgeNotice.classList.toggle('hidden-field', !isDefault);
      }
      if (profileExeGroup) {
        profileExeGroup.style.display = isDefault ? 'none' : 'flex';
      }
      if (profHoverRow) {
        profHoverRow.style.display = 'flex';
      }
      if (profOsdRow) {
        profOsdRow.style.display = isDefault ? 'none' : 'flex';
      }
      if (profileAppsColumn) {
        profileAppsColumn.style.display = isDefault ? 'none' : 'flex';
      }

      if (mode === 'add') {
        if (profileModalTitle) profileModalTitle.textContent = 'CREATE APP PROFILE';
        if (profileNameInput) {
          profileNameInput.value = '';
          profileNameInput.disabled = false;
          profileNameInput.placeholder = 'e.g. Chrome, Blender, Gaming, VS Code...';
        }
        if (profInputExe) {
          profInputExe.value = '';
          profInputExe.disabled = false;
        }
        updateProfileTriggerModeUI('focus');
        if (profSwitchOsdIcon) profSwitchOsdIcon.checked = true;
        if (btnConfirmProfileModal) btnConfirmProfileModal.textContent = 'Create Profile';
      } else if (mode === 'edit') {
        if (profileModalTitle) profileModalTitle.textContent = `CONFIGURE PROFILE: ${curName}`;
        if (profileNameInput) {
          profileNameInput.value = curName;
          profileNameInput.disabled = isDefault;
        }
        const prof = (state.config.profiles && state.config.profiles[curName]) || {};
        if (profInputExe) {
          profInputExe.value = prof.targetExe || '';
          profInputExe.disabled = isDefault;
        }

        const triggerEnabled = (typeof prof.switchTriggerEnabled !== 'undefined')
          ? Boolean(prof.switchTriggerEnabled)
          : true;

        let triggerMode = 'focus';
        if (!triggerEnabled) {
          triggerMode = 'off';
        } else if (prof.switchOnHover) {
          triggerMode = 'hover';
        } else {
          triggerMode = 'focus';
        }

        updateProfileTriggerModeUI(triggerMode);
        if (profSwitchOsdIcon) {
          profSwitchOsdIcon.checked = typeof prof.showOsdIcon !== 'undefined' ? Boolean(prof.showOsdIcon) : true;
        }
        if (btnConfirmProfileModal) btnConfirmProfileModal.textContent = 'Save Changes';
      } else if (mode === 'rename') {
        if (profileModalTitle) profileModalTitle.textContent = 'RENAME PROFILE';
        if (profileNameInput) {
          profileNameInput.value = curName;
          profileNameInput.disabled = false;
        }
        if (profileExeGroup) profileExeGroup.classList.add('hidden-field');
        if (profHoverRow) profHoverRow.classList.add('hidden-field');
        if (profOsdRow) profOsdRow.classList.add('hidden-field');
        if (profileAppsColumn) profileAppsColumn.classList.add('hidden-field');
        if (profileInfoTip) profileInfoTip.classList.add('hidden-field');
        if (btnConfirmProfileModal) btnConfirmProfileModal.textContent = 'Rename';
      }

      // Render immediately if cached running apps exist, then request fresh scan
      if (cachedRunningApps && cachedRunningApps.length > 0) {
        renderRunningAppsList();
      }
      sendToAhk('getRunningApps');
    }

    profileModal.style.display = '';
    profileModal.classList.remove('hidden-field');
    if (mode === 'add' && profileNameInput) {
      setTimeout(() => profileNameInput.focus(), 60);
    }
  }

  function closeProfileModal() {
    if (profileModal) {
      profileModal.classList.add('hidden-field');
      profileModal.style.display = 'none';
      profileModal.classList.remove('has-mode-delete');
    }
    const profileConfigCard = document.getElementById('profileConfigCard');
    if (profileConfigCard) {
      profileConfigCard.classList.remove('mode-delete');
      profileConfigCard.classList.remove('is-default-mode');
    }
    if (btnConfirmProfileModal) {
      btnConfirmProfileModal.classList.remove('danger');
      btnConfirmProfileModal.textContent = 'Save Profile';
    }
  }

  function handleProfileModalConfirm() {
    const curName = (state.config && state.config.activeProfile) || 'Default';
    const profInputExe = document.getElementById('profInputExe');
    const profSwitchOsdIcon = document.getElementById('profSwitchOsdIcon');
    const profSwitchAutoSwitch = document.getElementById('profSwitchAutoSwitch');

    const targetExe = profInputExe ? profInputExe.value.trim() : '';
    const switchTriggerEnabled = profSwitchAutoSwitch ? Boolean(profSwitchAutoSwitch.checked) : (modalTriggerMode !== 'off');
    const switchOnFocus = (modalTriggerMode === 'focus');
    const switchOnHover = (modalTriggerMode === 'hover');
    const showOsdIcon = profSwitchOsdIcon ? profSwitchOsdIcon.checked : true;

    if (profileModalMode === 'add') {
      const name = profileNameInput ? profileNameInput.value.trim() : '';
      if (!name) {
        if (profileNameInput) profileNameInput.focus();
        showToast('Please enter a name for the profile');
        return;
      }
      if (createNewProfile(name, targetExe, switchOnHover, showOsdIcon, switchTriggerEnabled, switchOnFocus)) {
        closeProfileModal();
      }
    } else if (profileModalMode === 'edit') {
      const newName = profileNameInput ? profileNameInput.value.trim() : curName;
      if (curName !== 'Default' && newName && newName !== curName) {
        renameProfile(curName, newName);
      }
      const actualName = (curName !== 'Default' && newName) ? newName : curName;
      if (updateProfileSettings(actualName, targetExe, switchOnHover, showOsdIcon, switchTriggerEnabled, switchOnFocus)) {
        closeProfileModal();
      }
    } else if (profileModalMode === 'rename') {
      const name = profileNameInput ? profileNameInput.value.trim() : '';
      if (!name) {
        if (profileNameInput) profileNameInput.focus();
        return;
      }
      if (renameProfile(curName, name)) {
        closeProfileModal();
      }
    } else if (profileModalMode === 'delete') {
      try {
        deleteProfile(curName);
      } finally {
        closeProfileModal();
      }
    }
  }

  function renderRunningAppsList(apps) {
    if (Array.isArray(apps)) cachedRunningApps = apps;
    const container = document.getElementById('runningAppsList');
    if (!container) return;

    const filterInput = document.getElementById('runningAppsFilterInput');
    const filter = (filterInput ? filterInput.value : '').trim().toLowerCase();

    const profInputExe = document.getElementById('profInputExe');
    const rawExeVal = profInputExe ? profInputExe.value : '';
    const selectedExes = rawExeVal.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);

    const filtered = (cachedRunningApps || []).filter(app => {
      if (!filter) return true;
      const t = (app.title || '').toLowerCase();
      const p = (app.process || '').toLowerCase();
      return t.includes(filter) || p.includes(filter);
    });

    if (filtered.length === 0) {
      container.innerHTML = `<div class="apps-empty-state">${cachedRunningApps.length === 0 ? 'No open eligible application windows found.' : 'No open windows match filter.'}</div>`;
      return;
    }

    container.innerHTML = '';
    filtered.forEach(app => {
      const cleanProc = (app.process || '').replace(/\.exe$/i, '');
      const isSelected = selectedExes.includes((app.process || '').toLowerCase());

      const card = document.createElement('div');
      card.className = `running-app-item-card ${isSelected ? 'is-selected' : ''}`;
      card.setAttribute('data-process', (app.process || '').toLowerCase());
      card.title = `${app.title}\nExecutable: ${app.process}\nClick to toggle binding for this profile`;

      card.innerHTML = `
        <div class="app-icon-thumb-box">
          <img class="app-icon-thumb-img" src="icons/${encodeURIComponent(cleanProc)}.png" alt="${cleanProc}" onerror="this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.style.display='flex';" />
          <div class="app-icon-thumb-fallback" style="display: none;">
            <svg class="icon-svg-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="8" y1="21" x2="16" y2="21"></line>
              <line x1="12" y1="17" x2="12" y2="21"></line>
            </svg>
          </div>
        </div>
        <div class="app-item-info">
          <div class="app-item-title-row">
            <span class="app-item-title">${escapeHtml(app.title || cleanProc)}</span>
            <span class="app-item-badge-assigned">
              <svg class="icon-svg-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg> Assigned
            </span>
          </div>
          <span class="app-item-exe-name">${escapeHtml(app.process || '')}</span>
        </div>
      `;

      card.addEventListener('click', () => {
        if (!profInputExe || profInputExe.disabled) return;
        const curList = profInputExe.value.split(',').map(s => s.trim()).filter(Boolean);
        const lowerList = curList.map(s => s.toLowerCase());
        const procLower = (app.process || '').toLowerCase();

        if (lowerList.includes(procLower)) {
          const updated = curList.filter(s => s.toLowerCase() !== procLower);
          profInputExe.value = updated.join(', ');
          card.classList.remove('is-selected');
        } else {
          curList.push(app.process);
          profInputExe.value = curList.join(', ');
          card.classList.add('is-selected');
        }

        // Auto-fill profile name if it's currently empty and in create mode
        if (profileModalMode === 'add' && profileNameInput && !profileNameInput.value.trim()) {
          profileNameInput.value = cleanProc.charAt(0).toUpperCase() + cleanProc.slice(1);
        }
      });

      container.appendChild(card);
    });
  }

  // ============================================================================
  // Tab Management
  // ============================================================================

  function updateTabsScrollButtons() {
    const bar = document.getElementById('segmentedBar');
    const btnLeft = document.getElementById('btnScrollTabsLeft');
    const btnRight = document.getElementById('btnScrollTabsRight');
    if (!bar) return;

    const isOverflowing = bar.scrollWidth > (bar.clientWidth + 4);
    if (btnLeft) {
      btnLeft.style.display = isOverflowing ? 'flex' : 'none';
      btnLeft.classList.toggle('disabled-scroll', bar.scrollLeft <= 2);
    }
    if (btnRight) {
      btnRight.style.display = isOverflowing ? 'flex' : 'none';
      btnRight.classList.toggle('disabled-scroll', bar.scrollLeft + bar.clientWidth >= bar.scrollWidth - 2);
    }
  }

  function updateSegmentedGlider(instant = false) {
    const segmentedBar = document.getElementById('segmentedBar');
    const glider = document.getElementById('segmentedGlider');
    if (!segmentedBar || !glider) return;

    const activeBtn = segmentedBar.querySelector('.segment-btn.active');
    if (!activeBtn) {
      glider.style.opacity = '0';
      return;
    }

    const left = activeBtn.offsetLeft;
    const width = activeBtn.offsetWidth;

    if (width === 0) {
      requestAnimationFrame(() => updateSegmentedGlider(instant));
      return;
    }

    if (instant) {
      glider.style.transition = 'none';
    } else {
      glider.style.transition = 'transform 0.32s cubic-bezier(0.25, 1, 0.5, 1), width 0.32s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.2s ease';
    }

    glider.style.transform = `translateX(${left}px)`;
    glider.style.width = `${width}px`;
    glider.style.opacity = '1';

    if (instant) {
      glider.offsetHeight;
      glider.style.transition = '';
    }

    updateTabsScrollButtons();
  }

  function switchTab(tabName, shouldSync = true) {
    if (typeof stopActiveBadgeRecording === 'function') stopActiveBadgeRecording(true);
    state.activeTab = tabName;
    const segmentedBar = document.getElementById('segmentedBar');
    let activeBtn = null;
    if (segmentedBar) {
      segmentedBar.querySelectorAll('.segment-btn').forEach(btn => {
        const isMatch = btn.dataset.tab === tabName;
        btn.classList.toggle('active', isMatch);
        if (isMatch) activeBtn = btn;
      });
    } else {
      document.querySelectorAll('.segment-btn').forEach(btn => {
        const isMatch = btn.dataset.tab === tabName;
        btn.classList.toggle('active', isMatch);
        if (isMatch) activeBtn = btn;
      });
    }
    document.querySelectorAll('.module-panel').forEach(panel => {
      panel.classList.toggle('active', panel.id === `panel-${tabName}`);
    });
    if (tabName === 'windowManager' || tabName === 'mouseGestures' || tabName === 'radialMenu') {
      updateAllFeatureProfileBadges();
      if (tabName === 'windowManager') {
        sendToAhk('getActiveAppVolume');
      }
      if (tabName === 'mouseGestures' || tabName === 'radialMenu') {
        refreshAllActionSelects();
      }
    }
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
    updateSegmentedGlider(false);
    if (shouldSync && isInitialized) {
      syncConfig();
    }
  }

  // ============================================================================
  // Module 1: Text Expander (with Multiline Support)
  // ============================================================================

  function toggleMultiline(force) {
    state.isMultiline = typeof force === 'boolean' ? force : !state.isMultiline;
    teToggleMultiline.classList.toggle('active', state.isMultiline);

    if (state.isMultiline) {
      teOutputContainer.classList.add('multiline-active');
      teInputOutput.classList.add('hidden-field');
      teTextareaOutput.classList.remove('hidden-field');
      if (teInputOutput.value && !teTextareaOutput.value) {
        teTextareaOutput.value = teInputOutput.value;
      }
      teTextareaOutput.focus();
    } else {
      teOutputContainer.classList.remove('multiline-active');
      teTextareaOutput.classList.add('hidden-field');
      teInputOutput.classList.remove('hidden-field');
      if (teTextareaOutput.value && !teInputOutput.value) {
        teInputOutput.value = teTextareaOutput.value.replace(/\n/g, ' ');
      }
      teInputOutput.focus();
    }
  }

  function renderTextExpander() {
    teShortcutsContainer.innerHTML = '';
    const items = state.config.textExpander.items || [];
    const query = (teSearchFilter.value || '').toLowerCase();

    const filtered = items.filter(item => {
      if (!query) return true;
      return item.input.toLowerCase().includes(query) || item.output.toLowerCase().includes(query);
    });

    if (filtered.length === 0) {
      teShortcutsContainer.innerHTML = `
        <div class="empty-state">
          <span>No text expanders configured</span>
          <span style="font-size: 11px;">Type trigger & snippet above and click GO</span>
        </div>
      `;
      return;
    }

    filtered.forEach(item => {
      const isEnabled = item.enabled !== false && item.enabled !== 0;
      const card = document.createElement('div');
      card.className = `shortcut-card ${isEnabled ? '' : 'is-disabled'} ${state.editingTeId === item.id ? 'editing' : ''}`;
      card.dataset.module = 'textExpander';
      card.dataset.id = item.id;

      const isMulti = item.multiline || item.output.includes('\n');
      const previewText = item.output.replace(/\n/g, ' \\n ');
      const profileBadgesHtml = renderItemProfileBadges('textExpander', item.id);

      card.innerHTML = `
        <div class="card-info">
          <span class="trigger-badge ${isEnabled ? '' : 'is-disabled'}">${escapeHtml(item.input)}</span>
          <span class="arrow-divider"><svg class="arrow-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg></span>
          <span class="expansion-text" title="${escapeHtml(item.output)}">${escapeHtml(previewText)}</span>
          ${isMulti ? '<span class="multiline-badge">Multiline</span>' : ''}
        </div>
        ${profileBadgesHtml}
        <div class="card-actions">
          <button class="card-btn btn-copy" title="Copy Replacement" data-id="${item.id}">
            <svg style="width:14px;height:14px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
          <button class="card-btn btn-edit" title="Edit Snippet" data-id="${item.id}">
            <svg style="width:14px;height:14px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button class="card-btn btn-delete" title="Delete Snippet" data-id="${item.id}">
            <svg style="width:14px;height:14px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
          <div class="toggle-wrapper" title="Enable / Disable Text Expander">
            <input class="toggle-checkbox te-switch" type="checkbox" ${isEnabled ? 'checked' : ''}>
            <div class="toggle-container">
              <div class="toggle-button"></div>
            </div>
          </div>
        </div>
      `;

      card.querySelector('.btn-copy').addEventListener('click', (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(item.output);
      });

      card.querySelector('.btn-edit').addEventListener('click', (e) => {
        e.stopPropagation();
        startEditTe(item);
      });

      card.querySelector('.btn-delete').addEventListener('click', (e) => {
        e.stopPropagation();
        deleteTe(item.id);
      });

      // Toggle switch logic
      const sw = card.querySelector('.te-switch');
      const badge = card.querySelector('.trigger-badge');
      sw.addEventListener('change', () => {
        const isChecked = sw.checked;
        item.enabled = isChecked ? 1 : 0;
        card.classList.toggle('is-disabled', !isChecked);
        if (badge) badge.classList.toggle('is-disabled', !isChecked);
        syncConfig();
        updateCardProfileBadges(card, 'textExpander', item.id);
        updateGlobalIndicators();
      });

      card.addEventListener('click', (e) => {
        if (
          e.target.closest('.card-btn') ||
          e.target.closest('.toggle-wrapper') ||
          e.target.closest('.item-profiles-badges') ||
          e.target.closest('.item-profile-badge') ||
          e.target.closest('.item-profile-badge')
        ) return;
        sw.checked = !sw.checked;
        sw.dispatchEvent(new Event('change'));
      });

      teShortcutsContainer.appendChild(card);
    });
  }

  function submitTextExpander() {
    const trigger = teInputTrigger.value.trim();
    const output = state.isMultiline ? teTextareaOutput.value : teInputOutput.value;

    if (!trigger) {
      teInputTrigger.focus();
      return;
    }
    if (!output) {
      if (state.isMultiline) teTextareaOutput.focus();
      else teInputOutput.focus();
      return;
    }

    const items = state.config.textExpander.items;
    const isMulti = state.isMultiline || output.includes('\n');

    if (state.editingTeId) {
      const idx = items.findIndex(s => s.id === state.editingTeId);
      if (idx !== -1) {
        items[idx].input = trigger;
        items[idx].output = output;
        items[idx].multiline = isMulti;
        updateItemAcrossProfiles('textExpander', items[idx]);
      }
      state.editingTeId = null;
      teBtnSubmitText.textContent = 'GO';
    } else {
      const exists = items.find(s => s.input.toLowerCase() === trigger.toLowerCase());
      if (exists) {
        exists.output = output;
        exists.multiline = isMulti;
        updateItemAcrossProfiles('textExpander', exists);
      } else {
        const newItem = {
          id: 'te-' + Date.now(),
          input: trigger,
          output: output,
          multiline: isMulti,
          enabled: 1
        };
        items.unshift(newItem);
        addItemAcrossProfiles('textExpander', newItem);
      }
    }

    teInputTrigger.value = '';
    teInputOutput.value = '';
    teTextareaOutput.value = '';
    toggleMultiline(false);
    teInputTrigger.focus();

    renderTextExpander();
    syncConfig();
  }

  function startEditTe(item) {
    state.editingTeId = item.id;
    teInputTrigger.value = item.input;
    if (item.multiline || item.output.includes('\n')) {
      toggleMultiline(true);
      teTextareaOutput.value = item.output;
      teTextareaOutput.focus();
    } else {
      toggleMultiline(false);
      teInputOutput.value = item.output;
      teInputOutput.focus();
    }
    teBtnSubmitText.textContent = 'SAVE';
    renderTextExpander();
  }

  function deleteTe(id) {
    deleteItemAcrossProfiles('textExpander', id);
    state.config.textExpander.items = state.config.textExpander.items.filter(s => s.id !== id);
    if (state.editingTeId === id) {
      state.editingTeId = null;
      teInputTrigger.value = '';
      teInputOutput.value = '';
      teTextareaOutput.value = '';
      teBtnSubmitText.textContent = 'GO';
    }
    renderTextExpander();
    syncConfig();
  }

  // ============================================================================
  // Module 2: Key Remapper
  // ============================================================================

  function normalizeKeySource(src) {
    if (!src) return '';
    let s = String(src).trim().toLowerCase();

    // Expand leading AHK modifier symbols (^, !, +, #) if present
    if (/^[\^!+#]+/.test(s)) {
      const modMap = { '^': 'ctrl', '!': 'alt', '+': 'shift', '#': 'win' };
      const mods = [];
      let i = 0;
      while (i < s.length && modMap[s[i]]) {
        mods.push(modMap[s[i]]);
        i++;
      }
      const rest = s.slice(i).trim();
      if (rest) {
        mods.push(rest);
        s = mods.join('+');
      }
    }

    const tokens = s.split(/\s*\+\s*/).map(t => t.trim()).filter(Boolean);
    const modOrder = { 'ctrl': 1, 'control': 1, 'alt': 2, 'shift': 3, 'win': 4, 'meta': 4 };
    const mods = [];
    const keys = [];
    tokens.forEach(tok => {
      const canon = tok.toLowerCase();
      if (modOrder[canon]) {
        mods.push(canon === 'control' ? 'ctrl' : (canon === 'meta' ? 'win' : canon));
      } else {
        keys.push(canon);
      }
    });
    mods.sort((a, b) => modOrder[a] - modOrder[b]);
    return [...mods, ...keys].join('+');
  }

  function formatKeyDisplay(raw) {
    if (!raw || typeof raw !== 'string') return '';
    let s = raw.trim();
    if (!s) return '';
    if (s.startsWith('@') || s.startsWith(':*:') || s.startsWith('::')) return s;

    // Strip AHK hook/modifier prefixes like *, $, ~
    s = s.replace(/^[\*\$~]+/, '');

    const mods = [];
    let rest = s;
    const ahkModPattern = /^([<>]*[\^!+#]+)(.+)$/;
    const match = rest.match(ahkModPattern);
    if (match) {
      const syms = match[1];
      rest = match[2];
      for (let i = 0; i < syms.length; i++) {
        const ch = syms[i];
        if (ch === '^' && !mods.includes('Ctrl')) mods.push('Ctrl');
        else if (ch === '!' && !mods.includes('Alt')) mods.push('Alt');
        else if (ch === '+' && !mods.includes('Shift')) mods.push('Shift');
        else if (ch === '#' && !mods.includes('Win')) mods.push('Win');
      }
    }

    const tokens = rest.split(/\s*\+\s*/).map(t => t.trim()).filter(Boolean);
    const keys = [];
    const keyMap = {
      'ctrl': 'Ctrl', 'control': 'Ctrl',
      'alt': 'Alt', 'menu': 'Alt',
      'shift': 'Shift',
      'win': 'Win', 'windows': 'Win', 'meta': 'Win', 'cmd': 'Win',
      'capslock': 'CapsLock',
      'space': 'Space',
      'esc': 'Esc', 'escape': 'Esc',
      'enter': 'Enter', 'return': 'Enter',
      'tab': 'Tab',
      'backspace': 'Backspace', 'bs': 'Backspace',
      'delete': 'Delete', 'del': 'Del',
      'insert': 'Insert', 'ins': 'Ins',
      'home': 'Home', 'end': 'End',
      'pgup': 'PgUp', 'pageup': 'PgUp',
      'pgdn': 'PgDn', 'pagedown': 'PgDn',
      'up': 'Up', 'down': 'Down', 'left': 'Left', 'right': 'Right'
    };

    tokens.forEach(tok => {
      const lower = tok.toLowerCase();
      if (lower === 'ctrl' || lower === 'control') {
        if (!mods.includes('Ctrl')) mods.push('Ctrl');
      } else if (lower === 'alt' || lower === 'menu') {
        if (!mods.includes('Alt')) mods.push('Alt');
      } else if (lower === 'shift') {
        if (!mods.includes('Shift')) mods.push('Shift');
      } else if (lower === 'win' || lower === 'windows' || lower === 'meta' || lower === 'cmd') {
        if (!mods.includes('Win')) mods.push('Win');
      } else if (keyMap[lower]) {
        keys.push(keyMap[lower]);
      } else if (tok.length === 1) {
        keys.push(tok.toUpperCase());
      } else if (/^f\d{1,2}$/i.test(tok)) {
        keys.push(tok.toUpperCase());
      } else {
        keys.push(tok);
      }
    });

    const order = { 'Ctrl': 1, 'Alt': 2, 'Shift': 3, 'Win': 4 };
    mods.sort((a, b) => (order[a] || 99) - (order[b] || 99));
    const all = [...mods, ...keys];
    return all.length > 0 ? all.join(' + ') : raw;
  }

  function comboToAhk(combo) {
    if (!combo || typeof combo !== 'string') return '';
    const clean = combo.trim();
    if (!clean) return '';
    if (/^[\$*~<>\^!+#]+[A-Za-z0-9_]+$/.test(clean)) return clean;
    const parts = clean.split('+').map(p => p.trim());
    let mods = '';
    let key = '';
    for (const part of parts) {
      const lower = part.toLowerCase();
      if (lower === 'ctrl' || lower === 'control') mods += '^';
      else if (lower === 'alt' || lower === 'menu') mods += '!';
      else if (lower === 'shift') mods += '+';
      else if (lower === 'win' || lower === 'windows' || lower === 'meta' || lower === 'cmd') mods += '#';
      else {
        key = part;
      }
    }
    if (!key) return clean;
    return mods + key;
  }

  function isSameSourceKey(src1, src2) {
    if (!src1 || !src2) return false;
    return normalizeKeySource(src1) === normalizeKeySource(src2);
  }

  function renderKeyRemapper() {
    krRemapsContainer.innerHTML = '';
    const items = state.config.keyRemapper.items || [];

    if (items.length === 0) {
      krRemapsContainer.innerHTML = `
        <div class="empty-state">
          <span>No key remaps configured</span>
          <span style="font-size: 11px;">Enter source key & target above</span>
        </div>
      `;
      return;
    }

    items.forEach(item => {
      const isEnabled = item.enabled !== false && item.enabled !== 0;
      const card = document.createElement('div');
      card.className = `shortcut-card ${isEnabled ? '' : 'is-disabled'}`;
      card.dataset.module = 'keyRemapper';
      card.dataset.id = item.id;
      const displaySource = formatKeyDisplay(item.source);
      const displayTarget = formatKeyDisplay(item.target);
      const descText = `${displaySource} → ${displayTarget}`;
      const profileBadgesHtml = renderItemProfileBadges('keyRemapper', item.id);
      card.innerHTML = `
        <div class="card-info">
          <span class="trigger-badge ${isEnabled ? '' : 'is-disabled'}">${escapeHtml(displaySource)}</span>
          <span class="arrow-divider"><svg class="arrow-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg></span>
          <span class="expansion-text" title="${escapeHtml(descText)}"><strong>${escapeHtml(displayTarget)}</strong></span>
        </div>
        ${profileBadgesHtml}
        <div class="card-actions">
          <button class="card-btn btn-delete" title="Delete Remap" data-id="${item.id}">
            <svg style="width:14px;height:14px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
          <div class="toggle-wrapper" title="Enable / Disable Key Remap">
            <input class="toggle-checkbox kr-switch" type="checkbox" ${isEnabled ? 'checked' : ''}>
            <div class="toggle-container">
              <div class="toggle-button"></div>
            </div>
          </div>
        </div>
      `;

      card.querySelector('.btn-delete').addEventListener('click', (e) => {
        e.stopPropagation();
        deleteKr(item.id);
      });

      // Toggle switch logic with conflict prevention
      const sw = card.querySelector('.kr-switch');
      const badge = card.querySelector('.trigger-badge');
      sw.addEventListener('change', () => {
        const isChecked = sw.checked;
        if (isChecked) {
          item.enabled = 1;
          // Turn OFF any other active mapping that uses the same source key
          const allItems = state.config.keyRemapper.items || [];
          const conflicting = allItems.filter(other =>
            other.id !== item.id &&
            isSameSourceKey(other.source, item.source) &&
            (other.enabled !== 0 && other.enabled !== false)
          );

          if (conflicting.length > 0) {
            conflicting.forEach(c => {
              c.enabled = 0;
            });
            const conflictNames = conflicting.map(c => `"${formatKeyDisplay(c.source)} → ${formatKeyDisplay(c.target)}"`).join(', ');
            showToast(`Conflict resolved: Turned OFF ${conflictNames}`, 'info');
            renderKeyRemapper();
          } else {
            card.classList.remove('is-disabled');
            if (badge) badge.classList.remove('is-disabled');
          }
        } else {
          item.enabled = 0;
          card.classList.add('is-disabled');
          if (badge) badge.classList.add('is-disabled');
        }

        syncConfig();
        updateCardProfileBadges(card, 'keyRemapper', item.id);
        updateGlobalIndicators();
      });

      card.addEventListener('click', (e) => {
        if (
          e.target.closest('.card-btn') ||
          e.target.closest('.toggle-wrapper') ||
          e.target.closest('.item-profiles-badges') ||
          e.target.closest('.item-profile-badge') ||
          e.target.closest('.item-profile-badge')
        ) return;
        sw.checked = !sw.checked;
        sw.dispatchEvent(new Event('change'));
      });

      krRemapsContainer.appendChild(card);
    });
  }

  function setupKeyCombinationBox(boxEl, inputEl, clearBtn, nextBox, onCommit) {
    if (!boxEl || !inputEl) return;

    let isRecording = false;
    let pendingModifier = null;

    function startRecording() {
      isRecording = true;
      pendingModifier = null;
      boxEl.classList.add('is-recording');
      inputEl.placeholder = 'Press keys...';
    }

    function stopRecording() {
      isRecording = false;
      pendingModifier = null;
      boxEl.classList.remove('is-recording');
      if (!inputEl.value) {
        inputEl.placeholder = 'Click to record...';
      }
      updateClearButton();
    }

    function updateClearButton() {
      if (clearBtn) {
        if (inputEl.value.trim()) {
          clearBtn.classList.remove('hidden-field');
        } else {
          clearBtn.classList.add('hidden-field');
        }
      }
    }

    boxEl.addEventListener('click', (e) => {
      if (e.target === clearBtn) return;
      inputEl.focus();
      startRecording();
    });

    inputEl.addEventListener('focus', () => {
      startRecording();
    });

    inputEl.addEventListener('blur', () => {
      stopRecording();
    });

    if (clearBtn) {
      clearBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        inputEl.value = '';
        inputEl.placeholder = 'Click to record...';
        updateClearButton();
        inputEl.blur();
      });
    }

    inputEl.addEventListener('keydown', (e) => {
      if (!isRecording) startRecording();

      if (e.key === 'Tab') return;

      e.preventDefault();
      e.stopPropagation();

      // Backspace or Delete clears the combination
      if ((e.key === 'Backspace' || e.key === 'Delete') && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        inputEl.value = '';
        updateClearButton();
        return;
      }

      // Enter key commits or advances
      if (e.key === 'Enter') {
        if (inputEl.value.trim()) {
          stopRecording();
          if (nextBox) {
            const nextInput = nextBox.querySelector('input');
            if (nextInput) nextInput.focus();
          } else if (onCommit) {
            onCommit();
          }
        }
        return;
      }

      const isModifier = ['Control', 'Alt', 'Shift', 'Meta', 'OS'].includes(e.key);

      const parts = [];
      if (e.ctrlKey) parts.push('Ctrl');
      if (e.altKey) parts.push('Alt');
      if (e.shiftKey) parts.push('Shift');
      if (e.metaKey) parts.push('Win');

      // Standalone modifier press
      if (isModifier) {
        pendingModifier = e.key === 'Control' ? 'Ctrl' : (e.key === 'Shift' ? 'Shift' : (e.key === 'Alt' ? 'Alt' : 'Win'));
        inputEl.value = parts.join(' + ') + ' + ...';
        return;
      }

      pendingModifier = null;

      let key = e.key;
      if (e.code && e.code.startsWith('Key')) {
        key = e.code.slice(3).toUpperCase();
      } else if (e.code && e.code.startsWith('Digit')) {
        key = e.code.slice(5);
      } else if (e.code && e.code.startsWith('Numpad')) {
        key = e.code;
      } else if (key === ' ') {
        key = 'Space';
      } else if (key === 'Escape' || key === 'Esc') {
        key = 'Escape';
      } else if (key === 'ArrowUp') {
        key = 'Up';
      } else if (key === 'ArrowDown') {
        key = 'Down';
      } else if (key === 'ArrowLeft') {
        key = 'Left';
      } else if (key === 'ArrowRight') {
        key = 'Right';
      } else if (key === 'PageUp') {
        key = 'PgUp';
      } else if (key === 'PageDown') {
        key = 'PgDn';
      } else if (e.code === 'Minus') {
        key = '-';
      } else if (e.code === 'Equal') {
        key = '=';
      } else if (e.code === 'BracketLeft') {
        key = '[';
      } else if (e.code === 'BracketRight') {
        key = ']';
      } else if (e.code === 'Backslash') {
        key = '\\';
      } else if (e.code === 'Semicolon') {
        key = ';';
      } else if (e.code === 'Quote') {
        key = "'";
      } else if (e.code === 'Backquote') {
        key = '`';
      } else if (e.code === 'Comma') {
        key = ',';
      } else if (e.code === 'Period') {
        key = '.';
      } else if (e.code === 'Slash') {
        key = '/';
      } else if (key.length === 1) {
        key = key.toUpperCase();
      }

      if (!parts.includes(key)) {
        parts.push(key);
      }

      const combo = parts.join(' + ');
      inputEl.value = combo;
      updateClearButton();
      stopRecording();

      if (nextBox) {
        const nextInput = nextBox.querySelector('input');
        if (nextInput) {
          setTimeout(() => nextInput.focus(), 50);
        }
      }
    });

    inputEl.addEventListener('keyup', (e) => {
      if (isRecording && pendingModifier) {
        inputEl.value = pendingModifier === 'Control' ? 'Ctrl' : pendingModifier;
        updateClearButton();
        stopRecording();
        pendingModifier = null;
        if (nextBox) {
          const nextInput = nextBox.querySelector('input');
          if (nextInput) {
            setTimeout(() => nextInput.focus(), 50);
          }
        }
      }
    });

    updateClearButton();
  }

  function submitKeyRemapper() {
    const src = krInputSource ? krInputSource.value.trim() : '';
    const tgt = krInputTarget ? krInputTarget.value.trim() : '';

    if (!src) {
      if (krInputSource) krInputSource.focus();
      return;
    }
    if (!tgt) {
      if (krInputTarget) krInputTarget.focus();
      return;
    }

    if (!state.config.keyRemapper) {
      state.config.keyRemapper = { enabled: 1, items: [] };
    }
    if (!Array.isArray(state.config.keyRemapper.items)) {
      state.config.keyRemapper.items = [];
    }

    // Turn off any existing conflicting mappings for the same source key
    const conflicting = state.config.keyRemapper.items.filter(item =>
      isSameSourceKey(item.source, src) && (item.enabled !== 0 && item.enabled !== false)
    );

    if (conflicting.length > 0) {
      conflicting.forEach(item => {
        item.enabled = 0;
      });
      const conflictNames = conflicting.map(c => `"${formatKeyDisplay(c.source)} → ${formatKeyDisplay(c.target)}"`).join(', ');
      showToast(`Conflicting remap ${conflictNames} turned OFF`, 'info');
    }

    const newItem = {
      id: 'kr-' + Date.now(),
      source: src,
      target: tgt,
      name: `${formatKeyDisplay(src)} → ${formatKeyDisplay(tgt)}`,
      enabled: 1
    };
    state.config.keyRemapper.items.unshift(newItem);
    addItemAcrossProfiles('keyRemapper', newItem);

    if (krInputSource) {
      krInputSource.value = '';
      if (krBtnClearSource) krBtnClearSource.classList.add('hidden-field');
    }
    if (krInputTarget) {
      krInputTarget.value = '';
      if (krBtnClearTarget) krBtnClearTarget.classList.add('hidden-field');
    }

    renderKeyRemapper();
    syncConfig();
  }

  function deleteKr(id) {
    deleteItemAcrossProfiles('keyRemapper', id);
    state.config.keyRemapper.items = state.config.keyRemapper.items.filter(s => s.id !== id);
    renderKeyRemapper();
    syncConfig();
  }

  // ============================================================================
  // Module 3: Window Management
  // ============================================================================

  function updateSliderProgress(slider) {
    if (!slider) return;
    const min = parseFloat(slider.min) || 0;
    const max = parseFloat(slider.max) || 100;
    const val = parseFloat(slider.value) || 0;
    const pct = Math.max(0, Math.min(100, ((val - min) / (max - min)) * 100));
    slider.style.setProperty('--progress', `${pct}%`);
  }

  let activeRecordingBadge = null;
  let activeRecordingCleanup = null;

  function stopActiveBadgeRecording(restore = true) {
    if (activeRecordingCleanup) {
      activeRecordingCleanup(restore);
      activeRecordingCleanup = null;
      activeRecordingBadge = null;
    }
  }

  function setupEditableHotkeyBadge(badgeEl, configPropKey, defaultAhkHotkey, onUpdateCallback) {
    if (!badgeEl) return;

    function refreshDisplay() {
      const wm = (state.config && state.config.windowManager) ? state.config.windowManager : {};
      const currentHk = (wm[configPropKey] && String(wm[configPropKey]).trim() !== '')
        ? String(wm[configPropKey]).trim()
        : defaultAhkHotkey;
      badgeEl.textContent = formatKeyDisplay(currentHk);
      badgeEl.title = `Click to change shortcut (Current: ${formatKeyDisplay(currentHk)})`;
    }

    refreshDisplay();
    badgeEl._refreshDisplay = refreshDisplay;

    if (badgeEl.dataset.editableBound) return;
    badgeEl.dataset.editableBound = 'true';

    badgeEl.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();

      if (activeRecordingBadge === badgeEl) {
        stopActiveBadgeRecording(true);
        return;
      }
      stopActiveBadgeRecording(true);

      const wm = (state.config && state.config.windowManager) ? state.config.windowManager : {};
      const originalHk = (wm[configPropKey] && String(wm[configPropKey]).trim() !== '')
        ? String(wm[configPropKey]).trim()
        : defaultAhkHotkey;
      const originalDisplay = formatKeyDisplay(originalHk);

      activeRecordingBadge = badgeEl;
      badgeEl.classList.add('is-recording');
      badgeEl.textContent = 'Press keys...';

      let pendingMod = null;

      function onKeyDown(evt) {
        evt.preventDefault();
        evt.stopPropagation();

        if (evt.key === 'Escape') {
          cleanup(true);
          showToast('Shortcut change cancelled');
          return;
        }

        const isModifier = ['Control', 'Alt', 'Shift', 'Meta', 'OS'].includes(evt.key);
        const parts = [];
        if (evt.ctrlKey) parts.push('Ctrl');
        if (evt.altKey) parts.push('Alt');
        if (evt.shiftKey) parts.push('Shift');
        if (evt.metaKey) parts.push('Win');

        if (isModifier) {
          pendingMod = (evt.key === 'Control') ? 'Ctrl' : ((evt.key === 'Shift') ? 'Shift' : ((evt.key === 'Alt') ? 'Alt' : 'Win'));
          badgeEl.textContent = parts.join(' + ') + ' + ...';
          return;
        }

        pendingMod = null;

        let key = evt.key;
        if (evt.code && evt.code.startsWith('Key')) {
          key = evt.code.slice(3).toUpperCase();
        } else if (evt.code && evt.code.startsWith('Digit')) {
          key = evt.code.slice(5);
        } else if (evt.code && evt.code.startsWith('Numpad')) {
          key = evt.code;
        } else if (key === ' ') {
          key = 'Space';
        } else if (key === 'ArrowUp') {
          key = 'Up';
        } else if (key === 'ArrowDown') {
          key = 'Down';
        } else if (key === 'ArrowLeft') {
          key = 'Left';
        } else if (key === 'ArrowRight') {
          key = 'Right';
        } else if (key === 'PageUp') {
          key = 'PgUp';
        } else if (key === 'PageDown') {
          key = 'PgDn';
        } else if (evt.code === 'Minus') {
          key = '-';
        } else if (evt.code === 'Equal') {
          key = '=';
        } else if (evt.code === 'BracketLeft') {
          key = '[';
        } else if (evt.code === 'BracketRight') {
          key = ']';
        } else if (evt.code === 'Backslash') {
          key = '\\';
        } else if (evt.code === 'Semicolon') {
          key = ';';
        } else if (evt.code === 'Quote') {
          key = "'";
        } else if (evt.code === 'Backquote') {
          key = '`';
        } else if (evt.code === 'Comma') {
          key = ',';
        } else if (evt.code === 'Period') {
          key = '.';
        } else if (evt.code === 'Slash') {
          key = '/';
        } else if (key.length === 1) {
          key = key.toUpperCase();
        }

        if (!parts.includes(key)) {
          parts.push(key);
        }

        const combo = parts.join(' + ');
        const ahkHk = comboToAhk(combo);

        if (!state.config.windowManager) state.config.windowManager = {};
        state.config.windowManager[configPropKey] = ahkHk;

        badgeEl.textContent = formatKeyDisplay(ahkHk);
        cleanup(false);

        saveCurrentProfileState();
        syncConfig();
        showToast(`Shortcut set to: ${formatKeyDisplay(ahkHk)}`);

        if (typeof onUpdateCallback === 'function') {
          onUpdateCallback(ahkHk);
        }
      }

      function onKeyUp(evt) {
        if (pendingMod) {
          const combo = pendingMod;
          const ahkHk = comboToAhk(combo);
          if (!state.config.windowManager) state.config.windowManager = {};
          state.config.windowManager[configPropKey] = ahkHk;
          badgeEl.textContent = formatKeyDisplay(ahkHk);
          cleanup(false);
          saveCurrentProfileState();
          syncConfig();
          showToast(`Shortcut set to: ${formatKeyDisplay(ahkHk)}`);
          if (typeof onUpdateCallback === 'function') {
            onUpdateCallback(ahkHk);
          }
          pendingMod = null;
        }
      }

      function onDocClick(evt) {
        if (!badgeEl.contains(evt.target)) {
          cleanup(true);
        }
      }

      function cleanup(restore) {
        badgeEl.classList.remove('is-recording');
        window.removeEventListener('keydown', onKeyDown, true);
        window.removeEventListener('keyup', onKeyUp, true);
        document.removeEventListener('pointerdown', onDocClick, true);
        if (activeRecordingBadge === badgeEl) {
          activeRecordingBadge = null;
          activeRecordingCleanup = null;
        }
        if (restore) {
          badgeEl.textContent = originalDisplay;
        }
      }

      activeRecordingCleanup = cleanup;
      window.addEventListener('keydown', onKeyDown, true);
      window.addEventListener('keyup', onKeyUp, true);
      setTimeout(() => {
        document.addEventListener('pointerdown', onDocClick, true);
      }, 50);
    });
  }

  function initWindowManager() {
    if (!state.config.windowManager) {
      state.config.windowManager = {};
    }
    const wm = state.config.windowManager;
    if (wmOpacitySlider) {
      wmOpacitySlider.value = wm.opacity || 215;
      updateWmOpacityLabel();
      updateSliderProgress(wmOpacitySlider);

      if (!wmOpacitySlider.dataset.bound) {
        wmOpacitySlider.dataset.bound = 'true';
        wmOpacitySlider.addEventListener('input', () => {
          updateWmOpacityLabel();
          updateSliderProgress(wmOpacitySlider);
        });

        wmOpacitySlider.addEventListener('change', () => {
          state.config.windowManager.opacity = parseInt(wmOpacitySlider.value, 10);
          updateSliderProgress(wmOpacitySlider);
          syncConfig();
        });
      }
    }

    // Wire individual option switches (Uiverse rude-stingray-22)
    const switchDefinitions = [
      { id: 'wmSwitchAlwaysOnTop', badgeId: 'wmBadgeAlwaysOnTop', key: 'alwaysOnTopEnabled' },
      { id: 'wmSwitchCenterWindow', badgeId: 'wmBadgeCenterWindow', key: 'centerWindowEnabled' },
      { id: 'wmSwitchHideWindow', badgeId: 'wmBadgeHideWindow', key: 'hideWindowEnabled' },
      { id: 'wmSwitchTransparencyWheel', badgeId: 'wmBadgeTransparencyWheel', key: 'transparencyWheel' },
      { id: 'wmSwitchAppVolumeWheel', badgeId: 'wmBadgeAppVolumeWheel', key: 'appVolumeWheel' },
      { id: 'wmSwitchAppVolumeMute', badgeId: 'wmBadgeAppVolumeMute', key: 'appVolumeMuteEnabled' },
      { id: 'wmSwitchMasterAudioMute', badgeId: 'wmBadgeMasterAudioMute', key: 'masterAudioMuteEnabled' },
      { id: 'wmSwitchWindowShade', badgeId: 'wmBadgeWindowShade', key: 'windowShadeEnabled' },
      { id: 'wmSwitchBorderless', badgeId: 'wmBadgeBorderless', key: 'borderlessEnabled' },
      { id: 'wmSwitchTextTransform', badgeId: 'wmBadgeUpper', key: 'textTransformEnabled' },
      { id: 'wmSwitchCleanText', badgeId: 'wmBadgeCleanText', key: 'textTransformCleanEnabled' },
      { id: 'wmSwitchScreenOcr', badgeId: 'wmBadgeOcr', key: 'screenOcrEnabled' },
      { id: 'wmSwitchColorPicker', badgeId: 'wmBadgeColorPicker', key: 'colorPickerEnabled' },
      { id: 'wmSwitchVirtualDesktops', badgeId: 'wmBadgeVDesktops', key: 'virtualDesktopsEnabled' },
      { id: 'wmSwitchSleep', badgeId: 'wmBadgeSleep', key: 'sleepEnabled' }
    ];

    switchDefinitions.forEach(({ id, badgeId, key }) => {
      const sw = document.getElementById(id);
      const badge = document.getElementById(badgeId);
      if (!sw) return;

      const currWm = (state.config && state.config.windowManager) ? state.config.windowManager : {};
      const isEnabled = (currWm[key] !== false && currWm[key] !== 0);
      currWm[key] = isEnabled ? 1 : 0;
      sw.checked = isEnabled;
      const card = sw.closest('.wm-card');
      const iconBadge = card ? card.querySelector('.wm-icon-badge') : null;
      if (card) {
        card.classList.toggle('is-disabled', !isEnabled);
      }
      if (badge) {
        badge.classList.toggle('is-disabled', !isEnabled);
      }
      if (id === 'wmSwitchTextTransform') {
        const lowerBadge = document.getElementById('wmBadgeLower');
        const titleBadge = document.getElementById('wmBadgeTitle');
        if (lowerBadge) lowerBadge.classList.toggle('is-disabled', !isEnabled);
        if (titleBadge) titleBadge.classList.toggle('is-disabled', !isEnabled);
      }
      if (iconBadge) {
        iconBadge.classList.toggle('is-disabled', !isEnabled);
      }

      if (!sw.dataset.bound) {
        sw.dataset.bound = 'true';
        sw.addEventListener('change', () => {
          if (!state.config.windowManager) {
            state.config.windowManager = {};
          }
          const isChecked = sw.checked;
          state.config.windowManager[key] = isChecked ? 1 : 0;
          if (card) {
            card.classList.toggle('is-disabled', !isChecked);
          }
          if (badge) {
            badge.classList.toggle('is-disabled', !isChecked);
          }
          if (id === 'wmSwitchTextTransform') {
            const lowerBadge = document.getElementById('wmBadgeLower');
            const titleBadge = document.getElementById('wmBadgeTitle');
            if (lowerBadge) lowerBadge.classList.toggle('is-disabled', !isChecked);
            if (titleBadge) titleBadge.classList.toggle('is-disabled', !isChecked);
          }
          if (iconBadge) {
            iconBadge.classList.toggle('is-disabled', !isChecked);
          }
          saveCurrentProfileState();
          updateAllFeatureProfileBadges();
          updateGlobalIndicators();
          syncConfig();
        });
      }

      if (card && !card.dataset.cardBound) {
        card.dataset.cardBound = 'true';
        card.addEventListener('click', (e) => {
          // If clicked inside the toggle switch itself, let the switch handle it naturally
          if (e.target.closest('.toggle-wrapper')) return;
          // If clicked inside profile badges, let profile badge switch profile
          if (e.target.closest('.item-profiles-badges') || e.target.closest('.item-profile-badge')) return;
          // If clicked inside the ghost sub-checkbox or its label, let ghost mode handle it
          if (e.target.closest('.wm-sub-option') || e.target.closest('.uiverse-checkbox-wrap')) return;
          // If clicked inside any hotkey badge, sub-hotkey tag, chips, sub-controls or sleep controls, do NOT toggle switch
          if (e.target.closest('.wm-hotkey-badge') || e.target.closest('.wm-sub-hotkey-tag') || e.target.closest('.wm-text-transform-chips') || e.target.closest('.sleep-controls-row') || e.target.closest('.wm-sub-controls-row')) return;

          sw.checked = !sw.checked;
          sw.dispatchEvent(new Event('change'));
        });
      }
    });

    // Wire Uiverse bright-rat-5 round checkbox for Click-Through Ghost Mode
    const wmCheckboxGhostMode = document.getElementById('wmCheckboxGhostMode');
    if (wmCheckboxGhostMode) {
      const currWm = (state.config && state.config.windowManager) ? state.config.windowManager : {};
      const isGhost = (currWm.clickThroughGhost === 1 || currWm.clickThroughGhost === true);
      wmCheckboxGhostMode.checked = isGhost;
      const ghostBadge = document.getElementById('wmBadgeGhostMode');
      if (ghostBadge) ghostBadge.classList.toggle('is-disabled', !isGhost);

      if (!wmCheckboxGhostMode.dataset.bound) {
        wmCheckboxGhostMode.dataset.bound = 'true';
        wmCheckboxGhostMode.addEventListener('change', () => {
          if (!state.config.windowManager) state.config.windowManager = {};
          state.config.windowManager.clickThroughGhost = wmCheckboxGhostMode.checked ? 1 : 0;
          if (ghostBadge) ghostBadge.classList.toggle('is-disabled', !wmCheckboxGhostMode.checked);
          syncConfig();
        });
      }
    }

    // Wire Taskbar Scroll Checkbox for Virtual Desktop Navigation
    const wmCheckboxTaskbarScroll = document.getElementById('wmCheckboxTaskbarScroll');
    if (wmCheckboxTaskbarScroll) {
      const currWm = (state.config && state.config.windowManager) ? state.config.windowManager : {};
      const isTaskbar = (currWm.taskbarScrollEnabled !== 0 && currWm.taskbarScrollEnabled !== false);
      wmCheckboxTaskbarScroll.checked = isTaskbar;

      if (!wmCheckboxTaskbarScroll.dataset.bound) {
        wmCheckboxTaskbarScroll.dataset.bound = 'true';
        wmCheckboxTaskbarScroll.addEventListener('change', () => {
          if (!state.config.windowManager) state.config.windowManager = {};
          state.config.windowManager.taskbarScrollEnabled = wmCheckboxTaskbarScroll.checked ? 1 : 0;
          syncConfig();
        });
      }
    }

    // Wire Color Format Dropdown & Launch Picker Button
    const wmSelectColorFormat = document.getElementById('wmSelectColorFormat');
    if (wmSelectColorFormat) {
      const currWm = (state.config && state.config.windowManager) ? state.config.windowManager : {};
      const currFmt = currWm.colorFormat || 'HEX';
      wmSelectColorFormat.value = currFmt;

      if (!wmSelectColorFormat.dataset.bound) {
        wmSelectColorFormat.dataset.bound = 'true';
        wmSelectColorFormat.addEventListener('change', () => {
          if (!state.config.windowManager) state.config.windowManager = {};
          state.config.windowManager.colorFormat = wmSelectColorFormat.value;
          sendToAhk('setColorFormat', { format: wmSelectColorFormat.value });
          syncConfig();
          showToast(`Color format set to ${wmSelectColorFormat.value}`, 'info');
        });
      }
    }

    const btnLaunchColorPicker = document.getElementById('btnLaunchColorPicker');
    if (btnLaunchColorPicker) {
      if (!btnLaunchColorPicker.dataset.bound) {
        btnLaunchColorPicker.dataset.bound = 'true';
        btnLaunchColorPicker.addEventListener('click', (e) => {
          e.stopPropagation();
          sendToAhk('launchColorPicker');
        });
      }
    }

    // Wire Sleep / Hibernate Mode Pill Buttons & Timer
    const btnSleepModeSleep = document.getElementById('btnSleepModeSleep');
    const btnSleepModeHibernate = document.getElementById('btnSleepModeHibernate');
    const wmSleepTimerInput = document.getElementById('wmSleepTimerInput');
    const wmSleepStatusBadge = document.getElementById('wmSleepStatusBadge');
    const wmSleepDesc = document.getElementById('wmSleepDesc');

    function formatMinutesDisplay(minutes, isShort = false) {
      const mins = Math.max(0, parseInt(minutes, 10) || 0);
      if (mins <= 0) return 'Instant';
      if (mins < 60) {
        if (isShort) return `${mins}m`;
        return `${mins} min${mins === 1 ? '' : 's'}`;
      }
      const hrs = Math.floor(mins / 60);
      const remMins = mins % 60;
      if (remMins === 0) {
        if (isShort) return `${hrs}h`;
        return `${hrs} hour${hrs === 1 ? '' : 's'}`;
      }
      if (isShort) return `${hrs}h ${remMins}m`;
      return `${hrs} hour${hrs === 1 ? '' : 's'} ${remMins} min${remMins === 1 ? '' : 's'}`;
    }

    function updateSleepCardUI() {
      const currWm = (state.config && state.config.windowManager) ? state.config.windowManager : {};
      const isHib = (currWm.sleepMode === 'hibernate' || currWm.sleepModeHibernate === 1 || currWm.sleepModeHibernate === true);
      const timerVal = Math.max(0, parseInt(currWm.sleepTimer, 10) || 0);

      if (btnSleepModeSleep) btnSleepModeSleep.classList.toggle('active', !isHib);
      if (btnSleepModeHibernate) btnSleepModeHibernate.classList.toggle('active', isHib);
      if (wmSleepTimerInput && document.activeElement !== wmSleepTimerInput) {
        wmSleepTimerInput.value = timerVal;
      }

      const actionName = isHib ? 'Hibernate' : 'Sleep';
      if (wmSleepStatusBadge) {
        wmSleepStatusBadge.textContent = timerVal > 0
          ? `${actionName} (${formatMinutesDisplay(timerVal, true)})`
          : `Instant ${actionName}`;
      }
      if (wmSleepDesc) {
        const hkDisplay = formatKeyDisplay(currWm.sleepHotkey || '#s');
        wmSleepDesc.textContent = timerVal > 0
          ? `Put PC into ${actionName} after ${formatMinutesDisplay(timerVal, false)} countdown via ${hkDisplay}`
          : `Instantly put PC into ${actionName} using ${hkDisplay}`;
      }
    }

    if (btnSleepModeSleep && !btnSleepModeSleep.dataset.bound) {
      btnSleepModeSleep.dataset.bound = 'true';
      btnSleepModeSleep.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!state.config.windowManager) state.config.windowManager = {};
        state.config.windowManager.sleepMode = 'sleep';
        state.config.windowManager.sleepModeHibernate = 0;
        updateSleepCardUI();
        syncConfig();
      });
    }

    if (btnSleepModeHibernate && !btnSleepModeHibernate.dataset.bound) {
      btnSleepModeHibernate.dataset.bound = 'true';
      btnSleepModeHibernate.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!state.config.windowManager) state.config.windowManager = {};
        state.config.windowManager.sleepMode = 'hibernate';
        state.config.windowManager.sleepModeHibernate = 1;
        updateSleepCardUI();
        syncConfig();
      });
    }

    if (wmSleepTimerInput && !wmSleepTimerInput.dataset.bound) {
      wmSleepTimerInput.dataset.bound = 'true';
      wmSleepTimerInput.addEventListener('input', () => {
        if (!state.config.windowManager) state.config.windowManager = {};
        const v = Math.max(0, parseInt(wmSleepTimerInput.value, 10) || 0);
        state.config.windowManager.sleepTimer = v;
        const isHib = (state.config.windowManager.sleepMode === 'hibernate' || state.config.windowManager.sleepModeHibernate === 1);
        const actionName = isHib ? 'Hibernate' : 'Sleep';
        if (wmSleepStatusBadge) {
          wmSleepStatusBadge.textContent = v > 0
            ? `${actionName} (${formatMinutesDisplay(v, true)})`
            : `Instant ${actionName}`;
        }
        if (wmSleepDesc) {
          const hkDisplay = formatKeyDisplay((state.config.windowManager && state.config.windowManager.sleepHotkey) || '#s');
          wmSleepDesc.textContent = v > 0
            ? `Put PC into ${actionName} after ${formatMinutesDisplay(v, false)} countdown via ${hkDisplay}`
            : `Instantly put PC into ${actionName} using ${hkDisplay}`;
        }
      });
      wmSleepTimerInput.addEventListener('change', () => {
        if (!state.config.windowManager) state.config.windowManager = {};
        const v = Math.max(0, parseInt(wmSleepTimerInput.value, 10) || 0);
        state.config.windowManager.sleepTimer = v;
        updateSleepCardUI();
        syncConfig();
      });
    }

    updateSleepCardUI();

    // Wire Interactive Shortcut Editing for all Window Manager Hotkey Badges
    const EDITABLE_WM_HOTKEY_BADGES = [
      { id: 'wmBadgeAlwaysOnTop', key: 'alwaysOnTopHotkey', def: '^Space' },
      { id: 'wmBadgeCenterWindow', key: 'centerWindowHotkey', def: '^!c' },
      { id: 'wmBadgeHideWindow', key: 'hideWindowHotkey', def: '^!h' },
      { id: 'wmBadgeGhostMode', key: 'clickThroughGhostHotkey', def: '^!g' },
      { id: 'wmBadgeAppVolumeMute', key: 'appVolumeMuteHotkey', def: '!m' },
      { id: 'wmBadgeMasterAudioMute', key: 'masterAudioMuteHotkey', def: '^!m' },
      { id: 'wmBadgeWindowShade', key: 'windowShadeHotkey', def: '^!r' },
      { id: 'wmBadgeBorderless', key: 'borderlessHotkey', def: '^!Enter' },
      { id: 'wmBadgeUpper', key: 'textTransformUpperHotkey', def: '^!u' },
      { id: 'wmBadgeLower', key: 'textTransformLowerHotkey', def: '^!l' },
      { id: 'wmBadgeTitle', key: 'textTransformTitleHotkey', def: '^!t' },
      { id: 'wmBadgeCleanText', key: 'textTransformCleanHotkey', def: '^!k' },
      { id: 'wmBadgeOcr', key: 'screenOcrHotkey', def: '^!o' },
      { id: 'wmBadgeColorPicker', key: 'colorPickerHotkey', def: '^!p' },
      {
        id: 'wmBadgeSleep',
        key: 'sleepHotkey',
        def: '#s',
        onUpdate: () => {
          updateSleepCardUI();
        }
      }
    ];

    EDITABLE_WM_HOTKEY_BADGES.forEach(({ id, key, def, onUpdate }) => {
      const el = document.getElementById(id);
      if (!el) return;
      setupEditableHotkeyBadge(el, key, def, onUpdate);
    });

    // Reset All System Tools Shortcuts Button
    const btnResetShortcuts = document.getElementById('btnResetWmShortcuts');
    if (btnResetShortcuts && !btnResetShortcuts.dataset.bound) {
      btnResetShortcuts.dataset.bound = 'true';
      btnResetShortcuts.addEventListener('click', () => {
        if (typeof stopActiveBadgeRecording === 'function') {
          stopActiveBadgeRecording(true);
        }

        const currentProfName = state.config.activeProfile || 'Default';
        const prof = (state.config.profiles && state.config.profiles[currentProfName]) || state.config;
        if (!prof.windowManager) prof.windowManager = {};
        if (!state.config.windowManager) state.config.windowManager = {};

        EDITABLE_WM_HOTKEY_BADGES.forEach(({ id, key, def, onUpdate }) => {
          prof.windowManager[key] = def;
          state.config.windowManager[key] = def;
          const badge = document.getElementById(id);
          if (badge) {
            badge.textContent = formatKeyDisplay(def);
            badge.classList.remove('recording');
          }
          if (typeof onUpdate === 'function') {
            try { onUpdate(); } catch (err) { }
          }
        });

        saveCurrentProfileState();
        syncConfig();
        updateGlobalIndicators();
        showToast('All System Tools shortcuts reset to factory defaults!');
      });
    }

    if (wmAppVolumeSlider) {
      updateSliderProgress(wmAppVolumeSlider);

      if (!wmAppVolumeSlider.dataset.bound) {
        wmAppVolumeSlider.dataset.bound = 'true';
        wmAppVolumeSlider.addEventListener('input', () => {
          const val = parseInt(wmAppVolumeSlider.value, 10);
          if (wmAppVolumeValue) wmAppVolumeValue.textContent = `${val}%`;
          updateSliderProgress(wmAppVolumeSlider);
          sendToAhk('setActiveAppVolume', { volume: val, pid: activeAppState.pid });
        });

        wmAppVolumeSlider.addEventListener('change', () => {
          const val = parseInt(wmAppVolumeSlider.value, 10);
          updateSliderProgress(wmAppVolumeSlider);
          sendToAhk('setActiveAppVolume', { volume: val, pid: activeAppState.pid });
        });
      }
    }

    if (wmBtnMuteActiveApp && !wmBtnMuteActiveApp.dataset.bound) {
      wmBtnMuteActiveApp.dataset.bound = 'true';
      wmBtnMuteActiveApp.addEventListener('click', () => {
        sendToAhk('toggleMuteActiveApp', { pid: activeAppState.pid });
      });
    }

    updateAllFeatureProfileBadges();
    sendToAhk('getActiveAppVolume');
  }

  function updateWmOpacityLabel() {
    if (!wmOpacitySlider || !wmOpacityValue) return;
    const pct = Math.round((wmOpacitySlider.value / 255) * 100);
    wmOpacityValue.textContent = `${pct}%`;
  }

  // ============================================================================
  // Action Definitions & Unified Select Helpers
  // ============================================================================

  const SYSTEM_ACTION_OPTIONS = [
    // Productivity & Tabs
    { val: 'CloseTab', text: 'Close Tab (Ctrl+W)' },
    { val: 'NewTab', text: 'New Tab (Ctrl+T)' },
    { val: 'ReopenTab', text: 'Reopen Closed Tab (Ctrl+Shift+T)' },
    { val: 'NextTab', text: 'Next Tab (Ctrl+Tab)' },
    { val: 'PrevTab', text: 'Previous Tab (Ctrl+Shift+Tab)' },
    { val: 'DuplicateTab', text: 'Duplicate Tab' },
    { val: 'Back', text: 'Browser Back (Alt+Left)' },
    { val: 'Forward', text: 'Browser Forward (Alt+Right)' },
    // Window Management
    { val: 'MinimizeWindow', text: 'Minimize Window' },
    { val: 'MaximizeWindow', text: 'Maximize Window' },
    { val: 'CloseWindow', text: 'Close Window (Alt+F4)' },
    { val: 'SnapLeft', text: 'Snap Left (Win+Left)' },
    { val: 'SnapRight', text: 'Snap Right (Win+Right)' },
    { val: 'MinimizeAll', text: 'Minimize All Windows (Win+M)' },
    { val: 'ShowDesktop', text: 'Show Desktop (Win+D)' },
    { val: 'TaskView', text: 'Task View (Win+Tab)' },
    // Audio & Media
    { val: 'MuteVolume', text: 'Toggle Audio Mute' },
    { val: 'VolumeUp', text: 'Volume Up (+4%)' },
    { val: 'VolumeDown', text: 'Volume Down (-4%)' },
    // Windows System Tools
    { val: 'ClipboardHistory', text: 'Clipboard History (Win+V)' },
    { val: 'EmojiPicker', text: 'Emoji & Symbols (Win+.)' },
    { val: 'PastePlainText', text: 'Paste Plain Text' },
    { val: 'FileExplorer', text: 'File Explorer (Win+E)' },
    { val: 'WindowsSettings', text: 'Windows Settings (Win+I)' },
    { val: 'GameBar', text: 'Xbox Game Bar / Snip' },
    { val: 'ActionCenter', text: 'Action Center (Win+A)' },
    { val: 'StartMenu', text: 'Start Menu' },
    { val: 'LockWorkstation', text: 'Lock Workstation' },
    // Built-in Tools
    { val: 'ScreenOcr', text: 'Instant Screen OCR' },
    { val: 'ColorPicker', text: 'Color Picker' },
    { val: 'AlwaysOnTop', text: 'Toggle Always-on-Top' },
    { val: 'GhostMode', text: 'Toggle Ghost Click-Through' },
    { val: 'CleanText', text: 'Clean Plain Text' },
    { val: 'NextDesktop', text: 'Next Virtual Desktop' },
    { val: 'PrevDesktop', text: 'Previous Virtual Desktop' },
    { val: 'ScrollTop', text: 'Scroll to Top' },
    { val: 'ScrollBottom', text: 'Scroll to Bottom' },
    { val: 'Calculator', text: 'Calculator' },
    { val: 'Screenshot', text: 'Screen Snip' },
    { val: 'none', text: 'Disabled' }
  ];

  const ACTION_FRIENDLY_NAMES = {
    'ScreenOcr': 'OCR',
    'ColorPicker': 'Color Pick',
    'NextDesktop': 'Next Desk',
    'PrevDesktop': 'Prev Desk',
    'TaskView': 'Task View',
    'ShowDesktop': 'Desktop',
    'AlwaysOnTop': 'Always On',
    'GhostMode': 'Ghost',
    'MuteVolume': 'Mute Audio',
    'VolumeUp': 'Vol +',
    'VolumeDown': 'Vol -',
    'SnapLeft': 'Snap Left',
    'SnapRight': 'Snap Right',
    'MinimizeAll': 'Min All',
    'CloseTab': 'Close Tab',
    'NewTab': 'New Tab',
    'ReopenTab': 'Reopen Tab',
    'NextTab': 'Next Tab',
    'PrevTab': 'Prev Tab',
    'DuplicateTab': 'Dup Tab',
    'Back': 'Back',
    'Forward': 'Forward',
    'MinimizeWindow': 'Min Win',
    'MaximizeWindow': 'Max Win',
    'CloseWindow': 'Close Win',
    'ClipboardHistory': 'Clipboard',
    'EmojiPicker': 'Emoji',
    'PastePlainText': 'Paste Text',
    'FileExplorer': 'Explorer',
    'WindowsSettings': 'Settings',
    'GameBar': 'Game Bar',
    'ActionCenter': 'Action Ctr',
    'StartMenu': 'Start Menu',
    'LockWorkstation': 'Lock PC',
    'ScrollTop': 'Scroll Top',
    'ScrollBottom': 'Scroll Btm',
    'Calculator': 'Calc',
    'CleanText': 'Clean Text',
    'Screenshot': 'Snip',
    'none': 'Disabled'
  };

  function getFullActionOptions() {
    const list = [...SYSTEM_ACTION_OPTIONS];
    if (state.config && state.config.appLauncher && Array.isArray(state.config.appLauncher.items)) {
      state.config.appLauncher.items.forEach(item => {
        if (item && item.id) {
          const rawId = String(item.id);
          const cleanId = rawId.startsWith('al-') ? rawId : `al-${rawId}`;
          const title = item.name || item.title || item.target || `App #${cleanId}`;
          list.push({ val: cleanId, text: `Launch: ${title}` });
        }
      });
    }
    if (state.config && state.config.macroRecorder && Array.isArray(state.config.macroRecorder.items)) {
      state.config.macroRecorder.items.forEach(macro => {
        if (macro && macro.id) {
          const rawId = String(macro.id);
          const cleanId = rawId.startsWith('macro-') ? rawId : `macro-${rawId}`;
          const name = macro.name || `Macro #${cleanId}`;
          list.push({ val: cleanId, text: `Macro: ${name}` });
        }
      });
    }
    return list;
  }

  function getActionFriendlyName(actionKey) {
    if (!actionKey || actionKey === 'none') return 'Disabled';
    if (ACTION_FRIENDLY_NAMES[actionKey]) return ACTION_FRIENDLY_NAMES[actionKey];
    if (actionKey.startsWith('al-')) {
      const cleanKey = actionKey.replace(/^(al-)+/, 'al-');
      const bareId = actionKey.replace(/^(al-)+/, '');
      const app = (state.config && state.config.appLauncher && state.config.appLauncher.items)
        ? state.config.appLauncher.items.find(i => String(i.id) === actionKey || String(i.id) === cleanKey || String(i.id) === bareId || `al-${i.id}` === actionKey)
        : null;
      return app ? (app.name || app.title || app.target || 'App') : 'App';
    }
    if (actionKey.startsWith('macro-')) {
      const cleanKey = actionKey.replace(/^(macro-)+/, 'macro-');
      const bareId = actionKey.replace(/^(macro-)+/, '');
      const m = (state.config && state.config.macroRecorder && state.config.macroRecorder.items)
        ? state.config.macroRecorder.items.find(i => String(i.id) === actionKey || String(i.id) === cleanKey || String(i.id) === bareId || `macro-${i.id}` === actionKey)
        : null;
      return m ? (m.name || 'Macro') : 'Macro';
    }
    return actionKey;
  }

  function populateActionSelect(sel, currentVal) {
    if (!sel) return;
    const options = getFullActionOptions();
    let cur = currentVal !== undefined ? currentVal : sel.value;
    if (typeof cur === 'string') {
      cur = cur.replace(/^(al-)+/, 'al-').replace(/^(macro-)+/, 'macro-');
    }
    sel.innerHTML = options.map(opt => `<option value="${escapeHtml(opt.val)}">${escapeHtml(opt.text)}</option>`).join('');
    if (cur !== undefined && cur !== null) {
      sel.value = cur;
    }
  }

  function refreshAllActionSelects() {
    const mg = (state.config && state.config.mouseGestures) || {};
    const rm = (state.config && state.config.radialMenu) || {};

    // 1. Screen Hot Corners
    const cornerKeys = [
      { id: 'hcSelectTopLeft', key: 'cornerTopLeft', def: 'TaskView' },
      { id: 'hcSelectTopRight', key: 'cornerTopRight', def: 'ActionCenter' },
      { id: 'hcSelectBottomLeft', key: 'cornerBottomLeft', def: 'StartMenu' },
      { id: 'hcSelectBottomRight', key: 'cornerBottomRight', def: 'ShowDesktop' }
    ];
    cornerKeys.forEach(({ id, key, def }) => {
      const sel = document.getElementById(id);
      if (sel) {
        const curVal = sel.value || mg[key] || def;
        populateActionSelect(sel, curVal);
      }
    });

    // 2. Mouse Stroke Gestures
    const gestureKeys = [
      { id: 'mgActionLeft', key: 'actionLeft', def: 'Back' },
      { id: 'mgActionRight', key: 'actionRight', def: 'Forward' },
      { id: 'mgActionUp', key: 'actionUp', def: 'MaximizeWindow' },
      { id: 'mgActionDown', key: 'actionDown', def: 'MinimizeWindow' },
      { id: 'mgActionDownRight', key: 'actionDownRight', def: 'CloseWindow' },
      { id: 'mgActionUpLeft', key: 'actionUpLeft', def: 'ReopenTab' },
      { id: 'mgActionUpRight', key: 'actionUpRight', def: 'DuplicateTab' },
      { id: 'mgActionDownLeft', key: 'actionDownLeft', def: 'MinimizeAll' }
    ];
    gestureKeys.forEach(({ id, key, def }) => {
      const sel = document.getElementById(id);
      if (sel) {
        const curVal = sel.value || mg[key] || def;
        populateActionSelect(sel, curVal);
      }
    });

    // 3. Rocker Gestures
    const selRockerLeft = document.getElementById('mgActionRockerLeft');
    if (selRockerLeft) {
      populateActionSelect(selRockerLeft, selRockerLeft.value || mg.actionRockerLeft || 'Back');
    }
    const selRockerRight = document.getElementById('mgActionRockerRight');
    if (selRockerRight) {
      populateActionSelect(selRockerRight, selRockerRight.value || mg.actionRockerRight || 'Forward');
    }

    // 4. Radial Menu Center Hub
    const rmCenter = document.getElementById('rmCenterActionSelect');
    if (rmCenter) {
      populateActionSelect(rmCenter, rmCenter.value || rm.centerAction || 'none');
    }

    // 5. Radial Menu 8 Slices & Labels
    const slices = Array.isArray(rm.slices) ? rm.slices : [];
    for (let i = 0; i < 8; i++) {
      const sel = document.getElementById(`rmAction${i}`);
      const lbl = document.getElementById(`rmSliceLbl${i}`);
      const curVal = (sel && sel.value) ? sel.value : (slices[i] || 'none');
      if (sel) {
        populateActionSelect(sel, curVal);
      }
      if (lbl) {
        lbl.textContent = getActionFriendlyName(curVal);
      }
    }
  }

  // ============================================================================
  // Module: Mouse Gestures & Screen Hot Corners
  // ============================================================================

  function initMouseGestures() {
    if (!state.config.mouseGestures) {
      state.config.mouseGestures = {};
    }
    const mg = state.config.mouseGestures;

    // 1. Hot Corners Master Switch
    const hcMasterSwitch = document.getElementById('hcMasterSwitch');
    if (hcMasterSwitch) {
      const isCorners = (mg.cornersEnabled !== false && mg.cornersEnabled !== 0);
      hcMasterSwitch.checked = isCorners;
      const col = hcMasterSwitch.closest('.mg-column');
      if (col) col.classList.toggle('is-disabled', !isCorners);

      if (!hcMasterSwitch.dataset.bound) {
        hcMasterSwitch.dataset.bound = 'true';
        hcMasterSwitch.addEventListener('change', () => {
          state.config.mouseGestures.cornersEnabled = hcMasterSwitch.checked ? 1 : 0;
          if (col) col.classList.toggle('is-disabled', !hcMasterSwitch.checked);
          saveCurrentProfileState();
          updateAllFeatureProfileBadges();
          updateGlobalIndicators();
          syncConfig();
        });
      }
    }

    // 2. Corner Dwell Slider
    const hcDwellSlider = document.getElementById('hcDwellSlider');
    const hcDwellVal = document.getElementById('hcDwellVal');
    if (hcDwellSlider) {
      const dwell = mg.dwellDuration || 250;
      hcDwellSlider.value = dwell;
      if (hcDwellVal) hcDwellVal.textContent = `${dwell} ms`;
      updateSliderProgress(hcDwellSlider);

      if (!hcDwellSlider.dataset.bound) {
        hcDwellSlider.dataset.bound = 'true';
        hcDwellSlider.addEventListener('input', () => {
          if (hcDwellVal) hcDwellVal.textContent = `${hcDwellSlider.value} ms`;
          updateSliderProgress(hcDwellSlider);
        });
        hcDwellSlider.addEventListener('change', () => {
          state.config.mouseGestures.dwellDuration = parseInt(hcDwellSlider.value, 10);
          updateSliderProgress(hcDwellSlider);
          syncConfig();
        });
      }
    }

    // Corner Sensitive Zone Size Slider
    const hcCornerSizeSlider = document.getElementById('hcCornerSizeSlider');
    const hcCornerSizeVal = document.getElementById('hcCornerSizeVal');
    if (hcCornerSizeSlider) {
      const size = mg.cornerSize || 14;
      hcCornerSizeSlider.value = size;
      if (hcCornerSizeVal) hcCornerSizeVal.textContent = `${size} px`;
      updateSliderProgress(hcCornerSizeSlider);

      if (!hcCornerSizeSlider.dataset.bound) {
        hcCornerSizeSlider.dataset.bound = 'true';
        hcCornerSizeSlider.addEventListener('input', () => {
          if (hcCornerSizeVal) hcCornerSizeVal.textContent = `${hcCornerSizeSlider.value} px`;
          updateSliderProgress(hcCornerSizeSlider);
        });
        hcCornerSizeSlider.addEventListener('change', () => {
          state.config.mouseGestures.cornerSize = parseInt(hcCornerSizeSlider.value, 10);
          updateSliderProgress(hcCornerSizeSlider);
          syncConfig();
        });
      }
    }

    // 3. Screen Corner Action Dropdowns
    const cornerSelectMap = [
      { id: 'hcSelectTopLeft', key: 'cornerTopLeft', def: 'TaskView' },
      { id: 'hcSelectTopRight', key: 'cornerTopRight', def: 'ActionCenter' },
      { id: 'hcSelectBottomLeft', key: 'cornerBottomLeft', def: 'StartMenu' },
      { id: 'hcSelectBottomRight', key: 'cornerBottomRight', def: 'ShowDesktop' }
    ];

    cornerSelectMap.forEach(({ id, key, def }) => {
      const sel = document.getElementById(id);
      if (!sel) return;
      populateActionSelect(sel, mg[key] || def);

      if (!sel.dataset.bound) {
        sel.dataset.bound = 'true';
        sel.addEventListener('change', () => {
          state.config.mouseGestures[key] = sel.value;
          syncConfig();
        });
      }
    });

    // 4. Mouse Gestures Master Switch
    const mgMasterSwitch = document.getElementById('mgMasterSwitch');
    if (mgMasterSwitch) {
      const isGestures = (mg.gesturesEnabled !== false && mg.gesturesEnabled !== 0);
      mgMasterSwitch.checked = isGestures;
      const col = mgMasterSwitch.closest('.mg-column');
      if (col) col.classList.toggle('is-disabled', !isGestures);

      if (!mgMasterSwitch.dataset.bound) {
        mgMasterSwitch.dataset.bound = 'true';
        mgMasterSwitch.addEventListener('change', () => {
          state.config.mouseGestures.gesturesEnabled = mgMasterSwitch.checked ? 1 : 0;
          if (col) col.classList.toggle('is-disabled', !mgMasterSwitch.checked);
          saveCurrentProfileState();
          updateAllFeatureProfileBadges();
          updateGlobalIndicators();
          syncConfig();
        });
      }
    }

    // 5. Trigger Button Select
    const mgTriggerSelect = document.getElementById('mgTriggerSelect');
    if (mgTriggerSelect) {
      mgTriggerSelect.value = mg.triggerButton || 'RButton';
      if (!mgTriggerSelect.dataset.bound) {
        mgTriggerSelect.dataset.bound = 'true';
        mgTriggerSelect.addEventListener('change', () => {
          state.config.mouseGestures.triggerButton = mgTriggerSelect.value;
          syncConfig();
        });
      }
    }

    // 6. Gesture Timeout Slider
    const mgTimeoutSlider = document.getElementById('mgTimeoutSlider');
    const mgTimeoutVal = document.getElementById('mgTimeoutVal');
    if (mgTimeoutSlider) {
      const timeout = mg.gestureTimeout || 700;
      mgTimeoutSlider.value = timeout;
      if (mgTimeoutVal) mgTimeoutVal.textContent = `${timeout} ms`;
      updateSliderProgress(mgTimeoutSlider);

      if (!mgTimeoutSlider.dataset.bound) {
        mgTimeoutSlider.dataset.bound = 'true';
        mgTimeoutSlider.addEventListener('input', () => {
          if (mgTimeoutVal) mgTimeoutVal.textContent = `${mgTimeoutSlider.value} ms`;
          updateSliderProgress(mgTimeoutSlider);
        });
        mgTimeoutSlider.addEventListener('change', () => {
          state.config.mouseGestures.gestureTimeout = parseInt(mgTimeoutSlider.value, 10);
          updateSliderProgress(mgTimeoutSlider);
          syncConfig();
        });
      }
    }

    // 7. Stroke Distance Threshold Slider
    const mgThresholdSlider = document.getElementById('mgThresholdSlider');
    const mgThresholdVal = document.getElementById('mgThresholdVal');
    if (mgThresholdSlider) {
      const thresh = mg.strokeThreshold || 45;
      mgThresholdSlider.value = thresh;
      if (mgThresholdVal) mgThresholdVal.textContent = `${thresh} px`;
      updateSliderProgress(mgThresholdSlider);

      if (!mgThresholdSlider.dataset.bound) {
        mgThresholdSlider.dataset.bound = 'true';
        mgThresholdSlider.addEventListener('input', () => {
          if (mgThresholdVal) mgThresholdVal.textContent = `${mgThresholdSlider.value} px`;
          updateSliderProgress(mgThresholdSlider);
        });
        mgThresholdSlider.addEventListener('change', () => {
          state.config.mouseGestures.strokeThreshold = parseInt(mgThresholdSlider.value, 10);
          updateSliderProgress(mgThresholdSlider);
          syncConfig();
        });
      }
    }

    // 8. 8-Directional Gesture Actions
    const gestureActionMap = [
      { id: 'mgActionLeft', key: 'actionLeft', def: 'Back' },
      { id: 'mgActionRight', key: 'actionRight', def: 'Forward' },
      { id: 'mgActionUp', key: 'actionUp', def: 'MaximizeWindow' },
      { id: 'mgActionDown', key: 'actionDown', def: 'MinimizeWindow' },
      { id: 'mgActionDownRight', key: 'actionDownRight', def: 'CloseWindow' },
      { id: 'mgActionUpLeft', key: 'actionUpLeft', def: 'ReopenTab' },
      { id: 'mgActionUpRight', key: 'actionUpRight', def: 'DuplicateTab' },
      { id: 'mgActionDownLeft', key: 'actionDownLeft', def: 'MinimizeAll' }
    ];

    gestureActionMap.forEach(({ id, key, def }) => {
      const sel = document.getElementById(id);
      if (!sel) return;
      populateActionSelect(sel, mg[key] || def);

      if (!sel.dataset.bound) {
        sel.dataset.bound = 'true';
        sel.addEventListener('change', () => {
          state.config.mouseGestures[key] = sel.value;
          syncConfig();
        });
      }
    });

    // 9. Rocker Gestures (Hold one button, click the other)
    const mgRockerSwitch = document.getElementById('mgRockerSwitch');
    if (mgRockerSwitch) {
      mgRockerSwitch.checked = (mg.rockerEnabled !== false && mg.rockerEnabled !== 0);
      if (!mgRockerSwitch.dataset.bound) {
        mgRockerSwitch.dataset.bound = 'true';
        mgRockerSwitch.addEventListener('change', () => {
          state.config.mouseGestures.rockerEnabled = mgRockerSwitch.checked ? 1 : 0;
          saveCurrentProfileState();
          syncConfig();
        });
      }
    }
    const selRockerLeft = document.getElementById('mgActionRockerLeft');
    if (selRockerLeft) {
      populateActionSelect(selRockerLeft, mg.actionRockerLeft || 'Back');
      if (!selRockerLeft.dataset.bound) {
        selRockerLeft.dataset.bound = 'true';
        selRockerLeft.addEventListener('change', () => {
          state.config.mouseGestures.actionRockerLeft = selRockerLeft.value;
          syncConfig();
        });
      }
    }
    const selRockerRight = document.getElementById('mgActionRockerRight');
    if (selRockerRight) {
      populateActionSelect(selRockerRight, mg.actionRockerRight || 'Forward');
      if (!selRockerRight.dataset.bound) {
        selRockerRight.dataset.bound = 'true';
        selRockerRight.addEventListener('change', () => {
          state.config.mouseGestures.actionRockerRight = selRockerRight.value;
          syncConfig();
        });
      }
    }

    // 10. Gesture Wheel Action
    const mgWheelSwitch = document.getElementById('mgWheelSwitch');
    if (mgWheelSwitch) {
      const isWheelOn = (mg.wheelGestureEnabled !== false && mg.wheelGestureEnabled !== 0 && mg.wheelGesturesEnabled !== 0);
      mgWheelSwitch.checked = isWheelOn;
      if (!mgWheelSwitch.dataset.bound) {
        mgWheelSwitch.dataset.bound = 'true';
        mgWheelSwitch.addEventListener('change', () => {
          const val = mgWheelSwitch.checked ? 1 : 0;
          state.config.mouseGestures.wheelGestureEnabled = val;
          state.config.mouseGestures.wheelGesturesEnabled = val;
          saveCurrentProfileState();
          syncConfig();
        });
      }
    }
    const selWheelMode = document.getElementById('mgWheelModeSelect');
    if (selWheelMode) {
      selWheelMode.value = mg.wheelMode || mg.wheelGestureMode || 'volume';
      if (!selWheelMode.dataset.bound) {
        selWheelMode.dataset.bound = 'true';
        selWheelMode.addEventListener('change', () => {
          state.config.mouseGestures.wheelMode = selWheelMode.value;
          state.config.mouseGestures.wheelGestureMode = selWheelMode.value;
          syncConfig();
        });
      }
    }

    updateAllFeatureProfileBadges();
  }

  // ============================================================================
  // Module: Radial Menu / Command Palette (Pie Wheel)
  // ============================================================================

  function initRadialMenu() {
    if (!state.config.radialMenu) {
      state.config.radialMenu = {
        enabled: 1,
        triggerButton: 'MButton',
        wheelRadius: 190,
        sliceCount: 8,
        centerAction: 'none',
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
      };
    }
    const rm = state.config.radialMenu;

    // Master switch for Radial Menu
    const rmMasterSwitch = document.getElementById('rmMasterSwitch');
    const previewCol = document.querySelector('.rm-column-preview');
    const controlsCol = document.querySelector('.rm-column-controls');
    const rmTriggerSelect = document.getElementById('rmTriggerSelect');

    const isRm = (rm.enabled !== false && rm.enabled !== 0 && rm.triggerButton !== 'none');

    function syncRadialMenuState(enabled) {
      state.config.radialMenu.enabled = enabled ? 1 : 0;
      if (rmMasterSwitch) rmMasterSwitch.checked = !!enabled;
      if (previewCol) previewCol.classList.toggle('is-disabled', !enabled);
      if (controlsCol) controlsCol.classList.toggle('is-disabled', !enabled);
      if (rmTriggerSelect) {
        if (enabled && rmTriggerSelect.value === 'none') {
          rmTriggerSelect.value = state.config.radialMenu.triggerButton && state.config.radialMenu.triggerButton !== 'none'
            ? state.config.radialMenu.triggerButton
            : 'MButton';
          state.config.radialMenu.triggerButton = rmTriggerSelect.value;
        }
      }
      saveCurrentProfileState();
      updateAllFeatureProfileBadges();
      updateGlobalIndicators();
      syncConfig();
    }

    if (rmMasterSwitch) {
      rmMasterSwitch.checked = isRm;
      if (!rmMasterSwitch.dataset.bound) {
        rmMasterSwitch.dataset.bound = 'true';
        rmMasterSwitch.addEventListener('change', () => {
          syncRadialMenuState(rmMasterSwitch.checked);
        });
      }
    }

    if (previewCol) previewCol.classList.toggle('is-disabled', !isRm);
    if (controlsCol) controlsCol.classList.toggle('is-disabled', !isRm);

    // Trigger button select
    if (rmTriggerSelect) {
      rmTriggerSelect.value = (!isRm && rm.triggerButton === 'none') ? 'none' : (rm.triggerButton || 'MButton');
      if (!rmTriggerSelect.dataset.bound) {
        rmTriggerSelect.dataset.bound = 'true';
        rmTriggerSelect.addEventListener('change', () => {
          if (rmTriggerSelect.value === 'none') {
            syncRadialMenuState(false);
          } else {
            state.config.radialMenu.triggerButton = rmTriggerSelect.value;
            if (!state.config.radialMenu.enabled) {
              syncRadialMenuState(true);
            } else {
              syncConfig();
            }
          }
        });
      }
    }

    // Slice Count Segmented Mode Pills (8 Slices vs 4 Slices)
    const btnRmSlices8 = document.getElementById('btnRmSlices8');
    const btnRmSlices4 = document.getElementById('btnRmSlices4');
    const wheelPreviewContainer = document.getElementById('rmWheelPreview');
    const sliceCount = (rm.sliceCount === 4) ? 4 : 8;

    function renderRadialSpokes(previewSize, is4Slice) {
      const spokesGroup = document.getElementById('rmSpokesGroup');
      const wedgesGroup = document.getElementById('rmWedgesGroup');
      const spokesSvg = document.getElementById('rmSpokesSvg');
      if (!spokesGroup || !wedgesGroup || !spokesSvg) return;

      spokesSvg.setAttribute('viewBox', `0 0 ${previewSize} ${previewSize}`);
      spokesGroup.innerHTML = '';
      wedgesGroup.innerHTML = '';

      const cx = previewSize / 2;
      const cy = previewSize / 2;
      const rInner = 43 * (previewSize / 280);
      const rOuter = previewSize / 2;
      const wedgeReach = rOuter * 1.5;

      if (is4Slice) {
        // 4 Slices: N (0), E (2), S (4), W (6)
        const cardinalSlices = [
          { slice: 0, centerAng: -90 },
          { slice: 2, centerAng: 0 },
          { slice: 4, centerAng: 90 },
          { slice: 6, centerAng: 180 }
        ];
        const halfStep = 45;
        cardinalSlices.forEach(item => {
          const startAng = (item.centerAng - halfStep) * (Math.PI / 180);
          const endAng = (item.centerAng + halfStep) * (Math.PI / 180);
          const x1 = cx + wedgeReach * Math.cos(startAng);
          const y1 = cy + wedgeReach * Math.sin(startAng);
          const x2 = cx + wedgeReach * Math.cos(endAng);
          const y2 = cy + wedgeReach * Math.sin(endAng);

          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          path.setAttribute('d', `M ${cx} ${cy} L ${x1.toFixed(1)} ${y1.toFixed(1)} A ${wedgeReach.toFixed(1)} ${wedgeReach.toFixed(1)} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z`);
          path.setAttribute('class', 'rm-sector-wedge');
          path.setAttribute('data-slice', item.slice);
          wedgesGroup.appendChild(path);
        });

        // 4 Spoke Lines: -135°, -45°, 45°, 135° (diagonals matching GDI+ popup)
        const spokeAngles = [-135, -45, 45, 135];
        spokeAngles.forEach(deg => {
          const rad = deg * (Math.PI / 180);
          const x1 = cx + rInner * Math.cos(rad);
          const y1 = cy + rInner * Math.sin(rad);
          const x2 = cx + wedgeReach * Math.cos(rad);
          const y2 = cy + wedgeReach * Math.sin(rad);

          const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          line.setAttribute('x1', x1.toFixed(1));
          line.setAttribute('y1', y1.toFixed(1));
          line.setAttribute('x2', x2.toFixed(1));
          line.setAttribute('y2', y2.toFixed(1));
          line.setAttribute('class', 'rm-spoke-line');
          spokesGroup.appendChild(line);
        });
      } else {
        // 8 Slices: N, NE, E, SE, S, SW, W, NW
        const sliceAngles = [-90, -45, 0, 45, 90, 135, 180, 225];
        const halfStep = 22.5;
        sliceAngles.forEach((centerAng, idx) => {
          const startAng = (centerAng - halfStep) * (Math.PI / 180);
          const endAng = (centerAng + halfStep) * (Math.PI / 180);
          const x1 = cx + wedgeReach * Math.cos(startAng);
          const y1 = cy + wedgeReach * Math.sin(startAng);
          const x2 = cx + wedgeReach * Math.cos(endAng);
          const y2 = cy + wedgeReach * Math.sin(endAng);

          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          path.setAttribute('d', `M ${cx} ${cy} L ${x1.toFixed(1)} ${y1.toFixed(1)} A ${wedgeReach.toFixed(1)} ${wedgeReach.toFixed(1)} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z`);
          path.setAttribute('class', 'rm-sector-wedge');
          path.setAttribute('data-slice', idx);
          wedgesGroup.appendChild(path);
        });

        // 8 Spoke Lines: -112.5°, -67.5°, -22.5°, 22.5°, 67.5°, 112.5°, 157.5°, 202.5°
        const spokeAngles = [-112.5, -67.5, -22.5, 22.5, 67.5, 112.5, 157.5, 202.5];
        spokeAngles.forEach(deg => {
          const rad = deg * (Math.PI / 180);
          const x1 = cx + rInner * Math.cos(rad);
          const y1 = cy + rInner * Math.sin(rad);
          const x2 = cx + wedgeReach * Math.cos(rad);
          const y2 = cy + wedgeReach * Math.sin(rad);

          const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          line.setAttribute('x1', x1.toFixed(1));
          line.setAttribute('y1', y1.toFixed(1));
          line.setAttribute('x2', x2.toFixed(1));
          line.setAttribute('y2', y2.toFixed(1));
          line.setAttribute('class', 'rm-spoke-line');
          spokesGroup.appendChild(line);
        });
      }
    }

    function updateHubDefaultText() {
      const hubText = document.getElementById('rmHubText');
      if (!hubText) return;
      const rmConfig = (state.config && state.config.radialMenu) || {};
      if (rmConfig.centerAction && rmConfig.centerAction !== 'none' && rmConfig.centerAction !== '') {
        hubText.textContent = getActionFriendlyName(rmConfig.centerAction);
      } else {
        hubText.textContent = 'DISMISS';
      }
    }

    function applySliceCountMode(count) {
      state.config.radialMenu.sliceCount = count;
      if (btnRmSlices8) btnRmSlices8.classList.toggle('active', count === 8);
      if (btnRmSlices4) btnRmSlices4.classList.toggle('active', count === 4);
      if (wheelPreviewContainer) {
        wheelPreviewContainer.classList.toggle('mode-4-slice', count === 4);
      }
      // In the slice setup grid, mark diagonal slices (1, 3, 5, 7)
      [1, 3, 5, 7].forEach(idx => {
        const sel = document.getElementById(`rmAction${idx}`);
        if (sel) {
          const card = sel.closest('.mg-gesture-card');
          if (card) {
            card.classList.add('rm-slice-diagonal');
            card.style.opacity = (count === 4) ? '0.35' : '1';
            card.style.pointerEvents = (count === 4) ? 'none' : 'auto';
          }
        }
      });
      const curRad = (state.config.radialMenu && state.config.radialMenu.wheelRadius) || 190;
      updateRadialPreviewScale(curRad);
    }

    applySliceCountMode(sliceCount);

    if (btnRmSlices8 && !btnRmSlices8.dataset.bound) {
      btnRmSlices8.dataset.bound = 'true';
      btnRmSlices8.addEventListener('click', () => {
        applySliceCountMode(8);
        syncConfig();
      });
    }
    if (btnRmSlices4 && !btnRmSlices4.dataset.bound) {
      btnRmSlices4.dataset.bound = 'true';
      btnRmSlices4.addEventListener('click', () => {
        applySliceCountMode(4);
        syncConfig();
      });
    }

    // Center Hub Click Action
    const rmCenterActionSelect = document.getElementById('rmCenterActionSelect');
    if (rmCenterActionSelect) {
      populateActionSelect(rmCenterActionSelect, rm.centerAction || 'none');
      if (!rmCenterActionSelect.dataset.bound) {
        rmCenterActionSelect.dataset.bound = 'true';
        rmCenterActionSelect.addEventListener('change', () => {
          state.config.radialMenu.centerAction = rmCenterActionSelect.value;
          updateHubDefaultText();
          syncConfig();
        });
      }
    }

    // Radius slider & dynamic scaling
    const rmRadiusSlider = document.getElementById('rmRadiusSlider');
    const rmRadiusVal = document.getElementById('rmRadiusVal');

    function updateRadialPreviewScale(rad) {
      const preview = document.getElementById('rmWheelPreview');
      if (!preview) return;
      const r = parseFloat(rad) || 190;
      // Dynamic container size scaling with slider (min 270px, max 350px)
      const previewSize = Math.max(270, Math.min(350, Math.round(180 + (r - 140) * (170 / 120))));
      const scale = previewSize / 280;

      preview.style.width = `${previewSize}px`;
      preview.style.height = `${previewSize}px`;
      preview.style.setProperty('--rm-scale', scale.toFixed(3));
      preview.style.setProperty('--rm-size', `${previewSize}px`);

      const cx = previewSize / 2;
      const cy = previewSize / 2;
      const rInner = 43 * scale;
      const rOuter = previewSize / 2;
      // Match main.ahk: R_nodes = (R_outer + R_inner) * 0.52
      const dist = (rOuter + rInner) * 0.52;

      const angles = [
        -90,  // N: 0
        -45,  // NE: 1
        0,    // E: 2
        45,   // SE: 3
        90,   // S: 4
        135,  // SW: 5
        180,  // W: 6
        -135  // NW: 7
      ];
      for (let i = 0; i < 8; i++) {
        const node = preview.querySelector(`.rm-slice-node[data-slice="${i}"]`);
        if (node) {
          const radAng = angles[i] * (Math.PI / 180);
          const x = cx + dist * Math.cos(radAng);
          const y = cy + dist * Math.sin(radAng);
          node.style.left = `${x.toFixed(1)}px`;
          node.style.top = `${y.toFixed(1)}px`;
        }
      }

      const is4Slice = preview.classList.contains('mode-4-slice');
      renderRadialSpokes(previewSize, is4Slice);
      updateHubDefaultText();
    }

    if (rmRadiusSlider) {
      const rad = rm.wheelRadius || 190;
      rmRadiusSlider.value = rad;
      if (rmRadiusVal) rmRadiusVal.textContent = `${rad} px`;
      updateSliderProgress(rmRadiusSlider);
      updateRadialPreviewScale(rad);

      if (!rmRadiusSlider.dataset.bound) {
        rmRadiusSlider.dataset.bound = 'true';
        rmRadiusSlider.addEventListener('input', () => {
          if (rmRadiusVal) rmRadiusVal.textContent = `${rmRadiusSlider.value} px`;
          updateSliderProgress(rmRadiusSlider);
          updateRadialPreviewScale(rmRadiusSlider.value);
        });
        rmRadiusSlider.addEventListener('change', () => {
          state.config.radialMenu.wheelRadius = parseInt(rmRadiusSlider.value, 10);
          updateSliderProgress(rmRadiusSlider);
          updateRadialPreviewScale(rmRadiusSlider.value);
          syncConfig();
        });
      }
    } else {
      updateRadialPreviewScale(rm.wheelRadius || 190);
    }

    // Wire 8 slice dropdowns and preview labels
    const slices = Array.isArray(rm.slices) ? rm.slices : [];
    for (let i = 0; i < 8; i++) {
      const sel = document.getElementById(`rmAction${i}`);
      const lbl = document.getElementById(`rmSliceLbl${i}`);
      const action = slices[i] || 'none';
      if (sel) {
        populateActionSelect(sel, action);
        if (!sel.dataset.bound) {
          sel.dataset.bound = 'true';
          sel.addEventListener('change', () => {
            if (!Array.isArray(state.config.radialMenu.slices)) state.config.radialMenu.slices = [];
            state.config.radialMenu.slices[i] = sel.value;
            if (lbl) lbl.textContent = getActionFriendlyName(sel.value);
            syncConfig();
          });
        }
      }
      if (lbl) {
        lbl.textContent = getActionFriendlyName(action);
      }
    }

    // Interactive slice hover preview in the mockup wheel
    const previewNodes = document.querySelectorAll('.rm-slice-node');
    const hubText = document.getElementById('rmHubText');
    previewNodes.forEach(node => {
      if (!node.dataset.previewBound) {
        node.dataset.previewBound = 'true';
        node.addEventListener('mouseenter', () => {
          previewNodes.forEach(n => n.classList.remove('active'));
          node.classList.add('active');
          const idx = parseInt(node.getAttribute('data-slice'), 10);

          // Highlight corresponding SVG sector wedge
          const wedges = document.querySelectorAll('.rm-sector-wedge');
          wedges.forEach(w => {
            w.classList.toggle('active', parseInt(w.getAttribute('data-slice'), 10) === idx);
          });

          const curAction = (state.config.radialMenu && state.config.radialMenu.slices && state.config.radialMenu.slices[idx]) || 'none';
          if (hubText) hubText.textContent = getActionFriendlyName(curAction);
        });
        node.addEventListener('mouseleave', () => {
          node.classList.remove('active');
          const wedges = document.querySelectorAll('.rm-sector-wedge');
          wedges.forEach(w => w.classList.remove('active'));
          updateHubDefaultText();
        });
      }
    });
    updateAllFeatureProfileBadges();
  }

  // ============================================================================
  // Module 4: App Launcher (Text String & Key Combination Support)
  // ============================================================================

  let currentAlType = 'string'; // 'string' | 'hotkey'
  let editingAlId = null;

  function setAlTriggerType(type) {
    currentAlType = (type === 'hotkey') ? 'hotkey' : 'string';
    if (currentAlType === 'hotkey') {
      if (alTypeHotkey) alTypeHotkey.classList.add('active');
      if (alTypeString) alTypeString.classList.remove('active');
      if (alTriggerIcon) {
        alTriggerIcon.innerHTML = `
          <rect x="2" y="4" width="20" height="16" rx="2"></rect>
          <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M7 16h10"></path>
        `;
      }
      if (alInputTrigger) {
        alInputTrigger.placeholder = 'Press keys (e.g. Ctrl+Alt+C) or type...';
      }
      if (alHintTag) {
        alHintTag.textContent = 'Pressing key combination anywhere in Windows opens target instantly';
      }
    } else {
      if (alTypeString) alTypeString.classList.add('active');
      if (alTypeHotkey) alTypeHotkey.classList.remove('active');
      if (alTriggerIcon) {
        alTriggerIcon.innerHTML = `
          <polyline points="4 17 10 11 4 5"></polyline>
          <line x1="12" y1="19" x2="20" y2="19"></line>
        `;
      }
      if (alInputTrigger) {
        alInputTrigger.placeholder = 'Trigger (e.g. @calc, @yt)';
      }
      if (alHintTag) {
        alHintTag.textContent = 'Typing trigger string anywhere in Windows opens apps, websites, or commands instantly';
      }
    }
  }

  function handleAlTriggerKeydown(e) {
    if (currentAlType === 'hotkey') {
      if (e.key === 'Tab') return;
      if (e.key === 'Enter') {
        if (!alInputTarget.value.trim()) alInputTarget.focus();
        else submitAppLauncher();
        return;
      }

      const isModifier = ['Control', 'Alt', 'Shift', 'Meta', 'OS'].includes(e.key);
      const hasModifier = e.ctrlKey || e.altKey || e.metaKey || (e.shiftKey && (e.ctrlKey || e.altKey || e.metaKey));
      const isSpecialKey = [
        'Escape', 'CapsLock', 'Space', 'Backspace', 'Delete', 'Insert',
        'Home', 'End', 'PageUp', 'PageDown', 'ArrowUp', 'ArrowDown',
        'ArrowLeft', 'ArrowRight', 'Tab', 'NumLock', 'ScrollLock', 'PrintScreen'
      ].includes(e.key) || /^F\d{1,2}$/i.test(e.key);

      if ((e.key === 'Backspace' || e.key === 'Delete') && !hasModifier && !e.shiftKey) {
        alInputTrigger.value = '';
        e.preventDefault();
        return;
      }

      if (hasModifier || isModifier || isSpecialKey) {
        e.preventDefault();

        const parts = [];
        if (e.ctrlKey) parts.push('Ctrl');
        if (e.altKey) parts.push('Alt');
        if (e.shiftKey) parts.push('Shift');
        if (e.metaKey) parts.push('Win');

        if (isModifier) {
          if (parts.length > 0) {
            alInputTrigger.value = parts.join(' + ');
          }
          return;
        }

        let key = e.key;
        if (e.code && e.code.startsWith('Key')) {
          key = e.code.slice(3).toUpperCase();
        } else if (e.code && e.code.startsWith('Digit')) {
          key = e.code.slice(5);
        } else if (e.code && e.code.startsWith('Numpad')) {
          key = e.code;
        } else if (key === ' ') {
          key = 'Space';
        } else if (key === 'Escape' || key === 'Esc') {
          key = 'Escape';
        } else if (key === 'ArrowUp') {
          key = 'Up';
        } else if (key === 'ArrowDown') {
          key = 'Down';
        } else if (key === 'ArrowLeft') {
          key = 'Left';
        } else if (key === 'ArrowRight') {
          key = 'Right';
        } else if (key === 'PageUp') {
          key = 'PgUp';
        } else if (key === 'PageDown') {
          key = 'PgDn';
        } else if (key.length === 1) {
          key = key.toUpperCase();
        }

        if (!parts.includes(key)) {
          parts.push(key);
        }

        alInputTrigger.value = parts.join(' + ');
      }
    } else {
      if (e.key === 'Enter') {
        if (!alInputTarget.value.trim()) alInputTarget.focus();
        else submitAppLauncher();
      }
    }
  }

  function renderAppLauncher() {
    alLaunchersContainer.innerHTML = '';
    const items = state.config.appLauncher.items || [];

    if (items.length === 0) {
      alLaunchersContainer.innerHTML = `
        <div class="empty-state">
          <span>No quick launchers configured</span>
          <span style="font-size: 11px;">Configure a text trigger or key combination above</span>
        </div>
      `;
      if (typeof refreshAllActionSelects === 'function') refreshAllActionSelects();
      return;
    }

    items.forEach(item => {
      const isHotkey = item.triggerType === 'hotkey';
      const isEnabled = item.enabled !== false && item.enabled !== 0;
      const card = document.createElement('div');
      card.className = `shortcut-card ${isEnabled ? '' : 'is-disabled'}`;
      card.dataset.module = 'appLauncher';
      card.dataset.id = item.id;

      const badgeIcon = isHotkey
        ? `<svg class="badge-key-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M7 16h10"></path></svg>`
        : '';

      const typeBadge = isHotkey
        ? `<span class="multiline-badge hotkey-tag">KEY COMBO</span>`
        : `<span class="multiline-badge">STRING</span>`;

      const displayTrig = isHotkey ? formatKeyDisplay(item.trigger) : item.trigger;
      const profileBadgesHtml = renderItemProfileBadges('appLauncher', item.id);

      card.innerHTML = `
        <div class="card-info">
          <span class="trigger-badge ${isHotkey ? 'trigger-badge-hotkey' : ''} ${isEnabled ? '' : 'is-disabled'}">${badgeIcon}${escapeHtml(displayTrig)}</span>
          <span class="arrow-divider"><svg class="arrow-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg></span>
          <span class="expansion-text"><strong>${escapeHtml(item.name || 'Launch')}</strong>: ${escapeHtml(item.target)}</span>
          ${typeBadge}
        </div>
        ${profileBadgesHtml}
        <div class="card-actions">
          <button class="card-btn btn-run" title="Test Launch" data-target="${escapeHtml(item.target)}">
            <svg style="width:14px;height:14px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          </button>
          <button class="card-btn btn-edit" title="Edit Launcher" data-id="${item.id}">
            <svg style="width:14px;height:14px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
          </button>
          <button class="card-btn btn-delete" title="Delete Launcher" data-id="${item.id}">
            <svg style="width:14px;height:14px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
          <div class="toggle-wrapper" title="Enable / Disable App Launcher">
            <input class="toggle-checkbox al-switch" type="checkbox" ${isEnabled ? 'checked' : ''}>
            <div class="toggle-container">
              <div class="toggle-button"></div>
            </div>
          </div>
        </div>
      `;

      card.querySelector('.btn-run').addEventListener('click', (e) => {
        e.stopPropagation();
        sendToAhk('runLauncher', { target: item.target });
      });

      card.querySelector('.btn-edit').addEventListener('click', (e) => {
        e.stopPropagation();
        editAl(item);
      });

      card.querySelector('.btn-delete').addEventListener('click', (e) => {
        e.stopPropagation();
        deleteAl(item.id);
      });

      // Toggle switch logic
      const sw = card.querySelector('.al-switch');
      const badge = card.querySelector('.trigger-badge');
      sw.addEventListener('change', () => {
        const isChecked = sw.checked;
        item.enabled = isChecked ? 1 : 0;
        card.classList.toggle('is-disabled', !isChecked);
        if (badge) badge.classList.toggle('is-disabled', !isChecked);
        syncConfig();
        updateCardProfileBadges(card, 'appLauncher', item.id);
        updateGlobalIndicators();
      });

      card.addEventListener('click', (e) => {
        if (
          e.target.closest('.card-btn') ||
          e.target.closest('.toggle-wrapper') ||
          e.target.closest('.item-profiles-badges') ||
          e.target.closest('.item-profile-badge') ||
          e.target.closest('.item-profile-badge')
        ) return;
        sw.checked = !sw.checked;
        sw.dispatchEvent(new Event('change'));
      });

      alLaunchersContainer.appendChild(card);
    });
    if (typeof refreshAllActionSelects === 'function') refreshAllActionSelects();
  }

  function editAl(item) {
    editingAlId = item.id;
    setAlTriggerType(item.triggerType || 'string');
    alInputTrigger.value = item.trigger || '';
    alInputTarget.value = item.target || '';
    if (alInputName) alInputName.value = item.name || '';
    if (alBtnSubmitText) alBtnSubmitText.textContent = 'SAVE';
    alInputTrigger.focus();
  }

  function submitAppLauncher() {
    const trigger = alInputTrigger.value.trim();
    const target = alInputTarget.value.trim();
    const name = (alInputName && alInputName.value.trim()) ? alInputName.value.trim() : (target || trigger);
    const triggerType = currentAlType;

    if (!trigger) {
      alInputTrigger.focus();
      return;
    }
    if (!target) {
      alInputTarget.focus();
      return;
    }

    if (editingAlId) {
      const idx = state.config.appLauncher.items.findIndex(s => s.id === editingAlId);
      if (idx !== -1) {
        state.config.appLauncher.items[idx] = {
          ...state.config.appLauncher.items[idx],
          trigger: trigger,
          triggerType: triggerType,
          target: target,
          name: name
        };
        updateItemAcrossProfiles('appLauncher', state.config.appLauncher.items[idx]);
      }
      editingAlId = null;
      if (alBtnSubmitText) alBtnSubmitText.textContent = 'ADD';
    } else {
      const newItem = {
        id: 'al-' + Date.now(),
        trigger: trigger,
        triggerType: triggerType,
        target: target,
        name: name,
        enabled: 1
      };
      state.config.appLauncher.items.unshift(newItem);
      addItemAcrossProfiles('appLauncher', newItem);
    }

    alInputTrigger.value = '';
    alInputTarget.value = '';
    if (alInputName) alInputName.value = '';
    renderAppLauncher();
    syncConfig();
  }

  function deleteAl(id) {
    if (editingAlId === id) {
      editingAlId = null;
      if (alBtnSubmitText) alBtnSubmitText.textContent = 'ADD';
      alInputTrigger.value = '';
      alInputTarget.value = '';
      if (alInputName) alInputName.value = '';
    }
    deleteItemAcrossProfiles('appLauncher', id);
    state.config.appLauncher.items = state.config.appLauncher.items.filter(s => s.id !== id);
    renderAppLauncher();
    syncConfig();
  }

  // ============================================================================
  // Module 4.5: Folder Creator
  // ============================================================================

  function setFcTriggerType(type) {
    currentFcType = type;
    if (type === 'hotkey') {
      if (fcTypeHotkey) fcTypeHotkey.classList.add('active');
      if (fcTypeString) fcTypeString.classList.remove('active');
      if (fcTriggerIcon) {
        fcTriggerIcon.innerHTML = `
          <rect x="2" y="4" width="20" height="16" rx="2"></rect>
          <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M7 16h10"></path>
        `;
      }
      if (fcInputTrigger) {
        fcInputTrigger.placeholder = 'Press keys (e.g. Ctrl+Alt+Shift+F)...';
      }
    } else {
      if (fcTypeString) fcTypeString.classList.add('active');
      if (fcTypeHotkey) fcTypeHotkey.classList.remove('active');
      if (fcTriggerIcon) {
        fcTriggerIcon.innerHTML = `
          <polyline points="4 17 10 11 4 5"></polyline>
          <line x1="12" y1="19" x2="20" y2="19"></line>
        `;
      }
      if (fcInputTrigger) {
        fcInputTrigger.placeholder = 'Trigger (e.g. @mkproj, @folders)';
      }
    }
  }

  function setFcLocation(loc) {
    currentFcLocation = loc;
    if (loc === 'custom') {
      if (fcLocCustom) fcLocCustom.classList.add('active');
      if (fcLocActive) fcLocActive.classList.remove('active');
      if (fcCustomPathRow) fcCustomPathRow.classList.remove('hidden-field');
      if (fcCustomPathBox) fcCustomPathBox.classList.remove('hidden-field');
      if (fcToggleAutoOpen) fcToggleAutoOpen.classList.remove('hidden-field');
    } else {
      if (fcLocActive) fcLocActive.classList.add('active');
      if (fcLocCustom) fcLocCustom.classList.remove('active');
      if (fcCustomPathRow) fcCustomPathRow.classList.add('hidden-field');
      if (fcCustomPathBox) fcCustomPathBox.classList.add('hidden-field');
      if (fcToggleAutoOpen) fcToggleAutoOpen.classList.add('hidden-field');
    }
  }

  function handleFcTriggerKeydown(e) {
    if (currentFcType === 'hotkey') {
      if (e.key === 'Tab') return;
      if (e.key === 'Enter') {
        if (!fcTextareaFolders.value.trim()) fcTextareaFolders.focus();
        else submitFolderCreator();
        return;
      }

      const isModifier = ['Control', 'Alt', 'Shift', 'Meta', 'OS'].includes(e.key);
      const hasModifier = e.ctrlKey || e.altKey || e.metaKey || (e.shiftKey && (e.ctrlKey || e.altKey || e.metaKey));
      const isSpecialKey = [
        'Escape', 'CapsLock', 'Space', 'Backspace', 'Delete', 'Insert',
        'Home', 'End', 'PageUp', 'PageDown', 'ArrowUp', 'ArrowDown',
        'ArrowLeft', 'ArrowRight', 'Tab', 'NumLock', 'ScrollLock', 'PrintScreen'
      ].includes(e.key) || /^F\d{1,2}$/i.test(e.key);

      if ((e.key === 'Backspace' || e.key === 'Delete') && !hasModifier && !e.shiftKey) {
        fcInputTrigger.value = '';
        if (fcBtnClearTrigger) fcBtnClearTrigger.classList.add('hidden-field');
        e.preventDefault();
        return;
      }

      if (hasModifier || isModifier || isSpecialKey) {
        e.preventDefault();

        const parts = [];
        if (e.ctrlKey) parts.push('Ctrl');
        if (e.altKey) parts.push('Alt');
        if (e.shiftKey) parts.push('Shift');
        if (e.metaKey) parts.push('Win');

        if (isModifier) {
          if (parts.length > 0) {
            fcInputTrigger.value = parts.join(' + ');
            if (fcBtnClearTrigger) fcBtnClearTrigger.classList.remove('hidden-field');
          }
          return;
        }

        let key = e.key;
        if (e.code && e.code.startsWith('Key')) {
          key = e.code.slice(3).toUpperCase();
        } else if (e.code && e.code.startsWith('Digit')) {
          key = e.code.slice(5);
        } else if (e.code && e.code.startsWith('Numpad')) {
          key = e.code;
        } else if (key === ' ') {
          key = 'Space';
        } else if (key === 'Escape' || key === 'Esc') {
          key = 'Escape';
        } else if (key === 'ArrowUp') {
          key = 'Up';
        } else if (key === 'ArrowDown') {
          key = 'Down';
        } else if (key === 'ArrowLeft') {
          key = 'Left';
        } else if (key === 'ArrowRight') {
          key = 'Right';
        } else if (key === 'PageUp') {
          key = 'PgUp';
        } else if (key === 'PageDown') {
          key = 'PgDn';
        } else if (key.length === 1) {
          key = key.toUpperCase();
        }

        if (!parts.includes(key)) {
          parts.push(key);
        }

        fcInputTrigger.value = parts.join(' + ');
        if (fcBtnClearTrigger) fcBtnClearTrigger.classList.remove('hidden-field');
      }
    }
  }

  function renderFolderCreator() {
    if (!fcContainer) return;
    fcContainer.innerHTML = '';
    if (!state.config.folderCreator) {
      state.config.folderCreator = { enabled: true, items: [] };
    }
    const items = state.config.folderCreator.items || [];

    if (items.length === 0) {
      fcContainer.innerHTML = `
        <div class="empty-state">
          <span>No folder creators configured</span>
          <span style="font-size: 11px;">Configure a trigger and folder structure above</span>
        </div>
      `;
      return;
    }

    items.forEach(item => {
      const isHotkey = item.triggerType === 'hotkey';
      const isEnabled = item.enabled !== false && item.enabled !== 0;
      const card = document.createElement('div');
      card.className = `shortcut-card ${isEnabled ? '' : 'is-disabled'}`;
      card.dataset.module = 'folderCreator';
      card.dataset.id = item.id;

      const badgeIcon = isHotkey
        ? `<svg class="badge-key-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M7 16h10"></path></svg>`
        : '';

      const typeBadge = isHotkey
        ? `<span class="multiline-badge hotkey-tag">SHORTCUT</span>`
        : `<span class="multiline-badge">TEXT</span>`;

      const displayTrig = isHotkey ? formatKeyDisplay(item.trigger) : item.trigger;
      const folderCount = item.folderPaths ? item.folderPaths.split(/\r?\n/).filter(l => l.trim()).length : 0;
      const displayName = item.name ? item.name : `${folderCount} Folders`;
      const locLabel = item.targetLocation === 'custom' ? (item.customPath || 'Fixed') : 'Active Explorer';
      const profileBadgesHtml = renderItemProfileBadges('folderCreator', item.id);

      card.innerHTML = `
        <div class="card-info">
          <span class="trigger-badge ${isHotkey ? 'trigger-badge-hotkey' : ''} ${isEnabled ? '' : 'is-disabled'}">${badgeIcon}${escapeHtml(displayTrig)}</span>
          <span class="arrow-divider"><svg class="arrow-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg></span>
          <span class="expansion-text" title="${escapeHtml(item.folderPaths || '')}"><strong>${escapeHtml(displayName)}</strong> <span style="font-size:10px; opacity:0.75; font-weight:normal;">(${escapeHtml(locLabel)})</span></span>
          ${typeBadge}
        </div>
        ${profileBadgesHtml}
        <div class="card-actions">
          <button class="card-btn btn-duplicate" title="Duplicate Folder Creator">
            <svg style="width:14px;height:14px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
          <button class="card-btn btn-edit" title="Edit Folder Creator" data-id="${item.id}">
            <svg style="width:14px;height:14px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
          </button>
          <button class="card-btn btn-delete" title="Delete Folder Creator" data-id="${item.id}">
            <svg style="width:14px;height:14px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
          <div class="toggle-wrapper" title="Enable / Disable Folder Creator">
            <input class="toggle-checkbox fc-switch" type="checkbox" ${isEnabled ? 'checked' : ''}>
            <div class="toggle-container">
              <div class="toggle-button"></div>
            </div>
          </div>
        </div>
      `;

      card.querySelector('.btn-duplicate').addEventListener('click', (e) => {
        e.stopPropagation();
        duplicateFc(item);
      });

      card.querySelector('.btn-edit').addEventListener('click', (e) => {
        e.stopPropagation();
        editFc(item);
      });

      card.querySelector('.btn-delete').addEventListener('click', (e) => {
        e.stopPropagation();
        deleteFc(item.id);
      });

      const sw = card.querySelector('.fc-switch');
      const badge = card.querySelector('.trigger-badge');
      sw.addEventListener('change', () => {
        const isChecked = sw.checked;
        item.enabled = isChecked ? 1 : 0;
        card.classList.toggle('is-disabled', !isChecked);
        if (badge) badge.classList.toggle('is-disabled', !isChecked);
        syncConfig();
        updateCardProfileBadges(card, 'folderCreator', item.id);
        updateGlobalIndicators();
      });

      card.addEventListener('click', (e) => {
        if (
          e.target.closest('.card-btn') ||
          e.target.closest('.toggle-wrapper') ||
          e.target.closest('.item-profiles-badges') ||
          e.target.closest('.item-profile-badge')
        ) return;
        sw.checked = !sw.checked;
        sw.dispatchEvent(new Event('change'));
      });

      fcContainer.appendChild(card);
    });
  }

  function submitFolderCreator() {
    const trig = fcInputTrigger.value.trim();
    const paths = fcTextareaFolders.value.trim();
    const name = fcInputName.value.trim();
    const seedFiles = fcInputSeedFiles.value.trim();
    const customPath = fcInputCustomPath ? fcInputCustomPath.value.trim() : '';

    if (!trig) {
      showToast('Please enter or record a trigger');
      fcInputTrigger.focus();
      return;
    }
    if (!paths) {
      showToast('Please specify at least one folder path');
      fcTextareaFolders.focus();
      return;
    }

    if (!state.config.folderCreator) {
      state.config.folderCreator = { enabled: 1, items: [] };
    }
    if (!Array.isArray(state.config.folderCreator.items)) {
      state.config.folderCreator.items = [];
    }

    if (editingFcId) {
      const idx = state.config.folderCreator.items.findIndex(s => s.id === editingFcId);
      if (idx !== -1) {
        state.config.folderCreator.items[idx] = {
          ...state.config.folderCreator.items[idx],
          trigger: trig,
          triggerType: currentFcType,
          targetLocation: currentFcLocation,
          customPath: customPath,
          folderPaths: paths,
          seedFiles: seedFiles,
          autoOpen: fcAutoOpen ? 1 : 0,
          name: name
        };
        updateItemAcrossProfiles('folderCreator', state.config.folderCreator.items[idx]);
        showToast(`Updated folder creator "${name || trig}"`);
      }
      editingFcId = null;
      if (fcBtnSubmitText) fcBtnSubmitText.textContent = 'ADD';
    } else {
      const newFc = {
        id: 'fc-' + Date.now(),
        trigger: trig,
        triggerType: currentFcType,
        targetLocation: currentFcLocation,
        customPath: customPath,
        folderPaths: paths,
        seedFiles: seedFiles,
        autoOpen: fcAutoOpen ? 1 : 0,
        name: name,
        enabled: 1
      };
      state.config.folderCreator.items.unshift(newFc);
      addItemAcrossProfiles('folderCreator', newFc);
      showToast(`Added folder creator "${name || trig}"`);
    }

    fcInputTrigger.value = '';
    fcTextareaFolders.value = '';
    fcInputName.value = '';
    fcInputSeedFiles.value = '';
    if (fcBtnClearTrigger) fcBtnClearTrigger.classList.add('hidden-field');
    renderFolderCreator();
    updateGlobalIndicators();
    syncConfig();
  }

  function editFc(item) {
    editingFcId = item.id;
    if (fcBtnSubmitText) fcBtnSubmitText.textContent = 'SAVE';
    setFcTriggerType(item.triggerType || 'string');
    fcInputTrigger.value = item.trigger || '';
    if (fcBtnClearTrigger && item.trigger) {
      fcBtnClearTrigger.classList.remove('hidden-field');
    }
    if (fcInputName) fcInputName.value = item.name || '';
    if (fcTextareaFolders) fcTextareaFolders.value = item.folderPaths || '';
    if (fcInputSeedFiles) fcInputSeedFiles.value = item.seedFiles || '';
    if (fcInputCustomPath) fcInputCustomPath.value = item.customPath || '';
    setFcLocation(item.targetLocation || 'activeExplorer');
    fcAutoOpen = item.autoOpen !== false && item.autoOpen !== 0;
    if (fcToggleAutoOpen) {
      fcToggleAutoOpen.classList.toggle('active', fcAutoOpen);
    }
    fcInputTrigger.focus();
  }

  function deleteFc(id) {
    if (editingFcId === id) {
      editingFcId = null;
      if (fcBtnSubmitText) fcBtnSubmitText.textContent = 'ADD';
      fcInputTrigger.value = '';
      fcTextareaFolders.value = '';
      fcInputName.value = '';
      fcInputSeedFiles.value = '';
    }
    deleteItemAcrossProfiles('folderCreator', id);
    state.config.folderCreator.items = state.config.folderCreator.items.filter(s => s.id !== id);
    renderFolderCreator();
    updateGlobalIndicators();
    syncConfig();
    showToast('Folder creator deleted');
  }

  function duplicateFc(item) {
    const copy = {
      ...JSON.parse(JSON.stringify(item)),
      id: 'fc-' + Date.now(),
      name: item.name ? `${item.name} (Copy)` : 'Copy',
      enabled: 1
    };
    state.config.folderCreator.items.unshift(copy);
    addItemAcrossProfiles('folderCreator', copy);
    renderFolderCreator();
    updateGlobalIndicators();
    syncConfig();
    showToast(`Duplicated "${copy.name}"`);
  }

  function initFolderCreator() {
    if (fcTypeString) {
      fcTypeString.addEventListener('click', () => setFcTriggerType('string'));
    }
    if (fcTypeHotkey) {
      fcTypeHotkey.addEventListener('click', () => setFcTriggerType('hotkey'));
    }
    if (fcLocActive) {
      fcLocActive.addEventListener('click', () => setFcLocation('activeExplorer'));
    }
    if (fcLocCustom) {
      fcLocCustom.addEventListener('click', () => setFcLocation('custom'));
    }
    if (fcToggleAutoOpen) {
      fcToggleAutoOpen.addEventListener('click', () => {
        fcAutoOpen = !fcAutoOpen;
        fcToggleAutoOpen.classList.toggle('active', fcAutoOpen);
      });
    }
    if (fcBtnBrowseTarget) {
      fcBtnBrowseTarget.addEventListener('click', () => {
        sendToAhk('browseFolder');
      });
    }
    if (fcInputTrigger) {
      fcInputTrigger.addEventListener('keydown', handleFcTriggerKeydown);
      fcInputTrigger.addEventListener('input', () => {
        if (fcBtnClearTrigger) {
          fcBtnClearTrigger.classList.toggle('hidden-field', !fcInputTrigger.value);
        }
      });
    }
    if (fcBtnClearTrigger) {
      fcBtnClearTrigger.addEventListener('click', () => {
        fcInputTrigger.value = '';
        fcBtnClearTrigger.classList.add('hidden-field');
        fcInputTrigger.focus();
      });
    }
    if (fcBtnSubmit) {
      fcBtnSubmit.addEventListener('click', submitFolderCreator);
    }
  }

  // ============================================================================
  // Module 5: Auto Clicker
  // ============================================================================

  function initAutoClicker() {
    const ac = state.config.autoClicker;
    acCpsSlider.value = ac.cps || 20;
    acCpsValue.textContent = `${ac.cps || 20} CPS`;
    updateSliderProgress(acCpsSlider);

    // Button selector
    acButtonSelector.querySelectorAll('.ac-pill-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.val === ac.button);
      btn.addEventListener('click', () => {
        acButtonSelector.querySelectorAll('.ac-pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.config.autoClicker.button = btn.dataset.val;
        syncConfig();
      });
    });

    // Click Type selector
    acTypeSelector.querySelectorAll('.ac-pill-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.val === ac.clickType);
      btn.addEventListener('click', () => {
        acTypeSelector.querySelectorAll('.ac-pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.config.autoClicker.clickType = btn.dataset.val;
        syncConfig();
      });
    });

    // CPS slider
    acCpsSlider.addEventListener('input', () => {
      acCpsValue.textContent = `${acCpsSlider.value} CPS`;
      updateSliderProgress(acCpsSlider);
    });

    acCpsSlider.addEventListener('change', () => {
      state.config.autoClicker.cps = parseInt(acCpsSlider.value, 10);
      updateSliderProgress(acCpsSlider);
      syncConfig();
    });

    // Toggle Button
    acToggleBtn.addEventListener('click', () => {
      sendToAhk('toggleAutoClicker');
    });

    updateAutoClickerUi(state.autoClickerRunning);
  }

  function updateAutoClickerUi(isRunning) {
    state.autoClickerRunning = isRunning;
    acToggleBtn.classList.toggle('running', isRunning);
    acToggleBtnText.textContent = isRunning ? 'STOP (F8)' : 'START (F8)';
    acStatusHint.textContent = isRunning
      ? 'Auto-Clicker is RUNNING! Press F8 anywhere to STOP.'
      : 'Ready - Press F8 anywhere in Windows to start or stop clicking.';

    // Animate radial dots if present
    if (radialDotsDial) {
      radialDotsDial.classList.toggle('spinning', isRunning);
    }
  }

  // ============================================================================
  // Module 6: Macro Recording & Sequencer
  // ============================================================================

  const macroState = {
    isRecording: false,
    useStandardDelays: true,
    standardDelay: 50,
    playbackMode: 'NoRepeat',
    steps: [],
    editingId: null
  };

  const macroInputName = document.getElementById('macroInputName');
  const macroTriggerBox = document.getElementById('macroTriggerBox');
  const macroInputTrigger = document.getElementById('macroInputTrigger');
  const macroBtnClearTrigger = document.getElementById('macroBtnClearTrigger');
  const macroModeSelector = document.getElementById('macroModeSelector');
  const macroIntervalBox = document.getElementById('macroIntervalBox');
  const macroInputInterval = document.getElementById('macroInputInterval');
  const macroBtnSubmit = document.getElementById('macroBtnSubmit');
  const macroBtnSubmitText = document.getElementById('macroBtnSubmitText');
  const macroBtnRecordToggle = document.getElementById('macroBtnRecordToggle');
  const macroBtnRecordText = document.getElementById('macroBtnRecordText');
  const macroRecDot = document.getElementById('macroRecDot');
  const macroStatusPill = document.getElementById('macroStatusPill');
  const macroStatusText = document.getElementById('macroStatusText');
  const macroBtnAddLClick = document.getElementById('macroBtnAddLClick');
  const macroBtnAddRClick = document.getElementById('macroBtnAddRClick');
  const macroBtnAddMClick = document.getElementById('macroBtnAddMClick');
  const macroBtnAddDelay = document.getElementById('macroBtnAddDelay');
  const macroChkStandardDelays = document.getElementById('macroChkStandardDelays');
  const macroBtnTestPlay = document.getElementById('macroBtnTestPlay');
  const macroBtnClearSteps = document.getElementById('macroBtnClearSteps');
  const macroTimelineTrack = document.getElementById('macroTimelineTrack');
  const macroTimelineEmpty = document.getElementById('macroTimelineEmpty');
  const macroCountBadge = document.getElementById('macroCountBadge');
  const macroListContainer = document.getElementById('macroListContainer');

  // Drag & drop state for macro sequencer
  let macroDragSourceIndex = null;
  let macroDragInjectItem = null;

  function renderMacroTimeline() {
    if (!macroTimelineTrack) return;
    macroTimelineTrack.innerHTML = '';

    if (!macroState.steps || macroState.steps.length === 0) {
      const emptyDiv = document.createElement('div');
      emptyDiv.className = 'macro-timeline-empty';
      emptyDiv.innerHTML = 'No sequence steps recorded yet. Click <strong>RECORD</strong> or <strong>drag &amp; drop buttons</strong> here.';
      macroTimelineTrack.appendChild(emptyDiv);
      return;
    }

    macroState.steps.forEach((step, idx) => {
      const chip = document.createElement('div');
      chip.className = 'macro-step-chip';
      chip.setAttribute('draggable', 'true');
      chip.dataset.index = idx;

      let dirClass = 'down';
      let dirSymbol = '↓';
      if (step.action === 'Up') {
        dirClass = 'up';
        dirSymbol = '↑';
      } else if (step.action === 'Click') {
        dirClass = 'click';
        dirSymbol = '🖱';
      } else if (step.action === 'Delay') {
        dirClass = 'delay';
        dirSymbol = '⏱';
      }

      chip.innerHTML = `
        <span class="macro-step-drag-grip" title="Drag to reorder">
          <svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor">
            <circle cx="8" cy="6" r="1.5"/><circle cx="16" cy="6" r="1.5"/>
            <circle cx="8" cy="12" r="1.5"/><circle cx="16" cy="12" r="1.5"/>
            <circle cx="8" cy="18" r="1.5"/><circle cx="16" cy="18" r="1.5"/>
          </svg>
        </span>
        <span class="macro-step-dir ${dirClass}">${dirSymbol}</span>
        <span class="macro-step-key">${escapeHtml(step.key || 'Delay')}</span>
        <span class="macro-step-delay" title="Click to edit delay">${step.delay || 50}ms</span>
        <button type="button" class="btn-remove-step" title="Remove step">&times;</button>
      `;

      // Drag Start
      chip.addEventListener('dragstart', (e) => {
        macroDragSourceIndex = idx;
        macroDragInjectItem = null;
        chip.classList.add('is-dragging');
        e.dataTransfer.effectAllowed = 'move';
        try {
          e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'reorder', fromIndex: idx }));
        } catch (err) { }
        e.stopPropagation();
      });

      // Drag End
      chip.addEventListener('dragend', () => {
        chip.classList.remove('is-dragging');
        macroDragSourceIndex = null;
        macroDragInjectItem = null;
        if (macroTimelineTrack) {
          macroTimelineTrack.querySelectorAll('.macro-step-chip').forEach(c => {
            c.classList.remove('drag-over-left', 'drag-over-right');
          });
        }
      });

      // Drag Over Chip
      chip.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';

        const rect = chip.getBoundingClientRect();
        const midX = rect.left + rect.width / 2;
        const isAfter = e.clientX > midX;

        chip.classList.toggle('drag-over-left', !isAfter);
        chip.classList.toggle('drag-over-right', isAfter);
      });

      // Drag Leave Chip
      chip.addEventListener('dragleave', (e) => {
        if (!chip.contains(e.relatedTarget)) {
          chip.classList.remove('drag-over-left', 'drag-over-right');
        }
      });

      // Drop on Chip
      chip.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        chip.classList.remove('drag-over-left', 'drag-over-right');

        const rect = chip.getBoundingClientRect();
        const midX = rect.left + rect.width / 2;
        const isAfter = e.clientX > midX;
        let targetIndex = isAfter ? idx + 1 : idx;

        let data = null;
        try {
          const raw = e.dataTransfer.getData('text/plain');
          if (raw) data = JSON.parse(raw);
        } catch (err) { }

        if (!data) {
          if (macroDragSourceIndex !== null) {
            data = { type: 'reorder', fromIndex: macroDragSourceIndex };
          } else if (macroDragInjectItem) {
            data = macroDragInjectItem;
          }
        }

        if (data && data.type === 'reorder') {
          const fromIdx = data.fromIndex;
          if (fromIdx === undefined || fromIdx === null) return;
          if (fromIdx === targetIndex || (fromIdx === targetIndex - 1 && isAfter)) {
            return;
          }
          const [movedStep] = macroState.steps.splice(fromIdx, 1);
          if (fromIdx < targetIndex) {
            targetIndex--;
          }
          macroState.steps.splice(targetIndex, 0, movedStep);
          renderMacroTimeline();
        } else if (data && data.type === 'inject') {
          macroState.steps.splice(targetIndex, 0, {
            action: data.action,
            key: data.key,
            delay: data.delay || 50
          });
          renderMacroTimeline();
        }
      });

      // Click to edit delay
      const delayEl = chip.querySelector('.macro-step-delay');
      if (delayEl) {
        delayEl.addEventListener('click', (e) => {
          e.stopPropagation();
          const current = step.delay || 50;
          const entered = prompt('Enter delay in milliseconds (5 - 5000):', current);
          if (entered !== null) {
            const parsed = parseInt(entered, 10);
            if (!isNaN(parsed) && parsed >= 5 && parsed <= 5000) {
              step.delay = parsed;
              renderMacroTimeline();
            }
          }
        });
      }

      // Remove step button
      const removeBtn = chip.querySelector('.btn-remove-step');
      if (removeBtn) {
        removeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          macroState.steps.splice(idx, 1);
          renderMacroTimeline();
        });
      }

      macroTimelineTrack.appendChild(chip);
    });
  }

  function addMacroStep(action, key, delay = 50) {
    if (!macroState.steps) macroState.steps = [];
    const stepDelay = (typeof delay === 'number' && !isNaN(delay)) ? Math.max(5, Math.round(delay)) : (parseInt(delay, 10) || 50);
    macroState.steps.push({
      action: action || 'Down',
      key: key || '',
      delay: stepDelay
    });
    renderMacroTimeline();
  }

  function startMacroRecording() {
    if (macroChkStandardDelays) {
      macroState.useStandardDelays = macroChkStandardDelays.checked;
    }
    macroState.isRecording = true;
    if (macroBtnRecordToggle) {
      macroBtnRecordToggle.classList.add('is-recording');
    }
    if (macroBtnRecordText) {
      macroBtnRecordText.textContent = 'STOP RECORDING';
    }
    if (macroStatusText) {
      macroStatusText.textContent = 'Recording live keystrokes...';
    }
    if (macroStatusPill) {
      macroStatusPill.style.color = '#ef4444';
    }
    sendToAhk('startMacroRecording', {
      options: {
        defDelay: macroState.standardDelay,
        realDelays: !macroState.useStandardDelays
      },
      defDelay: macroState.standardDelay,
      realDelays: !macroState.useStandardDelays
    });
  }

  function stopMacroRecording() {
    macroState.isRecording = false;
    if (macroBtnRecordToggle) {
      macroBtnRecordToggle.classList.remove('is-recording');
    }
    if (macroBtnRecordText) {
      macroBtnRecordText.textContent = 'RECORD';
    }
    if (macroStatusText) {
      macroStatusText.textContent = 'Ready to record';
    }
    if (macroStatusPill) {
      macroStatusPill.style.color = '';
    }
    sendToAhk('stopMacroRecording');
  }

  function toggleMacroRecording() {
    if (macroState.isRecording) {
      stopMacroRecording();
    } else {
      startMacroRecording();
    }
  }

  function testCurrentMacro() {
    if (!macroState.steps || macroState.steps.length === 0) {
      showToast('Record or add some steps before testing playback!');
      return;
    }
    sendToAhk('testMacro', {
      macro: {
        steps: macroState.steps,
        playbackMode: 'NoRepeat'
      }
    });
    showToast('Executing macro preview...');
  }

  function renderMacroRecorder() {
    if (!macroListContainer) return;
    macroListContainer.innerHTML = '';

    if (!state.config.macroRecorder) {
      state.config.macroRecorder = { enabled: true, items: [] };
    }

    if (typeof state.config.macroRecorder.useStandardDelays === 'boolean') {
      macroState.useStandardDelays = state.config.macroRecorder.useStandardDelays;
      if (macroChkStandardDelays) {
        macroChkStandardDelays.checked = macroState.useStandardDelays;
      }
    }

    const items = state.config.macroRecorder.items || [];

    if (macroCountBadge) {
      macroCountBadge.textContent = items.length;
    }

    if (items.length === 0) {
      macroListContainer.innerHTML = `
        <div class="empty-state">
          <span>No macros recorded yet</span>
          <p>Create your first macro above using the live keystroke recorder or mouse click injectors.</p>
        </div>
      `;
      if (typeof refreshAllActionSelects === 'function') refreshAllActionSelects();
      return;
    }

    items.forEach((item, itemIdx) => {
      const isEnabled = (item.enabled !== false && item.enabled !== 0);
      const card = document.createElement('div');
      card.className = `shortcut-card macro-card ${isEnabled ? '' : 'is-disabled'}`;
      card.dataset.id = item.id;
      card.dataset.module = 'macroRecorder';
      card.setAttribute('draggable', 'true');
      const stepsCount = (item.steps && Array.isArray(item.steps)) ? item.steps.length : 0;
      const profileBadgesHtml = renderItemProfileBadges('macroRecorder', item.id);

      let modeTag = 'Once';
      let modeClass = '';
      if (item.playbackMode === 'RepeatWhileHolding') {
        modeTag = 'Hold to Loop';
        modeClass = 'mode-hold';
      } else if (item.playbackMode === 'Toggle') {
        modeTag = 'Toggle Loop';
        modeClass = 'mode-toggle';
      }

      card.innerHTML = `
        <div class="macro-card-info">
          <div class="wm-icon-badge" style="width:36px;height:36px;border-radius:var(--radius-btn);">
            <svg class="wm-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
              <polyline points="2 17 12 22 22 17"></polyline>
              <polyline points="2 12 12 17 22 12"></polyline>
            </svg>
          </div>
          <div class="macro-card-text">
            <div class="macro-card-top">
              <span class="macro-title">${escapeHtml(item.name || 'Untitled Macro')}</span>
              <span class="wm-hotkey-badge ${isEnabled ? '' : 'is-disabled'}">${escapeHtml(formatKeyDisplay(item.trigger || 'Unassigned'))}</span>
            </div>
            <div class="macro-card-meta">
              <span class="macro-steps-tag">${stepsCount} steps</span>
              <span class="macro-mode-tag ${modeClass}">${modeTag}</span>
              ${(item.playbackMode !== 'NoRepeat' && item.repeatInterval) ? `<span class="macro-steps-tag">${item.repeatInterval}ms int</span>` : ''}
            </div>
          </div>
        </div>
        ${profileBadgesHtml}
        <div class="card-actions">
          <button class="card-btn btn-test-run" title="Test Run Macro">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:14px;height:14px;">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          </button>
          <button class="card-btn btn-edit" title="Edit Macro">
            <svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button class="card-btn btn-delete" title="Delete Macro">
            <svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
          <div class="toggle-wrapper" title="Enable / Disable Macro">
            <input class="toggle-checkbox macro-switch" type="checkbox" ${isEnabled ? 'checked' : ''}>
            <div class="toggle-container">
              <div class="toggle-button"></div>
            </div>
          </div>
        </div>
      `;

      // Drag reordering for macro cards in list
      card.addEventListener('dragstart', (e) => {
        card.classList.add('is-dragging');
        e.dataTransfer.effectAllowed = 'move';
        try {
          e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'macroCard', id: item.id }));
        } catch (err) { }
        e.stopPropagation();
      });

      card.addEventListener('dragend', () => {
        card.classList.remove('is-dragging');
        if (macroListContainer) {
          macroListContainer.querySelectorAll('.macro-card').forEach(c => {
            c.classList.remove('drag-over-top', 'drag-over-bottom');
          });
        }
      });

      card.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        const rect = card.getBoundingClientRect();
        const isBottom = e.clientY > (rect.top + rect.height / 2);
        card.classList.toggle('drag-over-top', !isBottom);
        card.classList.toggle('drag-over-bottom', isBottom);
      });

      card.addEventListener('dragleave', (e) => {
        if (!card.contains(e.relatedTarget)) {
          card.classList.remove('drag-over-top', 'drag-over-bottom');
        }
      });

      card.addEventListener('drop', (e) => {
        e.preventDefault();
        card.classList.remove('drag-over-top', 'drag-over-bottom');
        let data = null;
        try {
          const raw = e.dataTransfer.getData('text/plain');
          if (raw) data = JSON.parse(raw);
        } catch (err) { }

        if (data && data.type === 'macroCard' && data.id !== item.id) {
          const items = state.config.macroRecorder.items;
          const fromIdx = items.findIndex(m => m.id === data.id);
          let toIdx = items.findIndex(m => m.id === item.id);
          if (fromIdx !== -1 && toIdx !== -1) {
            const rect = card.getBoundingClientRect();
            if (e.clientY > (rect.top + rect.height / 2)) toIdx++;
            const [moved] = items.splice(fromIdx, 1);
            if (fromIdx < toIdx) toIdx--;
            items.splice(toIdx, 0, moved);
            renderMacroRecorder();
            syncConfig();
          }
        }
      });

      // Test Run
      card.querySelector('.btn-test-run').addEventListener('click', (e) => {
        e.stopPropagation();
        sendToAhk('testMacro', { macro: item });
        showToast(`Running "${item.name}"...`);
      });

      // Edit
      card.querySelector('.btn-edit').addEventListener('click', (e) => {
        e.stopPropagation();
        editMacro(item);
      });

      // Delete
      card.querySelector('.btn-delete').addEventListener('click', (e) => {
        e.stopPropagation();
        deleteMacro(item.id);
      });

      // Toggle Switch
      const sw = card.querySelector('.macro-switch');
      const badge = card.querySelector('.wm-hotkey-badge');
      const iconBadge = card.querySelector('.wm-icon-badge');
      if (iconBadge) {
        iconBadge.classList.toggle('is-disabled', !isEnabled);
      }
      sw.addEventListener('change', () => {
        const isChecked = sw.checked;
        item.enabled = isChecked ? 1 : 0;
        card.classList.toggle('is-disabled', !isChecked);
        if (badge) badge.classList.toggle('is-disabled', !isChecked);
        if (iconBadge) iconBadge.classList.toggle('is-disabled', !isChecked);
        syncConfig();
        updateCardProfileBadges(card, 'macroRecorder', item.id);
        updateGlobalIndicators();
      });

      card.addEventListener('click', (e) => {
        if (
          e.target.closest('.card-btn') ||
          e.target.closest('.toggle-wrapper') ||
          e.target.closest('.item-profiles-badges') ||
          e.target.closest('.item-profile-badge') ||
          card.classList.contains('is-dragging')
        ) return;
        sw.checked = !sw.checked;
        sw.dispatchEvent(new Event('change'));
      });

      macroListContainer.appendChild(card);
    });
    if (typeof refreshAllActionSelects === 'function') refreshAllActionSelects();
  }

  function submitMacro() {
    try {
      const name = macroInputName ? macroInputName.value.trim() : '';
      const trig = macroInputTrigger ? macroInputTrigger.value.trim() : '';
      const interval = macroInputInterval ? parseInt(macroInputInterval.value, 10) || 50 : 50;

      if (!name) {
        if (macroInputName) macroInputName.focus();
        showToast('Please enter a name for the macro');
        return;
      }
      if (!trig) {
        if (macroInputTrigger) macroInputTrigger.focus();
        showToast('Please record a trigger hotkey');
        return;
      }
      if (!macroState.steps || macroState.steps.length === 0) {
        showToast('Please record or add at least one step in the sequence');
        return;
      }

      if (!state.config.macroRecorder) {
        state.config.macroRecorder = { enabled: 1, items: [] };
      }
      if (!Array.isArray(state.config.macroRecorder.items)) {
        state.config.macroRecorder.items = [];
      }

      if (macroState.editingId) {
        const idx = state.config.macroRecorder.items.findIndex(m => m.id === macroState.editingId);
        if (idx !== -1) {
          state.config.macroRecorder.items[idx] = {
            ...state.config.macroRecorder.items[idx],
            name: name,
            trigger: trig,
            playbackMode: macroState.playbackMode,
            repeatInterval: interval,
            steps: JSON.parse(JSON.stringify(macroState.steps))
          };
          updateItemAcrossProfiles('macroRecorder', state.config.macroRecorder.items[idx]);
        }
        macroState.editingId = null;
        if (macroBtnSubmitText) macroBtnSubmitText.textContent = 'ADD';
        showToast(`Updated macro "${name}"`);
      } else {
        const newMacro = {
          id: 'macro-' + Date.now(),
          name: name,
          trigger: trig,
          playbackMode: macroState.playbackMode,
          repeatInterval: interval,
          enabled: 1,
          steps: JSON.parse(JSON.stringify(macroState.steps))
        };
        state.config.macroRecorder.items.unshift(newMacro);
        addItemAcrossProfiles('macroRecorder', newMacro);
        showToast(`Created macro "${name}"`);
      }

      if (macroInputName) macroInputName.value = '';
      if (macroInputTrigger) {
        macroInputTrigger.value = '';
        macroInputTrigger.placeholder = 'Click to record...';
      }
      if (macroBtnClearTrigger) macroBtnClearTrigger.classList.add('hidden-field');
      macroState.steps = [];
      renderMacroTimeline();
      renderMacroRecorder();
      syncConfig();
    } catch (err) {
      console.error('Error submitting macro:', err);
      showToast('Error saving macro: ' + err.message, 'error');
    }
  }

  function editMacro(item) {
    macroState.editingId = item.id;
    if (macroInputName) macroInputName.value = item.name || '';
    if (macroInputTrigger) {
      macroInputTrigger.value = item.trigger || '';
      if (macroBtnClearTrigger) macroBtnClearTrigger.classList.remove('hidden-field');
    }
    if (macroInputInterval) {
      macroInputInterval.value = item.repeatInterval || 50;
    }

    setMacroPlaybackMode(item.playbackMode || 'NoRepeat');

    macroState.steps = (item.steps && Array.isArray(item.steps)) ? JSON.parse(JSON.stringify(item.steps)) : [];
    renderMacroTimeline();

    if (macroBtnSubmitText) macroBtnSubmitText.textContent = 'SAVE';
    if (macroInputName) macroInputName.focus();
    showToast(`Editing "${item.name}"`);
  }

  function deleteMacro(id) {
    if (!state.config.macroRecorder) return;
    deleteItemAcrossProfiles('macroRecorder', id);
    state.config.macroRecorder.items = state.config.macroRecorder.items.filter(m => m.id !== id);
    if (macroState.editingId === id) {
      macroState.editingId = null;
      if (macroBtnSubmitText) macroBtnSubmitText.textContent = 'ADD';
    }
    renderMacroRecorder();
    syncConfig();
    showToast('Macro deleted');
  }

  function setMacroPlaybackMode(mode) {
    macroState.playbackMode = mode;
    if (macroModeSelector) {
      macroModeSelector.querySelectorAll('.macro-mode-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
      });
    }
    if (macroIntervalBox) {
      macroIntervalBox.classList.toggle('is-hidden', mode === 'NoRepeat');
    }
  }

  function initMacroRecorder() {
    setupKeyCombinationBox(macroTriggerBox, macroInputTrigger, macroBtnClearTrigger, null, submitMacro);

    if (macroInputName) {
      macroInputName.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (macroInputTrigger && !macroInputTrigger.value.trim()) {
            if (macroTriggerBox) macroTriggerBox.click();
          } else {
            submitMacro();
          }
        }
      });
    }

    if (macroModeSelector) {
      macroModeSelector.querySelectorAll('.macro-mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          setMacroPlaybackMode(btn.dataset.mode);
        });
      });
    }

    if (macroInputInterval) {
      macroInputInterval.addEventListener('input', () => {
        const val = parseInt(macroInputInterval.value, 10);
        if (!isNaN(val)) macroState.repeatInterval = Math.max(5, val);
      });
    }

    if (macroChkStandardDelays) {
      macroChkStandardDelays.addEventListener('change', () => {
        macroState.useStandardDelays = macroChkStandardDelays.checked;
        if (!state.config.macroRecorder) {
          state.config.macroRecorder = { enabled: true, items: [] };
        }
        state.config.macroRecorder.useStandardDelays = macroChkStandardDelays.checked;
        syncConfig();
        sendToAhk('setMacroRecordingOptions', {
          defDelay: macroState.standardDelay,
          realDelays: !macroState.useStandardDelays
        });
      });
    }

    if (macroBtnSubmit) {
      macroBtnSubmit.addEventListener('click', submitMacro);
    }

    if (macroBtnRecordToggle) {
      macroBtnRecordToggle.addEventListener('click', toggleMacroRecording);
    }

    // Quick Action Injectors with Click & Drag-and-Drop
    function wireInjectButton(btn, action, key, delay = 50) {
      if (!btn) return;
      btn.setAttribute('draggable', 'true');
      btn.addEventListener('click', () => {
        addMacroStep(action, key, delay);
      });
      btn.addEventListener('dragstart', (e) => {
        macroDragSourceIndex = null;
        macroDragInjectItem = { type: 'inject', action, key, delay };
        btn.classList.add('is-dragging');
        e.dataTransfer.effectAllowed = 'copyMove';
        try {
          e.dataTransfer.setData('text/plain', JSON.stringify(macroDragInjectItem));
        } catch (err) { }
        e.stopPropagation();
      });
      btn.addEventListener('dragend', () => {
        btn.classList.remove('is-dragging');
        macroDragInjectItem = null;
      });
    }

    wireInjectButton(macroBtnAddLClick, 'Click', 'LButton', 50);
    wireInjectButton(macroBtnAddRClick, 'Click', 'RButton', 50);
    wireInjectButton(macroBtnAddMClick, 'Click', 'MButton', 50);
    wireInjectButton(macroBtnAddDelay, 'Delay', 'Sleep', 50);

    // Timeline track drop zone for empty background drops
    if (macroTimelineTrack) {
      macroTimelineTrack.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        macroTimelineTrack.classList.add('track-drag-over');
      });

      macroTimelineTrack.addEventListener('dragleave', (e) => {
        if (!macroTimelineTrack.contains(e.relatedTarget)) {
          macroTimelineTrack.classList.remove('track-drag-over');
        }
      });

      macroTimelineTrack.addEventListener('drop', (e) => {
        macroTimelineTrack.classList.remove('track-drag-over');
        if (e.target === macroTimelineTrack || e.target.classList.contains('macro-timeline-empty')) {
          e.preventDefault();
          let data = null;
          try {
            const raw = e.dataTransfer.getData('text/plain');
            if (raw) data = JSON.parse(raw);
          } catch (err) { }

          if (!data) {
            if (macroDragSourceIndex !== null) data = { type: 'reorder', fromIndex: macroDragSourceIndex };
            else if (macroDragInjectItem) data = macroDragInjectItem;
          }

          if (data && data.type === 'reorder') {
            const fromIdx = data.fromIndex;
            if (fromIdx !== undefined && fromIdx !== null && fromIdx < macroState.steps.length) {
              const [movedStep] = macroState.steps.splice(fromIdx, 1);
              macroState.steps.push(movedStep);
              renderMacroTimeline();
            }
          } else if (data && data.type === 'inject') {
            addMacroStep(data.action, data.key, data.delay || 50);
          }
        }
      });
    }

    if (macroBtnTestPlay) {
      macroBtnTestPlay.addEventListener('click', testCurrentMacro);
    }
    if (macroBtnClearSteps) {
      macroBtnClearSteps.addEventListener('click', () => {
        macroState.steps = [];
        renderMacroTimeline();
      });
    }

    setMacroPlaybackMode('NoRepeat');
    renderMacroTimeline();
    renderMacroRecorder();
  }

  // ============================================================================
  // Master Engine Switch & Indicators
  // ============================================================================

  function toggleMasterEngine() {
    state.enabled = !state.enabled;
    updateSwitchUi();
    syncConfig();
  }

  function updateSwitchUi() {
    if (state.enabled) {
      if (mainEngineSwitch) {
        mainEngineSwitch.classList.remove('is-off');
        mainEngineSwitch.classList.add('is-on');
      }
      if (switchCaptionText) switchCaptionText.textContent = 'ACTIVE';
      if (statusSubtitle) statusSubtitle.innerHTML = 'Engine: <span class="status-indicator-text online">Active</span>';
    } else {
      if (mainEngineSwitch) {
        mainEngineSwitch.classList.remove('is-on');
        mainEngineSwitch.classList.add('is-off');
      }
      if (switchCaptionText) switchCaptionText.textContent = 'SUSPENDED';
      if (statusSubtitle) statusSubtitle.innerHTML = 'Engine: <span class="status-indicator-text offline">Suspended</span>';
    }
  }

  function updateGlobalIndicators() {
    const currentProfName = (state.config && state.config.activeProfile) || 'Default';
    const totalItems = getProfileActiveScriptsCount(currentProfName);

    const badge = document.getElementById('activeCountBadge') || activeCountBadge;
    if (badge) {
      badge.textContent = String(totalItems);
    }

    const gauge = document.getElementById('gaugeCircle') || gaugeCircle;
    if (gauge) {
      const maxItems = 15;
      const progress = Math.min(totalItems / maxItems, 1);
      const circumference = 150.79;
      const offset = circumference - (progress * circumference * 0.75);
      gauge.style.strokeDashoffset = offset;
    }
  }

  // ============================================================================
  // Active Scripts Overview Modal (Quick Switchboard for Current Profile)
  // ============================================================================

  function openActiveScriptsModal() {
    const modal = document.getElementById('activeScriptsModal');
    const body = document.getElementById('activeScriptsModalBody');
    const titleEl = document.getElementById('activeScriptsModalTitle');
    const subtitleEl = document.getElementById('activeScriptsModalSubtitle');
    if (!modal || !body) return;

    saveCurrentProfileState();
    const currentProfName = (state.config && state.config.activeProfile) || 'Default';
    let prof = null;
    if (state.config && state.config.profiles) {
      if (!Array.isArray(state.config.profiles) && state.config.profiles[currentProfName]) {
        prof = state.config.profiles[currentProfName];
      } else if (Array.isArray(state.config.profiles)) {
        prof = state.config.profiles.find(p => p && (p.name === currentProfName || p.id === currentProfName));
      }
    }
    if (!prof) prof = state.config || {};

    if (titleEl) {
      titleEl.textContent = `ACTIVE SCRIPTS (${currentProfName.toUpperCase()})`;
    }

    body.innerHTML = '';
    let totalActive = 0;

    function createActiveItemCard(item, moduleName, displayTitle, displayMeta, onToggle) {
      const card = document.createElement('div');
      card.className = 'shortcut-card active-script-card';
      card.dataset.module = moduleName;
      if (item && item.id) card.dataset.id = item.id;
      if (item && item.featureKey) card.dataset.featureKey = item.featureKey;
      const isEnabled = item.enabled !== false && item.enabled !== 0;

      card.innerHTML = `
        <div class="card-info">
          <span class="trigger-badge">${escapeHtml(displayTitle)}</span>
          <span class="arrow-divider"><svg class="arrow-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg></span>
          <span class="expansion-text" title="${escapeHtml(displayMeta)}">${escapeHtml(displayMeta)}</span>
        </div>
        <div class="card-actions">
          <div class="toggle-wrapper" title="Toggle On / Off in current profile">
            <input class="toggle-checkbox active-overview-switch" type="checkbox" ${isEnabled ? 'checked' : ''}>
            <div class="toggle-container">
              <div class="toggle-button"></div>
            </div>
          </div>
        </div>
      `;

      const sw = card.querySelector('.active-overview-switch');
      sw.addEventListener('change', () => {
        const checked = sw.checked;
        item.enabled = checked ? 1 : 0;
        card.classList.toggle('is-disabled', !checked);
        if (typeof onToggle === 'function') onToggle(checked);
        syncConfig();
        updateGlobalIndicators();
        // Re-sync subtitle count
        if (subtitleEl) {
          const count = body.querySelectorAll('.active-overview-switch:checked').length;
          subtitleEl.textContent = `Profile: ${currentProfName} • ${count} Active`;
        }
      });

      card.addEventListener('click', (e) => {
        if (e.target.closest('.toggle-wrapper')) return;
        sw.checked = !sw.checked;
        sw.dispatchEvent(new Event('change'));
      });

      return card;
    }

    function appendSection(title, cards) {
      if (!cards || cards.length === 0) return;
      const header = document.createElement('div');
      header.className = 'active-scripts-category-header';
      header.innerHTML = `
        <span class="active-scripts-category-title">
          <svg style="width:13px;height:13px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
          ${escapeHtml(title)}
        </span>
        <span class="multiline-badge">${cards.length}</span>
      `;
      body.appendChild(header);
      cards.forEach(c => body.appendChild(c));
    }

    // 1. Text Expander
    const te = prof.textExpander || {};
    if (te.items && Array.isArray(te.items)) {
      const activeTe = te.items.filter(i => i && i.enabled !== false && i.enabled !== 0);
      const cards = activeTe.map(item => {
        totalActive++;
        return createActiveItemCard(
          item,
          'textExpander',
          item.input,
          item.output.replace(/\n/g, ' \\n '),
          (checked) => {
            if (state.config && state.config.textExpander && Array.isArray(state.config.textExpander.items)) {
              const live = state.config.textExpander.items.find(x => x.id === item.id);
              if (live) live.enabled = checked ? 1 : 0;
            }
            renderTextExpander();
          }
        );
      });
      appendSection('Text Expander', cards);
    }

    // 2. Key Remapper
    const kr = prof.keyRemapper || {};
    if (kr.items && Array.isArray(kr.items)) {
      const activeKr = kr.items.filter(i => i && i.enabled !== false && i.enabled !== 0);
      const cards = activeKr.map(item => {
        totalActive++;
        const src = formatKeyDisplay(item.source);
        const tgt = formatKeyDisplay(item.target);
        return createActiveItemCard(
          item,
          'keyRemapper',
          src,
          tgt,
          (checked) => {
            if (state.config && state.config.keyRemapper && Array.isArray(state.config.keyRemapper.items)) {
              const live = state.config.keyRemapper.items.find(x => x.id === item.id);
              if (live) live.enabled = checked ? 1 : 0;
            }
            renderKeyRemapper();
          }
        );
      });
      appendSection('Key Remapper', cards);
    }

    // 3. App Launcher
    const al = prof.appLauncher || {};
    if (al.items && Array.isArray(al.items)) {
      const activeAl = al.items.filter(i => i && i.enabled !== false && i.enabled !== 0);
      const cards = activeAl.map(item => {
        totalActive++;
        const trig = item.triggerType === 'hotkey' ? formatKeyDisplay(item.trigger) : item.trigger;
        return createActiveItemCard(
          item,
          'appLauncher',
          trig,
          `${item.name || 'Launch'}: ${item.target}`,
          (checked) => {
            if (state.config && state.config.appLauncher && Array.isArray(state.config.appLauncher.items)) {
              const live = state.config.appLauncher.items.find(x => x.id === item.id);
              if (live) live.enabled = checked ? 1 : 0;
            }
            renderAppLauncher();
          }
        );
      });
      appendSection('App Launcher', cards);
    }

    // 3.5. Folder Creator
    const fc = prof.folderCreator || {};
    if (fc.items && Array.isArray(fc.items)) {
      const activeFc = fc.items.filter(i => i && i.enabled !== false && i.enabled !== 0);
      const cards = activeFc.map(item => {
        totalActive++;
        const isHk = item.triggerType === 'hotkey';
        const trig = isHk ? formatKeyDisplay(item.trigger || 'No Key') : (item.trigger || 'No Trigger');
        return createActiveItemCard(
          item,
          'folderCreator',
          trig,
          item.name || 'Folder Creator',
          (checked) => {
            if (state.config && state.config.folderCreator && Array.isArray(state.config.folderCreator.items)) {
              const live = state.config.folderCreator.items.find(x => x.id === item.id);
              if (live) live.enabled = checked ? 1 : 0;
            }
            renderFolderCreator();
          }
        );
      });
      appendSection('Folder Creator', cards);
    }

    // 4. Macro Recorder
    const mr = prof.macroRecorder || {};
    if (mr.items && Array.isArray(mr.items)) {
      const activeMr = mr.items.filter(i => i && i.enabled !== false && i.enabled !== 0);
      const cards = activeMr.map(item => {
        totalActive++;
        const trig = formatKeyDisplay(item.trigger || 'No Key');
        const count = (item.steps && Array.isArray(item.steps)) ? item.steps.length : 0;
        return createActiveItemCard(
          item,
          'macroRecorder',
          trig,
          `${item.name || 'Macro'} (${count} steps)`,
          (checked) => {
            if (state.config && state.config.macroRecorder && Array.isArray(state.config.macroRecorder.items)) {
              const live = state.config.macroRecorder.items.find(x => x.id === item.id);
              if (live) live.enabled = checked ? 1 : 0;
            }
            renderMacroRecorder();
          }
        );
      });
      appendSection('Macro Recorder', cards);
    }

    // 5. Window Tools
    const wm = prof.windowManager || prof.systemTools || (state.config && (state.config.windowManager || state.config.systemTools)) || {};
    const wmDefinitions = [
      { key: 'alwaysOnTopEnabled', title: 'Always on Top', meta: wm.alwaysOnTopHotkey ? formatKeyDisplay(wm.alwaysOnTopHotkey) : 'Ctrl+Space' },
      { key: 'centerWindowEnabled', title: 'Center Window', meta: wm.centerWindowHotkey ? formatKeyDisplay(wm.centerWindowHotkey) : 'Ctrl+Alt+C' },
      { key: 'hideWindowEnabled', title: 'Hide to Tray', meta: wm.hideWindowHotkey ? formatKeyDisplay(wm.hideWindowHotkey) : 'Ctrl+Alt+H' },
      { key: 'borderlessEnabled', title: 'Borderless Fullscreen', meta: wm.borderlessHotkey ? formatKeyDisplay(wm.borderlessHotkey) : 'Ctrl+Alt+Enter' },
      { key: 'windowShadeEnabled', title: 'Window Shade Roll-Up', meta: wm.windowShadeHotkey ? formatKeyDisplay(wm.windowShadeHotkey) : 'Ctrl+Alt+R' },
      { key: 'appVolumeWheel', title: 'Hover App Volume Wheel', meta: 'Alt + Mouse Wheel over window' },
      { key: 'appVolumeMuteEnabled', title: 'App Volume Mute', meta: wm.appVolumeMuteHotkey ? formatKeyDisplay(wm.appVolumeMuteHotkey) : 'Alt+M' },
      { key: 'masterAudioMuteEnabled', title: 'Master Audio Mute', meta: 'Alt+M (Mute Speakers)' },
      { key: 'transparencyWheel', title: 'Window Transparency Wheel', meta: 'Ctrl + Alt + Mouse Wheel' },
      { key: 'clickThroughGhost', title: 'Ghost Click-Through Window', meta: wm.clickThroughGhostHotkey ? formatKeyDisplay(wm.clickThroughGhostHotkey) : 'Ctrl+Alt+G' },
      { key: 'textTransformEnabled', title: 'Uppercase Transformation', meta: 'Convert selected text' },
      { key: 'textTransformCleanEnabled', title: 'Clean String Stripper', meta: 'Strip symbols & spaces' },
      { key: 'screenOcrEnabled', title: 'Screen Text OCR Snipper', meta: 'Copy text directly from screen' },
      { key: 'colorPickerEnabled', title: 'Precision Color Eyedropper', meta: 'Pick hex colors from pixels' },
      { key: 'virtualDesktopsEnabled', title: 'Virtual Desktop Taskbar Switch', meta: 'Mouse wheel over taskbar' },
      { key: 'taskbarScrollEnabled', title: 'Taskbar Volume Control', meta: 'Mouse wheel over taskbar' },
      { key: 'sleepEnabled', title: 'Quick Sleep / Hibernate', meta: 'Win + S' }
    ];

    const activeWmCards = [];
    wmDefinitions.forEach(def => {
      if (wm[def.key] === 1 || wm[def.key] === true) {
        totalActive++;
        const dummyItem = { enabled: 1, featureKey: def.key };
        const c = createActiveItemCard(
          dummyItem,
          'windowManager',
          def.title,
          def.meta,
          (checked) => {
            wm[def.key] = checked ? 1 : 0;
            if (state.config && state.config.windowManager) {
              state.config.windowManager[def.key] = checked ? 1 : 0;
            }
            initWindowManager();
          }
        );
        activeWmCards.push(c);
      }
    });
    appendSection('Window Tools & Productivity', activeWmCards);

    // 6. Mouse Gestures & Corners
    const mg = prof.mouseGestures || prof.gesturesAndCorners || (state.config && (state.config.mouseGestures || state.config.gesturesAndCorners)) || {};
    const mgCards = [];
    if (mg.cornersEnabled === 1 || mg.cornersEnabled === true) {
      totalActive++;
      const dummyItem = { enabled: 1, featureKey: 'cornersEnabled' };
      mgCards.push(createActiveItemCard(
        dummyItem,
        'mouseGestures',
        'Screen Hot Corners',
        `Top-Left: ${mg.cornerTopLeft || 'None'} • Top-Right: ${mg.cornerTopRight || 'None'}`,
        (checked) => {
          mg.cornersEnabled = checked ? 1 : 0;
          if (state.config && state.config.mouseGestures) {
            state.config.mouseGestures.cornersEnabled = checked ? 1 : 0;
          }
          initMouseGestures();
        }
      ));
    }
    if (mg.gesturesEnabled === 1 || mg.gesturesEnabled === true) {
      totalActive++;
      const dummyItem = { enabled: 1, featureKey: 'gesturesEnabled' };
      mgCards.push(createActiveItemCard(
        dummyItem,
        'mouseGestures',
        'Mouse Gestures',
        `Trigger: ${mg.triggerButton || 'MButton'}`,
        (checked) => {
          mg.gesturesEnabled = checked ? 1 : 0;
          if (state.config && state.config.mouseGestures) {
            state.config.mouseGestures.gesturesEnabled = checked ? 1 : 0;
          }
          initMouseGestures();
        }
      ));
    }
    appendSection('Mouse Gestures & Hot Corners', mgCards);

    // 7. Radial Menu
    const rm = prof.radialMenu || {};
    if (rm.enabled === 1 || rm.enabled === true) {
      totalActive++;
      const dummyItem = { enabled: 1, featureKey: 'enabled' };
      const c = createActiveItemCard(
        dummyItem,
        'radialMenu',
        'Radial Menu (Pie Wheel)',
        `Trigger: ${rm.triggerButton || '^SPACE'} • Radius: ${rm.wheelRadius || 190}px`,
        (checked) => {
          rm.enabled = checked ? 1 : 0;
          if (state.config && state.config.radialMenu) {
            state.config.radialMenu.enabled = checked ? 1 : 0;
          }
          initRadialMenu();
        }
      );
      appendSection('Radial Menu', [c]);
    }

    // 8. Auto Clicker
    const ac = prof.autoClicker || {};
    if (ac.enabled === 1 || ac.enabled === true) {
      totalActive++;
      const dummyItem = { enabled: 1 };
      const c = createActiveItemCard(
        dummyItem,
        'autoClicker',
        'Auto Clicker',
        `Speed: ${ac.cps || 20} CPS • Button: ${ac.button || 'Left'} • Hotkey: ${ac.hotkey || 'F8'}`,
        (checked) => {
          ac.enabled = checked ? 1 : 0;
          if (state.config && state.config.autoClicker) {
            state.config.autoClicker.enabled = checked ? 1 : 0;
          }
          initAutoClicker();
        }
      );
      appendSection('Auto Clicker', [c]);
    }

    if (totalActive === 0) {
      body.innerHTML = `
        <div class="active-scripts-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span style="font-weight: 700; font-size: 14px;">No Active Scripts in "${escapeHtml(currentProfName)}"</span>
          <span style="font-size: 12px; max-width: 320px;">Turn on any script switch in the tabs to activate it for this profile.</span>
        </div>
      `;
    }

    if (subtitleEl) {
      subtitleEl.textContent = `Profile: ${currentProfName} • ${totalActive} Active`;
    }

    modal.classList.remove('hidden-field');
  }

  function closeActiveScriptsModal() {
    const modal = document.getElementById('activeScriptsModal');
    if (modal) {
      modal.classList.add('hidden-field');
      syncConfig();
      updateGlobalIndicators();
    }
  }

  // ============================================================================
  // Theme Engine (Primary Background & Secondary Elements Colors)
  // ============================================================================
  // Theme Engine (Primary Background & Secondary Elements Colors)
  // ============================================================================

  function hexToRgb(hex) {
    let c = hex.replace('#', '').trim();
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    const num = parseInt(c, 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255
    };
  }

  function rgbToHex(r, g, b) {
    const clamp = v => Math.max(0, Math.min(255, Math.round(v)));
    return '#' + [clamp(r), clamp(g), clamp(b)].map(x => x.toString(16).padStart(2, '0')).join('');
  }

  function hexToHsl(hex) {
    let c = hex.replace('#', '').trim();
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    const r = parseInt(c.substring(0, 2), 16) / 255;
    const g = parseInt(c.substring(2, 4), 16) / 255;
    const b = parseInt(c.substring(4, 6), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return { h, s, l };
  }

  function hslToHex(h, s, l) {
    l = Math.max(0, Math.min(1, l));
    s = Math.max(0, Math.min(1, s));
    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      function hue2rgb(p, q, t) {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      }
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    const toHex = x => {
      const hex = Math.round(Math.max(0, Math.min(255, x * 255))).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return '#' + toHex(r) + toHex(g) + toHex(b);
  }

  // Hand-crafted Neumorphic Theme Presets: Diverse, colorful clay base palettes across all aesthetics
  const THEME_PRESETS = {
    'custom-default': {
      name: 'Warm Clay (Default)',
      bgColor: '#e8dfd5',
      accentColor: '#d97706',
      radius: 5,
      distance: 4,
      lightIntensity: 39,
      darkIntensity: 5,
      blur: 9
    },
    'dribbble-soft-gray': {
      name: 'Dribbble Soft Canvas',
      bgColor: '#e0e5ec',
      accentColor: '#3b82f6',
      radius: 16,
      distance: 5,
      lightIntensity: 85,
      darkIntensity: 18,
      blur: 10
    },
    'porcelain-ceramic': {
      name: 'Porcelain Ceramic',
      bgColor: '#f1f5f9',
      accentColor: '#2563eb',
      radius: 28,
      distance: 7,
      lightIntensity: 85,
      darkIntensity: 20,
      blur: 16
    },
    'pure-snow': {
      name: 'Pure Snow Clay',
      bgColor: '#f8fafc',
      accentColor: '#0ea5e9',
      radius: 18,
      distance: 4,
      lightIntensity: 90,
      darkIntensity: 15,
      blur: 12
    },
    'alabaster-clean': {
      name: 'Alabaster Minimal',
      bgColor: '#f4f4f5',
      accentColor: '#18181b',
      radius: 12,
      distance: 4,
      lightIntensity: 80,
      darkIntensity: 18,
      blur: 10
    },
    'nordic-linen': {
      name: 'Nordic Linen',
      bgColor: '#dfd9ce',
      accentColor: '#92400e',
      radius: 10,
      distance: 4,
      lightIntensity: 65,
      darkIntensity: 20,
      blur: 8
    },
    'nord-frost': {
      name: 'Nord Frost',
      bgColor: '#e5e9f0',
      accentColor: '#5e81ac',
      radius: 8,
      distance: 3,
      lightIntensity: 32,
      darkIntensity: 16,
      blur: 7
    },
    'silver-chiffon': {
      name: 'Silver Chiffon',
      bgColor: '#e2e8f0',
      accentColor: '#475569',
      radius: 14,
      distance: 4,
      lightIntensity: 75,
      darkIntensity: 18,
      blur: 9
    },
    'retro-sharp': {
      name: 'Retro Paper',
      bgColor: '#f2efe9',
      accentColor: '#e11d48',
      radius: 4,
      distance: 3,
      lightIntensity: 50,
      darkIntensity: 16,
      blur: 0
    },
    'solarized-cream': {
      name: 'Solarized Cream',
      bgColor: '#fdf6e3',
      accentColor: '#b58900',
      radius: 6,
      distance: 3,
      lightIntensity: 32,
      darkIntensity: 14,
      blur: 6
    },
    'butter-cream': {
      name: 'Butter Cream',
      bgColor: '#fef3c7',
      accentColor: '#b45309',
      radius: 14,
      distance: 4,
      lightIntensity: 35,
      darkIntensity: 15,
      blur: 8
    },
    'cappuccino-foam': {
      name: 'Cappuccino Foam',
      bgColor: '#ede0d4',
      accentColor: '#7f4f24',
      radius: 16,
      distance: 4,
      lightIntensity: 45,
      darkIntensity: 16,
      blur: 9
    },
    'desert-caramel': {
      name: 'Desert Caramel',
      bgColor: '#c68b59',
      accentColor: '#451a03',
      radius: 8,
      distance: 3,
      lightIntensity: 25,
      darkIntensity: 22,
      blur: 7
    },
    'roasted-cocoa': {
      name: 'Roasted Cocoa',
      bgColor: '#351c14',
      accentColor: '#fbbf24',
      radius: 10,
      distance: 3,
      lightIntensity: 22,
      darkIntensity: 60,
      blur: 5
    },
    'espresso-mocha': {
      name: 'Espresso Mocha',
      bgColor: '#2b1d14',
      accentColor: '#f59e0b',
      radius: 10,
      distance: 3,
      lightIntensity: 18,
      darkIntensity: 36,
      blur: 7
    },
    'brutalist-concrete': {
      name: 'Brutalist Concrete',
      bgColor: '#78716c',
      accentColor: '#f97316',
      radius: 2,
      distance: 5,
      lightIntensity: 55,
      darkIntensity: 75,
      blur: 0
    },
    'brutalist-amber': {
      name: 'Brutalist Amber',
      bgColor: '#f59e0b',
      accentColor: '#1e1b4b',
      radius: 2,
      distance: 6,
      lightIntensity: 65,
      darkIntensity: 75,
      blur: 0
    },
    'hard-canary': {
      name: 'Hard Canary Yellow',
      bgColor: '#facc15',
      accentColor: '#09090b',
      radius: 0,
      distance: 5,
      lightIntensity: 70,
      darkIntensity: 80,
      blur: 0
    },
    'hard-bubblegum': {
      name: 'Hard Bubblegum Pop',
      bgColor: '#f472b6',
      accentColor: '#0f172a',
      radius: 4,
      distance: 6,
      lightIntensity: 65,
      darkIntensity: 75,
      blur: 0
    },
    'hard-acid-lime': {
      name: 'Hard Acid Lime',
      bgColor: '#a3e635',
      accentColor: '#14532d',
      radius: 1,
      distance: 5,
      lightIntensity: 60,
      darkIntensity: 75,
      blur: 0
    },
    'hard-bauhaus-red': {
      name: 'Hard Bauhaus Red',
      bgColor: '#ef4444',
      accentColor: '#000000',
      radius: 0,
      distance: 7,
      lightIntensity: 60,
      darkIntensity: 80,
      blur: 0
    },
    'hard-blueprint': {
      name: 'Hard Electric Blueprint',
      bgColor: '#2563eb',
      accentColor: '#fde047',
      radius: 0,
      distance: 7,
      lightIntensity: 55,
      darkIntensity: 85,
      blur: 0
    },
    'hard-tangerine': {
      name: 'Hard Tangerine Pop',
      bgColor: '#fb923c',
      accentColor: '#09090b',
      radius: 3,
      distance: 6,
      lightIntensity: 60,
      darkIntensity: 75,
      blur: 0
    },
    'hard-arcade-cyan': {
      name: 'Hard Arcade Cyan',
      bgColor: '#38bdf8',
      accentColor: '#0f172a',
      radius: 6,
      distance: 6,
      lightIntensity: 65,
      darkIntensity: 75,
      blur: 0
    },
    'hard-toxic-mint': {
      name: 'Hard Toxic Mint',
      bgColor: '#34d399',
      accentColor: '#064e3b',
      radius: 2,
      distance: 5,
      lightIntensity: 65,
      darkIntensity: 70,
      blur: 0
    },
    'hard-ultraviolet': {
      name: 'Hard Ultraviolet Pop',
      bgColor: '#8b5cf6',
      accentColor: '#facc15',
      radius: 4,
      distance: 6,
      lightIntensity: 55,
      darkIntensity: 80,
      blur: 0
    },
    'hard-swiss-white': {
      name: 'Hard Swiss Stark White',
      bgColor: '#ffffff',
      accentColor: '#e11d48',
      radius: 0,
      distance: 6,
      lightIntensity: 80,
      darkIntensity: 85,
      blur: 0
    },
    'hard-parchment': {
      name: 'Hard Parchment Blueprint',
      bgColor: '#f6f1eb',
      accentColor: '#1d4ed8',
      radius: 2,
      distance: 4,
      lightIntensity: 60,
      darkIntensity: 65,
      blur: 0
    },
    'hard-hazard': {
      name: 'Hard Industrial Hazard',
      bgColor: '#eab308',
      accentColor: '#000000',
      radius: 0,
      distance: 8,
      lightIntensity: 65,
      darkIntensity: 85,
      blur: 0
    },
    'hard-gameboy': {
      name: 'Hard Dot Matrix Handheld',
      bgColor: '#8bac0f',
      accentColor: '#0f380f',
      radius: 4,
      distance: 4,
      lightIntensity: 50,
      darkIntensity: 75,
      blur: 0
    },
    'hard-steel': {
      name: 'Hard Machined Steel',
      bgColor: '#475569',
      accentColor: '#38bdf8',
      radius: 1,
      distance: 5,
      lightIntensity: 50,
      darkIntensity: 80,
      blur: 0
    },
    'hard-terminal-green': {
      name: 'Hard CRT Terminal Green',
      bgColor: '#052e16',
      accentColor: '#22c55e',
      radius: 0,
      distance: 4,
      lightIntensity: 45,
      darkIntensity: 90,
      blur: 0
    },
    'hard-cyber-black': {
      name: 'Hard Cyber Void',
      bgColor: '#121214',
      accentColor: '#f43f5e',
      radius: 0,
      distance: 6,
      lightIntensity: 45,
      darkIntensity: 90,
      blur: 0
    },
    'hard-midnight-navy': {
      name: 'Hard Midnight Navy',
      bgColor: '#0f172a',
      accentColor: '#38bdf8',
      radius: 2,
      distance: 6,
      lightIntensity: 45,
      darkIntensity: 85,
      blur: 0
    },
    'hard-blood-dark': {
      name: 'Hard Blood Obsidian',
      bgColor: '#260707',
      accentColor: '#ef4444',
      radius: 0,
      distance: 6,
      lightIntensity: 45,
      darkIntensity: 85,
      blur: 0
    },
    'hard-kawaii-lilac': {
      name: 'Hard Kawaii Lilac',
      bgColor: '#ddd6fe',
      accentColor: '#6d28d9',
      radius: 8,
      distance: 6,
      lightIntensity: 70,
      darkIntensity: 70,
      blur: 0
    },
    'hard-matcha': {
      name: 'Hard Matcha Ceramic',
      bgColor: '#d5dfc3',
      accentColor: '#14532d',
      radius: 2,
      distance: 5,
      lightIntensity: 65,
      darkIntensity: 65,
      blur: 0
    },
    'hard-teal-punch': {
      name: 'Hard Teal Punch',
      bgColor: '#0f766e',
      accentColor: '#fef08a',
      radius: 3,
      distance: 6,
      lightIntensity: 55,
      darkIntensity: 80,
      blur: 0
    },
    'hard-neon-coral': {
      name: 'Hard Neon Coral',
      bgColor: '#f43f5e',
      accentColor: '#ffffff',
      radius: 4,
      distance: 7,
      lightIntensity: 60,
      darkIntensity: 80,
      blur: 0
    },
    'hard-amber-slate': {
      name: 'Hard Amber Slate',
      bgColor: '#1c1917',
      accentColor: '#f59e0b',
      radius: 1,
      distance: 5,
      lightIntensity: 45,
      darkIntensity: 85,
      blur: 0
    },
    'hard-industrial-gray': {
      name: 'Hard Industrial Gray',
      bgColor: '#d1d5db',
      accentColor: '#111827',
      radius: 0,
      distance: 6,
      lightIntensity: 75,
      darkIntensity: 80,
      blur: 0
    },
    'hard-peach-punch': {
      name: 'Hard Peach Punch',
      bgColor: '#fed7aa',
      accentColor: '#c2410c',
      radius: 6,
      distance: 5,
      lightIntensity: 70,
      darkIntensity: 70,
      blur: 0
    },
    'solar-tangerine': {
      name: 'Solar Tangerine',
      bgColor: '#ea580c',
      accentColor: '#fef08a',
      radius: 34,
      distance: 5,
      lightIntensity: 38,
      darkIntensity: 42,
      blur: 12
    },
    'peach-fuzz': {
      name: 'Peach Fuzz',
      bgColor: '#fed7aa',
      accentColor: '#c2410c',
      radius: 16,
      distance: 3,
      lightIntensity: 28,
      darkIntensity: 16,
      blur: 7
    },
    'sunset-terracotta': {
      name: 'Sunset Terracotta',
      bgColor: '#8c3a27',
      accentColor: '#fcd34d',
      radius: 12,
      distance: 3,
      lightIntensity: 22,
      darkIntensity: 28,
      blur: 8
    },
    'vintage-rose': {
      name: 'Vintage Rose',
      bgColor: '#b85d68',
      accentColor: '#ffe4e6',
      radius: 14,
      distance: 3,
      lightIntensity: 22,
      darkIntensity: 24,
      blur: 8
    },
    'dusty-blush': {
      name: 'Dusty Blush',
      bgColor: '#ebdcd9',
      accentColor: '#9f1239',
      radius: 18,
      distance: 5,
      lightIntensity: 75,
      darkIntensity: 20,
      blur: 10
    },
    'sakura-blossom': {
      name: 'Sakura Blossom',
      bgColor: '#fce7f3',
      accentColor: '#be123c',
      radius: 18,
      distance: 3,
      lightIntensity: 30,
      darkIntensity: 14,
      blur: 8
    },
    'bubblegum-magenta': {
      name: 'Bubblegum Magenta',
      bgColor: '#db2777',
      accentColor: '#fef08a',
      radius: 30,
      distance: 7,
      lightIntensity: 42,
      darkIntensity: 38,
      blur: 15
    },
    'electric-coral': {
      name: 'Electric Coral',
      bgColor: '#f43f5e',
      accentColor: '#ffffff',
      radius: 20,
      distance: 5,
      lightIntensity: 40,
      darkIntensity: 35,
      blur: 10
    },
    'marshmallow-indigo': {
      name: 'Marshmallow Indigo',
      bgColor: '#4f46e5',
      accentColor: '#fde047',
      radius: 42,
      distance: 8,
      lightIntensity: 40,
      darkIntensity: 48,
      blur: 18
    },
    'lilac-cloud': {
      name: 'Lilac Cloud',
      bgColor: '#c4b5fd',
      accentColor: '#4c1d95',
      radius: 22,
      distance: 4,
      lightIntensity: 36,
      darkIntensity: 22,
      blur: 11
    },
    'lavender-dream': {
      name: 'Lavender Dream',
      bgColor: '#e2d9f3',
      accentColor: '#6b21a8',
      radius: 14,
      distance: 3,
      lightIntensity: 28,
      darkIntensity: 18,
      blur: 8
    },
    'sage-mint': {
      name: 'Sage Mint',
      bgColor: '#c8d6c0',
      accentColor: '#166534',
      radius: 18,
      distance: 3,
      lightIntensity: 24,
      darkIntensity: 18,
      blur: 7
    },
    'matcha-cream': {
      name: 'Matcha Cream',
      bgColor: '#dbe4d2',
      accentColor: '#3f5622',
      radius: 16,
      distance: 3,
      lightIntensity: 26,
      darkIntensity: 18,
      blur: 8
    },
    'eucalyptus-mist': {
      name: 'Eucalyptus Mist',
      bgColor: '#d4ded6',
      accentColor: '#065f46',
      radius: 16,
      distance: 4,
      lightIntensity: 70,
      darkIntensity: 22,
      blur: 9
    },
    'spearmint-gelato': {
      name: 'Spearmint Gelato',
      bgColor: '#6ee7b7',
      accentColor: '#831843',
      radius: 38,
      distance: 6,
      lightIntensity: 48,
      darkIntensity: 28,
      blur: 14
    },
    'pistachio-gelato': {
      name: 'Pistachio Gelato',
      bgColor: '#dcfce7',
      accentColor: '#15803d',
      radius: 20,
      distance: 4,
      lightIntensity: 45,
      darkIntensity: 16,
      blur: 10
    },
    'aqua-marine': {
      name: 'Aqua Marine',
      bgColor: '#cffafe',
      accentColor: '#0369a1',
      radius: 16,
      distance: 3,
      lightIntensity: 30,
      darkIntensity: 16,
      blur: 8
    },
    'sky-blue-pastel': {
      name: 'Sky Blue Pastel',
      bgColor: '#bae6fd',
      accentColor: '#0369a1',
      radius: 16,
      distance: 4,
      lightIntensity: 45,
      darkIntensity: 18,
      blur: 9
    },
    'cyber-cyan': {
      name: 'Cyber Cyan',
      bgColor: '#0891b2',
      accentColor: '#fef08a',
      radius: 18,
      distance: 4,
      lightIntensity: 35,
      darkIntensity: 32,
      blur: 6
    },
    'neon-lime': {
      name: 'Neon Lime Pop',
      bgColor: '#84cc16',
      accentColor: '#1a2e05',
      radius: 16,
      distance: 4,
      lightIntensity: 50,
      darkIntensity: 30,
      blur: 8
    },
    'sunburst-yellow': {
      name: 'Sunburst Gold',
      bgColor: '#eab308',
      accentColor: '#172554',
      radius: 14,
      distance: 4,
      lightIntensity: 55,
      darkIntensity: 35,
      blur: 8
    },
    'laguna-teal': {
      name: 'Laguna Teal',
      bgColor: '#134e4a',
      accentColor: '#2dd4bf',
      radius: 12,
      distance: 3,
      lightIntensity: 20,
      darkIntensity: 30,
      blur: 8
    },
    'forest-emerald': {
      name: 'Forest Emerald',
      bgColor: '#1b4332',
      accentColor: '#52b788',
      radius: 10,
      distance: 3,
      lightIntensity: 20,
      darkIntensity: 30,
      blur: 7
    },
    'matrix-terminal': {
      name: 'Matrix CRT',
      bgColor: '#052e16',
      accentColor: '#22c55e',
      radius: 4,
      distance: 2,
      lightIntensity: 40,
      darkIntensity: 70,
      blur: 2
    },
    'ocean-azure': {
      name: 'Ocean Azure',
      bgColor: '#1e3a5f',
      accentColor: '#38bdf8',
      radius: 14,
      distance: 3,
      lightIntensity: 20,
      darkIntensity: 30,
      blur: 8
    },
    'abyssal-ocean': {
      name: 'Abyssal Ocean',
      bgColor: '#0e2a47',
      accentColor: '#38bdf8',
      radius: 16,
      distance: 4,
      lightIntensity: 22,
      darkIntensity: 55,
      blur: 10
    },
    'electric-cobalt': {
      name: 'Electric Cobalt',
      bgColor: '#1d3557',
      accentColor: '#34d399',
      radius: 10,
      distance: 3,
      lightIntensity: 20,
      darkIntensity: 30,
      blur: 8
    },
    'nordic-slate': {
      name: 'Nordic Slate',
      bgColor: '#334155',
      accentColor: '#60a5fa',
      radius: 10,
      distance: 3,
      lightIntensity: 20,
      darkIntensity: 28,
      blur: 8
    },
    'matte-titanium': {
      name: 'Matte Titanium',
      bgColor: '#1e293b',
      accentColor: '#06b6d4',
      radius: 12,
      distance: 3,
      lightIntensity: 22,
      darkIntensity: 45,
      blur: 7
    },
    'graphite-carbon': {
      name: 'Graphite Studio',
      bgColor: '#24272c',
      accentColor: '#00f2fe',
      radius: 12,
      distance: 4,
      lightIntensity: 18,
      darkIntensity: 42,
      blur: 8
    },
    'royal-violet': {
      name: 'Royal Violet',
      bgColor: '#442759',
      accentColor: '#f472b6',
      radius: 16,
      distance: 4,
      lightIntensity: 20,
      darkIntensity: 32,
      blur: 9
    },
    'midnight-violet': {
      name: 'Midnight Violet',
      bgColor: '#3b0764',
      accentColor: '#f43f5e',
      radius: 24,
      distance: 6,
      lightIntensity: 32,
      darkIntensity: 65,
      blur: 14
    },
    'garnet-obsidian': {
      name: 'Garnet Obsidian',
      bgColor: '#450a0a',
      accentColor: '#fb7185',
      radius: 8,
      distance: 4,
      lightIntensity: 24,
      darkIntensity: 70,
      blur: 9
    },
    'crimson-vampire': {
      name: 'Crimson Vampire',
      bgColor: '#2a0808',
      accentColor: '#ef4444',
      radius: 10,
      distance: 4,
      lightIntensity: 18,
      darkIntensity: 60,
      blur: 8
    },
    'obsidian-gold': {
      name: 'Obsidian Gold',
      bgColor: '#1e1e24',
      accentColor: '#f59e0b',
      radius: 10,
      distance: 4,
      lightIntensity: 16,
      darkIntensity: 48,
      blur: 8
    },
    'synth-slate': {
      name: 'Synthwave Slate',
      bgColor: '#2b2d42',
      accentColor: '#ff007f',
      radius: 12,
      distance: 5,
      lightIntensity: 22,
      darkIntensity: 38,
      blur: 9
    },
    'synthwave-sunset': {
      name: 'Synthwave Sunset',
      bgColor: '#262335',
      accentColor: '#ff7b00',
      radius: 14,
      distance: 4,
      lightIntensity: 20,
      darkIntensity: 32,
      blur: 9
    },
    'tokyo-night': {
      name: 'Tokyo Night',
      bgColor: '#1a1b26',
      accentColor: '#7aa2f7',
      radius: 12,
      distance: 3,
      lightIntensity: 18,
      darkIntensity: 38,
      blur: 8
    },
    'catppuccin-mocha': {
      name: 'Catppuccin Mocha',
      bgColor: '#1e1e2e',
      accentColor: '#cba6f7',
      radius: 14,
      distance: 3,
      lightIntensity: 20,
      darkIntensity: 35,
      blur: 8
    },
    'dracula-classic': {
      name: 'Dracula Classic',
      bgColor: '#282a36',
      accentColor: '#ff79c6',
      radius: 10,
      distance: 3,
      lightIntensity: 20,
      darkIntensity: 32,
      blur: 7
    },
    'monokai-charcoal': {
      name: 'Monokai Charcoal',
      bgColor: '#2d2a2e',
      accentColor: '#ffd866',
      radius: 10,
      distance: 3,
      lightIntensity: 18,
      darkIntensity: 34,
      blur: 7
    },
    'cyberpunk-neon': {
      name: 'Cyberpunk Neon',
      bgColor: '#12131a',
      accentColor: '#fcee0a',
      radius: 6,
      distance: 3,
      lightIntensity: 15,
      darkIntensity: 45,
      blur: 6
    },
    'midnight-onyx': {
      name: 'Midnight Onyx',
      bgColor: '#18181b',
      accentColor: '#a855f7',
      radius: 12,
      distance: 3,
      lightIntensity: 16,
      darkIntensity: 45,
      blur: 7
    },
    'oled-black': {
      name: 'OLED Void',
      bgColor: '#09090b',
      accentColor: '#38bdf8',
      radius: 8,
      distance: 3,
      lightIntensity: 14,
      darkIntensity: 65,
      blur: 6
    },
    'soft-gray': {
      name: 'Warm Clay (Default)',
      bgColor: '#e8dfd5',
      accentColor: '#d97706',
      radius: 5,
      distance: 4,
      lightIntensity: 39,
      darkIntensity: 5,
      blur: 9
    }
  };

  function deriveRealisticShadows(bgColor, lightIntensity = 20, darkIntensity = 20) {
    const rgb = hexToRgb(bgColor);
    const lum = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255.0;

    // Realistic specular light highlight (blended with pure white)
    let lFactor;
    if (lum < 0.25) {
      lFactor = (lightIntensity / 100.0) * 0.45;
    } else if (lum < 0.55) {
      lFactor = (lightIntensity / 100.0) * 0.65;
    } else {
      lFactor = (lightIntensity / 100.0) * 0.95;
    }
    lFactor = Math.min(0.95, Math.max(0.03, lFactor));

    const lightR = Math.min(255, Math.round(rgb.r + (255 - rgb.r) * lFactor));
    const lightG = Math.min(255, Math.round(rgb.g + (255 - rgb.g) * lFactor));
    const lightB = Math.min(255, Math.round(rgb.b + (255 - rgb.b) * lFactor));

    // Realistic ambient occlusion shadow (blended with pure black)
    let dFactor;
    if (lum < 0.25) {
      dFactor = (darkIntensity / 100.0) * 0.75;
    } else if (lum < 0.55) {
      dFactor = (darkIntensity / 100.0) * 0.95;
    } else {
      dFactor = (darkIntensity / 100.0) * 1.15;
    }
    dFactor = Math.min(0.95, Math.max(0.03, dFactor));

    const darkR = Math.max(0, Math.round(rgb.r * (1.0 - dFactor)));
    const darkG = Math.max(0, Math.round(rgb.g * (1.0 - dFactor)));
    const darkB = Math.max(0, Math.round(rgb.b * (1.0 - dFactor)));

    const deepFactor = Math.min(0.98, dFactor * 1.35);
    const deepR = Math.max(0, Math.round(rgb.r * (1.0 - deepFactor)));
    const deepG = Math.max(0, Math.round(rgb.g * (1.0 - deepFactor)));
    const deepB = Math.max(0, Math.round(rgb.b * (1.0 - deepFactor)));

    return {
      shadowLight: rgbToHex(lightR, lightG, lightB),
      shadowDark: rgbToHex(darkR, darkG, darkB),
      shadowDarkDeep: rgbToHex(deepR, deepG, deepB)
    };
  }

  function computePresetShadow(bgColor, lightIntensity = 20, darkIntensity = 20, distance = 3, blur = 8) {
    const d = Math.max(2, Math.round(distance * 0.75));
    const b = blur;
    const maxDark = (blur === 0) ? 0.85 : 0.55;
    const maxLight = (blur === 0) ? 0.85 : 0.65;
    const darkAlpha = Math.min(maxDark, Math.max(0.12, (darkIntensity / 100.0) * 1.1));
    const lightAlpha = Math.min(maxLight, Math.max(0.10, (lightIntensity / 100.0) * 1.1));
    if (blur === 0) {
      return `${d}px ${d}px 0px rgba(0, 0, 0, ${darkAlpha.toFixed(2)}), -${d}px -${d}px 0px rgba(255, 255, 255, ${lightAlpha.toFixed(2)})`;
    }
    return `${d}px ${d}px ${b}px rgba(0, 0, 0, ${darkAlpha.toFixed(2)}), -${d}px -${d}px ${b}px rgba(255, 255, 255, ${lightAlpha.toFixed(2)})`;
  }

  function lightenHex(hex, percent) {
    const rgb = hexToRgb(hex);
    const factor = percent / 100;
    return rgbToHex(
      rgb.r + (255 - rgb.r) * factor,
      rgb.g + (255 - rgb.g) * factor,
      rgb.b + (255 - rgb.b) * factor
    );
  }

  function darkenHex(hex, percent) {
    const rgb = hexToRgb(hex);
    const factor = 1 - (percent / 100);
    return rgbToHex(rgb.r * factor, rgb.g * factor, rgb.b * factor);
  }

  function getLuminance(r, g, b) {
    const a = [r, g, b].map(v => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  }

  function getContrastRatio(lum1, lum2) {
    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  function deriveHarmonicTypography(bgHex) {
    const rgb = hexToRgb(bgHex);
    const bgLum = getLuminance(rgb.r, rgb.g, rgb.b);
    const hsl = hexToHsl(bgHex);

    const contrastWhite = (1.0 + 0.05) / (bgLum + 0.05);
    const contrastBlack = (bgLum + 0.05) / (0.0 + 0.05);

    // Harmonic undertone saturation (keeps text naturally keyed to the base clay)
    const harmSat = Math.min(0.22, Math.max(0.06, hsl.s * 0.45));
    const useDarkText = contrastBlack >= contrastWhite;

    let textPrimary, textSecondary, textMuted, textDisabled;

    if (useDarkText) {
      // Dark text mode (on light, beige, caramel, mint backgrounds)
      textPrimary = hslToHex(hsl.h, harmSat, 0.09);

      // Search lightness for secondary text (minimum contrast 5.5:1)
      let secL = 0.09;
      for (let l = 12; l <= 45; l++) {
        const testHex = hslToHex(hsl.h, harmSat, l / 100);
        const testRgb = hexToRgb(testHex);
        const testLum = getLuminance(testRgb.r, testRgb.g, testRgb.b);
        if (getContrastRatio(bgLum, testLum) >= 5.5) {
          secL = l / 100;
        } else {
          break;
        }
      }
      textSecondary = hslToHex(hsl.h, harmSat, secL);

      // Search lightness for muted text (guaranteed WCAG AA >= 4.5:1)
      let mutedL = secL;
      for (let l = Math.round(secL * 100); l <= 55; l++) {
        const testHex = hslToHex(hsl.h, harmSat, l / 100);
        const testRgb = hexToRgb(testHex);
        const testLum = getLuminance(testRgb.r, testRgb.g, testRgb.b);
        if (getContrastRatio(bgLum, testLum) >= 4.5) {
          mutedL = l / 100;
        } else {
          break;
        }
      }
      textMuted = hslToHex(hsl.h, harmSat, mutedL);

      // Search lightness for disabled text (minimum contrast 2.4:1)
      let disL = mutedL;
      for (let l = Math.round(mutedL * 100); l <= 75; l++) {
        const testHex = hslToHex(hsl.h, harmSat, l / 100);
        const testRgb = hexToRgb(testHex);
        const testLum = getLuminance(testRgb.r, testRgb.g, testRgb.b);
        if (getContrastRatio(bgLum, testLum) >= 2.4) {
          disL = l / 100;
        } else {
          break;
        }
      }
      textDisabled = hslToHex(hsl.h, harmSat, disL);
    } else {
      // Light text mode (on dark, navy, emerald, terracotta, violet backgrounds)
      textPrimary = hslToHex(hsl.h, harmSat * 0.5, 0.96);

      // Search lightness for secondary text (minimum contrast 5.5:1)
      let secL = 0.96;
      for (let l = 92; l >= 50; l--) {
        const testHex = hslToHex(hsl.h, harmSat, l / 100);
        const testRgb = hexToRgb(testHex);
        const testLum = getLuminance(testRgb.r, testRgb.g, testRgb.b);
        if (getContrastRatio(bgLum, testLum) >= 5.5) {
          secL = l / 100;
        } else {
          break;
        }
      }
      textSecondary = hslToHex(hsl.h, harmSat, secL);

      // Search lightness for muted text (guaranteed WCAG AA >= 4.5:1)
      let mutedL = secL;
      for (let l = Math.round(secL * 100); l >= 40; l--) {
        const testHex = hslToHex(hsl.h, harmSat, l / 100);
        const testRgb = hexToRgb(testHex);
        const testLum = getLuminance(testRgb.r, testRgb.g, testRgb.b);
        if (getContrastRatio(bgLum, testLum) >= 4.5) {
          mutedL = l / 100;
        } else {
          break;
        }
      }
      textMuted = hslToHex(hsl.h, harmSat, mutedL);

      // Search lightness for disabled text (minimum contrast 2.4:1)
      let disL = mutedL;
      for (let l = Math.round(mutedL * 100); l >= 20; l--) {
        const testHex = hslToHex(hsl.h, harmSat, l / 100);
        const testRgb = hexToRgb(testHex);
        const testLum = getLuminance(testRgb.r, testRgb.g, testRgb.b);
        if (getContrastRatio(bgLum, testLum) >= 2.4) {
          disL = l / 100;
        } else {
          break;
        }
      }
      textDisabled = hslToHex(hsl.h, harmSat, disL);
    }

    return {
      textPrimary,
      textSecondary,
      textMuted,
      textDisabled
    };
  }

  function applyTheme(bgColor, accentColor, save = false, neo = null) {
    if (!bgColor) bgColor = '#e8dfd5';
    if (!accentColor) accentColor = '#d97706';
    if (!bgColor.startsWith('#')) bgColor = '#' + bgColor;
    if (!accentColor.startsWith('#')) accentColor = '#' + accentColor;

    // Resolve Neumorphism Parameters (Radius, Distance, Light/Dark Intensity, Blur)
    const radius = (neo && typeof neo.radius !== 'undefined')
      ? parseInt(neo.radius, 10)
      : ((state.config && state.config.theme && typeof state.config.theme.radius !== 'undefined') ? parseInt(state.config.theme.radius, 10) : 5);

    const distance = Math.min(10, Math.max(1, (neo && typeof neo.distance !== 'undefined')
      ? parseInt(neo.distance, 10)
      : ((state.config && state.config.theme && typeof state.config.theme.distance !== 'undefined') ? parseInt(state.config.theme.distance, 10) : 3)));

    const lightIntensity = (neo && typeof neo.lightIntensity !== 'undefined')
      ? parseInt(neo.lightIntensity, 10)
      : ((state.config && state.config.theme && typeof state.config.theme.lightIntensity !== 'undefined')
        ? parseInt(state.config.theme.lightIntensity, 10)
        : ((state.config && state.config.theme && typeof state.config.theme.intensity !== 'undefined')
          ? parseInt(state.config.theme.intensity, 10) : 22));

    const darkIntensity = (neo && typeof neo.darkIntensity !== 'undefined')
      ? parseInt(neo.darkIntensity, 10)
      : ((state.config && state.config.theme && typeof state.config.theme.darkIntensity !== 'undefined')
        ? parseInt(state.config.theme.darkIntensity, 10)
        : ((state.config && state.config.theme && typeof state.config.theme.intensity !== 'undefined')
          ? parseInt(state.config.theme.intensity, 10) : 6));

    const blur = (neo && typeof neo.blur !== 'undefined')
      ? parseInt(neo.blur, 10)
      : ((state.config && state.config.theme && typeof state.config.theme.blur !== 'undefined') ? parseInt(state.config.theme.blur, 10) : 10);

    const avgIntensity = Math.round((lightIntensity + darkIntensity) / 2);

    // Compute Chromatic Shadows: exact lighter tint for top and darker shade for bottom
    const chromatic = deriveRealisticShadows(bgColor, lightIntensity, darkIntensity);
    const shadowLight = chromatic.shadowLight;
    const shadowDark = chromatic.shadowDark;
    const shadowDarkDeep = chromatic.shadowDarkDeep;

    // Dynamic WCAG-compliant harmonic typography system (guaranteed >= 4.5:1 contrast)
    const typography = deriveHarmonicTypography(bgColor);
    const textPrimary = typography.textPrimary;
    const textSecondary = typography.textSecondary;
    const textMuted = typography.textMuted;
    const textDisabled = typography.textDisabled;

    // Derived accent color shades
    const accRgb = hexToRgb(accentColor);
    const accLight = lightenHex(accentColor, 20);
    const accPastel = lightenHex(accentColor, 45);
    const accSuperPastel = lightenHex(accentColor, 60);
    const accDark = darkenHex(accentColor, 18);
    const accDeep = darkenHex(accentColor, 35);
    const deepRgb = hexToRgb(accDeep);

    const accGlow = `0 4px 16px rgba(${accRgb.r}, ${accRgb.g}, ${accRgb.b}, 0.45)`;
    const accGradient = `linear-gradient(135deg, ${accLight} 0%, ${accentColor} 100%)`;
    const accTroughGrad = accentColor;
    const accTroughShadow = `inset 0 2px 4px rgba(0, 0, 0, 0.35), 0 0 10px ${accentColor}`;

    const root = document.documentElement;
    root.style.setProperty('--bg-color', bgColor);
    root.style.setProperty('--surface-color', bgColor);
    root.style.setProperty('--shadow-light', shadowLight);
    root.style.setProperty('--shadow-dark', shadowDark);
    root.style.setProperty('--shadow-dark-deep', shadowDarkDeep);
    root.style.setProperty('--text-primary', textPrimary);
    root.style.setProperty('--text-secondary', textSecondary);
    root.style.setProperty('--text-muted', textMuted);
    root.style.setProperty('--text-disabled', textDisabled);

    root.style.setProperty('--accent-primary', accentColor);
    root.style.setProperty('--accent-light', accLight);
    root.style.setProperty('--accent-pastel', accPastel);
    root.style.setProperty('--accent-dark', accDark);
    root.style.setProperty('--accent-deep', accDeep);
    root.style.setProperty('--accent-glow', accGlow);
    root.style.setProperty('--accent-gradient', accGradient);
    root.style.setProperty('--accent-trough-gradient', accTroughGrad);
    root.style.setProperty('--accent-trough-shadow', accTroughShadow);

    // Dynamic theme-matching scrollbar variables
    root.style.setProperty('--scrollbar-thumb', shadowDark);
    root.style.setProperty('--scrollbar-thumb-hover', accentColor);
    root.style.setProperty('--bg-hover', shadowDark);

    // Apply dynamic Neumorphism core parameters
    root.style.setProperty('--neo-radius', `${radius}px`);
    root.style.setProperty('--neo-dist', `${distance}px`);
    root.style.setProperty('--neo-blur', `${blur}px`);
    root.style.setProperty('--neo-light-intensity', `${lightIntensity}%`);
    root.style.setProperty('--neo-dark-intensity', `${darkIntensity}%`);
    root.style.setProperty('--neo-intensity', `${avgIntensity}%`);

    // Sync state
    if (!state.config.theme) {
      state.config.theme = {};
    }
    state.config.theme.bgColor = bgColor;
    state.config.theme.accentColor = accentColor;
    state.config.theme.radius = radius;
    state.config.theme.distance = distance;
    state.config.theme.lightIntensity = lightIntensity;
    state.config.theme.darkIntensity = darkIntensity;
    state.config.theme.intensity = avgIntensity;
    state.config.theme.blur = blur;

    // Persist to localStorage immediately
    try {
      localStorage.setItem('ahk_theme', JSON.stringify({
        bgColor,
        accentColor,
        radius,
        distance,
        lightIntensity,
        darkIntensity,
        intensity: avgIntensity,
        blur
      }));
    } catch (e) { }

    // Sync input controls if present
    if (themeBgColorPicker) themeBgColorPicker.value = bgColor;
    if (themeBgHex) themeBgHex.value = bgColor.toUpperCase();
    if (themeAccentColorPicker) themeAccentColorPicker.value = accentColor;
    if (themeAccentHex) themeAccentHex.value = accentColor.toUpperCase();

    if (themeSliderRadius) {
      themeSliderRadius.value = radius;
      updateSliderProgress(themeSliderRadius);
      if (badgeRadius) badgeRadius.textContent = `${radius}px`;
    }
    if (themeSliderDistance) {
      themeSliderDistance.value = distance;
      updateSliderProgress(themeSliderDistance);
      if (badgeDistance) badgeDistance.textContent = `${distance}px`;
    }
    if (themeSliderLightIntensity) {
      themeSliderLightIntensity.value = lightIntensity;
      updateSliderProgress(themeSliderLightIntensity);
      if (badgeLightIntensity) badgeLightIntensity.textContent = `${lightIntensity}%`;
    }
    if (themeSliderDarkIntensity) {
      themeSliderDarkIntensity.value = darkIntensity;
      updateSliderProgress(themeSliderDarkIntensity);
      if (badgeDarkIntensity) badgeDarkIntensity.textContent = `${darkIntensity}%`;
    }
    if (themeSliderBlur) {
      themeSliderBlur.value = blur;
      updateSliderProgress(themeSliderBlur);
      if (badgeBlur) badgeBlur.textContent = `${blur}px`;
    }

    // Refresh all neumorphic sliders so track fills dynamically adapt to the active theme colors
    document.querySelectorAll('.neumorphic-slider').forEach(sl => {
      updateSliderProgress(sl);
    });

    updateActivePresetChips();

    if (save) {
      syncConfig();
    }
  }

  function getCurrentThemeColors(preferDom = true) {
    let bg = '';
    let acc = '';

    if (preferDom) {
      if (themeBgHex && /^#[0-9A-Fa-f]{6}$/i.test(themeBgHex.value.trim())) {
        bg = themeBgHex.value.trim();
      } else if (themeBgColorPicker && /^#[0-9A-Fa-f]{6}$/i.test(themeBgColorPicker.value)) {
        bg = themeBgColorPicker.value;
      }

      if (themeAccentHex && /^#[0-9A-Fa-f]{6}$/i.test(themeAccentHex.value.trim())) {
        acc = themeAccentHex.value.trim();
      } else if (themeAccentColorPicker && /^#[0-9A-Fa-f]{6}$/i.test(themeAccentColorPicker.value)) {
        acc = themeAccentColorPicker.value;
      }
    }

    if (!bg) {
      bg = (state.config && state.config.theme && state.config.theme.bgColor)
        || document.documentElement.style.getPropertyValue('--bg-color')
        || '#e8dfd5';
    }

    if (!acc) {
      acc = (state.config && state.config.theme && state.config.theme.accentColor)
        || document.documentElement.style.getPropertyValue('--accent-primary')
        || '#d97706';
    }

    const radius = (preferDom && themeSliderRadius)
      ? parseInt(themeSliderRadius.value, 10)
      : ((state.config && state.config.theme && typeof state.config.theme.radius !== 'undefined') ? parseInt(state.config.theme.radius, 10) : 5);

    const distance = Math.min(10, Math.max(1, (preferDom && themeSliderDistance)
      ? parseInt(themeSliderDistance.value, 10)
      : ((state.config && state.config.theme && typeof state.config.theme.distance !== 'undefined') ? parseInt(state.config.theme.distance, 10) : 3)));

    const lightIntensity = (preferDom && themeSliderLightIntensity)
      ? parseInt(themeSliderLightIntensity.value, 10)
      : ((state.config && state.config.theme && typeof state.config.theme.lightIntensity !== 'undefined')
        ? parseInt(state.config.theme.lightIntensity, 10)
        : ((state.config && state.config.theme && typeof state.config.theme.intensity !== 'undefined') ? parseInt(state.config.theme.intensity, 10) : 22));

    const darkIntensity = (preferDom && themeSliderDarkIntensity)
      ? parseInt(themeSliderDarkIntensity.value, 10)
      : ((state.config && state.config.theme && typeof state.config.theme.darkIntensity !== 'undefined')
        ? parseInt(state.config.theme.darkIntensity, 10)
        : ((state.config && state.config.theme && typeof state.config.theme.intensity !== 'undefined') ? parseInt(state.config.theme.intensity, 10) : 6));

    const blur = (preferDom && themeSliderBlur)
      ? parseInt(themeSliderBlur.value, 10)
      : ((state.config && state.config.theme && typeof state.config.theme.blur !== 'undefined') ? parseInt(state.config.theme.blur, 10) : 10);

    return {
      bg: bg.trim(),
      acc: acc.trim(),
      radius,
      distance,
      lightIntensity,
      darkIntensity,
      intensity: Math.round((lightIntensity + darkIntensity) / 2),
      blur
    };
  }

  function getNeoSliderValues() {
    return {
      radius: themeSliderRadius ? parseInt(themeSliderRadius.value, 10) : 22,
      distance: themeSliderDistance ? parseInt(themeSliderDistance.value, 10) : 3,
      lightIntensity: themeSliderLightIntensity ? parseInt(themeSliderLightIntensity.value, 10) : 18,
      darkIntensity: themeSliderDarkIntensity ? parseInt(themeSliderDarkIntensity.value, 10) : 18,
      blur: themeSliderBlur ? parseInt(themeSliderBlur.value, 10) : 8
    };
  }

  function getCustomThemePresets() {
    if (state.config && state.config.theme && Array.isArray(state.config.theme.customPresets)) {
      return state.config.theme.customPresets;
    }
    try {
      const cached = localStorage.getItem('ahk_custom_theme_presets');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          if (!state.config.theme) state.config.theme = {};
          state.config.theme.customPresets = parsed;
          return parsed;
        }
      }
    } catch (e) { }
    return [];
  }

  function renderCuratedPresets() {
    const grid = document.getElementById('bgSwatchesGrid');
    if (!grid) return;

    grid.innerHTML = '';
    const currentColors = getCurrentThemeColors(true);

    Object.entries(THEME_PRESETS).forEach(([key, preset]) => {
      if (key === 'soft-gray') return;

      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'theme-swatch-chip theme-card-chip';
      chip.dataset.preset = key;
      chip.dataset.color = preset.bgColor;
      chip.title = `${preset.name} (Background: ${preset.bgColor}, Accent: ${preset.accentColor || currentColors.acc})`;
      chip.setAttribute('aria-label', preset.name);
      chip.style.backgroundColor = preset.bgColor;
      chip.style.borderColor = preset.accentColor || currentColors.acc;
      chip.style.color = preset.accentColor || currentColors.acc;
      chip.style.borderRadius = `${Math.min(24, Math.max(0, typeof preset.radius !== 'undefined' ? preset.radius : 10))}px`;
      chip.style.boxShadow = computePresetShadow(
        preset.bgColor,
        preset.lightIntensity,
        preset.darkIntensity,
        preset.distance,
        preset.blur
      );

      chip.innerHTML = `
        <svg class="theme-check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      `;

      grid.appendChild(chip);
    });

    updateActivePresetChips();
  }

  function updateActivePresetChips() {
    const currentColors = getCurrentThemeColors(true);
    const currentSliders = getNeoSliderValues();

    // Check curated swatches
    document.querySelectorAll('#bgSwatchesGrid .theme-swatch-chip').forEach(chip => {
      const presetKey = chip.dataset.preset;
      const preset = presetKey ? THEME_PRESETS[presetKey] : null;
      let isMatch = false;
      if (preset) {
        isMatch = (
          preset.bgColor.toLowerCase() === currentColors.bg.toLowerCase() &&
          (preset.accentColor || currentColors.acc).toLowerCase() === currentColors.acc.toLowerCase() &&
          parseInt(preset.radius, 10) === currentSliders.radius &&
          parseInt(preset.distance, 10) === currentSliders.distance &&
          parseInt(preset.blur, 10) === currentSliders.blur &&
          parseInt(preset.lightIntensity, 10) === currentSliders.lightIntensity &&
          parseInt(preset.darkIntensity, 10) === currentSliders.darkIntensity
        );
        chip.style.backgroundColor = preset.bgColor;
        chip.style.borderColor = preset.accentColor || currentColors.acc;
        chip.style.color = preset.accentColor || currentColors.acc;
        chip.style.borderRadius = `${Math.min(24, Math.max(0, typeof preset.radius !== 'undefined' ? preset.radius : 10))}px`;
        chip.style.boxShadow = computePresetShadow(preset.bgColor, preset.lightIntensity, preset.darkIntensity, preset.distance, preset.blur);
      } else if (chip.dataset.color) {
        isMatch = (chip.dataset.color.toLowerCase() === currentColors.bg.toLowerCase());
      }
      chip.classList.toggle('active', isMatch);
    });

    document.querySelectorAll('#accentSwatchesGrid .theme-swatch-chip').forEach(chip => {
      chip.classList.toggle('active', chip.dataset.color.toLowerCase() === currentColors.acc.toLowerCase());
    });

    // Check custom presets
    const presets = getCustomThemePresets();
    document.querySelectorAll('#customPresetsGrid .custom-preset-chip').forEach(chip => {
      const p = presets.find(item => item.id === chip.dataset.presetId);
      if (!p) {
        chip.classList.remove('active');
        return;
      }
      const isMatch = (
        p.bgColor.toLowerCase() === currentColors.bg.toLowerCase() &&
        p.accentColor.toLowerCase() === currentColors.acc.toLowerCase() &&
        parseInt(p.radius, 10) === currentSliders.radius &&
        parseInt(p.distance, 10) === currentSliders.distance &&
        parseInt(p.blur, 10) === currentSliders.blur &&
        (typeof p.lightIntensity === 'undefined' || parseInt(p.lightIntensity, 10) === currentSliders.lightIntensity) &&
        (typeof p.darkIntensity === 'undefined' || parseInt(p.darkIntensity, 10) === currentSliders.darkIntensity)
      );
      chip.classList.toggle('active', isMatch);
    });
  }

  function renderCustomPresets() {
    const grid = document.getElementById('customPresetsGrid');
    if (!grid) return;

    const presets = getCustomThemePresets();
    grid.innerHTML = '';

    if (presets.length === 0) {
      grid.innerHTML = '<span class="empty-custom-presets-hint">No custom presets saved yet. Adjust colors & sliders above, name your preset, and click Save Preset!</span>';
      return;
    }

    const currentColors = getCurrentThemeColors();
    const currentSliders = getNeoSliderValues();

    presets.forEach(p => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'theme-swatch-chip theme-card-chip custom-preset-chip';
      chip.dataset.presetId = p.id;
      chip.title = `${p.name} (Background: ${p.bgColor}, Accent: ${p.accentColor}, Radius: ${p.radius}px, Blur: ${p.blur}px)`;
      chip.setAttribute('aria-label', p.name);
      chip.style.backgroundColor = p.bgColor;
      chip.style.borderColor = p.accentColor;
      chip.style.color = p.accentColor;
      chip.style.borderRadius = `${Math.min(22, Math.max(0, typeof p.radius !== 'undefined' ? p.radius : 10))}px`;
      chip.style.boxShadow = computePresetShadow(
        p.bgColor,
        (typeof p.lightIntensity !== 'undefined') ? p.lightIntensity : 20,
        (typeof p.darkIntensity !== 'undefined') ? p.darkIntensity : 20,
        (typeof p.distance !== 'undefined') ? p.distance : 3,
        (typeof p.blur !== 'undefined') ? p.blur : 8
      );

      const isMatch = (
        p.bgColor.toLowerCase() === currentColors.bg.toLowerCase() &&
        p.accentColor.toLowerCase() === currentColors.acc.toLowerCase() &&
        parseInt(p.radius, 10) === currentSliders.radius &&
        parseInt(p.distance, 10) === currentSliders.distance &&
        parseInt(p.blur, 10) === currentSliders.blur &&
        (typeof p.lightIntensity === 'undefined' || parseInt(p.lightIntensity, 10) === currentSliders.lightIntensity) &&
        (typeof p.darkIntensity === 'undefined' || parseInt(p.darkIntensity, 10) === currentSliders.darkIntensity)
      );

      if (isMatch) {
        chip.classList.add('active');
      }

      chip.innerHTML = `
        <svg class="theme-check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span class="btn-delete-preset" data-delete-id="${p.id}" title="Delete preset">&times;</span>
      `;

      chip.addEventListener('click', (e) => {
        if (e.target.closest('.btn-delete-preset')) return;

        applyTheme(p.bgColor, p.accentColor, true, {
          radius: p.radius,
          distance: p.distance,
          lightIntensity: p.lightIntensity,
          darkIntensity: p.darkIntensity,
          blur: p.blur
        });

        updateActivePresetChips();
      });

      const btnDelete = chip.querySelector('.btn-delete-preset');
      if (btnDelete) {
        btnDelete.addEventListener('click', (e) => {
          e.stopPropagation();
          deleteCustomPreset(p.id);
        });
      }

      grid.appendChild(chip);
    });
  }

  function saveCurrentCustomPreset() {
    const input = document.getElementById('inputCustomPresetName');
    const nameVal = input ? input.value.trim() : '';

    if (!state.config.theme) state.config.theme = {};
    let presets = getCustomThemePresets();

    const name = nameVal || `Custom Theme ${presets.length + 1}`;
    const current = getCurrentThemeColors();
    const sliders = getNeoSliderValues();

    const existingIndex = presets.findIndex(p => p.name.toLowerCase() === name.toLowerCase());
    const newPreset = {
      id: (existingIndex >= 0) ? presets[existingIndex].id : ('custom_' + Date.now()),
      name: name,
      bgColor: current.bg,
      accentColor: current.acc,
      radius: sliders.radius,
      distance: sliders.distance,
      lightIntensity: sliders.lightIntensity,
      darkIntensity: sliders.darkIntensity,
      blur: sliders.blur
    };

    if (existingIndex >= 0) {
      presets[existingIndex] = newPreset;
    } else {
      presets.push(newPreset);
    }

    state.config.theme.customPresets = presets;

    try {
      localStorage.setItem('ahk_custom_theme_presets', JSON.stringify(presets));
    } catch (e) { }

    syncConfig();

    if (input) input.value = '';

    renderCustomPresets();
    updateActivePresetChips();

    const btnSave = document.getElementById('btnSaveCustomPreset');
    if (btnSave) {
      const origText = btnSave.innerHTML;
      btnSave.classList.add('btn-saved');
      btnSave.innerHTML = '<span>SAVED!</span>';
      setTimeout(() => {
        btnSave.classList.remove('btn-saved');
        btnSave.innerHTML = origText;
      }, 1200);
    }
  }

  function deleteCustomPreset(id) {
    if (!state.config.theme) state.config.theme = {};
    let presets = getCustomThemePresets();
    presets = presets.filter(p => p.id !== id);
    state.config.theme.customPresets = presets;

    try {
      localStorage.setItem('ahk_custom_theme_presets', JSON.stringify(presets));
    } catch (e) { }

    syncConfig();
    renderCustomPresets();
    updateActivePresetChips();
  }

  // ============================================================================
  // Event Listeners & Initialization
  // ============================================================================

  function initListeners() {
    // Master Switch
    mainEngineSwitch.addEventListener('click', toggleMasterEngine);
    if (mainEngineSwitch) {
      mainEngineSwitch.addEventListener('click', toggleMasterEngine);
    }

    // Profile Management Listeners
    if (profileSelect) {
      profileSelect.addEventListener('change', (e) => {
        switchProfile(e.target.value);
      });
    }
    if (btnAddProfile) {
      btnAddProfile.addEventListener('click', () => {
        openProfileModal('add');
      });
    }
    const btnEditProfile = document.getElementById('btnEditProfile');
    if (btnEditProfile) {
      btnEditProfile.addEventListener('click', () => {
        openProfileModal('edit');
      });
    }
    if (btnRenameProfile) {
      btnRenameProfile.addEventListener('click', () => {
        openProfileModal('rename');
      });
    }
    if (btnDeleteProfile) {
      btnDeleteProfile.addEventListener('click', () => {
        openProfileModal('delete');
      });
    }
    const btnScrollProfilesLeft = document.getElementById('btnScrollProfilesLeft');
    const btnScrollProfilesRight = document.getElementById('btnScrollProfilesRight');
    const lgsProfilesTrack = document.getElementById('lgsProfilesTrack');
    if (btnScrollProfilesLeft && lgsProfilesTrack) {
      btnScrollProfilesLeft.addEventListener('click', () => {
        lgsProfilesTrack.scrollBy({ left: -220, behavior: 'smooth' });
        setTimeout(updateProfilesScrollButtons, 220);
      });
    }
    if (btnScrollProfilesRight && lgsProfilesTrack) {
      btnScrollProfilesRight.addEventListener('click', () => {
        lgsProfilesTrack.scrollBy({ left: 220, behavior: 'smooth' });
        setTimeout(updateProfilesScrollButtons, 220);
      });
    }
    if (lgsProfilesTrack) {
      lgsProfilesTrack.addEventListener('scroll', () => {
        updateProfilesScrollButtons();
      });
      lgsProfilesTrack.addEventListener('wheel', (e) => {
        if (e.deltaY) {
          e.preventDefault();
          lgsProfilesTrack.scrollLeft += e.deltaY;
          updateProfilesScrollButtons();
        }
      }, { passive: false });
    }
    const profileSearchInput = document.getElementById('profileSearchInput');
    if (profileSearchInput) {
      profileSearchInput.addEventListener('input', () => {
        renderProfilesRibbon();
      });
    }
    const btnBrowseProfileExe = document.getElementById('btnBrowseProfileExe');
    if (btnBrowseProfileExe) {
      btnBrowseProfileExe.addEventListener('click', () => {
        sendToAhk('browseProfileApp');
      });
    }
    const btnRescanRunningApps = document.getElementById('btnRescanRunningApps');
    if (btnRescanRunningApps) {
      btnRescanRunningApps.addEventListener('click', () => {
        const list = document.getElementById('runningAppsList');
        if (list) list.innerHTML = '<div class="apps-empty-state">Rescanning open windows...</div>';
        sendToAhk('getRunningApps');
      });
    }
    const runningAppsFilterInput = document.getElementById('runningAppsFilterInput');
    if (runningAppsFilterInput) {
      runningAppsFilterInput.addEventListener('input', () => {
        renderRunningAppsList();
      });
    }
    const profSwitchAutoSwitch = document.getElementById('profSwitchAutoSwitch');
    if (profSwitchAutoSwitch) {
      profSwitchAutoSwitch.addEventListener('change', () => {
        updateProfileTriggerModeUI(profSwitchAutoSwitch.checked ? modalLastActiveTrigger : 'off');
      });
    }
    const chipTriggerFocus = document.getElementById('chipTriggerFocus');
    if (chipTriggerFocus) {
      chipTriggerFocus.addEventListener('click', (e) => {
        e.stopPropagation();
        updateProfileTriggerModeUI('focus');
      });
    }
    const chipTriggerHover = document.getElementById('chipTriggerHover');
    if (chipTriggerHover) {
      chipTriggerHover.addEventListener('click', (e) => {
        e.stopPropagation();
        updateProfileTriggerModeUI('hover');
      });
    }
    if (btnConfirmProfileModal) {
      btnConfirmProfileModal.addEventListener('click', handleProfileModalConfirm);
    }
    if (btnCancelProfileModal) {
      btnCancelProfileModal.addEventListener('click', closeProfileModal);
    }
    if (btnCloseProfileModal) {
      btnCloseProfileModal.addEventListener('click', closeProfileModal);
    }
    if (profileNameInput) {
      profileNameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleProfileModalConfirm();
        else if (e.key === 'Escape') closeProfileModal();
      });
    }

    // Tab Bar (Smooth Drag & Wheel Horizontal Scroll + Responsive Buttons)
    let isTabsDragging = false;
    let tabsStartX = 0;
    let tabsScrollLeft = 0;
    let hasTabsDragged = false;

    segmentedBar.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      isTabsDragging = true;
      hasTabsDragged = false;
      tabsStartX = e.pageX - segmentedBar.offsetLeft;
      tabsScrollLeft = segmentedBar.scrollLeft;
    });

    window.addEventListener('mousemove', (e) => {
      if (!isTabsDragging) return;
      const x = e.pageX - segmentedBar.offsetLeft;
      const walk = (x - tabsStartX);
      if (Math.abs(walk) > 4) {
        hasTabsDragged = true;
        segmentedBar.scrollLeft = tabsScrollLeft - walk;
        updateTabsScrollButtons();
      }
    });

    window.addEventListener('mouseup', () => {
      isTabsDragging = false;
    });

    segmentedBar.addEventListener('click', (e) => {
      if (hasTabsDragged) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      const btn = e.target.closest('.segment-btn');
      if (!btn) return;
      switchTab(btn.dataset.tab);
    });

    segmentedBar.addEventListener('scroll', () => {
      updateTabsScrollButtons();
    });

    const handleTabsWheel = (e) => {
      if (e.deltaY) {
        e.preventDefault();
        segmentedBar.scrollLeft += e.deltaY;
        updateTabsScrollButtons();
      }
    };
    segmentedBar.addEventListener('wheel', handleTabsWheel, { passive: false });

    const segmentedWrap = document.querySelector('.segmented-control-wrapper');
    if (segmentedWrap) {
      segmentedWrap.addEventListener('wheel', handleTabsWheel, { passive: false });
    }

    const btnScrollTabsLeft = document.getElementById('btnScrollTabsLeft');
    const btnScrollTabsRight = document.getElementById('btnScrollTabsRight');
    if (btnScrollTabsLeft) {
      btnScrollTabsLeft.addEventListener('click', () => {
        segmentedBar.scrollBy({ left: -220, behavior: 'smooth' });
        setTimeout(updateTabsScrollButtons, 220);
      });
    }
    if (btnScrollTabsRight) {
      btnScrollTabsRight.addEventListener('click', () => {
        segmentedBar.scrollBy({ left: 220, behavior: 'smooth' });
        setTimeout(updateTabsScrollButtons, 220);
      });
    }

    if (window.ResizeObserver) {
      const tabsObserver = new ResizeObserver(() => {
        updateTabsScrollButtons();
        updateProfilesScrollButtons();
      });
      tabsObserver.observe(segmentedBar);
      tabsObserver.observe(document.body);
    }

    window.addEventListener('resize', () => {
      updateSegmentedGlider(true);
      updateProfileGlider(true);
      updateProfilesScrollButtons();
      updateTabsScrollButtons();
    });

    // Text Expander Listeners
    teBtnSubmit.addEventListener('click', submitTextExpander);
    teToggleMultiline.addEventListener('click', () => toggleMultiline());
    teSearchFilter.addEventListener('input', renderTextExpander);

    // Global click delegate for switching profile when clicking a profile badge on any script card
    document.addEventListener('click', (e) => {
      const badge = e.target.closest('.item-profile-badge');
      if (badge && badge.dataset.switchProfile) {
        e.stopPropagation();
        e.preventDefault();
        const targetProfile = badge.dataset.switchProfile;
        if (state.config && state.config.activeProfile !== targetProfile) {
          switchProfile(targetProfile);
        }
      }
    }, true);

    teInputTrigger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        if (state.isMultiline) teTextareaOutput.focus();
        else if (!teInputOutput.value.trim()) teInputOutput.focus();
        else submitTextExpander();
      }
    });

    teInputOutput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submitTextExpander();
    });

    // Key Remapper Pure Key Combination Recorders
    krBtnSubmit.addEventListener('click', submitKeyRemapper);
    setupKeyCombinationBox(krSourceBox, krInputSource, krBtnClearSource, krTargetBox, submitKeyRemapper);
    setupKeyCombinationBox(krTargetBox, krInputTarget, krBtnClearTarget, null, submitKeyRemapper);

    // App Launcher Listeners
    if (alTypeString) {
      alTypeString.addEventListener('click', () => setAlTriggerType('string'));
    }
    if (alTypeHotkey) {
      alTypeHotkey.addEventListener('click', () => setAlTriggerType('hotkey'));
    }
    if (alBtnSubmit) {
      alBtnSubmit.addEventListener('click', submitAppLauncher);
    }
    if (alInputTrigger) {
      alInputTrigger.addEventListener('keydown', handleAlTriggerKeydown);
    }
    if (alBtnBrowse) {
      alBtnBrowse.addEventListener('click', (e) => {
        e.preventDefault();
        sendToAhk('browseApp');
      });
    }

    if (alOutputBox) {
      alOutputBox.addEventListener('dragover', (e) => {
        e.preventDefault();
        alOutputBox.style.boxShadow = 'var(--inset-deep), inset 0 0 0 1.5px var(--accent-primary)';
      });
      alOutputBox.addEventListener('dragleave', () => {
        alOutputBox.style.boxShadow = '';
      });
      alOutputBox.addEventListener('drop', (e) => {
        e.preventDefault();
        alOutputBox.style.boxShadow = '';
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
          const file = e.dataTransfer.files[0];
          if (file.path) {
            alInputTarget.value = file.path;
            const nameNoExt = file.name.replace(/\.[^/.]+$/, '');
            if (!alInputName.value.trim()) {
              alInputName.value = nameNoExt;
            }
            alInputTarget.focus();
          }
        }
      });
    }

    if (alInputTarget) {
      alInputTarget.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') submitAppLauncher();
      });
    }

    if (alInputName) {
      alInputName.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') submitAppLauncher();
      });
    }

    // Window Dragging
    function handleDragStart(e) {
      if (
        e.target.closest('button') ||
        e.target.closest('#btnStats') ||
        e.target.closest('.squircle-btn') ||
        e.target.closest('input') ||
        e.target.closest('textarea') ||
        e.target.closest('select') ||
        e.target.closest('.resize-handle') ||
        e.target.closest('.shortcut-card') ||
        e.target.closest('.macro-step-chip') ||
        e.target.closest('.macro-timeline-track') ||
        e.target.closest('.macro-inject-btn') ||
        e.target.closest('[draggable="true"]') ||
        e.target.closest('#headerSleepCountdown') ||
        e.target.closest('.sleep-countdown-pill') ||
        e.target.closest('#mainEngineSwitch') ||
        e.target.closest('.vertical-rocker') ||
        e.target.closest('.lgs-profile-card') ||
        e.target.closest('.lgs-profiles-bar')
      ) return;
      sendToAhk('startDrag');
    }

    dragHeader.addEventListener('mousedown', handleDragStart);
    dragHeader.addEventListener('dblclick', (e) => {
      if (
        e.target.closest('#headerSleepCountdown') ||
        e.target.closest('.sleep-countdown-pill') ||
        e.target.closest('#mainEngineSwitch') ||
        e.target.closest('.vertical-rocker') ||
        e.target.closest('.lgs-profile-card') ||
        e.target.closest('.lgs-profiles-bar') ||
        e.target.closest('button') ||
        e.target.closest('input')
      ) return;
      sendToAhk('maximize');
    });
    appCard.addEventListener('mousedown', (e) => {
      if (
        e.target === appCard ||
        e.target.classList.contains('inputs-section') ||
        e.target.classList.contains('input-hints') ||
        e.target.classList.contains('list-section') ||
        e.target.classList.contains('modules-container')
      ) {
        handleDragStart(e);
      }
    });

    // Window Resizing via handles
    document.querySelectorAll('.resize-handle').forEach(handle => {
      handle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        sendToAhk('startResize', { dir: handle.dataset.direction });
      });
    });

    // Window Controls
    if (btnMinimize) btnMinimize.addEventListener('click', () => sendToAhk('minimize'));
    if (btnMaximize) btnMaximize.addEventListener('click', () => sendToAhk('maximize'));
    if (btnClose) btnClose.addEventListener('click', () => sendToAhk('close'));
    if (btnRefresh) btnRefresh.addEventListener('click', () => sendToAhk('reload'));
    if (btnExport) {
      btnExport.addEventListener('click', () => sendToAhk('openConfig'));
    }
    if (btnHelp) {
      btnHelp.addEventListener('click', () => {
        const modal = document.getElementById('infoModal');
        if (modal) modal.classList.remove('hidden-field');
      });
    }

    const btnCloseModal = document.getElementById('btnCloseModal');
    if (btnCloseModal) {
      btnCloseModal.addEventListener('click', () => {
        const modal = document.getElementById('infoModal');
        if (modal) modal.classList.add('hidden-field');
      });
    }

    const infoModal = document.getElementById('infoModal');
    if (infoModal) {
      infoModal.addEventListener('click', (e) => {
        if (e.target === infoModal) {
          infoModal.classList.add('hidden-field');
        }
      });
    }

    // Theme Settings Listeners
    if (btnTheme) {
      btnTheme.addEventListener('click', () => {
        if (themeModal) {
          const current = getCurrentThemeColors(false);
          if (themeBgColorPicker) themeBgColorPicker.value = current.bg;
          if (themeBgHex) themeBgHex.value = current.bg.toUpperCase();
          if (themeAccentColorPicker) themeAccentColorPicker.value = current.acc;
          if (themeAccentHex) themeAccentHex.value = current.acc.toUpperCase();

          if (themeSliderRadius) {
            themeSliderRadius.value = current.radius;
            updateSliderProgress(themeSliderRadius);
            if (badgeRadius) badgeRadius.textContent = `${current.radius}px`;
          }
          if (themeSliderDistance) {
            themeSliderDistance.value = current.distance;
            updateSliderProgress(themeSliderDistance);
            if (badgeDistance) badgeDistance.textContent = `${current.distance}px`;
          }
          if (themeSliderLightIntensity) {
            themeSliderLightIntensity.value = current.lightIntensity;
            updateSliderProgress(themeSliderLightIntensity);
            if (badgeLightIntensity) badgeLightIntensity.textContent = `${current.lightIntensity}%`;
          }
          if (themeSliderDarkIntensity) {
            themeSliderDarkIntensity.value = current.darkIntensity;
            updateSliderProgress(themeSliderDarkIntensity);
            if (badgeDarkIntensity) badgeDarkIntensity.textContent = `${current.darkIntensity}%`;
          }
          if (themeSliderBlur) {
            themeSliderBlur.value = current.blur;
            updateSliderProgress(themeSliderBlur);
            if (badgeBlur) badgeBlur.textContent = `${current.blur}px`;
          }

          renderCuratedPresets();
          updateActivePresetChips();
          renderCustomPresets();

          themeModal.classList.remove('hidden-field');
        }
      });
    }

    if (btnCloseThemeModal) {
      btnCloseThemeModal.addEventListener('click', () => {
        syncConfig();
        if (themeModal) themeModal.classList.add('hidden-field');
      });
    }

    const btnBackThemeModal = document.getElementById('btnBackThemeModal');
    if (btnBackThemeModal) {
      btnBackThemeModal.addEventListener('click', () => {
        syncConfig();
        if (themeModal) themeModal.classList.add('hidden-field');
      });
    }

    if (themeModal) {
      themeModal.addEventListener('click', (e) => {
        if (e.target === themeModal) {
          syncConfig();
          themeModal.classList.add('hidden-field');
        }
      });
    }

    // Active Items Count button click -> opens Active Scripts Overview Modal
    const btnStats = document.getElementById('btnStats');
    if (btnStats) {
      btnStats.addEventListener('click', () => {
        openActiveScriptsModal();
      });
    }

    const btnCloseActiveScriptsModal = document.getElementById('btnCloseActiveScriptsModal');
    if (btnCloseActiveScriptsModal) {
      btnCloseActiveScriptsModal.addEventListener('click', () => {
        closeActiveScriptsModal();
      });
    }

    const activeScriptsModal = document.getElementById('activeScriptsModal');
    if (activeScriptsModal) {
      activeScriptsModal.addEventListener('click', (e) => {
        if (e.target === activeScriptsModal) {
          closeActiveScriptsModal();
        }
      });
    }

    // Quick Sleep / Hibernate Countdown Header Cancel Button
    const btnHeaderCancelSleep = document.getElementById('btnHeaderCancelSleep');
    if (btnHeaderCancelSleep) {
      btnHeaderCancelSleep.addEventListener('click', (e) => {
        e.stopPropagation();
        sendToAhk('cancelSleepTimer');
        handleSleepTimerState({ active: false });
        showToast('Countdown cancelled', 'info');
      });
    }

    // Background Swatches - Auto-save immediately with curated preset parameters
    if (bgSwatchesGrid) {
      bgSwatchesGrid.addEventListener('click', (e) => {
        const chip = e.target.closest('.theme-swatch-chip');
        if (!chip) return;
        const presetKey = chip.dataset.preset;
        const preset = presetKey ? THEME_PRESETS[presetKey] : null;
        const current = getCurrentThemeColors(true);
        if (preset) {
          applyTheme(preset.bgColor, preset.accentColor || current.acc, true, {
            radius: preset.radius,
            distance: preset.distance,
            lightIntensity: preset.lightIntensity,
            darkIntensity: preset.darkIntensity,
            blur: preset.blur
          });
        } else if (chip.dataset.color) {
          applyTheme(chip.dataset.color, current.acc, true, getNeoSliderValues());
        }
        updateActivePresetChips();
      });
    }

    // Custom Background Color Picker & Hex Input with real-time bidirectional synchronization
    if (themeBgColorPicker) {
      themeBgColorPicker.addEventListener('input', (e) => {
        const color = e.target.value;
        if (themeBgHex) themeBgHex.value = color.toUpperCase();
        const current = getCurrentThemeColors(true);
        applyTheme(color, current.acc, false, getNeoSliderValues());
      });
      themeBgColorPicker.addEventListener('change', (e) => {
        const color = e.target.value;
        if (themeBgHex) themeBgHex.value = color.toUpperCase();
        const current = getCurrentThemeColors(true);
        applyTheme(color, current.acc, true, getNeoSliderValues());
      });
    }

    if (themeBgHex) {
      const handleBgHex = (save = false) => {
        let val = themeBgHex.value.trim();
        if (!val.startsWith('#') && val.length > 0) val = '#' + val;
        if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
          if (themeBgColorPicker) themeBgColorPicker.value = val;
          const current = getCurrentThemeColors(true);
          applyTheme(val, current.acc, save, getNeoSliderValues());
        }
      };
      themeBgHex.addEventListener('input', () => handleBgHex(false));
      themeBgHex.addEventListener('change', () => handleBgHex(true));
    }

    // Accent Swatches - Auto-save immediately
    if (accentSwatchesGrid) {
      accentSwatchesGrid.addEventListener('click', (e) => {
        const chip = e.target.closest('.theme-swatch-chip');
        if (!chip) return;
        const color = chip.dataset.color;
        const current = getCurrentThemeColors(true);
        applyTheme(current.bg, color, true, getNeoSliderValues());
      });
    }

    // Custom Accent Color Picker & Hex Input with real-time bidirectional synchronization
    if (themeAccentColorPicker) {
      themeAccentColorPicker.addEventListener('input', (e) => {
        const color = e.target.value;
        if (themeAccentHex) themeAccentHex.value = color.toUpperCase();
        const current = getCurrentThemeColors(true);
        applyTheme(current.bg, color, false, getNeoSliderValues());
      });
      themeAccentColorPicker.addEventListener('change', (e) => {
        const color = e.target.value;
        if (themeAccentHex) themeAccentHex.value = color.toUpperCase();
        const current = getCurrentThemeColors(true);
        applyTheme(current.bg, color, true, getNeoSliderValues());
      });
    }

    if (themeAccentHex) {
      const handleAccHex = (save = false) => {
        let val = themeAccentHex.value.trim();
        if (!val.startsWith('#') && val.length > 0) val = '#' + val;
        if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
          if (themeAccentColorPicker) themeAccentColorPicker.value = val;
          const current = getCurrentThemeColors(true);
          applyTheme(current.bg, val, save, getNeoSliderValues());
        }
      };
      themeAccentHex.addEventListener('input', () => handleAccHex(false));
      themeAccentHex.addEventListener('change', () => handleAccHex(true));
    }

    // Neumorphism Sliders Listeners (Live Preview on Input, Save on Change)
    if (themeSliderRadius) {
      themeSliderRadius.addEventListener('input', () => {
        const val = parseInt(themeSliderRadius.value, 10);
        if (badgeRadius) badgeRadius.textContent = `${val}px`;
        updateSliderProgress(themeSliderRadius);
        const current = getCurrentThemeColors(true);
        applyTheme(current.bg, current.acc, false, { ...getNeoSliderValues(), radius: val });
      });
      themeSliderRadius.addEventListener('change', () => {
        const current = getCurrentThemeColors(true);
        applyTheme(current.bg, current.acc, true, getNeoSliderValues());
      });
    }

    if (themeSliderDistance) {
      themeSliderDistance.addEventListener('input', () => {
        const val = parseInt(themeSliderDistance.value, 10);
        if (badgeDistance) badgeDistance.textContent = `${val}px`;
        updateSliderProgress(themeSliderDistance);
        const current = getCurrentThemeColors(true);
        applyTheme(current.bg, current.acc, false, { ...getNeoSliderValues(), distance: val });
      });
      themeSliderDistance.addEventListener('change', () => {
        const current = getCurrentThemeColors(true);
        applyTheme(current.bg, current.acc, true, getNeoSliderValues());
      });
    }

    if (themeSliderLightIntensity) {
      themeSliderLightIntensity.addEventListener('input', () => {
        const val = parseInt(themeSliderLightIntensity.value, 10);
        if (badgeLightIntensity) badgeLightIntensity.textContent = `${val}%`;
        updateSliderProgress(themeSliderLightIntensity);
        const current = getCurrentThemeColors(true);
        applyTheme(current.bg, current.acc, false, { ...getNeoSliderValues(), lightIntensity: val });
      });
      themeSliderLightIntensity.addEventListener('change', () => {
        const current = getCurrentThemeColors(true);
        applyTheme(current.bg, current.acc, true, getNeoSliderValues());
      });
    }

    if (themeSliderDarkIntensity) {
      themeSliderDarkIntensity.addEventListener('input', () => {
        const val = parseInt(themeSliderDarkIntensity.value, 10);
        if (badgeDarkIntensity) badgeDarkIntensity.textContent = `${val}%`;
        updateSliderProgress(themeSliderDarkIntensity);
        const current = getCurrentThemeColors(true);
        applyTheme(current.bg, current.acc, false, { ...getNeoSliderValues(), darkIntensity: val });
      });
      themeSliderDarkIntensity.addEventListener('change', () => {
        const current = getCurrentThemeColors(true);
        applyTheme(current.bg, current.acc, true, getNeoSliderValues());
      });
    }

    if (themeSliderBlur) {
      themeSliderBlur.addEventListener('input', () => {
        const val = parseInt(themeSliderBlur.value, 10);
        if (badgeBlur) badgeBlur.textContent = `${val}px`;
        updateSliderProgress(themeSliderBlur);
        const current = getCurrentThemeColors(true);
        applyTheme(current.bg, current.acc, false, { ...getNeoSliderValues(), blur: val });
      });
      themeSliderBlur.addEventListener('change', () => {
        const current = getCurrentThemeColors(true);
        applyTheme(current.bg, current.acc, true, getNeoSliderValues());
      });
    }

    // Reset Theme to Default Preset (Warm Clay)
    if (btnResetTheme) {
      btnResetTheme.addEventListener('click', () => {
        const def = THEME_PRESETS['custom-default'] || THEME_PRESETS['soft-gray'];
        applyTheme(def.bgColor, def.accentColor, true, {
          radius: def.radius,
          distance: def.distance,
          lightIntensity: def.lightIntensity,
          darkIntensity: def.darkIntensity,
          blur: def.blur
        });
        showToast('Theme reset to default (Warm Clay)', 'info');
      });
    }

    // Save / Apply Theme (Fully fixes Apply & Save button)
    if (btnSaveTheme) {
      btnSaveTheme.addEventListener('click', () => {
        const current = getCurrentThemeColors(true);
        const sliders = getNeoSliderValues();

        // 1. Apply theme variables & persist
        applyTheme(current.bg, current.acc, true, sliders);

        // 2. Explicitly ensure state.config.theme has everything
        if (!state.config.theme) state.config.theme = {};
        state.config.theme.bgColor = current.bg;
        state.config.theme.accentColor = current.acc;
        state.config.theme.radius = sliders.radius;
        state.config.theme.distance = sliders.distance;
        state.config.theme.lightIntensity = sliders.lightIntensity;
        state.config.theme.darkIntensity = sliders.darkIntensity;
        state.config.theme.intensity = Math.round((sliders.lightIntensity + sliders.darkIntensity) / 2);
        state.config.theme.blur = sliders.blur;

        // 3. Persist to localStorage & AutoHotkey
        try {
          localStorage.setItem('ahk_theme', JSON.stringify({
            bgColor: current.bg,
            accentColor: current.acc,
            radius: sliders.radius,
            distance: sliders.distance,
            lightIntensity: sliders.lightIntensity,
            darkIntensity: sliders.darkIntensity,
            intensity: Math.round((sliders.lightIntensity + sliders.darkIntensity) / 2),
            blur: sliders.blur,
            customPresets: state.config.theme.customPresets || []
          }));
        } catch (e) { }

        syncConfig();

        // 4. Positive visual feedback
        showToast('Theme applied and saved successfully!', 'success');

        const btnSpan = btnSaveTheme.querySelector('span');
        const origText = btnSpan ? btnSpan.textContent : 'APPLY';
        if (btnSpan) btnSpan.textContent = 'SAVED!';
        btnSaveTheme.classList.add('btn-saved');

        setTimeout(() => {
          if (btnSpan) btnSpan.textContent = origText;
          btnSaveTheme.classList.remove('btn-saved');
          if (themeModal) themeModal.classList.add('hidden-field');
        }, 350);
      });
    }

    // Save Custom Theme Preset Listeners
    if (btnSaveCustomPreset) {
      btnSaveCustomPreset.addEventListener('click', saveCurrentCustomPreset);
    }
    if (inputCustomPresetName) {
      inputCustomPresetName.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          saveCurrentCustomPreset();
        }
      });
    }

    initMacroRecorder();
    initFolderCreator();
    initProfileContextMenu();
    initScriptContextMenu();

    // Global listener to ensure gesture, hot corner, and radial action dropdowns are immediately fresh when focused/clicked
    document.addEventListener('focusin', (e) => {
      const sel = e.target;
      if (sel && sel.tagName === 'SELECT' && (
        sel.classList.contains('mg-action-select') ||
        sel.classList.contains('rm-slice-select') ||
        sel.id.startsWith('hcSelect') ||
        sel.id === 'rmCenterActionSelect'
      )) {
        populateActionSelect(sel, sel.value);
      }
    });
  }

  function updateMaximizeButtonState(isMax) {
    const btn = document.getElementById('btnMaximize');
    const svg = document.getElementById('svgMaximizeIcon');
    if (!btn) return;
    btn.title = isMax ? 'Restore Window' : 'Maximize Window';
    document.body.classList.toggle('window-maximized', Boolean(isMax));
    if (svg) {
      if (isMax) {
        svg.innerHTML = `
          <rect x="7" y="3" width="13" height="13" rx="1.5" ry="1.5"></rect>
          <path d="M4 7h1v10a1.5 1.5 0 0 0 1.5 1.5H17v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z"></path>
        `;
      } else {
        svg.innerHTML = `<rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>`;
      }
    }
  }

  // Quick Sleep / Hibernate Live Countdown State Handler
  function handleSleepTimerState(msg) {
    const pill = document.getElementById('headerSleepCountdown');
    const modeEl = document.getElementById('headerSleepMode');
    const digitsEl = document.getElementById('headerSleepDigits');
    const iconEl = document.getElementById('headerSleepIcon');
    const cardBadge = document.getElementById('wmSleepStatusBadge');

    if (!pill) return;

    if (msg && (msg.active === 1 || msg.active === true)) {
      pill.classList.remove('hidden-field');
      const isHib = (msg.mode === 'Hibernate');
      if (modeEl) {
        modeEl.textContent = isHib ? 'HIBERNATE' : 'SLEEP';
      }
      if (iconEl) {
        if (isHib) {
          iconEl.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v10M18.4 6.6L12 12m-6.4-5.4L12 12m0 0v10m6.4-3.4L12 12m-6.4 3.4L12 12"></path></svg>`;
        } else {
          iconEl.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
        }
      }
      const sec = Math.max(0, parseInt(msg.secondsLeft, 10) || 0);
      const h = Math.floor(sec / 3600);
      const m = Math.floor((sec % 3600) / 60);
      const s = sec % 60;
      let timeStr = '';
      if (h > 0) {
        timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      } else {
        timeStr = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      }
      if (digitsEl) {
        digitsEl.textContent = timeStr;
      }
      if (cardBadge) {
        cardBadge.textContent = `${isHib ? 'Hibernate' : 'Sleep'} in ${timeStr} (Click to Cancel)`;
        cardBadge.style.color = 'var(--accent-primary)';
        cardBadge.style.cursor = 'pointer';
      }
    } else {
      pill.classList.add('hidden-field');
      if (cardBadge) {
        const isHibMode = (state.config && state.config.windowManager && (state.config.windowManager.sleepMode === 'hibernate' || state.config.windowManager.sleepModeHibernate));
        const timerVal = (state.config && state.config.windowManager && state.config.windowManager.sleepTimer) || 0;
        cardBadge.textContent = timerVal > 0 ? `${timerVal}m Timer Active` : (isHibMode ? 'Instant Hibernate' : 'Instant Sleep');
        cardBadge.style.color = 'var(--text-muted)';
        cardBadge.style.cursor = 'default';
      }
    }
  }

  // Handle IPC Messages from AHK
  function onAhkMessage(event) {
    try {
      const msg = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

      if (msg.type === 'sleepTimerState') {
        handleSleepTimerState(msg);
        return;
      }

      if (msg.type === 'windowStateChanged' || msg.action === 'windowStateChanged') {
        updateMaximizeButtonState(Boolean(msg.isMaximized));
        return;
      }

      if (msg.type === 'init' || msg.type === 'updateState') {
        if (typeof msg.isMaximized === 'boolean') {
          updateMaximizeButtonState(msg.isMaximized);
        }
        if (typeof msg.enabled === 'boolean') state.enabled = msg.enabled;
        if (msg.config) {
          state.config = msg.config;
          ensureProfilesConfig(state.config);
          if (msg.type === 'init') {
            state.activeTab = 'textExpander';
          } else if (msg.config.activeTab) {
            state.activeTab = msg.config.activeTab;
          }
          if (msg.config.theme && msg.config.theme.bgColor && msg.config.theme.accentColor) {
            applyTheme(
              msg.config.theme.bgColor,
              msg.config.theme.accentColor,
              false,
              {
                radius: msg.config.theme.radius,
                distance: msg.config.theme.distance,
                lightIntensity: msg.config.theme.lightIntensity,
                darkIntensity: msg.config.theme.darkIntensity,
                intensity: msg.config.theme.intensity,
                blur: msg.config.theme.blur
              }
            );
            renderCustomPresets();
            try {
              localStorage.setItem('ahk_theme', JSON.stringify({
                bgColor: msg.config.theme.bgColor,
                accentColor: msg.config.theme.accentColor,
                radius: msg.config.theme.radius,
                distance: msg.config.theme.distance,
                lightIntensity: msg.config.theme.lightIntensity,
                darkIntensity: msg.config.theme.darkIntensity,
                intensity: msg.config.theme.intensity,
                blur: msg.config.theme.blur,
                customPresets: msg.config.theme.customPresets || []
              }));
              if (Array.isArray(msg.config.theme.customPresets)) {
                localStorage.setItem('ahk_custom_theme_presets', JSON.stringify(msg.config.theme.customPresets));
              }
            } catch (e) { }
          }
        }
        if (typeof msg.autoClickerRunning === 'boolean') {
          updateAutoClickerUi(msg.autoClickerRunning);
        }
        isInitialized = true;
        renderAll(false);
      } else if (msg.type === 'runningAppsList') {
        renderRunningAppsList(msg.apps || []);
      } else if (msg.type === 'profileAppSelected') {
        const profInputExe = document.getElementById('profInputExe');
        if (profInputExe && msg.exe) {
          const cur = profInputExe.value.split(',').map(s => s.trim()).filter(Boolean);
          if (!cur.some(x => x.toLowerCase() === msg.exe.toLowerCase())) {
            cur.push(msg.exe);
            profInputExe.value = cur.join(', ');
          }
          if (profileModalMode === 'add' && profileNameInput && !profileNameInput.value.trim() && msg.name) {
            profileNameInput.value = msg.name.charAt(0).toUpperCase() + msg.name.slice(1);
          }
          renderRunningAppsList();
        }
      } else if (msg.type === 'profileAutoSwitched') {
        if (msg.activeProfile && state.config && state.config.profiles && state.config.profiles[msg.activeProfile]) {
          switchProfile(msg.activeProfile, false);
          if (msg.triggerExe) {
            showToast(`Switched Profile: ${msg.activeProfile} (${msg.triggerExe})`);
          }
        }
      } else if (msg.type === 'autoClickerState') {
        updateAutoClickerUi(msg.running);
      } else if (msg.type === 'appSelected') {
        if (msg.path && alInputTarget) {
          alInputTarget.value = msg.path;
          if (alInputName && (!alInputName.value.trim() || alInputName.value === 'Launch') && msg.name) {
            alInputName.value = msg.name;
          }
          alInputTarget.focus();
        }
      } else if (msg.type === 'folderSelected') {
        if (msg.path && fcInputCustomPath) {
          fcInputCustomPath.value = msg.path;
          fcInputCustomPath.focus();
        }
      } else if (msg.type === 'activeAppVolumeChanged') {
        if (msg.name) {
          activeAppState.name = msg.name;
          if (wmAppTargetBadge) {
            wmAppTargetBadge.textContent = `Active: ${msg.name}`;
          }
        }
        if (msg.pid) {
          activeAppState.pid = msg.pid;
        }
        if (typeof msg.volume === 'number') {
          if (msg.volume >= 0) {
            activeAppState.volume = msg.volume;
            if (wmAppVolumeSlider) {
              wmAppVolumeSlider.value = msg.volume;
              updateSliderProgress(wmAppVolumeSlider);
            }
            if (wmAppVolumeValue) {
              wmAppVolumeValue.textContent = `${msg.volume}%`;
            }
          } else if (msg.volume === -1 && wmAppVolumeValue) {
            wmAppVolumeValue.textContent = 'No Audio';
          }
        }
        if (typeof msg.muted !== 'undefined') {
          activeAppState.muted = Boolean(msg.muted);
          if (wmBtnMuteActiveAppText) {
            wmBtnMuteActiveAppText.textContent = activeAppState.muted ? 'Unmute App' : 'Mute App';
          }
          if (wmBtnMuteActiveApp) {
            wmBtnMuteActiveApp.classList.toggle('is-muted', activeAppState.muted);
          }
        }
      } else if (msg.type === 'macroStepRecorded') {
        if (macroState.isRecording) {
          const delay = macroState.useStandardDelays
            ? macroState.standardDelay
            : ((typeof msg.delay === 'number' && !isNaN(msg.delay)) ? msg.delay : 50);
          addMacroStep(msg.action, msg.key, delay);
        }
      } else if (msg.type === 'macroRecordingStopped') {
        if (macroState.isRecording) {
          stopMacroRecording();
        }
      } else if (msg.type === 'colorFormatChanged') {
        const sel = document.getElementById('wmSelectColorFormat');
        if (sel) sel.value = msg.format;
        if (state.config && state.config.windowManager) {
          state.config.windowManager.colorFormat = msg.format;
        }
        showToast(`Color format changed to ${msg.format}`, 'info');
      } else if (msg.type === 'colorPicked') {
        showToast(`Color Picked & Copied: ${msg.color}`, 'success');
      } else if (msg.type === 'moduleEvent') {
        if (msg.message) {
          showToast(msg.message, msg.isError ? 'error' : 'info');
        }
      }
    } catch (err) {
      console.error('Error handling AHK message:', err);
    }
  }

  // Resilient AHK Bridge Initializer with Polling & Queue Flushing
  function initAhkBridge() {
    function tryConnect() {
      if (window.chrome && window.chrome.webview) {
        if (!window.__ahkBridgeReady) {
          window.__ahkBridgeReady = true;
          window.chrome.webview.addEventListener('message', onAhkMessage);
          flushAhkQueue();
          sendToAhk('getInitialState');
        }
        return true;
      }
      return false;
    }

    if (!tryConnect()) {
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (tryConnect() || attempts > 60) {
          clearInterval(interval);
        }
      }, 50);
    }
  }

  function renderAll(shouldSync = false) {
    ensureProfilesConfig(state.config);
    if (state.config && state.config.theme) {
      applyTheme(
        state.config.theme.bgColor,
        state.config.theme.accentColor,
        false,
        {
          radius: state.config.theme.radius,
          distance: state.config.theme.distance,
          lightIntensity: state.config.theme.lightIntensity,
          darkIntensity: state.config.theme.darkIntensity,
          intensity: state.config.theme.intensity,
          blur: state.config.theme.blur
        }
      );
    }
    renderProfileSelect();
    updateSwitchUi();
    switchTab(state.activeTab || 'textExpander', shouldSync);
    renderTextExpander();
    renderKeyRemapper();
    initWindowManager();
    initMouseGestures();
    initRadialMenu();
    renderAppLauncher();
    renderFolderCreator();
    initAutoClicker();
    renderMacroRecorder();
    updateGlobalIndicators();
    renderCuratedPresets();
    renderCustomPresets();
    updateAllFeatureProfileBadges();
  }

  // Startup
  initListeners();
  renderAll(false);
  requestAnimationFrame(() => {
    updateSegmentedGlider(true);
    updateProfileGlider(true);
    updateTabsScrollButtons();
    updateProfilesScrollButtons();
  });
  initAhkBridge();

})();
