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

        const isCaps = (typeof isCapsLockHeld !== 'undefined' ? isCapsLockHeld : false) || e.key === 'CapsLock';
        const isModifier = ['Control', 'Alt', 'Shift', 'Meta', 'OS', 'CapsLock'].includes(e.key);
        const hasModifier = e.ctrlKey || e.altKey || e.metaKey || e.shiftKey || isCaps;
        const isSpecialKey = [
          'Escape', 'CapsLock', 'Space', 'Backspace', 'Delete', 'Insert',
          'Home', 'End', 'PageUp', 'PageDown', 'ArrowUp', 'ArrowDown',
          'ArrowLeft', 'ArrowRight', 'Tab', 'NumLock', 'ScrollLock', 'PrintScreen'
        ].includes(e.key) || /^F\d{1,2}$/i.test(e.key);

        if ((e.key === 'Backspace' || e.key === 'Delete') && !hasModifier) {
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
          if (isCaps && !parts.includes('CapsLock')) parts.push('CapsLock');

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

          alInputTrigger.value = parts.join(' + ');
        }
      } else {
        if (e.key === 'Enter') {
          if (!alInputTarget.value.trim()) alInputTarget.focus();
          else submitAppLauncher();
        }
      }
    }

