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
          onItemToggleStateChanged('macroRecorder', item, isChecked);
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
    // Module 7: Screen Scanner & Visual Triggers
    // ============================================================================

    let ssCurrentMode = 'image';
    let ssCurrentRegion = 'fullscreen';
    let ssCurrentAction = 'click';
    let ssCurrentClickBtn = 'Left';
    let ssScanRate = 150;
    let ssCondition = 'appear';
    let ssRepeat = 'debounce';
    let ssSearchQuery = '';

    function updateScreenScannerImagePreview(path) {
      const box = document.getElementById('ssImagePreviewBox');
      if (!box) return;
      if (!path || !path.trim()) {
        box.innerHTML = '<span style="font-size:10px; color:var(--text-muted); text-align:center;">No Image</span>';
        return;
      }
      const cleanPath = path.trim().replace(/\\/g, '/');
      const safeUrl = 'file:///' + cleanPath;
      box.innerHTML = `<img src="${safeUrl}" style="max-width:100%; max-height:100%; object-fit:contain;" onerror="this.parentElement.innerHTML='<span style=\\'font-size:9px; color:var(--text-muted); text-align:center;\\'>Invalid Image</span>'" />`;
    }

    function populateScannerActionDropdowns() {
      // Populate Mouse Recording Scripts
      const selMouse = document.getElementById('ssSelectMouseScript');
      if (selMouse) {
        selMouse.innerHTML = '';
        const scripts = (state.config && state.config.autoClicker && Array.isArray(state.config.autoClicker.items))
          ? state.config.autoClicker.items
          : [];
        if (scripts.length === 0) {
          selMouse.innerHTML = '<option value="">No mouse recordings available (create one in Mouse Studio)</option>';
        } else {
          scripts.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.id;
            opt.textContent = `${s.name || 'Mouse Path'} (${s.trigger || 'No Hotkey'})`;
            selMouse.appendChild(opt);
          });
        }
      }

      // Populate Macros
      const selMacro = document.getElementById('ssSelectMacro');
      if (selMacro) {
        selMacro.innerHTML = '';
        const macros = (state.config && state.config.macroRecorder && Array.isArray(state.config.macroRecorder.items))
          ? state.config.macroRecorder.items
          : [];
        if (macros.length === 0) {
          selMacro.innerHTML = '<option value="">No macros available (record one in Macro Studio)</option>';
        } else {
          macros.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m.id;
            opt.textContent = `${m.name || 'Macro'} (${m.trigger || 'No Hotkey'})`;
            selMacro.appendChild(opt);
          });
        }
      }
    }

    function updateScreenScannerEngineStatus() {
      const hint = document.getElementById('ssEngineStatusHint');
      if (!hint) return;
      const isEnabled = (state.config && state.config.screenScanner && (state.config.screenScanner.enabled !== 0 && state.config.screenScanner.enabled !== false));
      if (!isEnabled) {
        hint.className = 'hint-tag';
        hint.textContent = 'Engine Suspended';
        return;
      }
      const ss = (state.config && state.config.screenScanner) || {};
      const hk = (ss.hotkey && String(ss.hotkey).trim() !== '') ? String(ss.hotkey).trim() : 'F9';
      const hkDisplay = formatKeyDisplay(hk);

      if (screenScannerRunning || (activeScanningScreenTriggers && activeScanningScreenTriggers.size > 0)) {
        const cnt = (activeScanningScreenTriggers && activeScanningScreenTriggers.size > 0) ? activeScanningScreenTriggers.size : 1;
        hint.className = 'hint-tag ss-active-engine-badge is-scanning';
        hint.style.color = '#ef4444';
        hint.innerHTML = `<span class="ss-running-dot" style="background:#ef4444;"></span> SCANNING ACTIVE (${cnt}) • Press ${escapeHtml(hkDisplay)} or Stop to halt`;
      } else if (activeRunningScreenTriggers && activeRunningScreenTriggers.size > 0) {
        const first = activeRunningScreenTriggers.values().next().value;
        hint.className = 'hint-tag ss-active-engine-badge';
        hint.style.color = 'var(--accent-primary)';
        hint.innerHTML = `<span class="ss-running-dot" style="background:var(--accent-primary);"></span> TRIGGERED: ${escapeHtml(first.name || 'Trigger')}`;
      } else {
        hint.className = 'hint-tag';
        hint.style.color = 'var(--text-muted)';
        hint.innerHTML = `<span>Ready (Press ${escapeHtml(hkDisplay)} or Start to Scan)</span>`;
      }
    }

    function updateScreenScannerMasterUI(isRunning) {
      screenScannerRunning = Boolean(isRunning);
      const ss = (state.config && state.config.screenScanner) || {};
      const hk = (ss.hotkey && String(ss.hotkey).trim() !== '') ? String(ss.hotkey).trim() : 'F9';
      const hkDisplay = formatKeyDisplay(hk);

      const hotkeyBox = document.getElementById('ssMasterHotkeyBox');
      const hotkeyLabel = document.getElementById('ssMasterHotkeyLabel');
      if (hotkeyLabel) hotkeyLabel.textContent = hkDisplay;
      if (hotkeyBox) hotkeyBox.title = `Click to record master shortcut (Current: ${hkDisplay})`;

      const btnToggle = document.getElementById('btnToggleScreenScannerMaster');
      const btnText = document.getElementById('ssMasterToggleBtnText');
      if (btnToggle) {
        btnToggle.classList.toggle('is-running', screenScannerRunning);
      }
      if (btnText) {
        btnText.textContent = screenScannerRunning ? `STOP SCAN (${hkDisplay})` : `START SCAN (${hkDisplay})`;
      }
      updateScreenScannerEngineStatus();
    }

