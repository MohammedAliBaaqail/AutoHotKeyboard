    function renderScreenScanner() {
      if (!state.config) return;
      if (!state.config.screenScanner) {
        state.config.screenScanner = { enabled: 1, scanRate: 150, items: [] };
      }

      const masterSwitch = document.getElementById('ssMasterSwitch');
      if (masterSwitch) {
        masterSwitch.checked = (state.config.screenScanner.enabled !== 0 && state.config.screenScanner.enabled !== false);
      }

      updateScreenScannerMasterUI(screenScannerRunning);
      populateScannerActionDropdowns();
      renderScreenScannerList();
    }

    function renderScreenScannerList() {
      const listContainer = document.getElementById('ssListContainer');
      const countBadge = document.getElementById('ssCountBadge');
      if (!listContainer) return;
      listContainer.innerHTML = '';

      if (!state.config.screenScanner || !Array.isArray(state.config.screenScanner.items)) {
        if (countBadge) countBadge.textContent = '0';
        return;
      }

      const items = state.config.screenScanner.items;
      if (countBadge) countBadge.textContent = String(items.length);

      const q = ssSearchQuery.trim().toLowerCase();
      const filtered = q
        ? items.filter(x => (x.name || '').toLowerCase().includes(q) || (x.mode || '').toLowerCase().includes(q) || (x.trigger || '').toLowerCase().includes(q))
        : items;

      if (filtered.length === 0) {
        listContainer.innerHTML = `<div class="empty-state" style="padding:24px; text-align:center; color:var(--text-muted); font-size:12px;">
        ${q ? 'No matching visual triggers found.' : 'No visual screen triggers configured yet. Configure a pattern above and click "ADD VISUAL TRIGGER".'}
      </div>`;
        return;
      }

      filtered.forEach((item) => {
        const isScanning = activeScanningScreenTriggers.has(item.id);
        const isRunning = activeRunningScreenTriggers.has(item.id);
        const runInfo = isRunning ? activeRunningScreenTriggers.get(item.id) : null;
        const isEnabled = (item.enabled !== 0 && item.enabled !== false);

        const card = document.createElement('div');
        card.className = 'shortcut-card' + (!isEnabled ? ' is-disabled' : '') + (isRunning ? ' is-running' : '') + (isScanning ? ' is-scanning' : '');
        card.className = 'shortcut-card' + (!isEnabled ? ' is-disabled' : '') + (isRunning ? ' is-running' : '') + (isScanning ? ' is-scanning' : '') + (ssEditingId === item.id ? ' is-editing' : '');
        card.dataset.id = item.id;
        card.style.display = 'flex';
        card.style.alignItems = 'center';
        card.style.justifyContent = 'space-between';
        card.style.padding = '12px 16px';
        card.style.gap = '14px';

        // Mode label & icon
        let modeLabel = 'Image Search';
        let modeColor = '#0284c7';
        if (item.mode === 'pixel') {
          modeLabel = `Pixel Search (${item.pixelColor || '#FF0000'})`;
          modeColor = item.pixelColor || '#e11d48';
        } else if (item.mode === 'point') {
          modeLabel = `Pixel Watch (${item.pointX}, ${item.pointY})`;
          modeColor = item.pointColor || '#10b981';
        } else {
          const fileName = (item.imagePath || '').split(/[\\/]/).pop();
          if (fileName) modeLabel = `Image: ${fileName}`;
        }

        // Action label
        let actionLabel = 'Mouse Click';
        let targetSubName = '';
        if (item.actionType === 'mouseScript') {
          actionLabel = 'Play Mouse Path';
          if (state.config.autoClicker && Array.isArray(state.config.autoClicker.items)) {
            const foundMs = state.config.autoClicker.items.find(x => x.id === item.mouseScriptId);
            if (foundMs && foundMs.name) targetSubName = foundMs.name;
          }
        } else if (item.actionType === 'macro') {
          actionLabel = 'Play Macro';
          if (state.config.macroRecorder && Array.isArray(state.config.macroRecorder.items)) {
            const foundM = state.config.macroRecorder.items.find(x => x.id === item.macroId);
            if (foundM && foundM.name) targetSubName = foundM.name;
          }
        } else if (item.actionType === 'appLauncher') {
          actionLabel = 'App Launcher';
          if (state.config.appLauncher && Array.isArray(state.config.appLauncher.items)) {
            const foundL = state.config.appLauncher.items.find(x => String(x.id) === String(item.appLauncherId) || `al-${x.id}` === String(item.appLauncherId));
            if (foundL) {
              targetSubName = foundL.name || foundL.target;
              actionLabel = `Launch: ${targetSubName}`;
            }
          }
        } else if (item.actionType === 'key') {
          actionLabel = `Send Key: ${item.keyToSend || '{Key}'}`;
        } else if (item.actionType === 'system') {
          actionLabel = `System: ${item.systemAction || 'Alert'}`;
        }

        const condLabel = item.condition === 'disappear' ? 'When Disappears' : 'When Appears';
        const repeatLabel = item.repeatRule === 'continuous' ? 'Continuous' : (item.repeatRule === 'once' ? 'Run Once' : `Cooldown ${((item.debounceMs || 2000) / 1000).toFixed(1)}s`);

        const triggerBadge = item.trigger
          ? `<span class="badge-shortcut" style="padding:2px 8px; font-size:11px; font-weight:700; border-radius:var(--radius-pill); background:var(--surface-color); box-shadow:var(--inset-sm); color:var(--accent-primary);">${escapeHtml(item.trigger)}</span>`
          : `<span class="badge-shortcut" style="padding:2px 8px; font-size:10px; color:var(--text-muted); border-radius:var(--radius-pill); background:var(--surface-color); box-shadow:var(--inset-sm);">No Shortcut</span>`;

        let runningBadgeHtml = '';
        if (isScanning) {
          runningBadgeHtml += `<span class="mr-meta-tag ss-running-tag" style="background:#ef4444; color:#fff;"><span class="ss-running-dot" style="background:#fff;"></span> SCANNING ACTIVE</span>`;
        }
        if (isRunning) {
          let runText = 'TRIGGERED';
          if (item.actionType === 'mouseScript') {
            runText = `RUNNING SCRIPT: ${targetSubName || 'Mouse Path'}`;
          } else if (item.actionType === 'macro') {
            runText = `RUNNING MACRO: ${targetSubName || 'Macro'}`;
          } else if (item.actionType === 'appLauncher') {
            runText = `LAUNCHING: ${targetSubName || 'App'}`;
          } else if (item.actionType === 'click') {
            runText = `EXECUTING ${item.clickButton || 'Left'} Click`;
          } else if (item.actionType === 'key') {
            runText = `SENDING ${item.keyToSend || 'Key'}`;
          } else if (item.actionType === 'system') {
            runText = `SYSTEM ${item.systemAction || 'Action'}`;
          }
          runningBadgeHtml += `<span class="mr-meta-tag ss-running-tag" style="background:#10b981;"><span class="ss-running-dot"></span> ${escapeHtml(runText)}</span>`;
        }

        card.innerHTML = `
        <div style="display:flex; align-items:center; gap:12px; flex:1; min-width:0;">
          <div class="wm-icon-badge ${isScanning ? 'is-playing' : ''}" style="background:var(--surface-color); color:${isScanning ? '#ef4444' : 'var(--accent)'}; border:1px solid var(--border-soft); width:36px; height:36px; display:flex; align-items:center; justify-content:center; border-radius:var(--radius-btn); flex-shrink:0;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
              <path d="M3 7V5a2 2 0 0 1 2-2h2"></path>
              <path d="M17 3h2a2 2 0 0 1 2 2v2"></path>
              <path d="M21 17v2a2 2 0 0 1-2 2h-2"></path>
              <path d="M7 21H5a2 2 0 0 1-2-2v-2"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          </div>
          <div style="display:flex; flex-direction:column; gap:4px; flex:1; min-width:0;">
            <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
              <span class="ss-item-name" style="font-weight:700; font-size:13px; color:var(--text-primary); cursor:pointer;" title="Click to edit">${escapeHtml(item.name || 'Visual Trigger')}</span>
              ${triggerBadge}
              ${runningBadgeHtml}
            </div>
            <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
              <span class="mr-meta-tag" style="color:${modeColor}; font-weight:700;">${escapeHtml(modeLabel)}</span>
              <span class="mr-meta-tag">${escapeHtml(item.region || 'fullscreen')}</span>
              <span class="mr-meta-tag" style="color:#d97706;">${escapeHtml(condLabel)}</span>
              <span class="mr-meta-tag" style="color:#8b5cf6;">${escapeHtml(actionLabel)}</span>
              <span class="mr-meta-tag">${escapeHtml(repeatLabel)}</span>
            </div>
          </div>
        </div>
        <div class="card-actions" style="display:flex; align-items:center; gap:8px; flex-shrink:0;">
          <button class="neumorphic-btn btn-chip btn-scan-ss-item ${isScanning ? 'is-scanning' : ''}" style="${isScanning ? 'color:#ef4444; font-weight:700;' : ''}" title="${isScanning ? 'Scanning active • Click or press ' + (item.trigger || 'shortcut') + ' to Stop' : 'Start scan (or press ' + (item.trigger || 'shortcut') + ')'}">
            ${isScanning ? '<span class="ss-running-dot" style="background:#ef4444; margin-right:4px;"></span> Stop Scan' : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12" style="margin-right:4px;"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg><span>Start Scan</span>'}
          </button>
          <button class="neumorphic-btn btn-chip btn-test-ss-item ${isRunning ? 'running' : ''}" title="${isRunning ? 'Currently executing' : 'Test scan this trigger now'}" style="padding:4px 10px; font-size:11px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12" style="margin-right:4px;">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M3 7V5a2 2 0 0 1 2-2h2"></path>
              <path d="M17 3h2a2 2 0 0 1 2 2v2"></path>
            </svg>
            <span>${isRunning ? 'Triggered!' : 'Test'}</span>
          </button>
          <button class="card-btn btn-edit btn-edit-ss" title="Edit Visual Trigger" data-id="${item.id}">
            <svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px; height:14px;">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button class="card-btn btn-delete btn-delete-ss" title="Delete Visual Trigger" data-id="${item.id}">
            <svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px; height:14px;">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
          <div class="toggle-wrapper" title="Enable / Disable Trigger">
            <input class="toggle-checkbox ss-item-toggle" type="checkbox" ${item.enabled !== 0 && item.enabled !== false ? 'checked' : ''} />
            <div class="toggle-container"><div class="toggle-button"></div></div>
          </div>
        </div>
      `;

        // Event: Scan Toggle
        const btnScan = card.querySelector('.btn-scan-ss-item');
        if (btnScan) {
          btnScan.addEventListener('click', (e) => {
            e.stopPropagation();
            sendToAhk('toggleScreenScannerItem', { id: item.id });
          });
        }

        // Event: Test Scan single item
        const btnTest = card.querySelector('.btn-test-ss-item');
        if (btnTest) {
          btnTest.addEventListener('click', (e) => {
            e.stopPropagation();
            card.classList.add('is-running');
            btnTest.innerHTML = '<span>Scanning...</span>';
            btnTest.disabled = true;
            sendToAhk('testScreenScan', { item: item });
            showToast(`Testing trigger "${item.name}"...`, 'info');
            setTimeout(() => {
              btnTest.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12" style="margin-right:4px;"><circle cx="12" cy="12" r="3"></circle><path d="M3 7V5a2 2 0 0 1 2-2h2"></path><path d="M17 3h2a2 2 0 0 1 2 2v2"></path></svg><span>Test</span>`;
              btnTest.disabled = false;
              if (!activeRunningScreenTriggers.has(item.id)) {
                card.classList.remove('is-running');
              }
            }, 1400);
          });
        }

        // Event: Click title to edit
        const titleEl = card.querySelector('.ss-item-name');
        if (titleEl) {
          titleEl.addEventListener('click', (e) => {
            e.stopPropagation();
            editScreenTrigger(item);
          });
        }

        // Event: Edit item
        const btnEdit = card.querySelector('.btn-edit-ss');
        if (btnEdit) {
          btnEdit.addEventListener('click', (e) => {
            e.stopPropagation();
            editScreenTrigger(item);
          });
        }

        // Event: Toggle enabled/disabled
        const chk = card.querySelector('.ss-item-toggle');
        if (chk) {
          chk.addEventListener('change', (e) => {
            e.stopPropagation();
            item.enabled = chk.checked ? 1 : 0;
            card.classList.toggle('is-disabled', !chk.checked);
            saveCurrentProfileState();
            syncConfig();
            updateGlobalIndicators();
          });
        }

        // Event: Delete item
        const btnDel = card.querySelector('.btn-delete-ss');
        if (btnDel) {
          btnDel.addEventListener('click', (e) => {
            e.stopPropagation();
            if (ssEditingId === item.id) {
              cancelEditScreenTrigger();
            }
            activeScanningScreenTriggers.delete(item.id);
            activeRunningScreenTriggers.delete(item.id);
            const origIdx = items.findIndex(x => x.id === item.id);
            if (origIdx !== -1) {
              items.splice(origIdx, 1);
              saveCurrentProfileState();
              syncConfig();
              renderScreenScannerList();
              updateGlobalIndicators();
              showToast(`Deleted visual trigger: ${item.name}`);
            }
          });
        }

        listContainer.appendChild(card);
      });
    }

    let ssEditingId = null;

    function editScreenTrigger(item) {
      if (!item) return;
      ssEditingId = item.id;

      const nameInput = document.getElementById('ssInputName');
      if (nameInput) nameInput.value = item.name || '';

      const triggerInput = document.getElementById('ssInputTrigger');
      const ssBtnClearTrigger = document.getElementById('ssBtnClearTrigger');
      if (triggerInput) {
        triggerInput.value = item.trigger || '';
        if (ssBtnClearTrigger) {
          ssBtnClearTrigger.classList.toggle('hidden-field', !item.trigger);
        }
      }

      // Detection mode
      ssCurrentMode = item.mode || 'image';
      const modeSelector = document.getElementById('ssModeSelector');
      if (modeSelector) {
        modeSelector.querySelectorAll('.ac-pill-btn').forEach(btn => {
          btn.classList.toggle('active', btn.dataset.mode === ssCurrentMode);
        });
      }
      const secImage = document.getElementById('ssSectionImage');
      const secPixel = document.getElementById('ssSectionPixel');
      const secPoint = document.getElementById('ssSectionPoint');
      if (secImage) secImage.classList.toggle('hidden-field', ssCurrentMode !== 'image');
      if (secPixel) secPixel.classList.toggle('hidden-field', ssCurrentMode !== 'pixel');
      if (secPoint) secPoint.classList.toggle('hidden-field', ssCurrentMode !== 'point');

      // Image details
      const inputImagePath = document.getElementById('ssInputImagePath');
      if (inputImagePath) inputImagePath.value = item.imagePath || '';
      const sliderImageVar = document.getElementById('ssImageVariation');
      const badgeImageVar = document.getElementById('ssImageVariationVal');
      if (sliderImageVar) sliderImageVar.value = item.imageVariation || 30;
      if (badgeImageVar) badgeImageVar.textContent = item.imageVariation || 30;
      updateScreenScannerImagePreview(item.imagePath || '');

      // Pixel details
      const inputPixelColor = document.getElementById('ssInputPixelColor');
      const chipPixel = document.getElementById('ssPixelChip');
      const sliderPixelVar = document.getElementById('ssPixelVariation');
      const badgePixelVar = document.getElementById('ssPixelVariationVal');
      if (inputPixelColor) inputPixelColor.value = item.pixelColor || '#FF0000';
      if (chipPixel) chipPixel.style.background = item.pixelColor || '#FF0000';
      if (sliderPixelVar) sliderPixelVar.value = item.pixelVariation || 15;
      if (badgePixelVar) badgePixelVar.textContent = item.pixelVariation || 15;

      // Point details
      const pointX = document.getElementById('ssPointX');
      const pointY = document.getElementById('ssPointY');
      const inputPointColor = document.getElementById('ssInputPointColor');
      const chipPoint = document.getElementById('ssPointChip');
      if (pointX) pointX.value = item.pointX || 960;
      if (pointY) pointY.value = item.pointY || 540;
      if (inputPointColor) inputPointColor.value = item.pointColor || '#00FF00';
      if (chipPoint) chipPoint.style.background = item.pointColor || '#00FF00';

      // Region
      ssCurrentRegion = item.region || 'fullscreen';
      const regionSelector = document.getElementById('ssRegionSelector');
      if (regionSelector) {
        regionSelector.querySelectorAll('.ac-pill-btn').forEach(btn => {
          btn.classList.toggle('active', btn.dataset.reg === ssCurrentRegion);
        });
      }
      const customRegionBox = document.getElementById('ssCustomRegionBox');
      if (customRegionBox) {
        customRegionBox.classList.toggle('hidden-field', ssCurrentRegion !== 'custom');
      }
      if (item.regionBox) {
        const bX1 = document.getElementById('ssBoxX1');
        const bY1 = document.getElementById('ssBoxY1');
        const bX2 = document.getElementById('ssBoxX2');
        const bY2 = document.getElementById('ssBoxY2');
        if (bX1) bX1.value = item.regionBox.x1 || 0;
        if (bY1) bY1.value = item.regionBox.y1 || 0;
        if (bX2) bX2.value = item.regionBox.x2 || 1920;
        if (bY2) bY2.value = item.regionBox.y2 || 1080;
      }

      // Action
      ssCurrentAction = item.actionType || 'click';
      const actionSelector = document.getElementById('ssActionSelector');
      if (actionSelector) {
        actionSelector.querySelectorAll('.ac-pill-btn').forEach(btn => {
          btn.classList.toggle('active', btn.dataset.act === ssCurrentAction);
        });
      }
      const detailClick = document.getElementById('ssActionDetailClick');
      const detailMouseScript = document.getElementById('ssActionDetailMouseScript');
      const detailMacro = document.getElementById('ssActionDetailMacro');
      const detailAppLauncher = document.getElementById('ssActionDetailAppLauncher');
      const detailKey = document.getElementById('ssActionDetailKey');
      const detailSystem = document.getElementById('ssActionDetailSystem');
      if (detailClick) detailClick.classList.toggle('hidden-field', ssCurrentAction !== 'click');
      if (detailMouseScript) detailMouseScript.classList.toggle('hidden-field', ssCurrentAction !== 'mouseScript');
      if (detailMacro) detailMacro.classList.toggle('hidden-field', ssCurrentAction !== 'macro');
      if (detailAppLauncher) detailAppLauncher.classList.toggle('hidden-field', ssCurrentAction !== 'appLauncher');
      if (detailKey) detailKey.classList.toggle('hidden-field', ssCurrentAction !== 'key');
      if (detailSystem) detailSystem.classList.toggle('hidden-field', ssCurrentAction !== 'system');

      // Click details
      ssCurrentClickBtn = item.clickButton || 'Left';
      const clickBtnSelector = document.getElementById('ssClickBtnSelector');
      if (clickBtnSelector) {
        clickBtnSelector.querySelectorAll('.ac-pill-btn').forEach(btn => {
          btn.classList.toggle('active', btn.dataset.btn === ssCurrentClickBtn);
        });
      }
      const clickOffsetX = document.getElementById('ssClickOffsetX');
      const clickOffsetY = document.getElementById('ssClickOffsetY');
      if (clickOffsetX) clickOffsetX.value = item.clickOffsetX || 0;
      if (clickOffsetY) clickOffsetY.value = item.clickOffsetY || 0;

      // Sub-selects
      const selMouse = document.getElementById('ssSelectMouseScript');
      if (selMouse && item.mouseScriptId) selMouse.value = item.mouseScriptId;
      const selMacro = document.getElementById('ssSelectMacro');
      if (selMacro && item.macroId) selMacro.value = item.macroId;
      const selAppLauncher = document.getElementById('ssSelectAppLauncher');
      if (selAppLauncher && item.appLauncherId) selAppLauncher.value = item.appLauncherId;
      const inputKey = document.getElementById('ssInputKey');
      if (inputKey) inputKey.value = item.keyToSend || '';
      const selSys = document.getElementById('ssSelectSystemAction');
      if (selSys && item.systemAction) selSys.value = item.systemAction;

      // Scan rate
      ssScanRate = item.scanRate || 150;
      const scanRateSelector = document.getElementById('ssScanRateSelector');
      if (scanRateSelector) {
        scanRateSelector.querySelectorAll('.ac-pill-btn').forEach(btn => {
          btn.classList.toggle('active', parseInt(btn.dataset.rate, 10) === ssScanRate);
        });
      }

      // Condition
      ssCondition = item.condition || 'appear';
      const conditionSelector = document.getElementById('ssConditionSelector');
      if (conditionSelector) {
        conditionSelector.querySelectorAll('.ac-pill-btn').forEach(btn => {
          btn.classList.toggle('active', btn.dataset.cond === ssCondition);
        });
      }

      // Repeat rule
      ssRepeat = item.repeatRule || 'debounce';
      const repeatSelector = document.getElementById('ssRepeatSelector');
      if (repeatSelector) {
        repeatSelector.querySelectorAll('.ac-pill-btn').forEach(btn => {
          btn.classList.toggle('active', btn.dataset.rep === ssRepeat);
        });
      }

      // Debounce
      const debounceInput = document.getElementById('ssDebounceInput');
      if (debounceInput) debounceInput.value = ((item.debounceMs || 2000) / 1000).toFixed(1);

      // Alerts
      const optSound = document.getElementById('ssOptSound');
      if (optSound) optSound.checked = (item.soundAlert !== false && item.soundAlert !== 0);
      const optOsd = document.getElementById('ssOptOsd');
      if (optOsd) optOsd.checked = (item.osdAlert !== false && item.osdAlert !== 0);

      // Form button state
      const btnAddText = document.getElementById('ssBtnAddTriggerText');
      if (btnAddText) btnAddText.textContent = 'SAVE CHANGES';
      const btnCancel = document.getElementById('ssBtnCancelEdit');
      if (btnCancel) btnCancel.classList.remove('hidden-field');

      renderScreenScannerList();

      // Scroll to form
      const setupCard = document.querySelector('#panel-screenScanner .ac-setting-card');
      if (setupCard) setupCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (nameInput) nameInput.focus();
      showToast(`Editing visual trigger: ${item.name || 'Trigger'}`, 'info');
    }

    function cancelEditScreenTrigger() {
      ssEditingId = null;
      const nameInput = document.getElementById('ssInputName');
      if (nameInput) nameInput.value = '';
      const triggerInput = document.getElementById('ssInputTrigger');
      if (triggerInput) {
        triggerInput.value = '';
        triggerInput.placeholder = 'Shortcut (e.g. F9)...';
      }
      const ssBtnClearTrigger = document.getElementById('ssBtnClearTrigger');
      if (ssBtnClearTrigger) ssBtnClearTrigger.classList.add('hidden-field');

      const btnAddText = document.getElementById('ssBtnAddTriggerText');
      if (btnAddText) btnAddText.textContent = 'ADD VISUAL TRIGGER';
      const btnCancel = document.getElementById('ssBtnCancelEdit');
      if (btnCancel) btnCancel.classList.add('hidden-field');
    }

    function initScreenScanner() {
      // Master Start/Stop Scan Button
      const btnToggleMaster = document.getElementById('btnToggleScreenScannerMaster');
      if (btnToggleMaster && !btnToggleMaster.dataset.bound) {
        btnToggleMaster.dataset.bound = 'true';
        btnToggleMaster.addEventListener('click', () => {
          sendToAhk('toggleScreenScannerMaster');
        });
      }

      // 1. Master Toggle
      const masterSwitch = document.getElementById('ssMasterSwitch');
      if (masterSwitch) {
        masterSwitch.addEventListener('change', () => {
          if (!state.config.screenScanner) state.config.screenScanner = {};
          state.config.screenScanner.enabled = masterSwitch.checked ? 1 : 0;
          saveCurrentProfileState();
          syncConfig();
          showToast(masterSwitch.checked ? 'Screen Scanner Engine Enabled' : 'Screen Scanner Engine Suspended');
        });
      }

      // 2. Detection Mode Selector
      const modeSelector = document.getElementById('ssModeSelector');
      const secImage = document.getElementById('ssSectionImage');
      const secPixel = document.getElementById('ssSectionPixel');
      const secPoint = document.getElementById('ssSectionPoint');

      if (modeSelector) {
        modeSelector.querySelectorAll('.ac-pill-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            modeSelector.querySelectorAll('.ac-pill-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            ssCurrentMode = btn.dataset.mode || 'image';

            if (secImage) secImage.classList.toggle('hidden-field', ssCurrentMode !== 'image');
            if (secPixel) secPixel.classList.toggle('hidden-field', ssCurrentMode !== 'pixel');
            if (secPoint) secPoint.classList.toggle('hidden-field', ssCurrentMode !== 'point');
          });
        });
      }

      // 3. Image Mode Events
      const btnBrowseImage = document.getElementById('ssBtnBrowseImage');
      if (btnBrowseImage) {
        btnBrowseImage.addEventListener('click', () => {
          sendToAhk('browseImageForScanner');
        });
      }

      const btnSnipImage = document.getElementById('ssBtnSnipImage');
      if (btnSnipImage) {
        btnSnipImage.addEventListener('click', () => {
          sendToAhk('startScreenSnip');
          showToast('Click and drag on screen to crop template image...', 'info');
        });
      }

      const inputImagePath = document.getElementById('ssInputImagePath');
      if (inputImagePath) {
        inputImagePath.addEventListener('input', () => {
          updateScreenScannerImagePreview(inputImagePath.value);
        });
      }

      const sliderImageVar = document.getElementById('ssImageVariation');
      const badgeImageVar = document.getElementById('ssImageVariationVal');
      if (sliderImageVar && badgeImageVar) {
        sliderImageVar.addEventListener('input', () => {
          badgeImageVar.textContent = sliderImageVar.value;
        });
      }

      // 4. Pixel Mode Events
      const btnPickColor = document.getElementById('ssBtnPickColor');
      if (btnPickColor) {
        btnPickColor.addEventListener('click', () => {
          sendToAhk('pickScreenColorForScanner', { target: 'screenScannerPixel' });
          showToast('Move reticle over target pixel and click to capture color...', 'info');
        });
      }

      const inputPixelColor = document.getElementById('ssInputPixelColor');
      const chipPixel = document.getElementById('ssPixelChip');
      if (inputPixelColor && chipPixel) {
        inputPixelColor.addEventListener('input', () => {
          const col = inputPixelColor.value.trim();
          if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(col)) {
            chipPixel.style.background = col;
          }
        });
      }

      const sliderPixelVar = document.getElementById('ssPixelVariation');
      const badgePixelVar = document.getElementById('ssPixelVariationVal');
      if (sliderPixelVar && badgePixelVar) {
        sliderPixelVar.addEventListener('input', () => {
          badgePixelVar.textContent = sliderPixelVar.value;
        });
      }

      // 5. Point Watcher Mode Events
      const btnPickPoint = document.getElementById('ssBtnPickPoint');
      if (btnPickPoint) {
        btnPickPoint.addEventListener('click', () => {
          sendToAhk('pickScreenColorForScanner', { target: 'screenScannerPoint' });
          showToast('Click exact pixel on screen to capture position and color...', 'info');
        });
      }

      const inputPointColor = document.getElementById('ssInputPointColor');
      const chipPoint = document.getElementById('ssPointChip');
      if (inputPointColor && chipPoint) {
        inputPointColor.addEventListener('input', () => {
          const col = inputPointColor.value.trim();
          if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(col)) {
            chipPoint.style.background = col;
          }
        });
      }

      // 6. Region Selector
      const regionSelector = document.getElementById('ssRegionSelector');
      const customRegionBox = document.getElementById('ssCustomRegionBox');
      if (regionSelector) {
        regionSelector.querySelectorAll('.ac-pill-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            regionSelector.querySelectorAll('.ac-pill-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            ssCurrentRegion = btn.dataset.reg || 'fullscreen';
            if (customRegionBox) {
              customRegionBox.classList.toggle('hidden-field', ssCurrentRegion !== 'custom');
            }
          });
        });
      }

      const btnSelectArea = document.getElementById('ssBtnSelectArea');
      if (btnSelectArea) {
        btnSelectArea.addEventListener('click', () => {
          sendToAhk('startScreenRegionSelect');
          showToast('Click and drag on screen to define bounding box...', 'info');
        });
      }

      // 7. Action Selector
      const actionSelector = document.getElementById('ssActionSelector');
      const detailClick = document.getElementById('ssActionDetailClick');
      const detailMouseScript = document.getElementById('ssActionDetailMouseScript');
      const detailMacro = document.getElementById('ssActionDetailMacro');
      const detailAppLauncher = document.getElementById('ssActionDetailAppLauncher');
      const detailKey = document.getElementById('ssActionDetailKey');
      const detailSystem = document.getElementById('ssActionDetailSystem');

      if (actionSelector) {
        actionSelector.querySelectorAll('.ac-pill-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            actionSelector.querySelectorAll('.ac-pill-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            ssCurrentAction = btn.dataset.act || 'click';

            if (detailClick) detailClick.classList.toggle('hidden-field', ssCurrentAction !== 'click');
            if (detailMouseScript) detailMouseScript.classList.toggle('hidden-field', ssCurrentAction !== 'mouseScript');
            if (detailMacro) detailMacro.classList.toggle('hidden-field', ssCurrentAction !== 'macro');
            if (detailAppLauncher) detailAppLauncher.classList.toggle('hidden-field', ssCurrentAction !== 'appLauncher');
            if (detailKey) detailKey.classList.toggle('hidden-field', ssCurrentAction !== 'key');
            if (detailSystem) detailSystem.classList.toggle('hidden-field', ssCurrentAction !== 'system');
          });
        });
      }

      // 8. Click Button Selector
      const clickBtnSelector = document.getElementById('ssClickBtnSelector');
      if (clickBtnSelector) {
        clickBtnSelector.querySelectorAll('.ac-pill-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            clickBtnSelector.querySelectorAll('.ac-pill-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            ssCurrentClickBtn = btn.dataset.btn || 'Left';
          });
        });
      }

      // 9. Scan Rate Selector
      const scanRateSelector = document.getElementById('ssScanRateSelector');
      if (scanRateSelector) {
        scanRateSelector.querySelectorAll('.ac-pill-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            scanRateSelector.querySelectorAll('.ac-pill-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            ssScanRate = parseInt(btn.dataset.rate, 10) || 150;
            if (!state.config.screenScanner) state.config.screenScanner = {};
            state.config.screenScanner.scanRate = ssScanRate;
            saveCurrentProfileState();
            syncConfig();
          });
        });
      }

      // 10. Condition & Repeat Selectors
      const conditionSelector = document.getElementById('ssConditionSelector');
      if (conditionSelector) {
        conditionSelector.querySelectorAll('.ac-pill-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            conditionSelector.querySelectorAll('.ac-pill-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            ssCondition = btn.dataset.cond || 'appear';
          });
        });
      }

      const repeatSelector = document.getElementById('ssRepeatSelector');
      if (repeatSelector) {
        repeatSelector.querySelectorAll('.ac-pill-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            repeatSelector.querySelectorAll('.ac-pill-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            ssRepeat = btn.dataset.rep || 'debounce';
          });
        });
      }

      // 11. Search Filter
      const searchFilter = document.getElementById('ssSearchFilter');
      if (searchFilter) {
        searchFilter.addEventListener('input', () => {
          ssSearchQuery = searchFilter.value;
          renderScreenScannerList();
        });
      }

      // 11. Trigger Shortcut Box Recorder
      const ssTriggerBox = document.getElementById('ssTriggerBox');
      const ssInputTrigger = document.getElementById('ssInputTrigger');
      const ssBtnClearTrigger = document.getElementById('ssBtnClearTrigger');
      if (ssTriggerBox && ssInputTrigger) {
        setupKeyCombinationBox(ssTriggerBox, ssInputTrigger, ssBtnClearTrigger, null, () => {
          const btn = document.getElementById('ssBtnAddTrigger');
          if (btn) btn.click();
        });
      }

      // 12. Add Trigger Button
      const btnAddTrigger = document.getElementById('ssBtnAddTrigger');
      if (btnAddTrigger) {
        btnAddTrigger.addEventListener('click', () => {
          const nameInput = document.getElementById('ssInputName');
          const name = (nameInput && nameInput.value.trim()) ? nameInput.value.trim() : 'Screen Trigger';
          const triggerInput = document.getElementById('ssInputTrigger');
          const trigger = (triggerInput && triggerInput.value.trim()) ? triggerInput.value.trim() : '';

          // Collect parameters according to mode
          const imagePath = (document.getElementById('ssInputImagePath') || {}).value || '';
          const imageVariation = parseInt((document.getElementById('ssImageVariation') || {}).value, 10) || 30;

          const pixelColor = (document.getElementById('ssInputPixelColor') || {}).value || '#FF0000';
          const pixelVariation = parseInt((document.getElementById('ssPixelVariation') || {}).value, 10) || 15;

          const pointX = parseInt((document.getElementById('ssPointX') || {}).value, 10) || 960;
          const pointY = parseInt((document.getElementById('ssPointY') || {}).value, 10) || 540;
          const pointColor = (document.getElementById('ssInputPointColor') || {}).value || '#00FF00';

          if (ssCurrentMode === 'image' && (!imagePath || !imagePath.trim())) {
            showToast('Please select or snip a template image first!', 'warning');
            return;
          }

          const boxX1 = parseInt((document.getElementById('ssBoxX1') || {}).value, 10) || 0;
          const boxY1 = parseInt((document.getElementById('ssBoxY1') || {}).value, 10) || 0;
          const boxX2 = parseInt((document.getElementById('ssBoxX2') || {}).value, 10) || 1920;
          const boxY2 = parseInt((document.getElementById('ssBoxY2') || {}).value, 10) || 1080;

          const clickOffsetX = parseInt((document.getElementById('ssClickOffsetX') || {}).value, 10) || 0;
          const clickOffsetY = parseInt((document.getElementById('ssClickOffsetY') || {}).value, 10) || 0;
          const mouseScriptId = (document.getElementById('ssSelectMouseScript') || {}).value || '';
          const macroId = (document.getElementById('ssSelectMacro') || {}).value || '';
          const appLauncherId = (document.getElementById('ssSelectAppLauncher') || {}).value || '';
          const keyToSend = (document.getElementById('ssInputKey') || {}).value || '';
          const systemAction = (document.getElementById('ssSelectSystemAction') || {}).value || 'beep';

          const debounceSec = parseFloat((document.getElementById('ssDebounceInput') || {}).value) || 2.0;
          const optSound = document.getElementById('ssOptSound');
          const optOsd = document.getElementById('ssOptOsd');

          const newRule = {
            id: 'ss-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
            name: name,
            trigger: trigger,
            enabled: 1,
            mode: ssCurrentMode,
            imagePath: imagePath.trim(),
            imageVariation: imageVariation,
            imageTrans: '',
            pixelColor: pixelColor.trim(),
            pixelVariation: pixelVariation,
            pointX: pointX,
            pointY: pointY,
            pointColor: pointColor.trim(),
            region: ssCurrentRegion,
            regionBox: { x1: boxX1, y1: boxY1, x2: boxX2, y2: boxY2 },
            actionType: ssCurrentAction,
            clickButton: ssCurrentClickBtn,
            clickOffsetX: clickOffsetX,
            clickOffsetY: clickOffsetY,
            mouseScriptId: mouseScriptId,
            macroId: macroId,
            appLauncherId: appLauncherId,
            keyToSend: keyToSend.trim(),
            systemAction: systemAction,
            condition: ssCondition,
            repeatRule: ssRepeat,
            debounceMs: Math.round(debounceSec * 1000),
            soundAlert: optSound ? optSound.checked : true,
            osdAlert: optOsd ? optOsd.checked : true
          };

          if (ssEditingId && state.config.screenScanner && Array.isArray(state.config.screenScanner.items)) {
            const existing = state.config.screenScanner.items.find(x => x.id === ssEditingId);
            if (existing) {
              existing.name = name;
              existing.trigger = trigger;
              existing.mode = ssCurrentMode;
              existing.imagePath = imagePath.trim();
              existing.imageVariation = imageVariation;
              existing.pixelColor = pixelColor.trim();
              existing.pixelVariation = pixelVariation;
              existing.pointX = pointX;
              existing.pointY = pointY;
              existing.pointColor = pointColor.trim();
              existing.region = ssCurrentRegion;
              existing.regionBox = { x1: boxX1, y1: boxY1, x2: boxX2, y2: boxY2 };
              existing.actionType = ssCurrentAction;
              existing.clickButton = ssCurrentClickBtn;
              existing.clickOffsetX = clickOffsetX;
              existing.clickOffsetY = clickOffsetY;
              existing.mouseScriptId = mouseScriptId;
              existing.macroId = macroId;
              existing.appLauncherId = appLauncherId;
              existing.keyToSend = keyToSend.trim();
              existing.systemAction = systemAction;
              existing.condition = ssCondition;
              existing.repeatRule = ssRepeat;
              existing.debounceMs = Math.round(debounceSec * 1000);
              existing.soundAlert = optSound ? optSound.checked : true;
              existing.osdAlert = optOsd ? optOsd.checked : true;

              cancelEditScreenTrigger();
              saveCurrentProfileState();
              syncConfig();
              renderScreenScannerList();
              updateGlobalIndicators();
              showToast(`Visual Trigger "${name}" updated!`, 'success');
              return;
            }
          }

          if (!state.config.screenScanner) {
            state.config.screenScanner = { enabled: 1, scanRate: ssScanRate, items: [] };
          }
          if (!Array.isArray(state.config.screenScanner.items)) {
            state.config.screenScanner.items = [];
          }

          state.config.screenScanner.items.push(newRule);
          saveCurrentProfileState();
          syncConfig();
          renderScreenScannerList();
          updateGlobalIndicators();

          if (nameInput) nameInput.value = '';
          if (triggerInput) {
            triggerInput.value = '';
            triggerInput.placeholder = 'Shortcut (e.g. F9)...';
          }
          if (ssBtnClearTrigger) ssBtnClearTrigger.classList.add('hidden-field');
          showToast(`Visual Trigger "${name}" added! Press ${trigger || 'Start Scan'} to scan.`, 'success');
        });
      }

      // 13. Instant Test Scan Button
      const btnTestScan = document.getElementById('ssBtnTestScan');
      if (btnTestScan) {
        btnTestScan.addEventListener('click', () => {
          const imagePath = (document.getElementById('ssInputImagePath') || {}).value || '';
          const imageVariation = parseInt((document.getElementById('ssImageVariation') || {}).value, 10) || 30;
          const pixelColor = (document.getElementById('ssInputPixelColor') || {}).value || '#FF0000';
          const pixelVariation = parseInt((document.getElementById('ssPixelVariation') || {}).value, 10) || 15;
          const pointX = parseInt((document.getElementById('ssPointX') || {}).value, 10) || 960;
          const pointY = parseInt((document.getElementById('ssPointY') || {}).value, 10) || 540;
          const pointColor = (document.getElementById('ssInputPointColor') || {}).value || '#00FF00';

          const boxX1 = parseInt((document.getElementById('ssBoxX1') || {}).value, 10) || 0;
          const boxY1 = parseInt((document.getElementById('ssBoxY1') || {}).value, 10) || 0;
          const boxX2 = parseInt((document.getElementById('ssBoxX2') || {}).value, 10) || 1920;
          const boxY2 = parseInt((document.getElementById('ssBoxY2') || {}).value, 10) || 1080;

          const draftItem = {
            mode: ssCurrentMode,
            imagePath: imagePath.trim(),
            imageVariation: imageVariation,
            pixelColor: pixelColor.trim(),
            pixelVariation: pixelVariation,
            pointX: pointX,
            pointY: pointY,
            pointColor: pointColor.trim(),
            region: ssCurrentRegion,
            regionBox: { x1: boxX1, y1: boxY1, x2: boxX2, y2: boxY2 }
          };

          if (ssCurrentMode === 'image' && (!imagePath || !imagePath.trim())) {
            showToast('Select or snip a template image first to test!', 'warning');
            return;
          }

          btnTestScan.disabled = true;
          sendToAhk('testScreenScan', { item: draftItem });
          showToast('Scanning screen now...', 'info');
        });
      }

      // 13. Cancel Edit Button
      const btnCancelEdit = document.getElementById('ssBtnCancelEdit');
      if (btnCancelEdit) {
        btnCancelEdit.addEventListener('click', () => {
          cancelEditScreenTrigger();
          renderScreenScannerList();
          showToast('Editing cancelled', 'info');
        });
      }

      renderScreenScanner();
    }

    // ============================================================================
    // Master Engine Switch & Indicators
    // ============================================================================

