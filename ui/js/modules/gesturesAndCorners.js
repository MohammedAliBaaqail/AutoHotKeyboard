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

      // Corner Sensitive Zone Size Slider & Real Physical Monitor Previews
      const hcCornerSizeSlider = document.getElementById('hcCornerSizeSlider');
      const hcCornerSizeVal = document.getElementById('hcCornerSizeVal');

      if (hcCornerSizeSlider) {
        const size = mg.cornerSize || 14;
        hcCornerSizeSlider.value = size;
        if (hcCornerSizeVal) hcCornerSizeVal.textContent = `${size} px`;
        updateSliderProgress(hcCornerSizeSlider);

        if (!hcCornerSizeSlider.dataset.bound) {
          hcCornerSizeSlider.dataset.bound = 'true';
          let previewFadeTimer = null;

          hcCornerSizeSlider.addEventListener('input', () => {
            const val = parseInt(hcCornerSizeSlider.value, 10);
            if (hcCornerSizeVal) hcCornerSizeVal.textContent = `${val} px`;
            updateSliderProgress(hcCornerSizeSlider);

            // Real-time physical monitor overlay preview in the current theme color matching exact hit bounds
            sendToAhk('previewCornerZones', { size: val, show: true });

            clearTimeout(previewFadeTimer);
            previewFadeTimer = setTimeout(() => {
              sendToAhk('previewCornerZones', { show: false });
            }, 1800);
          });

          const finishCornerDrag = () => {
            const val = parseInt(hcCornerSizeSlider.value, 10);
            state.config.mouseGestures.cornerSize = val;
            updateSliderProgress(hcCornerSizeSlider);
            clearTimeout(previewFadeTimer);
            previewFadeTimer = setTimeout(() => {
              sendToAhk('previewCornerZones', { show: false });
            }, 1800);
            syncConfig();
          };

          hcCornerSizeSlider.addEventListener('change', finishCornerDrag);
          hcCornerSizeSlider.addEventListener('pointerup', finishCornerDrag);
          hcCornerSizeSlider.addEventListener('mouseup', finishCornerDrag);
          hcCornerSizeSlider.addEventListener('touchend', finishCornerDrag);
        }
      }

      // Monitor Mode Pills (All Displays vs Primary Display Only)
      const btnHcMonAll = document.getElementById('btnHcMonAll');
      const btnHcMonPrimary = document.getElementById('btnHcMonPrimary');
      const monMode = mg.monitorMode || 'all';

      function setHcMonitorMode(mode) {
        state.config.mouseGestures.monitorMode = mode;
        if (btnHcMonAll) btnHcMonAll.classList.toggle('active', mode === 'all');
        if (btnHcMonPrimary) btnHcMonPrimary.classList.toggle('active', mode === 'primary');
      }

      setHcMonitorMode(monMode);

      if (btnHcMonAll && !btnHcMonAll.dataset.bound) {
        btnHcMonAll.dataset.bound = 'true';
        btnHcMonAll.addEventListener('click', () => {
          setHcMonitorMode('all');
          syncConfig();
          const curSize = parseInt(hcCornerSizeSlider ? hcCornerSizeSlider.value : 14, 10);
          sendToAhk('previewCornerZones', { size: curSize, show: true });
        });
      }

      if (btnHcMonPrimary && !btnHcMonPrimary.dataset.bound) {
        btnHcMonPrimary.dataset.bound = 'true';
        btnHcMonPrimary.addEventListener('click', () => {
          setHcMonitorMode('primary');
          syncConfig();
          const curSize = parseInt(hcCornerSizeSlider ? hcCornerSizeSlider.value : 14, 10);
          sendToAhk('previewCornerZones', { size: curSize, show: true });
        });
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

