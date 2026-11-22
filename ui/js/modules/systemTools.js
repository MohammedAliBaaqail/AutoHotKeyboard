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

      const btnHcMonAll = document.getElementById('btnHcMonAll');
      const btnHcMonPrimary = document.getElementById('btnHcMonPrimary');
      const monMode = mg.monitorMode || 'all';
      if (btnHcMonAll) btnHcMonAll.classList.toggle('active', monMode === 'all');
      if (btnHcMonPrimary) btnHcMonPrimary.classList.toggle('active', monMode === 'primary');

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

