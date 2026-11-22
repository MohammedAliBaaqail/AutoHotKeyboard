    function setupAutoClickerHotkeyRecorder() {
      const bindBox = (boxEl, labelEl) => {
        if (!boxEl || boxEl.dataset.bound) return;
        boxEl.dataset.bound = 'true';

        boxEl.addEventListener('click', (e) => {
          e.stopPropagation();
          e.preventDefault();

          if (activeAcRecording) {
            stopAcRecording(true);
            return;
          }

          if (typeof stopActiveBadgeRecording === 'function') {
            stopActiveBadgeRecording(true);
          }

          const ac = (state.config && state.config.autoClicker) || {};
          const originalHk = (ac.hotkey && String(ac.hotkey).trim() !== '') ? String(ac.hotkey).trim() : 'F8';

          activeAcRecording = true;
          activeAcTargetBox = boxEl;
          boxEl.classList.add('is-recording');
          if (labelEl) labelEl.textContent = 'Press key...';

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
              if (labelEl) labelEl.textContent = parts.join(' + ') + ' + ...';
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

            if (!state.config.autoClicker) state.config.autoClicker = {};
            state.config.autoClicker.hotkey = ahkHk;

            cleanup(false);
            saveCurrentProfileState();
            syncConfig();
            updateAutoClickerUI();
            showToast(`Shortcut set to: ${formatKeyDisplay(ahkHk)}`);
          }

          function onKeyUp(evt) {
            if (pendingMod) {
              const combo = pendingMod;
              const ahkHk = comboToAhk(combo);
              if (!state.config.autoClicker) state.config.autoClicker = {};
              state.config.autoClicker.hotkey = ahkHk;
              cleanup(false);
              saveCurrentProfileState();
              syncConfig();
              updateAutoClickerUI();
              showToast(`Shortcut set to: ${formatKeyDisplay(ahkHk)}`);
              pendingMod = null;
            }
          }

          function onDocClick(evt) {
            if (!boxEl.contains(evt.target)) {
              cleanup(true);
            }
          }

          function cleanup(restore) {
            activeAcRecording = false;
            activeAcTargetBox = null;
            boxEl.classList.remove('is-recording');
            window.removeEventListener('keydown', onKeyDown, true);
            window.removeEventListener('keyup', onKeyUp, true);
            document.removeEventListener('click', onDocClick, true);
            boxEl._cancelAcRecording = null;
            if (restore) {
              const curAc = (state.config && state.config.autoClicker) || {};
              const curHk = curAc.hotkey || 'F8';
              if (labelEl) labelEl.textContent = formatKeyDisplay(curHk);
            }
          }

          boxEl._cancelAcRecording = cleanup;

          window.addEventListener('keydown', onKeyDown, true);
          window.addEventListener('keyup', onKeyUp, true);
          setTimeout(() => {
            document.addEventListener('click', onDocClick, true);
          }, 50);
        });
      };

      bindBox(acHotkeyBox, acHotkeyLabel);
      bindBox(mrHotkeyBox, mrHotkeyLabel);
    }

    function initAutoClicker() {
      // Master Switch listener
      if (acMasterSwitch && !acMasterSwitch.dataset.bound) {
        acMasterSwitch.dataset.bound = 'true';
        acMasterSwitch.addEventListener('change', () => {
          const isEnabled = acMasterSwitch.checked ? 1 : 0;
          if (!state.config.autoClicker) state.config.autoClicker = {};
          state.config.autoClicker.enabled = isEnabled;
          if (state.config.profiles && state.config.profiles[state.config.activeProfile]) {
            if (!state.config.profiles[state.config.activeProfile].autoClicker) {
              state.config.profiles[state.config.activeProfile].autoClicker = {};
            }
            state.config.profiles[state.config.activeProfile].autoClicker.enabled = isEnabled;
          }
          if (acContainer) acContainer.classList.toggle('is-disabled', !isEnabled);
          if (!isEnabled) {
            if (state.autoClickerRunning) sendToAhk('toggleAutoClicker');
            if (mouseRecordingActive) sendToAhk('stopMouseRecording');
            if (mousePlaybackActive) sendToAhk('stopMousePlayback');
          }
          saveCurrentProfileState();
          syncConfig();
          updateGlobalIndicators();
          updateAllFeatureProfileBadges();
          showToast(isEnabled ? 'Mouse Automation enabled' : 'Mouse Automation disabled');
        });
      }

      // Function Mode Switcher: Clicker vs Recorder
      if (mouseModeSelector && !mouseModeSelector.dataset.bound) {
        mouseModeSelector.dataset.bound = 'true';
        mouseModeSelector.querySelectorAll('.mouse-mode-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const mode = btn.dataset.mode;
            if (!state.config.autoClicker) state.config.autoClicker = {};
            state.config.autoClicker.mode = mode;
            saveCurrentProfileState();
            syncConfig();
            updateAutoClickerUI();
          });
        });
      }

      // Hotkey recorder
      setupAutoClickerHotkeyRecorder();

      // Button selector
      if (acButtonSelector && !acButtonSelector.dataset.bound) {
        acButtonSelector.dataset.bound = 'true';
        acButtonSelector.querySelectorAll('.ac-pill-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            acButtonSelector.querySelectorAll('.ac-pill-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (!state.config.autoClicker) state.config.autoClicker = {};
            state.config.autoClicker.button = btn.dataset.val;
            saveCurrentProfileState();
            syncConfig();
          });
        });
      }

      // Click Type selector
      if (acTypeSelector && !acTypeSelector.dataset.bound) {
        acTypeSelector.dataset.bound = 'true';
        acTypeSelector.querySelectorAll('.ac-pill-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            acTypeSelector.querySelectorAll('.ac-pill-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (!state.config.autoClicker) state.config.autoClicker = {};
            state.config.autoClicker.clickType = btn.dataset.val;
            saveCurrentProfileState();
            syncConfig();
          });
        });
      }

      // CPS slider
      if (acCpsSlider && !acCpsSlider.dataset.bound) {
        acCpsSlider.dataset.bound = 'true';
        acCpsSlider.addEventListener('input', () => {
          if (acCpsValue) acCpsValue.textContent = `${acCpsSlider.value} CPS`;
          updateSliderProgress(acCpsSlider);
        });
        acCpsSlider.addEventListener('change', () => {
          if (!state.config.autoClicker) state.config.autoClicker = {};
          state.config.autoClicker.cps = parseInt(acCpsSlider.value, 10);
          updateSliderProgress(acCpsSlider);
          saveCurrentProfileState();
          syncConfig();
        });
      }

      // Toggle Button
      if (acToggleBtn && !acToggleBtn.dataset.bound) {
        acToggleBtn.dataset.bound = 'true';
        acToggleBtn.addEventListener('click', () => {
          sendToAhk('toggleAutoClicker');
        });
      }

      // Technique Selector (Polling vs Hook)
      if (techniquePolling && !techniquePolling.dataset.bound) {
        techniquePolling.dataset.bound = 'true';
        techniquePolling.addEventListener('click', () => {
          if (!state.config.autoClicker) state.config.autoClicker = {};
          state.config.autoClicker.recordTechnique = 'polling';
          saveCurrentProfileState();
          syncConfig();
          updateAutoClickerUI();
          showToast('Capture technique: High-Frequency Polling (Timer)');
        });
      }

      if (techniqueHook && !techniqueHook.dataset.bound) {
        techniqueHook.dataset.bound = 'true';
        techniqueHook.addEventListener('click', () => {
          if (!state.config.autoClicker) state.config.autoClicker = {};
          state.config.autoClicker.recordTechnique = 'hook';
          saveCurrentProfileState();
          syncConfig();
          updateAutoClickerUI();
          showToast('Capture technique: Low-Level Windows Hook (WH_MOUSE_LL)');
        });
      }

      // Polling Rate Selector
      if (mrPollingRateSelector && !mrPollingRateSelector.dataset.bound) {
        mrPollingRateSelector.dataset.bound = 'true';
        mrPollingRateSelector.querySelectorAll('.ac-pill-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            if (!state.config.autoClicker) state.config.autoClicker = {};
            state.config.autoClicker.pollingRate = parseInt(btn.dataset.val, 10);
            saveCurrentProfileState();
            syncConfig();
            updateAutoClickerUI();
          });
        });
      }

      // Playback Speed Selector & Custom Input
      if (mrPlaybackSpeedSelector && !mrPlaybackSpeedSelector.dataset.bound) {
        mrPlaybackSpeedSelector.dataset.bound = 'true';
        mrPlaybackSpeedSelector.querySelectorAll('.ac-pill-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            if (!state.config.autoClicker) state.config.autoClicker = {};
            state.config.autoClicker.playbackSpeed = parseFloat(btn.dataset.val);
            saveCurrentProfileState();
            syncConfig();
            updateAutoClickerUI();
          });
        });
      }

      const mrPlaybackSpeedInput = document.getElementById('mrPlaybackSpeedInput');
      if (mrPlaybackSpeedInput && !mrPlaybackSpeedInput.dataset.bound) {
        mrPlaybackSpeedInput.dataset.bound = 'true';
        mrPlaybackSpeedInput.addEventListener('change', () => {
          let val = parseFloat(mrPlaybackSpeedInput.value);
          if (isNaN(val) || val <= 0) val = 1.0;
          if (val > 100.0) val = 100.0;
          mrPlaybackSpeedInput.value = val;
          if (!state.config.autoClicker) state.config.autoClicker = {};
          state.config.autoClicker.playbackSpeed = val;
          saveCurrentProfileState();
          syncConfig();
          updateAutoClickerUI();
        });
      }

      // Starting Point Selector (Original vs Relative)
      if (mrOriginSelector && !mrOriginSelector.dataset.bound) {
        mrOriginSelector.dataset.bound = 'true';
        mrOriginSelector.querySelectorAll('.ac-pill-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            if (!state.config.autoClicker) state.config.autoClicker = {};
            state.config.autoClicker.originMode = btn.dataset.val;
            saveCurrentProfileState();
            syncConfig();
            updateAutoClickerUI();
            showToast(btn.dataset.val === 'relative' ? 'Playback: Relative to current mouse position' : 'Playback: Original screen position');
          });
        });
      }

      // Infinite Loop Toggle
      if (mrRepeatInfinite && !mrRepeatInfinite.dataset.bound) {
        mrRepeatInfinite.dataset.bound = 'true';
        mrRepeatInfinite.addEventListener('change', () => {
          if (!state.config.autoClicker) state.config.autoClicker = {};
          state.config.autoClicker.playbackInfinite = mrRepeatInfinite.checked ? 1 : 0;
          state.config.autoClicker.playbackLoop = mrRepeatInfinite.checked ? 0 : (parseInt(mrRepeatCountInput.value, 10) || 1);
          saveCurrentProfileState();
          syncConfig();
          updateAutoClickerUI();
          showToast(mrRepeatInfinite.checked ? 'Looping set to: Infinite' : 'Looping set to: Repeat count');
        });
      }

      // Repeat Count Input
      if (mrRepeatCountInput && !mrRepeatCountInput.dataset.bound) {
        mrRepeatCountInput.dataset.bound = 'true';
        const onRepeatChange = () => {
          const val = Math.max(1, parseInt(mrRepeatCountInput.value, 10) || 1);
          mrRepeatCountInput.value = val;
          if (!state.config.autoClicker) state.config.autoClicker = {};
          state.config.autoClicker.playbackRepeatCount = val;
          if (!state.config.autoClicker.playbackInfinite) {
            state.config.autoClicker.playbackLoop = val;
          }
          saveCurrentProfileState();
          syncConfig();
        };
        mrRepeatCountInput.addEventListener('change', onRepeatChange);
        mrRepeatCountInput.addEventListener('blur', onRepeatChange);
      }

      // Advanced Modifiers Toggles
      [
        [mrOptClicksOnly, 'clicksOnly', 'Clicks-Only Warp'],
        [mrOptHumanize, 'humanize', 'Humanizer & Jitter'],
        [mrOptBezier, 'bezier', 'Bezier Smoothing'],
        [mrOptEmergencyStop, 'emergencyStop', 'Emergency Stop on Mouse Move'],
        [mrOptRecordKeys, 'recordKeys', 'Record Keyboard Keys']
      ].forEach(([el, prop, label]) => {
        if (el && !el.dataset.bound) {
          el.dataset.bound = 'true';
          el.addEventListener('change', () => {
            if (!state.config.autoClicker) state.config.autoClicker = {};
            state.config.autoClicker[prop] = el.checked ? 1 : 0;
            saveCurrentProfileState();
            syncConfig();
            showToast(`${label}: ${el.checked ? 'Enabled' : 'Disabled'}`);
          });
        }
      });

      // Countdown Selector (Playback)
      if (mrCountdownSelector && !mrCountdownSelector.dataset.bound) {
        mrCountdownSelector.dataset.bound = 'true';
        mrCountdownSelector.querySelectorAll('.ac-pill-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            if (!state.config.autoClicker) state.config.autoClicker = {};
            state.config.autoClicker.countdown = parseInt(btn.dataset.val, 10);
            saveCurrentProfileState();
            syncConfig();
            updateAutoClickerUI();
          });
        });
      }

      // Pre-Recording Countdown Timer Selector
      if (mrRecordCountdownSelector && !mrRecordCountdownSelector.dataset.bound) {
        mrRecordCountdownSelector.dataset.bound = 'true';
        mrRecordCountdownSelector.querySelectorAll('.ac-pill-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            if (!state.config.autoClicker) state.config.autoClicker = {};
            state.config.autoClicker.recordCountdown = parseInt(btn.dataset.val, 10) || 0;
            saveCurrentProfileState();
            syncConfig();
            updateAutoClickerUI();
            showToast(`Pre-recording timer set to: ${btn.textContent}`);
          });
        });
      }

      // Record Mouse Path Button
      if (mrRecordBtn && !mrRecordBtn.dataset.bound) {
        mrRecordBtn.dataset.bound = 'true';
        mrRecordBtn.addEventListener('click', () => {
          if (mouseRecordingActive || mouseCountdownActive) {
            sendToAhk('stopMouseRecording');
          } else {
            const ac = (state.config && state.config.autoClicker) || {};
            sendToAhk('startMouseRecording', {
              countdown: parseInt(ac.recordCountdown || 0, 10),
              technique: ac.recordTechnique || 'polling',
              rate: ac.pollingRate || 20,
              recordKeys: (ac.recordKeys !== undefined) ? Boolean(ac.recordKeys) : true
            });
          }
        });
      }

      // Playback Mouse Path Button
      if (mrPlayBtn && !mrPlayBtn.dataset.bound) {
        mrPlayBtn.dataset.bound = 'true';
        mrPlayBtn.addEventListener('click', () => {
          if (mousePlaybackActive) {
            sendToAhk('stopMousePlayback');
          } else {
            const ac = (state.config && state.config.autoClicker) || {};
            const events = Array.isArray(ac.recordedPath) ? ac.recordedPath : [];
            if (events.length === 0) {
              showToast('No recorded mouse path to play back');
              return;
            }
            const isInf = Boolean(ac.playbackInfinite);
            const loopCount = isInf ? 0 : Math.max(1, parseInt(ac.playbackRepeatCount || ac.playbackLoop, 10) || 1);
            sendToAhk('playRecordedMouse', {
              events: events,
              speed: ac.playbackSpeed || 1.0,
              loop: loopCount,
              origin: ac.originMode || 'absolute',
              clicksOnly: Boolean(ac.clicksOnly),
              humanize: Boolean(ac.humanize),
              bezier: Boolean(ac.bezier),
              emergencyStop: (ac.emergencyStop !== undefined) ? Boolean(ac.emergencyStop) : true,
              countdown: (ac.countdown !== undefined) ? parseInt(ac.countdown, 10) : 0
            });
          }
        });
      }

      // Global ESC key listener to stop mouse playback or recording immediately, or close edit modal
      if (!window.mrEscBound) {
        window.mrEscBound = true;
        window.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') {
            const mseModal = document.getElementById('mouseScriptEditModal');
            if (mseModal && !mseModal.classList.contains('hidden-field') && (!activeRecordingBadge || activeRecordingBadge.id !== 'mseHotkeyBadge')) {
              closeMouseScriptEditModal();
            }
            if (mousePlaybackActive) {
              sendToAhk('stopMousePlayback');
            }
            if (mouseRecordingActive) {
              sendToAhk('stopMouseRecording');
            }
          }
        });
      }

      // Clear Path Button
      if (mrClearBtn && !mrClearBtn.dataset.bound) {
        mrClearBtn.dataset.bound = 'true';
        mrClearBtn.addEventListener('click', () => {
          if (!state.config.autoClicker) state.config.autoClicker = {};
          state.config.autoClicker.recordedPath = [];
          saveCurrentProfileState();
          syncConfig();
          updateMouseRecorderStats();
          updateMouseRecorderUI();
          showToast('Recorded mouse path cleared');
        });
      }

      // Mouse Scripts Search Filter
      if (mrSearchFilter && !mrSearchFilter.dataset.bound) {
        mrSearchFilter.dataset.bound = 'true';
        mrSearchFilter.addEventListener('input', () => {
          renderMouseScriptsList();
        });
      }

      renderMouseScriptsList();
      updateAutoClickerUI();
    }

    function getNextMouseShortcut(existingItems = []) {
      if (!Array.isArray(existingItems)) return 'Ctrl + Alt + F1';

      const usedSlots = new Set();
      existingItems.forEach(it => {
        if (!it || !it.trigger) return;
        const trig = String(it.trigger).trim().toLowerCase();
        const m = trig.match(/f([1-9]|1[0-2])\b/i);
        if (m) {
          const num = parseInt(m[1], 10);
          if (num >= 1 && num <= 12) {
            usedSlots.add(num);
          }
        }
      });

      for (let i = 1; i <= 12; i++) {
        if (!usedSlots.has(i)) {
          return `Ctrl + Alt + F${i}`;
        }
      }

      return '';
    }

    function renderMouseScriptsList() {
      if (!mrListContainer) return;
      mrListContainer.innerHTML = '';

      if (!state.config.autoClicker) {
        state.config.autoClicker = { enabled: 1, items: [] };
      }
      if (!Array.isArray(state.config.autoClicker.items)) {
        state.config.autoClicker.items = [];
        // Auto-migrate legacy recordedPath into items[0]
        if (Array.isArray(state.config.autoClicker.recordedPath) && state.config.autoClicker.recordedPath.length > 0) {
          state.config.autoClicker.items.push({
            id: 'mr-' + Date.now(),
            name: 'Mouse Path 1',
            trigger: 'Ctrl + Alt + F1',
            triggerType: 'hotkey',
            enabled: 1,
            events: state.config.autoClicker.recordedPath,
            speed: state.config.autoClicker.playbackSpeed || 1.0,
            origin: state.config.autoClicker.originMode || 'absolute',
            loop: state.config.autoClicker.playbackLoop || 1,
            playbackInfinite: state.config.autoClicker.playbackInfinite || 0,
            clicksOnly: state.config.autoClicker.clicksOnly || 0,
            humanize: state.config.autoClicker.humanize || 0,
            bezier: state.config.autoClicker.bezier || 0,
            emergencyStop: (state.config.autoClicker.emergencyStop !== undefined) ? state.config.autoClicker.emergencyStop : 1,
            countdown: state.config.autoClicker.countdown || 0,
            createdAt: Date.now()
          });
          saveCurrentProfileState();
          syncConfig();
        }
      }

      const items = state.config.autoClicker.items;
      if (mrCountBadge) {
        mrCountBadge.textContent = items.length;
      }

      const filterText = mrSearchFilter ? mrSearchFilter.value.trim().toLowerCase() : '';
      const filteredItems = items.filter(it => {
        if (!filterText) return true;
        const name = (it.name || '').toLowerCase();
        const trig = (it.trigger || '').toLowerCase();
        return name.includes(filterText) || trig.includes(filterText);
      });

      if (items.length === 0) {
        mrListContainer.innerHTML = `
        <div class="empty-state">
          <span>No saved mouse scripts yet</span>
          <p>Record a mouse path above. Each recording is saved as a discrete script with sequential hotkeys (Ctrl + Alt + F1, F2...).</p>
        </div>
      `;
        return;
      }

      if (filteredItems.length === 0) {
        mrListContainer.innerHTML = `
        <div class="empty-state">
          <span>No matching mouse scripts</span>
          <p>Try clearing or changing your search query.</p>
        </div>
      `;
        return;
      }

      filteredItems.forEach((item) => {
        const isEnabled = (item.enabled !== false && item.enabled !== 0);
        const isPlaying = (mousePlaybackActive && mousePlaybackScriptId === item.id);

        let scannerRunName = '';
        for (const [sId, info] of activeRunningScreenTriggers.entries()) {
          if (info.action === 'mouseScript' && info.mouseScriptId === item.id) {
            scannerRunName = info.name || 'Screen Trigger';
            break;
          }
        }

        const card = document.createElement('div');
        card.className = `shortcut-card mr-card ${isEnabled ? '' : 'is-disabled'} ${isPlaying ? 'is-running' : ''}`;
        card.dataset.id = item.id;
        card.dataset.module = 'autoClicker';

        const events = Array.isArray(item.events) ? item.events : [];
        let ptCount = 0;
        let clickCount = 0;
        let keyCount = 0;
        let totalDelay = 0;
        for (const ev of events) {
          if (ev.type === 'move') ptCount++;
          else if (ev.type === 'click') {
            if (ev.action === 'Down' || ev.action === 'Click') clickCount++;
          } else if (ev.type === 'key') {
            if (ev.action === 'Down' || ev.action === 'Click') keyCount++;
          }
          totalDelay += (ev.delay || 0);
        }
        const durationStr = `${(totalDelay / 1000).toFixed(1)}s`;
        const isInf = Boolean(item.playbackInfinite);
        const loopCnt = isInf ? 'Infinite' : `${item.loop || 1}x`;
        const originLabel = item.origin === 'relative' ? 'Relative' : 'Original Pos';
        const displayTrig = item.trigger ? formatKeyDisplay(item.trigger) : 'None (Click to set)';
        const profileBadgesHtml = renderItemProfileBadges('autoClicker', item.id);

        let runningBadgeHtml = '';
        if (isPlaying) {
          if (scannerRunName) {
            runningBadgeHtml = `<span class="mr-meta-tag ss-running-tag" style="background:#ef4444;"><span class="ss-running-dot"></span> RUNNING (Screen Trigger: ${escapeHtml(scannerRunName)})</span>`;
          } else {
            runningBadgeHtml = `<span class="mr-meta-tag ss-running-tag" style="background:#10b981;"><span class="ss-running-dot"></span> PLAYING NOW</span>`;
          }
        }

        card.innerHTML = `
        <div class="mr-card-info">
          <div class="wm-icon-badge ${isPlaying ? 'is-playing' : ''} ${isEnabled ? '' : 'is-disabled'}" style="width:36px;height:36px;border-radius:var(--radius-btn);">
            <svg class="wm-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2a5 5 0 0 0-5 5v6a5 5 0 0 0 10 0V7a5 5 0 0 0-5-5z"></path>
              <line x1="12" y1="6" x2="12" y2="10"></line>
            </svg>
          </div>
          <div class="mr-card-text">
            <div class="mr-card-top">
              <span class="mr-title" title="Click to rename">${escapeHtml(item.name || 'Mouse Path')}</span>
              ${runningBadgeHtml}
              <span class="wm-hotkey-badge mr-hotkey-badge ${isEnabled ? '' : 'is-disabled'}" title="Click to change shortcut (Current: ${escapeHtml(displayTrig)})">${escapeHtml(displayTrig)}</span>
            </div>
            <div class="mr-card-meta">
              <span class="mr-meta-tag">${ptCount} pts</span>
              <span class="mr-meta-tag">${clickCount} clicks</span>
              <span class="mr-meta-tag mr-tag-keys" title="${keyCount} recorded keyboard keystrokes">${keyCount} keys</span>
              <span class="mr-meta-tag">${durationStr}</span>
              <span class="mr-meta-tag mr-tag-origin" title="Click to cycle origin (Original -> Relative -> Window)" style="cursor:pointer;">${originLabel}</span>
              <span class="mr-meta-tag mr-tag-speed" title="Click to cycle playback speed (0.5x, 1x, 2x, 5x, 10x, 25x, 50x, 100x)" style="cursor:pointer;">${item.speed || 1.0}x</span>
              <span class="mr-meta-tag mr-tag-loop" title="Click to cycle repeat count (1x, 2x, 3x, 5x, 10x, Infinite)" style="cursor:pointer;">${loopCnt}</span>
            </div>
          </div>
        </div>
        ${profileBadgesHtml}
        <div class="card-actions">
          <button class="card-btn btn-play-mr ${isPlaying ? 'running' : ''}" title="${isPlaying ? 'Stop Playback (Esc)' : 'Play This Script'}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:14px;height:14px;">
              ${isPlaying
            ? '<rect x="6" y="6" width="12" height="12" rx="2"></rect>'
            : '<polygon points="5 3 19 12 5 21 5 3"></polygon>'
          }
            </svg>
          </button>
          <button class="card-btn btn-edit-mr" title="Edit Script Settings">
            <svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button class="card-btn btn-delete-mr" title="Delete Script">
            <svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
          <div class="toggle-wrapper" title="Enable / Disable Script">
            <input class="toggle-checkbox mr-switch" type="checkbox" ${isEnabled ? 'checked' : ''}>
            <div class="toggle-container">
              <div class="toggle-button"></div>
            </div>
          </div>
        </div>
      `;

        // 1. Play Button
        const btnPlay = card.querySelector('.btn-play-mr');
        btnPlay.addEventListener('click', (e) => {
          e.stopPropagation();
          if (mousePlaybackActive && mousePlaybackScriptId === item.id) {
            sendToAhk('stopMousePlayback');
          } else {
            const loopCount = item.playbackInfinite ? 0 : Math.max(1, parseInt(item.loop, 10) || 1);
            sendToAhk('playRecordedMouse', {
              scriptId: item.id,
              events: item.events || [],
              speed: parseFloat(item.speed) || 1.0,
              loop: loopCount,
              origin: item.origin || 'absolute',
              clicksOnly: Boolean(item.clicksOnly),
              humanize: Boolean(item.humanize),
              bezier: Boolean(item.bezier),
              emergencyStop: (item.emergencyStop !== undefined) ? Boolean(item.emergencyStop) : true,
              countdown: (item.countdown !== undefined) ? parseInt(item.countdown, 10) : 0
            });
            showToast(`Playing "${item.name}" (${item.speed || 1.0}x)... Press ESC or hotkey to stop.`);
          }
        });

        // 2. Hotkey Badge inline recorder
        const hkBadge = card.querySelector('.mr-hotkey-badge');
        setupInlineMouseScriptHotkey(hkBadge, item);

        // 3. Rename on title click
        const titleEl = card.querySelector('.mr-title');
        titleEl.addEventListener('click', (e) => {
          e.stopPropagation();
          promptRenameMouseScript(item);
        });

        // 3b. Interactive Meta Badges: Speed, Origin, Loop
        const tagSpeed = card.querySelector('.mr-tag-speed');
        if (tagSpeed) {
          tagSpeed.addEventListener('click', (e) => {
            e.stopPropagation();
            const speeds = [0.5, 1.0, 2.0, 5.0, 10.0, 25.0, 50.0, 100.0];
            const cur = parseFloat(item.speed) || 1.0;
            let idx = speeds.indexOf(cur);
            if (idx === -1) idx = 1;
            const nextSpeed = speeds[(idx + 1) % speeds.length];
            item.speed = nextSpeed;
            saveCurrentProfileState();
            syncConfig();
            renderMouseScriptsList();
            showToast(`"${item.name}" speed set to ${nextSpeed}x`);
          });
        }

        const tagOrigin = card.querySelector('.mr-tag-origin');
        if (tagOrigin) {
          tagOrigin.addEventListener('click', (e) => {
            e.stopPropagation();
            const modes = ['absolute', 'relative', 'window'];
            const curMode = item.origin || 'absolute';
            const nextMode = modes[(modes.indexOf(curMode) + 1) % modes.length];
            item.origin = nextMode;
            saveCurrentProfileState();
            syncConfig();
            renderMouseScriptsList();
            const label = nextMode === 'relative' ? 'Relative to Mouse' : (nextMode === 'window' ? 'Active Window' : 'Original Screen Pos');
            showToast(`"${item.name}" origin: ${label}`);
          });
        }

        const tagLoop = card.querySelector('.mr-tag-loop');
        if (tagLoop) {
          tagLoop.addEventListener('click', (e) => {
            e.stopPropagation();
            if (item.playbackInfinite) {
              item.playbackInfinite = 0;
              item.loop = 1;
            } else if (item.loop === 1) {
              item.loop = 2;
            } else if (item.loop === 2) {
              item.loop = 3;
            } else if (item.loop === 3) {
              item.loop = 5;
            } else if (item.loop === 5) {
              item.loop = 10;
            } else if (item.loop === 10) {
              item.playbackInfinite = 1;
              item.loop = 1;
            } else {
              item.loop = 1;
              item.playbackInfinite = 0;
            }
            saveCurrentProfileState();
            syncConfig();
            renderMouseScriptsList();
            showToast(`"${item.name}" repeat: ${item.playbackInfinite ? 'Infinite' : item.loop + 'x'}`);
          });
        }

        // 4. Edit button
        const btnEdit = card.querySelector('.btn-edit-mr');
        btnEdit.addEventListener('click', (e) => {
          e.stopPropagation();
          editMouseScript(item);
        });

        // 5. Delete button
        const btnDelete = card.querySelector('.btn-delete-mr');
        btnDelete.addEventListener('click', (e) => {
          e.stopPropagation();
          deleteMouseScript(item.id);
        });

        // 6. Toggle switch
        const sw = card.querySelector('.mr-switch');
        const iconBadge = card.querySelector('.wm-icon-badge');
        sw.addEventListener('change', () => {
          const isChecked = sw.checked;
          onItemToggleStateChanged('autoClicker', item, isChecked);
          card.classList.toggle('is-disabled', !isChecked);
          if (hkBadge) hkBadge.classList.toggle('is-disabled', !isChecked);
          if (iconBadge) iconBadge.classList.toggle('is-disabled', !isChecked);
          saveCurrentProfileState();
          syncConfig();
          updateCardProfileBadges(card, 'autoClicker', item.id);
          updateGlobalIndicators();
          showToast(`"${item.name}" ${isChecked ? 'enabled' : 'disabled'}`);
        });

        // 7. Click card background to toggle switch
        card.addEventListener('click', (e) => {
          if (
            e.target.closest('.card-btn') ||
            e.target.closest('.toggle-wrapper') ||
            e.target.closest('.item-profiles-badges') ||
            e.target.closest('.item-profile-badge') ||
            e.target.closest('.mr-hotkey-badge') ||
            e.target.closest('.mr-title') ||
            e.target.closest('.mr-meta-tag')
          ) return;
          sw.checked = !sw.checked;
          sw.dispatchEvent(new Event('change'));
        });

        mrListContainer.appendChild(card);
      });
    }

    function setupInlineMouseScriptHotkey(badgeEl, item) {
      if (!badgeEl) return;

      badgeEl.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();

        if (activeRecordingBadge === badgeEl) {
          stopActiveBadgeRecording(true);
          return;
        }
        stopActiveBadgeRecording(true);

        const originalHk = item.trigger || '';
        activeRecordingBadge = badgeEl;
        badgeEl.classList.add('is-recording');
        badgeEl.textContent = 'Press keys...';
        badgeEl.title = 'Press shortcut keys, Backspace/Del to clear, or Esc to cancel';

        function onKeyDown(evt) {
          evt.preventDefault();
          evt.stopPropagation();

          if (evt.key === 'Escape') {
            cleanup(true);
            showToast('Shortcut change cancelled');
            return;
          }

          if (evt.key === 'Backspace' || evt.key === 'Delete') {
            item.trigger = '';
            saveCurrentProfileState();
            syncConfig();
            cleanup(false);
            badgeEl.textContent = 'None (Click to set)';
            badgeEl.title = 'Click to change shortcut (Current: None)';
            showToast(`Shortcut cleared for "${item.name}"`);
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
            badgeEl.textContent = parts.join(' + ') + ' + ...';
            return;
          }

          let key = evt.key;
          if (evt.code && evt.code.startsWith('Key')) {
            key = evt.code.slice(3).toUpperCase();
          } else if (evt.code && evt.code.startsWith('Digit')) {
            key = evt.code.slice(5);
          } else if (evt.code && evt.code.startsWith('Numpad')) {
            key = evt.code;
          } else if (evt.code && /^F([1-9]|1[0-2])$/i.test(evt.code)) {
            key = evt.code.toUpperCase();
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

          parts.push(key);
          const newShortcut = parts.join(' + ');
          item.trigger = newShortcut;
          saveCurrentProfileState();
          syncConfig();
          cleanup(false);
          badgeEl.textContent = formatKeyDisplay(newShortcut);
          badgeEl.title = `Click to change shortcut (Current: ${formatKeyDisplay(newShortcut)})`;
          showToast(`Shortcut set to ${formatKeyDisplay(newShortcut)} for "${item.name}"`);
        }

        function cleanup(revert) {
          window.removeEventListener('keydown', onKeyDown, true);
          badgeEl.classList.remove('is-recording');
          activeRecordingBadge = null;
          if (revert) {
            badgeEl.textContent = originalHk ? formatKeyDisplay(originalHk) : 'None (Click to set)';
            badgeEl.title = `Click to change shortcut (Current: ${originalHk ? formatKeyDisplay(originalHk) : 'None'})`;
          }
        }

        window.addEventListener('keydown', onKeyDown, true);
      });
    }

    function promptRenameMouseScript(item) {
      const newName = prompt('Enter a new name for this mouse script:', item.name || 'Mouse Path');
      if (newName !== null && newName.trim() !== '') {
        item.name = newName.trim();
        saveCurrentProfileState();
        syncConfig();
        renderMouseScriptsList();
        showToast(`Renamed script to "${item.name}"`);
      }
    }

    function deleteMouseScript(id) {
      if (!state.config.autoClicker) return;
      deleteItemAcrossProfiles('autoClicker', id);
      if (Array.isArray(state.config.autoClicker.items)) {
        state.config.autoClicker.items = state.config.autoClicker.items.filter(it => it.id !== id);
      }
      saveCurrentProfileState();
      syncConfig();
      renderMouseScriptsList();
      showToast('Mouse script deleted');
    }

    // ============================================================================
    // Mouse Path Script Options Modal
    // ============================================================================
    let activeEditingMouseScript = null;
    let activeEditingMouseScriptHk = '';
    let activeEditingSpeed = 1.0;
    let activeEditingOrigin = 'absolute';

    function openMouseScriptEditModal(item) {
      if (!item) return;
      activeEditingMouseScript = item;
      activeEditingMouseScriptHk = item.trigger || '';
      activeEditingSpeed = parseFloat(item.speed) || 1.0;
      activeEditingOrigin = item.origin || 'absolute';

      const modal = document.getElementById('mouseScriptEditModal');
      if (!modal) return;

      // Script Name
      const nameInput = document.getElementById('mseNameInput');
      if (nameInput) nameInput.value = item.name || 'Mouse Path';

      // Trigger Shortcut
      const hkBadge = document.getElementById('mseHotkeyBadge');
      if (hkBadge) {
        hkBadge.textContent = activeEditingMouseScriptHk ? formatKeyDisplay(activeEditingMouseScriptHk) : 'None (Click to set)';
        hkBadge.classList.remove('is-recording');
        hkBadge.title = `Click to record shortcut (Current: ${activeEditingMouseScriptHk ? formatKeyDisplay(activeEditingMouseScriptHk) : 'None'})`;
      }

      // Playback Speed
      const speedSel = document.getElementById('mseSpeedSelector');
      if (speedSel) {
        speedSel.querySelectorAll('.ac-pill-btn').forEach(btn => {
          btn.classList.toggle('active', parseFloat(btn.dataset.val) === activeEditingSpeed);
        });
      }
      const speedLabel = document.getElementById('mseSpeedLabel');
      if (speedLabel) speedLabel.textContent = `${activeEditingSpeed}x`;
      const speedInput = document.getElementById('mseSpeedInput');
      if (speedInput) speedInput.value = activeEditingSpeed;

      // Origin Starting Point
      const originSel = document.getElementById('mseOriginSelector');
      if (originSel) {
        originSel.querySelectorAll('.ac-pill-btn').forEach(btn => {
          btn.classList.toggle('active', btn.dataset.val === activeEditingOrigin);
        });
      }

      // Repeat Count & Infinite
      const isInf = Boolean(item.playbackInfinite);
      const loopVal = item.loop || 1;
      const chkInf = document.getElementById('mseRepeatInfinite');
      const repeatInput = document.getElementById('mseRepeatCountInput');
      if (chkInf) chkInf.checked = isInf;
      if (repeatInput) {
        repeatInput.value = isInf ? '' : loopVal;
        repeatInput.disabled = isInf;
      }

      // Countdown (Sec)
      const countInput = document.getElementById('mseCountdownInput');
      if (countInput) countInput.value = item.countdown || 0;

      // Advanced Options
      const chkClicksOnly = document.getElementById('mseOptClicksOnly');
      if (chkClicksOnly) chkClicksOnly.checked = Boolean(item.clicksOnly);

      const chkHumanize = document.getElementById('mseOptHumanize');
      if (chkHumanize) chkHumanize.checked = Boolean(item.humanize);

      const chkBezier = document.getElementById('mseOptBezier');
      if (chkBezier) chkBezier.checked = Boolean(item.bezier);

      const chkEmergencyStop = document.getElementById('mseOptEmergencyStop');
      if (chkEmergencyStop) chkEmergencyStop.checked = (item.emergencyStop !== undefined) ? Boolean(item.emergencyStop) : true;

      // Stats
      const events = Array.isArray(item.events) ? item.events : [];
      let ptCount = 0;
      let clickCount = 0;
      let keyCount = 0;
      let totalDelay = 0;
      for (const ev of events) {
        if (ev.type === 'move') ptCount++;
        else if (ev.type === 'click') {
          if (ev.action === 'Down' || ev.action === 'Click') clickCount++;
        } else if (ev.type === 'key') {
          if (ev.action === 'Down' || ev.action === 'Click') keyCount++;
        }
        totalDelay += (ev.delay || 0);
      }
      const statEvents = document.getElementById('mseStatEvents');
      if (statEvents) statEvents.textContent = `${ptCount} points, ${clickCount} clicks, ${keyCount} keys`;
      const statDuration = document.getElementById('mseStatDuration');
      if (statDuration) statDuration.textContent = `${(totalDelay / 1000).toFixed(1)}s recorded duration`;

      updateMseModalPlaybackState(mousePlaybackActive && mousePlaybackScriptId === item.id);

      modal.classList.remove('hidden-field');
      if (nameInput) {
        setTimeout(() => nameInput.focus(), 60);
      }
    }

    function closeMouseScriptEditModal() {
      const modal = document.getElementById('mouseScriptEditModal');
      if (modal) modal.classList.add('hidden-field');
      activeEditingMouseScript = null;
      if (activeRecordingBadge && activeRecordingBadge.id === 'mseHotkeyBadge') {
        stopActiveBadgeRecording(true);
      }
    }

    function saveMouseScriptEditModal() {
      if (!activeEditingMouseScript) return;
      const item = activeEditingMouseScript;

      const nameInput = document.getElementById('mseNameInput');
      if (nameInput && nameInput.value.trim()) {
        item.name = nameInput.value.trim();
      }

      const speedInput = document.getElementById('mseSpeedInput');
      if (speedInput && !isNaN(parseFloat(speedInput.value))) {
        const v = parseFloat(speedInput.value);
        if (v > 0) activeEditingSpeed = Math.min(100.0, v);
      }

      item.trigger = activeEditingMouseScriptHk;
      item.speed = activeEditingSpeed;
      item.origin = activeEditingOrigin;

      const chkInf = document.getElementById('mseRepeatInfinite');
      const repeatInput = document.getElementById('mseRepeatCountInput');
      item.playbackInfinite = (chkInf && chkInf.checked) ? 1 : 0;
      item.loop = item.playbackInfinite ? 1 : Math.max(1, parseInt(repeatInput && repeatInput.value, 10) || 1);

      const countInput = document.getElementById('mseCountdownInput');
      item.countdown = Math.max(0, parseInt(countInput && countInput.value, 10) || 0);

      const chkClicksOnly = document.getElementById('mseOptClicksOnly');
      item.clicksOnly = (chkClicksOnly && chkClicksOnly.checked) ? 1 : 0;

      const chkHumanize = document.getElementById('mseOptHumanize');
      item.humanize = (chkHumanize && chkHumanize.checked) ? 1 : 0;

      const chkBezier = document.getElementById('mseOptBezier');
      item.bezier = (chkBezier && chkBezier.checked) ? 1 : 0;

      const chkEmergencyStop = document.getElementById('mseOptEmergencyStop');
      item.emergencyStop = (chkEmergencyStop && chkEmergencyStop.checked) ? 1 : 0;

      saveCurrentProfileState();
      syncConfig();
      renderMouseScriptsList();
      closeMouseScriptEditModal();
      showToast(`Saved options for "${item.name}"`);
    }

    function testPlayEditingMouseScript() {
      if (!activeEditingMouseScript) return;
      if (mousePlaybackActive) {
        sendToAhk('stopMousePlayback');
        return;
      }
      const item = activeEditingMouseScript;
      const chkInf = document.getElementById('mseRepeatInfinite');
      const repeatInput = document.getElementById('mseRepeatCountInput');
      const isInf = chkInf && chkInf.checked;
      const loopCount = isInf ? 0 : Math.max(1, parseInt(repeatInput && repeatInput.value, 10) || 1);
      const countInput = document.getElementById('mseCountdownInput');
      const cd = Math.max(0, parseInt(countInput && countInput.value, 10) || 0);
      const chkClicksOnly = document.getElementById('mseOptClicksOnly');
      const chkHumanize = document.getElementById('mseOptHumanize');
      const chkBezier = document.getElementById('mseOptBezier');
      const chkEmergencyStop = document.getElementById('mseOptEmergencyStop');

      sendToAhk('playRecordedMouse', {
        scriptId: item.id,
        events: item.events || [],
        speed: activeEditingSpeed,
        loop: loopCount,
        origin: activeEditingOrigin,
        clicksOnly: Boolean(chkClicksOnly && chkClicksOnly.checked),
        humanize: Boolean(chkHumanize && chkHumanize.checked),
        bezier: Boolean(chkBezier && chkBezier.checked),
        emergencyStop: Boolean(chkEmergencyStop ? chkEmergencyStop.checked : true),
        countdown: cd
      });
      showToast(`Playing "${item.name}" (${activeEditingSpeed}x)... Press ESC to stop.`);
    }

    function updateMseModalPlaybackState(isPlaying) {
      const btnPlay = document.getElementById('mseBtnTestPlay');
      const btnText = document.getElementById('mseBtnTestPlayText');
      if (!btnPlay) return;
      btnPlay.classList.toggle('running', isPlaying);
      if (btnText) {
        btnText.textContent = isPlaying ? 'Stop (Esc)' : 'Test Play';
      }
    }

    function setupMseModalHandlers() {
      const modal = document.getElementById('mouseScriptEditModal');
      const btnClose = document.getElementById('btnCloseMseModal');
      const btnCancel = document.getElementById('btnCancelMseModal');
      const btnSave = document.getElementById('btnSaveMseModal');
      const btnTestPlay = document.getElementById('mseBtnTestPlay');
      const nameInput = document.getElementById('mseNameInput');

      if (modal && !modal.dataset.bound) {
        modal.dataset.bound = 'true';
        modal.addEventListener('click', (e) => {
          if (e.target === modal) closeMouseScriptEditModal();
        });
      }

      if (btnClose && !btnClose.dataset.bound) {
        btnClose.dataset.bound = 'true';
        btnClose.addEventListener('click', closeMouseScriptEditModal);
      }
      if (btnCancel && !btnCancel.dataset.bound) {
        btnCancel.dataset.bound = 'true';
        btnCancel.addEventListener('click', closeMouseScriptEditModal);
      }
      if (btnSave && !btnSave.dataset.bound) {
        btnSave.dataset.bound = 'true';
        btnSave.addEventListener('click', saveMouseScriptEditModal);
      }
      if (btnTestPlay && !btnTestPlay.dataset.bound) {
        btnTestPlay.dataset.bound = 'true';
        btnTestPlay.addEventListener('click', testPlayEditingMouseScript);
      }
      if (nameInput && !nameInput.dataset.bound) {
        nameInput.dataset.bound = 'true';
        nameInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') saveMouseScriptEditModal();
          else if (e.key === 'Escape') closeMouseScriptEditModal();
        });
      }

      // Hotkey recorder
      const badgeEl = document.getElementById('mseHotkeyBadge');
      const btnClearHk = document.getElementById('mseBtnClearHotkey');
      if (btnClearHk && !btnClearHk.dataset.bound) {
        btnClearHk.dataset.bound = 'true';
        btnClearHk.addEventListener('click', (e) => {
          e.stopPropagation();
          activeEditingMouseScriptHk = '';
          if (badgeEl) {
            badgeEl.textContent = 'None (Click to set)';
            badgeEl.title = 'Click to record new shortcut';
          }
        });
      }

      if (badgeEl && !badgeEl.dataset.bound) {
        badgeEl.dataset.bound = 'true';
        badgeEl.addEventListener('click', (e) => {
          e.stopPropagation();
          if (activeRecordingBadge === badgeEl) {
            stopActiveBadgeRecording(true);
            return;
          }
          stopActiveBadgeRecording(true);

          const originalHk = activeEditingMouseScriptHk;
          activeRecordingBadge = badgeEl;
          badgeEl.classList.add('is-recording');
          badgeEl.textContent = 'Press keys...';

          function onKeyDown(evt) {
            evt.preventDefault();
            evt.stopPropagation();

            if (evt.key === 'Escape') {
              cleanup(true);
              return;
            }

            if (evt.key === 'Backspace' || evt.key === 'Delete') {
              activeEditingMouseScriptHk = '';
              cleanup(false);
              badgeEl.textContent = 'None (Click to set)';
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
              badgeEl.textContent = parts.join(' + ') + ' + ...';
              return;
            }

            let key = evt.key;
            if (evt.code && evt.code.startsWith('Key')) {
              key = evt.code.slice(3).toUpperCase();
            } else if (evt.code && evt.code.startsWith('Digit')) {
              key = evt.code.slice(5);
            } else if (evt.code && evt.code.startsWith('Numpad')) {
              key = evt.code;
            } else if (evt.code && /^F([1-9]|1[0-2])$/i.test(evt.code)) {
              key = evt.code.toUpperCase();
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

            parts.push(key);
            activeEditingMouseScriptHk = parts.join(' + ');
            cleanup(false);
            badgeEl.textContent = formatKeyDisplay(activeEditingMouseScriptHk);
          }

          function cleanup(revert) {
            window.removeEventListener('keydown', onKeyDown, true);
            badgeEl.classList.remove('is-recording');
            activeRecordingBadge = null;
            if (revert) {
              badgeEl.textContent = originalHk ? formatKeyDisplay(originalHk) : 'None (Click to set)';
            }
          }

          window.addEventListener('keydown', onKeyDown, true);
        });
      }

      // Speed Pill selector & custom input
      const speedSel = document.getElementById('mseSpeedSelector');
      const speedLabel = document.getElementById('mseSpeedLabel');
      const speedInput = document.getElementById('mseSpeedInput');
      if (speedSel && !speedSel.dataset.bound) {
        speedSel.dataset.bound = 'true';
        speedSel.querySelectorAll('.ac-pill-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            activeEditingSpeed = parseFloat(btn.dataset.val) || 1.0;
            speedSel.querySelectorAll('.ac-pill-btn').forEach(b => b.classList.toggle('active', b === btn));
            if (speedLabel) speedLabel.textContent = `${activeEditingSpeed}x`;
            if (speedInput) speedInput.value = activeEditingSpeed;
          });
        });
      }

      if (speedInput && !speedInput.dataset.bound) {
        speedInput.dataset.bound = 'true';
        speedInput.addEventListener('change', () => {
          let val = parseFloat(speedInput.value);
          if (isNaN(val) || val <= 0) val = 1.0;
          if (val > 100.0) val = 100.0;
          speedInput.value = val;
          activeEditingSpeed = val;
          if (speedLabel) speedLabel.textContent = `${val}x`;
          if (speedSel) {
            speedSel.querySelectorAll('.ac-pill-btn').forEach(b => {
              b.classList.toggle('active', parseFloat(b.dataset.val) === val);
            });
          }
        });
      }

      // Origin Pill selector
      const originSel = document.getElementById('mseOriginSelector');
      if (originSel && !originSel.dataset.bound) {
        originSel.dataset.bound = 'true';
        originSel.querySelectorAll('.ac-pill-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            activeEditingOrigin = btn.dataset.val || 'absolute';
            originSel.querySelectorAll('.ac-pill-btn').forEach(b => b.classList.toggle('active', b === btn));
          });
        });
      }

      // Infinite checkbox toggle
      const chkInf = document.getElementById('mseRepeatInfinite');
      const repeatInput = document.getElementById('mseRepeatCountInput');
      if (chkInf && !chkInf.dataset.bound) {
        chkInf.dataset.bound = 'true';
        chkInf.addEventListener('change', () => {
          if (repeatInput) {
            repeatInput.disabled = chkInf.checked;
            if (chkInf.checked) repeatInput.value = '';
            else repeatInput.value = '1';
          }
        });
      }
    }

    function editMouseScript(item) {
      setupMseModalHandlers();
      openMouseScriptEditModal(item);
    }

    function updateAutoClickerUi(isRunning) {
      state.autoClickerRunning = isRunning;
      const ac = (state.config && state.config.autoClicker) || {};
      const hk = (ac.hotkey && String(ac.hotkey).trim() !== '') ? String(ac.hotkey).trim() : 'F8';
      const hkDisplay = formatKeyDisplay(hk);
      if (acToggleBtn) {
        acToggleBtn.classList.toggle('running', isRunning);
      }
      if (acToggleBtnText) {
        acToggleBtnText.textContent = isRunning ? `STOP (${hkDisplay})` : `START (${hkDisplay})`;
      }
      if (acStatusHint) {
        acStatusHint.textContent = isRunning
          ? `Auto-Clicker is RUNNING! Press ${hkDisplay} anywhere to STOP.`
          : `Ready - Press ${hkDisplay} anywhere in Windows to start or stop clicking.`;
      }

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

