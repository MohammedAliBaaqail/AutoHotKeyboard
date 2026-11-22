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
          onItemToggleStateChanged('appLauncher', item, isChecked);
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

