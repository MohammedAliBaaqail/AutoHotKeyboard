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
            card.classList.add('is-disabled');
            if (badge) badge.classList.add('is-disabled');
          }

          onItemToggleStateChanged('keyRemapper', item, isChecked);
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

        const isCaps = (typeof isCapsLockHeld !== 'undefined' ? isCapsLockHeld : false) || e.key === 'CapsLock';
        const isModifier = ['Control', 'Alt', 'Shift', 'Meta', 'OS', 'CapsLock'].includes(e.key);

        const parts = [];
        if (e.ctrlKey) parts.push('Ctrl');
        if (e.altKey) parts.push('Alt');
        if (e.shiftKey) parts.push('Shift');
        if (e.metaKey) parts.push('Win');
        if (isCaps && !parts.includes('CapsLock')) parts.push('CapsLock');

        // Standalone modifier press
        if (isModifier) {
          pendingModifier = e.key === 'Control' ? 'Ctrl' : (e.key === 'Shift' ? 'Shift' : (e.key === 'Alt' ? 'Alt' : (e.key === 'CapsLock' ? 'CapsLock' : 'Win')));
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

        if ((key === 'Unidentified' || !key) && e.keyCode) {
          if (e.keyCode >= 65 && e.keyCode <= 90) {
            key = String.fromCharCode(e.keyCode);
          } else if (e.keyCode >= 48 && e.keyCode <= 57) {
            key = String.fromCharCode(e.keyCode);
          } else if (e.keyCode >= 96 && e.keyCode <= 105) {
            key = 'Numpad' + (e.keyCode - 96);
          } else if (e.keyCode >= 112 && e.keyCode <= 123) {
            key = 'F' + (e.keyCode - 111);
          }
        }

        if (!key || key === 'Unidentified') {
          return;
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
      if (typeof stopAcRecording === 'function') {
        stopAcRecording(restore);
      }
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

          const isCaps = (typeof isCapsLockHeld !== 'undefined' ? isCapsLockHeld : false) || evt.key === 'CapsLock';
          const isModifier = ['Control', 'Alt', 'Shift', 'Meta', 'OS', 'CapsLock'].includes(evt.key);
          const parts = [];
          if (evt.ctrlKey) parts.push('Ctrl');
          if (evt.altKey) parts.push('Alt');
          if (evt.shiftKey) parts.push('Shift');
          if (evt.metaKey) parts.push('Win');
          if (isCaps && !parts.includes('CapsLock')) parts.push('CapsLock');

          if (isModifier) {
            pendingMod = (evt.key === 'Control') ? 'Ctrl' : ((evt.key === 'Shift') ? 'Shift' : ((evt.key === 'Alt') ? 'Alt' : ((evt.key === 'CapsLock') ? 'CapsLock' : 'Win')));
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

          if ((key === 'Unidentified' || !key) && evt.keyCode) {
            if (evt.keyCode >= 65 && evt.keyCode <= 90) {
              key = String.fromCharCode(evt.keyCode);
            } else if (evt.keyCode >= 48 && evt.keyCode <= 57) {
              key = String.fromCharCode(evt.keyCode);
            } else if (evt.keyCode >= 96 && evt.keyCode <= 105) {
              key = 'Numpad' + (evt.keyCode - 96);
            } else if (evt.keyCode >= 112 && evt.keyCode <= 123) {
              key = 'F' + (evt.keyCode - 111);
            }
          }

          if (!key || key === 'Unidentified') {
            return;
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

