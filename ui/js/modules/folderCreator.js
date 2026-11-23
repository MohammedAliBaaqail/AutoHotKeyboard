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
        const isCombo = /[\+\^\!\#]|(\b(Ctrl|Alt|Shift|Win|Meta|CapsLock)\b)/i.test(item.trigger || '');
        const isHotkey = item.triggerType === 'hotkey' || isCombo;
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
          onItemToggleStateChanged('folderCreator', item, isChecked);
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
      if (['ctrl', 'alt', 'shift', 'win', 'meta', 'os'].includes(trig.toLowerCase())) {
        showToast('Please include a key with the modifier (e.g. Win + D)', 'warning');
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
        const isCombo = /[\+\^\!\#]|(\b(Ctrl|Alt|Shift|Win|Meta|CapsLock)\b)/i.test(trig);
        const triggerType = isCombo ? 'hotkey' : currentFcType;
        if (idx !== -1) {
          state.config.folderCreator.items[idx] = {
            ...state.config.folderCreator.items[idx],
            trigger: trig,
            triggerType: triggerType,
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
        const isCombo = /[\+\^\!\#]|(\b(Ctrl|Alt|Shift|Win|Meta|CapsLock)\b)/i.test(trig);
        const triggerType = isCombo ? 'hotkey' : currentFcType;
        const newFc = {
          id: 'fc-' + Date.now(),
          trigger: trig,
          triggerType: triggerType,
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
      const isCombo = item.triggerType === 'hotkey' || /[\+\^\!\#]|(\b(Ctrl|Alt|Shift|Win|Meta|CapsLock)\b)/i.test(item.trigger || '');
      setFcTriggerType(isCombo ? 'hotkey' : (item.triggerType || 'string'));
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

    let activeAcRecording = false;
    let activeAcTargetBox = null;

    function stopAcRecording(restore = true) {
      if (activeAcRecording && activeAcTargetBox && typeof activeAcTargetBox._cancelAcRecording === 'function') {
        activeAcTargetBox._cancelAcRecording(restore);
      }
    }

