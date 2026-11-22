  // Global Error Handlers for WebView2 Diagnostics
  window.addEventListener('error', (event) => {
    const filename = event.filename ? event.filename.split('/').pop() : 'script';
    const errText = `[WebUI JS Error] ${event.message} (${filename}:${event.lineno}:${event.colno})`;
    console.error(errText, event.error);
    if (typeof sendToAhk === 'function') {
      sendToAhk('logError', { error: errText });
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason ? (event.reason.message || event.reason) : 'Unknown Promise Rejection';
    const errText = `[WebUI Unhandled Rejection] ${reason}`;
    console.error(errText, event.reason);
    if (typeof sendToAhk === 'function') {
      sendToAhk('logError', { error: errText });
    }
  });

  function sendToAhk(action, data = {}) {
    if (window.chrome && window.chrome.webview) {
      try {
        window.chrome.webview.postMessage(JSON.stringify({ action, ...data }));
      } catch (e) {
        console.warn('sendToAhk postMessage caught:', e);
      }
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
  let lastToastMsg = '';
  let lastToastTime = 0;

  function showToast(message, type = 'info', duration = 2500) {
    if (!message) return;
    const now = Date.now();
    if (message === lastToastMsg && (now - lastToastTime < 800)) {
      return;
    }
    lastToastMsg = message;
    lastToastTime = now;

    try {
      let container = document.getElementById('toastContainer');
      if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
      }

      // Limit max visible toasts to 4 to prevent screen flood
      while (container.children.length >= 4) {
        container.removeChild(container.firstChild);
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
          onItemToggleStateChanged(moduleName, item, checked);
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

