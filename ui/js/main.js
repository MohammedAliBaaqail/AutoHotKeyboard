    function initListeners() {
      // Master Switch
      mainEngineSwitch.addEventListener('click', toggleMasterEngine);
      if (mainEngineSwitch) {
        mainEngineSwitch.addEventListener('click', toggleMasterEngine);
      }

      // Profile Management Listeners
      if (profileSelect) {
        profileSelect.addEventListener('change', (e) => {
          switchProfile(e.target.value);
        });
      }
      if (btnAddProfile) {
        btnAddProfile.addEventListener('click', () => {
          openProfileModal('add');
        });
      }
      const btnEditProfile = document.getElementById('btnEditProfile');
      if (btnEditProfile) {
        btnEditProfile.addEventListener('click', () => {
          openProfileModal('edit');
        });
      }
      const btnLockProfile = document.getElementById('btnLockProfile');
      if (btnLockProfile && !btnLockProfile.dataset.bound) {
        btnLockProfile.dataset.bound = 'true';
        btnLockProfile.addEventListener('click', () => {
          const isCurrentlyLocked = !!(state.config && (state.config.profileLocked === 1 || state.config.profileLocked === true));
          state.config.profileLocked = isCurrentlyLocked ? 0 : 1;
          updateProfileLockButton();
          const curProfile = (state.config && state.config.activeProfile) || 'Default';
          showToast(state.config.profileLocked ? `Profile "${curProfile}" Locked (Auto-switch suspended)` : `Profile "${curProfile}" Unlocked (Auto-switch active)`);
          syncConfig();
        });
      }
      const btnBlockSysKeys = document.getElementById('btnBlockSysKeys');
      if (btnBlockSysKeys && !btnBlockSysKeys.dataset.bound) {
        btnBlockSysKeys.dataset.bound = 'true';
        btnBlockSysKeys.addEventListener('click', () => {
          const curProfile = (state.config && state.config.activeProfile) || 'Default';
          const prof = (state.config && state.config.profiles && state.config.profiles[curProfile]) || {};
          const isCurrentlyBlocked = !!(prof.blockSystemKeys === 1 || prof.blockSystemKeys === true || (state.config && (state.config.blockSystemKeys === 1 || state.config.blockSystemKeys === true)));
          const newState = isCurrentlyBlocked ? 0 : 1;
          state.config.blockSystemKeys = newState;
          if (state.config.profiles && state.config.profiles[curProfile]) {
            state.config.profiles[curProfile].blockSystemKeys = newState;
          }
          if (typeof updateBlockSysKeysButton === 'function') updateBlockSysKeysButton();
          showToast(newState ? 'Key Presses Blocked: Windows Shortcuts (Win+D, etc.) suppressed' : 'Key Presses Allowed: Windows Shortcuts restored');
          syncConfig();
          sendToAhk('setBlockSystemKeys', { enabled: newState });
        });
      }
      if (btnRenameProfile) {
        btnRenameProfile.addEventListener('click', () => {
          openProfileModal('rename');
        });
      }
      if (btnDeleteProfile) {
        btnDeleteProfile.addEventListener('click', () => {
          openProfileModal('delete');
        });
      }
      const btnScrollProfilesLeft = document.getElementById('btnScrollProfilesLeft');
      const btnScrollProfilesRight = document.getElementById('btnScrollProfilesRight');
      const lgsProfilesTrack = document.getElementById('lgsProfilesTrack');
      const lgsCarouselWrap = document.querySelector('.lgs-carousel-wrap');

      if (btnScrollProfilesLeft && lgsProfilesTrack) {
        btnScrollProfilesLeft.addEventListener('click', () => {
          lgsProfilesTrack.scrollBy({ left: -220, behavior: 'smooth' });
          setTimeout(updateProfilesScrollButtons, 220);
        });
      }
      if (btnScrollProfilesRight && lgsProfilesTrack) {
        btnScrollProfilesRight.addEventListener('click', () => {
          lgsProfilesTrack.scrollBy({ left: 220, behavior: 'smooth' });
          setTimeout(updateProfilesScrollButtons, 220);
        });
      }
      if (lgsProfilesTrack) {
        lgsProfilesTrack.addEventListener('scroll', () => {
          updateProfilesScrollButtons();
        });

        const handleProfilesWheel = (e) => {
          if (e.deltaY) {
            e.preventDefault();
            lgsProfilesTrack.scrollLeft += e.deltaY;
            updateProfilesScrollButtons();
          }
        };
        lgsProfilesTrack.addEventListener('wheel', handleProfilesWheel, { passive: false });
        if (lgsCarouselWrap) {
          lgsCarouselWrap.addEventListener('wheel', handleProfilesWheel, { passive: false });
        }

        // Profiles Ribbon (Left-Mouse Hold & Drag Horizontal Scrolling)
        let isProfilesDragging = false;
        let profilesStartX = 0;
        let profilesScrollLeft = 0;

        const onProfilesMouseDown = (e) => {
          if (e.button !== 0) return; // Left mouse button only
          if (e.target.closest('.lgs-scroll-btn')) return; // Allow clicking scroll buttons

          // Only initiate drag if profiles track has scrollable overflow
          if (lgsProfilesTrack.scrollWidth <= lgsProfilesTrack.clientWidth + 2) return;

          isProfilesDragging = true;
          hasProfilesDragged = false;
          profilesStartX = e.pageX;
          profilesScrollLeft = lgsProfilesTrack.scrollLeft;
        };

        if (lgsCarouselWrap) {
          lgsCarouselWrap.addEventListener('mousedown', onProfilesMouseDown);
        } else {
          lgsProfilesTrack.addEventListener('mousedown', onProfilesMouseDown);
        }

        window.addEventListener('mousemove', (e) => {
          if (!isProfilesDragging) return;
          const walk = e.pageX - profilesStartX;
          if (Math.abs(walk) > 4) {
            if (!hasProfilesDragged) {
              hasProfilesDragged = true;
              lgsProfilesTrack.classList.add('is-dragging');
              if (lgsCarouselWrap) lgsCarouselWrap.classList.add('is-dragging');
            }
            lgsProfilesTrack.scrollLeft = profilesScrollLeft - walk;
            updateProfilesScrollButtons();
          }
        });

        const endProfilesDrag = () => {
          if (isProfilesDragging) {
            isProfilesDragging = false;
            lgsProfilesTrack.classList.remove('is-dragging');
            if (lgsCarouselWrap) lgsCarouselWrap.classList.remove('is-dragging');
            if (hasProfilesDragged) {
              setTimeout(() => {
                hasProfilesDragged = false;
              }, 80);
            }
          }
        };

        window.addEventListener('mouseup', endProfilesDrag);
        window.addEventListener('blur', endProfilesDrag);

        // Capture-phase click interceptor on carousel wrapper to guarantee no card switch upon releasing drag
        const interceptProfilesClick = (e) => {
          if (hasProfilesDragged) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
          }
        };
        if (lgsCarouselWrap) {
          lgsCarouselWrap.addEventListener('click', interceptProfilesClick, true);
        }
        lgsProfilesTrack.addEventListener('click', interceptProfilesClick, true);
      }
      const profileSearchInput = document.getElementById('profileSearchInput');
      if (profileSearchInput) {
        profileSearchInput.addEventListener('input', () => {
          renderProfilesRibbon();
        });
      }
      const btnBrowseProfileExe = document.getElementById('btnBrowseProfileExe');
      if (btnBrowseProfileExe) {
        btnBrowseProfileExe.addEventListener('click', () => {
          sendToAhk('browseProfileApp');
        });
      }
      const btnRescanRunningApps = document.getElementById('btnRescanRunningApps');
      if (btnRescanRunningApps) {
        btnRescanRunningApps.addEventListener('click', () => {
          const list = document.getElementById('runningAppsList');
          if (list) list.innerHTML = '<div class="apps-empty-state">Rescanning open windows...</div>';
          sendToAhk('getRunningApps');
        });
      }
      const runningAppsFilterInput = document.getElementById('runningAppsFilterInput');
      if (runningAppsFilterInput) {
        runningAppsFilterInput.addEventListener('input', () => {
          renderRunningAppsList();
        });
      }
      const profSwitchAutoSwitch = document.getElementById('profSwitchAutoSwitch');
      if (profSwitchAutoSwitch) {
        profSwitchAutoSwitch.addEventListener('change', () => {
          updateProfileTriggerModeUI(profSwitchAutoSwitch.checked ? modalLastActiveTrigger : 'off');
        });
      }
      const chipTriggerFocus = document.getElementById('chipTriggerFocus');
      if (chipTriggerFocus) {
        chipTriggerFocus.addEventListener('click', (e) => {
          e.stopPropagation();
          updateProfileTriggerModeUI('focus');
        });
      }
      const chipTriggerHover = document.getElementById('chipTriggerHover');
      if (chipTriggerHover) {
        chipTriggerHover.addEventListener('click', (e) => {
          e.stopPropagation();
          updateProfileTriggerModeUI('hover');
        });
      }
      if (btnConfirmProfileModal) {
        btnConfirmProfileModal.addEventListener('click', handleProfileModalConfirm);
      }
      if (btnCancelProfileModal) {
        btnCancelProfileModal.addEventListener('click', closeProfileModal);
      }
      if (btnCloseProfileModal) {
        btnCloseProfileModal.addEventListener('click', closeProfileModal);
      }
      if (profileNameInput) {
        profileNameInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') handleProfileModalConfirm();
          else if (e.key === 'Escape') closeProfileModal();
        });
      }

      // Tab Bar (Smooth Drag & Wheel Horizontal Scroll + Responsive Buttons)
      let isTabsDragging = false;
      let tabsStartX = 0;
      let tabsScrollLeft = 0;
      let hasTabsDragged = false;

      segmentedBar.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        isTabsDragging = true;
        hasTabsDragged = false;
        tabsStartX = e.pageX - segmentedBar.offsetLeft;
        tabsScrollLeft = segmentedBar.scrollLeft;
      });

      window.addEventListener('mousemove', (e) => {
        if (!isTabsDragging) return;
        const x = e.pageX - segmentedBar.offsetLeft;
        const walk = (x - tabsStartX);
        if (Math.abs(walk) > 4) {
          hasTabsDragged = true;
          segmentedBar.scrollLeft = tabsScrollLeft - walk;
          updateTabsScrollButtons();
        }
      });

      window.addEventListener('mouseup', () => {
        isTabsDragging = false;
      });

      segmentedBar.addEventListener('click', (e) => {
        if (hasTabsDragged) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        const btn = e.target.closest('.segment-btn');
        if (!btn) return;
        switchTab(btn.dataset.tab);
      });

      segmentedBar.addEventListener('scroll', () => {
        updateTabsScrollButtons();
      });

      const handleTabsWheel = (e) => {
        if (e.deltaY) {
          e.preventDefault();
          segmentedBar.scrollLeft += e.deltaY;
          updateTabsScrollButtons();
        }
      };
      segmentedBar.addEventListener('wheel', handleTabsWheel, { passive: false });

      const segmentedWrap = document.querySelector('.segmented-control-wrapper');
      if (segmentedWrap) {
        segmentedWrap.addEventListener('wheel', handleTabsWheel, { passive: false });
      }

      const btnScrollTabsLeft = document.getElementById('btnScrollTabsLeft');
      const btnScrollTabsRight = document.getElementById('btnScrollTabsRight');
      if (btnScrollTabsLeft) {
        btnScrollTabsLeft.addEventListener('click', () => {
          segmentedBar.scrollBy({ left: -220, behavior: 'smooth' });
          setTimeout(updateTabsScrollButtons, 220);
        });
      }
      if (btnScrollTabsRight) {
        btnScrollTabsRight.addEventListener('click', () => {
          segmentedBar.scrollBy({ left: 220, behavior: 'smooth' });
          setTimeout(updateTabsScrollButtons, 220);
        });
      }

      if (window.ResizeObserver) {
        const tabsObserver = new ResizeObserver(() => {
          updateTabsScrollButtons();
          updateProfilesScrollButtons();
        });
        tabsObserver.observe(segmentedBar);
        tabsObserver.observe(document.body);
      }

      window.addEventListener('resize', () => {
        updateSegmentedGlider(true);
        updateProfileGlider(true);
        updateProfilesScrollButtons();
        updateTabsScrollButtons();
      });

      // Text Expander Listeners
      teBtnSubmit.addEventListener('click', submitTextExpander);
      teToggleMultiline.addEventListener('click', () => toggleMultiline());
      teSearchFilter.addEventListener('input', renderTextExpander);

      // Global click delegate for switching profile when clicking a profile badge on any script card
      document.addEventListener('click', (e) => {
        const badge = e.target.closest('.item-profile-badge');
        if (badge && badge.dataset.switchProfile) {
          e.stopPropagation();
          e.preventDefault();
          const targetProfile = badge.dataset.switchProfile;
          if (state.config && state.config.activeProfile !== targetProfile) {
            switchProfile(targetProfile);
          }
        }
      }, true);

      teInputTrigger.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          if (state.isMultiline) teTextareaOutput.focus();
          else if (!teInputOutput.value.trim()) teInputOutput.focus();
          else submitTextExpander();
        }
      });

      teInputOutput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') submitTextExpander();
      });

      // Key Remapper Pure Key Combination Recorders
      krBtnSubmit.addEventListener('click', submitKeyRemapper);
      setupKeyCombinationBox(krSourceBox, krInputSource, krBtnClearSource, krTargetBox, submitKeyRemapper);
      setupKeyCombinationBox(krTargetBox, krInputTarget, krBtnClearTarget, null, submitKeyRemapper);

      // App Launcher Listeners
      if (alTypeString) {
        alTypeString.addEventListener('click', () => setAlTriggerType('string'));
      }
      if (alTypeHotkey) {
        alTypeHotkey.addEventListener('click', () => setAlTriggerType('hotkey'));
      }
      if (alBtnSubmit) {
        alBtnSubmit.addEventListener('click', submitAppLauncher);
      }
      if (alInputTrigger) {
        alInputTrigger.addEventListener('keydown', handleAlTriggerKeydown);
      }
      if (alBtnBrowse) {
        alBtnBrowse.addEventListener('click', (e) => {
          e.preventDefault();
          sendToAhk('browseApp');
        });
      }

      if (alOutputBox) {
        alOutputBox.addEventListener('dragover', (e) => {
          e.preventDefault();
          alOutputBox.style.boxShadow = 'var(--inset-deep), inset 0 0 0 1.5px var(--accent-primary)';
        });
        alOutputBox.addEventListener('dragleave', () => {
          alOutputBox.style.boxShadow = '';
        });
        alOutputBox.addEventListener('drop', (e) => {
          e.preventDefault();
          alOutputBox.style.boxShadow = '';
          if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            if (file.path) {
              alInputTarget.value = file.path;
              const nameNoExt = file.name.replace(/\.[^/.]+$/, '');
              if (!alInputName.value.trim()) {
                alInputName.value = nameNoExt;
              }
              alInputTarget.focus();
            }
          }
        });
      }

      if (alInputTarget) {
        alInputTarget.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') submitAppLauncher();
        });
      }

      if (alInputName) {
        alInputName.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') submitAppLauncher();
        });
      }

      // Window Dragging
      function handleDragStart(e) {
        if (
          e.target.closest('button') ||
          e.target.closest('#btnStats') ||
          e.target.closest('.squircle-btn') ||
          e.target.closest('input') ||
          e.target.closest('textarea') ||
          e.target.closest('select') ||
          e.target.closest('.resize-handle') ||
          e.target.closest('.shortcut-card') ||
          e.target.closest('.macro-step-chip') ||
          e.target.closest('.macro-timeline-track') ||
          e.target.closest('.macro-inject-btn') ||
          e.target.closest('[draggable="true"]') ||
          e.target.closest('#headerSleepCountdown') ||
          e.target.closest('.sleep-countdown-pill') ||
          e.target.closest('#mainEngineSwitch') ||
          e.target.closest('.vertical-rocker') ||
          e.target.closest('.lgs-profile-card') ||
          e.target.closest('.lgs-profiles-bar')
        ) return;
        sendToAhk('startDrag');
      }

      dragHeader.addEventListener('mousedown', handleDragStart);
      dragHeader.addEventListener('dblclick', (e) => {
        if (
          e.target.closest('#headerSleepCountdown') ||
          e.target.closest('.sleep-countdown-pill') ||
          e.target.closest('#mainEngineSwitch') ||
          e.target.closest('.vertical-rocker') ||
          e.target.closest('.lgs-profile-card') ||
          e.target.closest('.lgs-profiles-bar') ||
          e.target.closest('button') ||
          e.target.closest('input')
        ) return;
        sendToAhk('maximize');
      });
      appCard.addEventListener('mousedown', (e) => {
        if (
          e.target === appCard ||
          e.target.classList.contains('inputs-section') ||
          e.target.classList.contains('input-hints') ||
          e.target.classList.contains('list-section') ||
          e.target.classList.contains('modules-container')
        ) {
          handleDragStart(e);
        }
      });

      // Window Resizing via handles
      document.querySelectorAll('.resize-handle').forEach(handle => {
        handle.addEventListener('mousedown', (e) => {
          e.preventDefault();
          e.stopPropagation();
          sendToAhk('startResize', { dir: handle.dataset.direction });
        });
      });

      // Window Controls
      if (btnMinimize) btnMinimize.addEventListener('click', () => sendToAhk('minimize'));
      if (btnMaximize) btnMaximize.addEventListener('click', () => sendToAhk('maximize'));
      if (btnClose) btnClose.addEventListener('click', () => sendToAhk('close'));
      if (btnRefresh) btnRefresh.addEventListener('click', () => sendToAhk('reload'));
      if (btnExport) {
        btnExport.addEventListener('click', () => sendToAhk('openConfig'));
      }
      if (btnHelp) {
        btnHelp.addEventListener('click', () => {
          const modal = document.getElementById('infoModal');
          if (modal) modal.classList.remove('hidden-field');
        });
      }

      const btnCloseModal = document.getElementById('btnCloseModal');
      if (btnCloseModal) {
        btnCloseModal.addEventListener('click', () => {
          const modal = document.getElementById('infoModal');
          if (modal) modal.classList.add('hidden-field');
        });
      }

      const infoModal = document.getElementById('infoModal');
      if (infoModal) {
        infoModal.addEventListener('click', (e) => {
          if (e.target === infoModal) {
            infoModal.classList.add('hidden-field');
          }
        });
      }

      // Theme Settings Listeners
      if (btnTheme) {
        btnTheme.addEventListener('click', () => {
          if (themeModal) {
            const current = getCurrentThemeColors(false);
            if (themeBgColorPicker) themeBgColorPicker.value = current.bg;
            if (themeBgHex) themeBgHex.value = current.bg.toUpperCase();
            if (themeAccentColorPicker) themeAccentColorPicker.value = current.acc;
            if (themeAccentHex) themeAccentHex.value = current.acc.toUpperCase();

            if (themeSliderRadius) {
              themeSliderRadius.value = current.radius;
              updateSliderProgress(themeSliderRadius);
              if (badgeRadius) badgeRadius.textContent = `${current.radius}px`;
            }
            if (themeSliderDistance) {
              themeSliderDistance.value = current.distance;
              updateSliderProgress(themeSliderDistance);
              if (badgeDistance) badgeDistance.textContent = `${current.distance}px`;
            }
            if (themeSliderLightIntensity) {
              themeSliderLightIntensity.value = current.lightIntensity;
              updateSliderProgress(themeSliderLightIntensity);
              if (badgeLightIntensity) badgeLightIntensity.textContent = `${current.lightIntensity}%`;
            }
            if (themeSliderDarkIntensity) {
              themeSliderDarkIntensity.value = current.darkIntensity;
              updateSliderProgress(themeSliderDarkIntensity);
              if (badgeDarkIntensity) badgeDarkIntensity.textContent = `${current.darkIntensity}%`;
            }
            if (themeSliderBlur) {
              themeSliderBlur.value = current.blur;
              updateSliderProgress(themeSliderBlur);
              if (badgeBlur) badgeBlur.textContent = `${current.blur}px`;
            }

            renderCuratedPresets();
            updateActivePresetChips();
            renderCustomPresets();

            themeModal.classList.remove('hidden-field');
          }
        });
      }

      if (btnCloseThemeModal) {
        btnCloseThemeModal.addEventListener('click', () => {
          syncConfig();
          if (themeModal) themeModal.classList.add('hidden-field');
        });
      }

      const btnBackThemeModal = document.getElementById('btnBackThemeModal');
      if (btnBackThemeModal) {
        btnBackThemeModal.addEventListener('click', () => {
          syncConfig();
          if (themeModal) themeModal.classList.add('hidden-field');
        });
      }

      if (themeModal) {
        themeModal.addEventListener('click', (e) => {
          if (e.target === themeModal) {
            syncConfig();
            themeModal.classList.add('hidden-field');
          }
        });
      }

      // Active Items Count button click -> opens Active Scripts Overview Modal
      const btnStats = document.getElementById('btnStats');
      if (btnStats) {
        btnStats.addEventListener('click', () => {
          openActiveScriptsModal();
        });
      }

      const btnCloseActiveScriptsModal = document.getElementById('btnCloseActiveScriptsModal');
      if (btnCloseActiveScriptsModal) {
        btnCloseActiveScriptsModal.addEventListener('click', () => {
          closeActiveScriptsModal();
        });
      }

      const activeScriptsModal = document.getElementById('activeScriptsModal');
      if (activeScriptsModal) {
        activeScriptsModal.addEventListener('click', (e) => {
          if (e.target === activeScriptsModal) {
            closeActiveScriptsModal();
          }
        });
      }

      // Quick Sleep / Hibernate Countdown Header Cancel Button
      const btnHeaderCancelSleep = document.getElementById('btnHeaderCancelSleep');
      if (btnHeaderCancelSleep) {
        btnHeaderCancelSleep.addEventListener('click', (e) => {
          e.stopPropagation();
          sendToAhk('cancelSleepTimer');
          handleSleepTimerState({ active: false });
          showToast('Countdown cancelled', 'info');
        });
      }

      // Background Swatches - Auto-save immediately with curated preset parameters
      if (bgSwatchesGrid) {
        bgSwatchesGrid.addEventListener('click', (e) => {
          const chip = e.target.closest('.theme-swatch-chip');
          if (!chip) return;
          const presetKey = chip.dataset.preset;
          const preset = presetKey ? THEME_PRESETS[presetKey] : null;
          const current = getCurrentThemeColors(true);
          if (preset) {
            applyTheme(preset.bgColor, preset.accentColor || current.acc, true, {
              radius: preset.radius,
              distance: preset.distance,
              lightIntensity: preset.lightIntensity,
              darkIntensity: preset.darkIntensity,
              blur: preset.blur
            });
          } else if (chip.dataset.color) {
            applyTheme(chip.dataset.color, current.acc, true, getNeoSliderValues());
          }
          updateActivePresetChips();
        });
      }

      // Custom Background Color Picker & Hex Input with real-time bidirectional synchronization
      if (themeBgColorPicker) {
        themeBgColorPicker.addEventListener('input', (e) => {
          const color = e.target.value;
          if (themeBgHex) themeBgHex.value = color.toUpperCase();
          const current = getCurrentThemeColors(true);
          applyTheme(color, current.acc, false, getNeoSliderValues());
        });
        themeBgColorPicker.addEventListener('change', (e) => {
          const color = e.target.value;
          if (themeBgHex) themeBgHex.value = color.toUpperCase();
          const current = getCurrentThemeColors(true);
          applyTheme(color, current.acc, true, getNeoSliderValues());
        });
      }

      if (themeBgHex) {
        const handleBgHex = (save = false) => {
          let val = themeBgHex.value.trim();
          if (!val.startsWith('#') && val.length > 0) val = '#' + val;
          if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
            if (themeBgColorPicker) themeBgColorPicker.value = val;
            const current = getCurrentThemeColors(true);
            applyTheme(val, current.acc, save, getNeoSliderValues());
          }
        };
        themeBgHex.addEventListener('input', () => handleBgHex(false));
        themeBgHex.addEventListener('change', () => handleBgHex(true));
      }

      // Accent Swatches - Auto-save immediately
      if (accentSwatchesGrid) {
        accentSwatchesGrid.addEventListener('click', (e) => {
          const chip = e.target.closest('.theme-swatch-chip');
          if (!chip) return;
          const color = chip.dataset.color;
          const current = getCurrentThemeColors(true);
          applyTheme(current.bg, color, true, getNeoSliderValues());
        });
      }

      // Custom Accent Color Picker & Hex Input with real-time bidirectional synchronization
      if (themeAccentColorPicker) {
        themeAccentColorPicker.addEventListener('input', (e) => {
          const color = e.target.value;
          if (themeAccentHex) themeAccentHex.value = color.toUpperCase();
          const current = getCurrentThemeColors(true);
          applyTheme(current.bg, color, false, getNeoSliderValues());
        });
        themeAccentColorPicker.addEventListener('change', (e) => {
          const color = e.target.value;
          if (themeAccentHex) themeAccentHex.value = color.toUpperCase();
          const current = getCurrentThemeColors(true);
          applyTheme(current.bg, color, true, getNeoSliderValues());
        });
      }

      if (themeAccentHex) {
        const handleAccHex = (save = false) => {
          let val = themeAccentHex.value.trim();
          if (!val.startsWith('#') && val.length > 0) val = '#' + val;
          if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
            if (themeAccentColorPicker) themeAccentColorPicker.value = val;
            const current = getCurrentThemeColors(true);
            applyTheme(current.bg, val, save, getNeoSliderValues());
          }
        };
        themeAccentHex.addEventListener('input', () => handleAccHex(false));
        themeAccentHex.addEventListener('change', () => handleAccHex(true));
      }

      // Neumorphism Sliders Listeners (Live Preview on Input, Save on Change)
      if (themeSliderRadius) {
        themeSliderRadius.addEventListener('input', () => {
          const val = parseInt(themeSliderRadius.value, 10);
          if (badgeRadius) badgeRadius.textContent = `${val}px`;
          updateSliderProgress(themeSliderRadius);
          const current = getCurrentThemeColors(true);
          applyTheme(current.bg, current.acc, false, { ...getNeoSliderValues(), radius: val });
        });
        themeSliderRadius.addEventListener('change', () => {
          const current = getCurrentThemeColors(true);
          applyTheme(current.bg, current.acc, true, getNeoSliderValues());
        });
      }

      if (themeSliderDistance) {
        themeSliderDistance.addEventListener('input', () => {
          const val = parseInt(themeSliderDistance.value, 10);
          if (badgeDistance) badgeDistance.textContent = `${val}px`;
          updateSliderProgress(themeSliderDistance);
          const current = getCurrentThemeColors(true);
          applyTheme(current.bg, current.acc, false, { ...getNeoSliderValues(), distance: val });
        });
        themeSliderDistance.addEventListener('change', () => {
          const current = getCurrentThemeColors(true);
          applyTheme(current.bg, current.acc, true, getNeoSliderValues());
        });
      }

      if (themeSliderLightIntensity) {
        themeSliderLightIntensity.addEventListener('input', () => {
          const val = parseInt(themeSliderLightIntensity.value, 10);
          if (badgeLightIntensity) badgeLightIntensity.textContent = `${val}%`;
          updateSliderProgress(themeSliderLightIntensity);
          const current = getCurrentThemeColors(true);
          applyTheme(current.bg, current.acc, false, { ...getNeoSliderValues(), lightIntensity: val });
        });
        themeSliderLightIntensity.addEventListener('change', () => {
          const current = getCurrentThemeColors(true);
          applyTheme(current.bg, current.acc, true, getNeoSliderValues());
        });
      }

      if (themeSliderDarkIntensity) {
        themeSliderDarkIntensity.addEventListener('input', () => {
          const val = parseInt(themeSliderDarkIntensity.value, 10);
          if (badgeDarkIntensity) badgeDarkIntensity.textContent = `${val}%`;
          updateSliderProgress(themeSliderDarkIntensity);
          const current = getCurrentThemeColors(true);
          applyTheme(current.bg, current.acc, false, { ...getNeoSliderValues(), darkIntensity: val });
        });
        themeSliderDarkIntensity.addEventListener('change', () => {
          const current = getCurrentThemeColors(true);
          applyTheme(current.bg, current.acc, true, getNeoSliderValues());
        });
      }

      if (themeSliderBlur) {
        themeSliderBlur.addEventListener('input', () => {
          const val = parseInt(themeSliderBlur.value, 10);
          if (badgeBlur) badgeBlur.textContent = `${val}px`;
          updateSliderProgress(themeSliderBlur);
          const current = getCurrentThemeColors(true);
          applyTheme(current.bg, current.acc, false, { ...getNeoSliderValues(), blur: val });
      });
      themeSliderBlur.addEventListener('change', () => {
        const current = getCurrentThemeColors(true);
        applyTheme(current.bg, current.acc, true, getNeoSliderValues());
      });
    }

    const themeOsdModePills = document.getElementById('themeOsdModePills');
    if (themeOsdModePills && !themeOsdModePills.dataset.bound) {
      themeOsdModePills.dataset.bound = 'true';
      themeOsdModePills.addEventListener('click', (e) => {
        const btn = e.target.closest('.trigger-pill');
        if (!btn || !btn.dataset.mode) return;
        const mode = btn.dataset.mode;
        if (!state.config.theme) state.config.theme = {};
        state.config.theme.profileNotificationMode = mode;
        state.config.theme.osdIconOnly = (mode === 'icon' ? 1 : 0);
        updateThemeOsdModeUI(mode);
        syncConfig();
        if (mode !== 'off') {
          const curProf = (state.config && state.config.activeProfile) || 'Default';
          sendToAhk('showProfileOsd', { profile: curProf });
        }
      });
    }

    // Reset Theme to Default Preset (Warm Clay)
    if (btnResetTheme) {
      btnResetTheme.addEventListener('click', () => {
        const def = THEME_PRESETS['custom-default'] || THEME_PRESETS['soft-gray'];
        applyTheme(def.bgColor, def.accentColor, true, {
          radius: def.radius,
          distance: def.distance,
          lightIntensity: def.lightIntensity,
          darkIntensity: def.darkIntensity,
          blur: def.blur
        });
        showToast('Theme reset to default (Warm Clay)', 'info');
      });
    }

    // Save / Apply Theme (Fully fixes Apply & Save button)
    if (btnSaveTheme) {
      btnSaveTheme.addEventListener('click', () => {
        const current = getCurrentThemeColors(true);
        const sliders = getNeoSliderValues();

        // 1. Apply theme variables & persist
        applyTheme(current.bg, current.acc, true, sliders);

        // 2. Explicitly ensure state.config.theme has everything
        if (!state.config.theme) state.config.theme = {};
        state.config.theme.bgColor = current.bg;
        state.config.theme.accentColor = current.acc;
        state.config.theme.radius = sliders.radius;
        state.config.theme.distance = sliders.distance;
        state.config.theme.lightIntensity = sliders.lightIntensity;
        state.config.theme.darkIntensity = sliders.darkIntensity;
        state.config.theme.intensity = Math.round((sliders.lightIntensity + sliders.darkIntensity) / 2);
        state.config.theme.blur = sliders.blur;

        // 3. Persist to localStorage & AutoHotkey
        try {
          localStorage.setItem('ahk_theme', JSON.stringify({
            bgColor: current.bg,
            accentColor: current.acc,
            radius: sliders.radius,
            distance: sliders.distance,
            lightIntensity: sliders.lightIntensity,
            darkIntensity: sliders.darkIntensity,
            intensity: Math.round((sliders.lightIntensity + sliders.darkIntensity) / 2),
            blur: sliders.blur,
            customPresets: state.config.theme.customPresets || []
          }));
        } catch (e) { }

        syncConfig();

        // 4. Positive visual feedback
        showToast('Theme applied and saved successfully!', 'success');

        const btnSpan = btnSaveTheme.querySelector('span');
        const origText = btnSpan ? btnSpan.textContent : 'APPLY';
        if (btnSpan) btnSpan.textContent = 'SAVED!';
        btnSaveTheme.classList.add('btn-saved');

        setTimeout(() => {
          if (btnSpan) btnSpan.textContent = origText;
          btnSaveTheme.classList.remove('btn-saved');
          if (themeModal) themeModal.classList.add('hidden-field');
        }, 350);
      });
    }

    // Save Custom Theme Preset Listeners
    if (btnSaveCustomPreset) {
      btnSaveCustomPreset.addEventListener('click', saveCurrentCustomPreset);
    }
    if (inputCustomPresetName) {
      inputCustomPresetName.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          saveCurrentCustomPreset();
        }
      });
    }

    initMacroRecorder();
    initScreenScanner();
    initFolderCreator();
    initProfileContextMenu();
    initScriptContextMenu();

    // Global listener to ensure gesture, hot corner, and radial action dropdowns are immediately fresh when focused/clicked
    document.addEventListener('focusin', (e) => {
      const sel = e.target;
      if (sel && sel.tagName === 'SELECT' && (
        sel.classList.contains('mg-action-select') ||
        sel.classList.contains('rm-slice-select') ||
        sel.id.startsWith('hcSelect') ||
        sel.id === 'rmCenterActionSelect'
      )) {
        populateActionSelect(sel, sel.value);
      }
    });
  }

  function updateMaximizeButtonState(isMax) {
    const btn = document.getElementById('btnMaximize');
    const svg = document.getElementById('svgMaximizeIcon');
    if (!btn) return;
    btn.title = isMax ? 'Restore Window' : 'Maximize Window';
    document.body.classList.toggle('window-maximized', Boolean(isMax));
    if (svg) {
      if (isMax) {
        svg.innerHTML = `
          <rect x="7" y="3" width="13" height="13" rx="1.5" ry="1.5"></rect>
          <path d="M4 7h1v10a1.5 1.5 0 0 0 1.5 1.5H17v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z"></path>
        `;
      } else {
        svg.innerHTML = `<rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>`;
      }
    }
  }

  // Quick Sleep / Hibernate Live Countdown State Handler
  function handleSleepTimerState(msg) {
    const pill = document.getElementById('headerSleepCountdown');
    const modeEl = document.getElementById('headerSleepMode');
    const digitsEl = document.getElementById('headerSleepDigits');
    const iconEl = document.getElementById('headerSleepIcon');
    const cardBadge = document.getElementById('wmSleepStatusBadge');

    if (!pill) return;

    if (msg && (msg.active === 1 || msg.active === true)) {
      pill.classList.remove('hidden-field');
      const isHib = (msg.mode === 'Hibernate');
      if (modeEl) {
        modeEl.textContent = isHib ? 'HIBERNATE' : 'SLEEP';
      }
      if (iconEl) {
        if (isHib) {
          iconEl.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v10M18.4 6.6L12 12m-6.4-5.4L12 12m0 0v10m6.4-3.4L12 12m-6.4 3.4L12 12"></path></svg>`;
        } else {
          iconEl.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
        }
      }
      const sec = Math.max(0, parseInt(msg.secondsLeft, 10) || 0);
      const h = Math.floor(sec / 3600);
      const m = Math.floor((sec % 3600) / 60);
      const s = sec % 60;
      let timeStr = '';
      if (h > 0) {
        timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      } else {
        timeStr = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      }
      if (digitsEl) {
        digitsEl.textContent = timeStr;
      }
      if (cardBadge) {
        cardBadge.textContent = `${isHib ? 'Hibernate' : 'Sleep'} in ${timeStr} (Click to Cancel)`;
        cardBadge.style.color = 'var(--accent-primary)';
        cardBadge.style.cursor = 'pointer';
      }
    } else {
      pill.classList.add('hidden-field');
      if (cardBadge) {
        const isHibMode = (state.config && state.config.windowManager && (state.config.windowManager.sleepMode === 'hibernate' || state.config.windowManager.sleepModeHibernate));
        const timerVal = (state.config && state.config.windowManager && state.config.windowManager.sleepTimer) || 0;
        cardBadge.textContent = timerVal > 0 ? `${timerVal}m Timer Active` : (isHibMode ? 'Instant Hibernate' : 'Instant Sleep');
        cardBadge.style.color = 'var(--text-muted)';
        cardBadge.style.cursor = 'default';
      }
    }
  }

  let lastInterceptedKey = '';
  let lastInterceptedTime = 0;

  function handleSystemKeyIntercepted(combo) {
    const now = Date.now();
    if (combo === lastInterceptedKey && (now - lastInterceptedTime < 600)) {
      lastInterceptedTime = now;
      return;
    }
    lastInterceptedKey = combo;
    lastInterceptedTime = now;

    const activeEl = document.activeElement;
    if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
      if (activeEl.id === 'alInputTrigger' || activeEl.id === 'fcInputTrigger' || activeEl.id === 'ssInputTrigger' || activeEl.classList.contains('key-combo-input') || activeEl.dataset.recording === 'true') {
        activeEl.value = combo;
        activeEl.dispatchEvent(new Event('input', { bubbles: true }));
        activeEl.dispatchEvent(new Event('change', { bubbles: true }));
        const clearBtn = activeEl.parentElement ? activeEl.parentElement.querySelector('.btn-clear-input') : null;
        if (clearBtn) clearBtn.classList.remove('hidden-field');
        showToast(`Captured shortcut: ${combo}`);
        return;
      }
    }
    const recBadge = (typeof activeRecordingBadge !== 'undefined' && activeRecordingBadge) || document.querySelector('.wm-hotkey-badge.is-recording, .wm-sub-hotkey-tag.is-recording, .ac-hotkey-display.is-recording, .key-combo-box.is-recording');
    if (recBadge) {
      if (typeof recBadge._applyExternalShortcut === 'function') {
        recBadge._applyExternalShortcut(combo);
        return;
      }
      const input = recBadge.querySelector('input') || recBadge;
      if (input.tagName === 'INPUT') {
        input.value = combo;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      } else {
        recBadge.textContent = combo;
      }
      showToast(`Captured shortcut: ${combo}`);
      return;
    }
    showToast(`Prevented key press: ${combo} (System action suppressed)`, 'info');
  }

  // Handle IPC Messages from AHK
  function onAhkMessage(event) {
    try {
      const msg = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

      if (msg.type === 'systemKeyIntercepted') {
        const combo = msg.combo || `Win + ${msg.key}`;
        handleSystemKeyIntercepted(combo);
        return;
      }

      if (msg.type === 'sleepTimerState') {
        handleSleepTimerState(msg);
        return;
      }

      if (msg.type === 'windowStateChanged' || msg.action === 'windowStateChanged') {
        updateMaximizeButtonState(Boolean(msg.isMaximized));
        return;
      }

      if (msg.type === 'init' || msg.type === 'updateState') {
        if (typeof msg.isMaximized === 'boolean') {
          updateMaximizeButtonState(msg.isMaximized);
        }
        if (typeof msg.enabled === 'boolean') state.enabled = msg.enabled;
        if (msg.config) {
          state.config = msg.config;
          ensureProfilesConfig(state.config);
          if (msg.type === 'init') {
            state.activeTab = 'textExpander';
          } else if (msg.config.activeTab) {
            state.activeTab = msg.config.activeTab;
          }
          if (msg.config.theme && msg.config.theme.bgColor && msg.config.theme.accentColor) {
            applyTheme(
              msg.config.theme.bgColor,
              msg.config.theme.accentColor,
              false,
              {
                radius: msg.config.theme.radius,
                distance: msg.config.theme.distance,
                lightIntensity: msg.config.theme.lightIntensity,
                darkIntensity: msg.config.theme.darkIntensity,
                intensity: msg.config.theme.intensity,
                blur: msg.config.theme.blur
              }
            );
            renderCustomPresets();
            try {
              localStorage.setItem('ahk_theme', JSON.stringify({
                bgColor: msg.config.theme.bgColor,
                accentColor: msg.config.theme.accentColor,
                radius: msg.config.theme.radius,
                distance: msg.config.theme.distance,
                lightIntensity: msg.config.theme.lightIntensity,
                darkIntensity: msg.config.theme.darkIntensity,
                intensity: msg.config.theme.intensity,
                blur: msg.config.theme.blur,
                customPresets: msg.config.theme.customPresets || []
              }));
              if (Array.isArray(msg.config.theme.customPresets)) {
                localStorage.setItem('ahk_custom_theme_presets', JSON.stringify(msg.config.theme.customPresets));
              }
            } catch (e) { }
          }
        }
        if (typeof msg.autoClickerRunning === 'boolean') {
          updateAutoClickerUi(msg.autoClickerRunning);
        }
        isInitialized = true;
        renderAll(false);
      } else if (msg.type === 'runningAppsList') {
        renderRunningAppsList(msg.apps || []);
      } else if (msg.type === 'profileAppSelected') {
        const profInputExe = document.getElementById('profInputExe');
        if (profInputExe && msg.exe) {
          const cur = profInputExe.value.split(',').map(s => s.trim()).filter(Boolean);
          if (!cur.some(x => x.toLowerCase() === msg.exe.toLowerCase())) {
            cur.push(msg.exe);
            profInputExe.value = cur.join(', ');
          }
          if (profileModalMode === 'add' && profileNameInput && !profileNameInput.value.trim() && msg.name) {
            profileNameInput.value = msg.name.charAt(0).toUpperCase() + msg.name.slice(1);
          }
          renderRunningAppsList();
        }
      } else if (msg.type === 'profileAutoSwitched') {
        if (msg.activeProfile && state.config && state.config.profiles && state.config.profiles[msg.activeProfile]) {
          switchProfile(msg.activeProfile, false);
        }
      } else if (msg.type === 'autoClickerState') {
        updateAutoClickerUi(msg.running);
      } else if (msg.type === 'mouseCountdownState') {
        mouseCountdownActive = Boolean(msg.active);
        mouseCountdownSeconds = msg.seconds || 0;
        updateMouseRecorderUI();
      } else if (msg.type === 'mouseRecordingState') {
        mouseRecordingActive = Boolean(msg.recording);
        updateMouseRecorderUI();
      } else if (msg.type === 'mousePlaybackState') {
        mousePlaybackActive = Boolean(msg.playing);
        mousePlaybackScriptId = msg.scriptId || '';
        updateMouseRecorderUI();
        if (!mousePlaybackActive) {
          for (const [sId, info] of activeRunningScreenTriggers.entries()) {
            if (info.action === 'mouseScript') {
              if (info.timer) clearTimeout(info.timer);
              activeRunningScreenTriggers.delete(sId);
            }
          }
        }
        renderMouseScriptsList();
        renderScreenScannerList();
        updateScreenScannerEngineStatus();
        updateMseModalPlaybackState(mousePlaybackActive);
      } else if (msg.type === 'mouseRecordedPath') {
        mouseRecordingActive = false;
        if (!state.config.autoClicker) state.config.autoClicker = {};
        if (!Array.isArray(state.config.autoClicker.items)) state.config.autoClicker.items = [];
        const events = Array.isArray(msg.events) ? msg.events : [];
        if (events.length > 0) {
          const items = state.config.autoClicker.items;
          const nextHk = getNextMouseShortcut(items);
          const newScript = {
            id: 'mr-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
            name: `Mouse Path ${items.length + 1}`,
            trigger: nextHk,
            triggerType: 'hotkey',
            enabled: 1,
            events: events,
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
          };
          items.push(newScript);
          state.config.autoClicker.recordedPath = events;
          saveCurrentProfileState();
          syncConfig();
          renderMouseScriptsList();
          updateMouseRecorderStats(events);
          updateMouseRecorderUI();
          const trigDisplay = nextHk ? ` (${formatKeyDisplay(nextHk)})` : ' (No shortcut)';
          showToast(`Saved "${newScript.name}" with ${events.length} actions${trigDisplay}`);
        } else {
          updateMouseRecorderUI();
          showToast('Recording ended (no events captured)');
        }
      } else if (msg.type === 'appSelected') {
        if (msg.path && alInputTarget) {
          alInputTarget.value = msg.path;
          if (alInputName && (!alInputName.value.trim() || alInputName.value === 'Launch') && msg.name) {
            alInputName.value = msg.name;
          }
          alInputTarget.focus();
        }
      } else if (msg.type === 'folderSelected') {
        if (msg.path && fcInputCustomPath) {
          fcInputCustomPath.value = msg.path;
          fcInputCustomPath.focus();
        }
      } else if (msg.type === 'activeAppVolumeChanged') {
        if (msg.name) {
          activeAppState.name = msg.name;
          if (wmAppTargetBadge) {
            wmAppTargetBadge.textContent = `Active: ${msg.name}`;
          }
        }
        if (msg.pid) {
          activeAppState.pid = msg.pid;
        }
        if (typeof msg.volume === 'number') {
          if (msg.volume >= 0) {
            activeAppState.volume = msg.volume;
            if (wmAppVolumeSlider) {
              wmAppVolumeSlider.value = msg.volume;
              updateSliderProgress(wmAppVolumeSlider);
            }
            if (wmAppVolumeValue) {
              wmAppVolumeValue.textContent = `${msg.volume}%`;
            }
          } else if (msg.volume === -1 && wmAppVolumeValue) {
            wmAppVolumeValue.textContent = 'No Audio';
          }
        }
        if (typeof msg.muted !== 'undefined') {
          activeAppState.muted = Boolean(msg.muted);
          if (wmBtnMuteActiveAppText) {
            wmBtnMuteActiveAppText.textContent = activeAppState.muted ? 'Unmute App' : 'Mute App';
          }
          if (wmBtnMuteActiveApp) {
            wmBtnMuteActiveApp.classList.toggle('is-muted', activeAppState.muted);
          }
        }
      } else if (msg.type === 'macroStepRecorded') {
        if (macroState.isRecording) {
          const delay = macroState.useStandardDelays
            ? macroState.standardDelay
            : ((typeof msg.delay === 'number' && !isNaN(msg.delay)) ? msg.delay : 50);
          addMacroStep(msg.action, msg.key, delay);
        }
      } else if (msg.type === 'macroRecordingStopped') {
        if (macroState.isRecording) {
          stopMacroRecording();
        }
      } else if (msg.type === 'colorFormatChanged') {
        const sel = document.getElementById('wmSelectColorFormat');
        if (sel) sel.value = msg.format;
        if (state.config && state.config.windowManager) {
          state.config.windowManager.colorFormat = msg.format;
        }
        showToast(`Color format changed to ${msg.format}`, 'info');
      } else if (msg.type === 'colorPicked') {
        if (msg.target === 'screenScannerPixel') {
          const inp = document.getElementById('ssInputPixelColor');
          const chip = document.getElementById('ssPixelChip');
          if (inp) inp.value = msg.hex || msg.color;
          if (chip) chip.style.background = msg.hex || msg.color;
          showToast(`Screen Scanner Color Set: ${msg.hex || msg.color}`, 'success');
        } else if (msg.target === 'screenScannerPoint') {
          const ptX = document.getElementById('ssPointX');
          const ptY = document.getElementById('ssPointY');
          const ptCol = document.getElementById('ssInputPointColor');
          const chip = document.getElementById('ssPointChip');
          if (ptX && typeof msg.x === 'number') ptX.value = msg.x;
          if (ptY && typeof msg.y === 'number') ptY.value = msg.y;
          if (ptCol) ptCol.value = msg.hex || msg.color;
          if (chip) chip.style.background = msg.hex || msg.color;
          showToast(`Point Set: (${msg.x}, ${msg.y}) - ${msg.hex || msg.color}`, 'success');
        } else {
          showToast(`Color Picked & Copied: ${msg.color}`, 'success');
        }
      } else if (msg.type === 'screenScanTestResult') {
        const btn = document.getElementById('ssBtnTestScan');
        if (btn) btn.disabled = false;
        if (msg.id) {
          const card = document.querySelector(`.shortcut-card[data-id="${msg.id}"]`);
          if (card) {
            if (msg.found) {
              card.classList.add('is-match-success');
              setTimeout(() => card.classList.remove('is-match-success'), 2000);
            }
          }
        }
        if (msg.found) {
          showToast(`Match FOUND at (${msg.x}, ${msg.y}) in ${msg.elapsedMs}ms!`, 'success');
        } else {
          showToast(`No match found on screen (${msg.elapsedMs}ms). Check coordinates or tolerance.`, 'warning');
        }
      } else if (msg.type === 'screenScannerImageSelected') {
        const inp = document.getElementById('ssInputImagePath');
        if (inp) {
          inp.value = msg.path || '';
          updateScreenScannerImagePreview(msg.path);
        }
        showToast('Template image selected', 'success');
      } else if (msg.type === 'screenSnipSaved') {
        const inp = document.getElementById('ssInputImagePath');
        if (inp) {
          inp.value = msg.path || '';
          updateScreenScannerImagePreview(msg.path);
        }
        showToast(`Screen area snipped (${msg.width}x${msg.height})!`, 'success');
      } else if (msg.type === 'screenRegionSelected') {
        const bX1 = document.getElementById('ssBoxX1');
        const bY1 = document.getElementById('ssBoxY1');
        const bX2 = document.getElementById('ssBoxX2');
        const bY2 = document.getElementById('ssBoxY2');
        if (bX1) bX1.value = msg.x1;
        if (bY1) bY1.value = msg.y1;
        if (bX2) bX2.value = msg.x2;
        if (bY2) bY2.value = msg.y2;
        showToast(`Bounding Box: [${msg.x1}, ${msg.y1}] to [${msg.x2}, ${msg.y2}]`, 'info');
      } else if (msg.type === 'screenScannerTriggered') {
        const id = msg.id;
        const mouseScriptId = msg.mouseScriptId || '';
        const macroId = msg.macroId || '';
        const duration = msg.durationMs || 2500;

        if (id) {
          if (activeRunningScreenTriggers.has(id)) {
            const prev = activeRunningScreenTriggers.get(id);
            if (prev.timer) clearTimeout(prev.timer);
          }

          let timer = null;
          if (msg.action !== 'mouseScript') {
            timer = setTimeout(() => {
              activeRunningScreenTriggers.delete(id);
              renderScreenScannerList();
              renderMouseScriptsList();
              updateScreenScannerEngineStatus();
              updateGlobalIndicators();
            }, Math.min(Math.max(duration, 1500), 5000));
          }

          activeRunningScreenTriggers.set(id, {
            name: msg.name,
            action: msg.action,
            mouseScriptId: mouseScriptId,
            macroId: macroId,
            startTime: Date.now(),
            timer: timer
          });
        }

        renderScreenScannerList();
        renderMouseScriptsList();
        updateScreenScannerEngineStatus();
        updateGlobalIndicators();
        showToast(`Visual Trigger Running: ${msg.name || 'Screen Scanner'} (${msg.action})`, 'success');
      } else if (msg.type === 'screenScannerMasterState') {
        if (Array.isArray(msg.activeItemIds)) {
          activeScanningScreenTriggers = new Set(msg.activeItemIds);
        } else if (!msg.running) {
          activeScanningScreenTriggers.clear();
        }
        renderScreenScannerList();
        updateScreenScannerMasterUI(msg.running);
        updateGlobalIndicators();
      } else if (msg.type === 'screenScannerScanningStarted') {
        if (msg.id) activeScanningScreenTriggers.add(msg.id);
        renderScreenScannerList();
        updateScreenScannerEngineStatus();
        updateGlobalIndicators();
        showToast(`Scan Started: ${msg.name || 'Visual Trigger'} (${msg.repeatRule || 'Active'}) • Press shortcut to stop`, 'info');
      } else if (msg.type === 'screenScannerScanningStopped') {
        if (msg.id) activeScanningScreenTriggers.delete(msg.id);
        renderScreenScannerList();
        updateScreenScannerEngineStatus();
        updateGlobalIndicators();
        const reasonStr = (msg.reason === 'completedOnce') ? 'Completed & Finished (Once)' : 'Stopped';
        showToast(`Scan Stopped: ${msg.name || 'Visual Trigger'} (${reasonStr})`, 'info');
      } else if (msg.type === 'screenScannerItemDisabled') {
        if (state.config && state.config.screenScanner && Array.isArray(state.config.screenScanner.items)) {
          const itm = state.config.screenScanner.items.find(x => x.id === msg.id);
          if (itm) {
            itm.enabled = 0;
            renderScreenScannerList();
            updateGlobalIndicators();
          }
        }
      } else if (msg.type === 'moduleEvent') {
        if (msg.message) {
          showToast(msg.message, msg.isError ? 'error' : 'info');
        }
      }
    } catch (err) {
      console.error('Error handling AHK message:', err);
    }
  }

  // Resilient AHK Bridge Initializer with Polling & Queue Flushing
  function initAhkBridge() {
    function tryConnect() {
      if (window.chrome && window.chrome.webview) {
        if (!window.__ahkBridgeReady) {
          window.__ahkBridgeReady = true;
          window.chrome.webview.addEventListener('message', onAhkMessage);
          flushAhkQueue();
          sendToAhk('getInitialState');
        }
        return true;
      }
      return false;
    }

    if (!tryConnect()) {
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (tryConnect() || attempts > 60) {
          clearInterval(interval);
        }
      }, 50);
    }
  }

  function renderAll(shouldSync = false) {
    ensureProfilesConfig(state.config);
    if (state.config && state.config.theme) {
      applyTheme(
        state.config.theme.bgColor,
        state.config.theme.accentColor,
        false,
        {
          radius: state.config.theme.radius,
          distance: state.config.theme.distance,
          lightIntensity: state.config.theme.lightIntensity,
          darkIntensity: state.config.theme.darkIntensity,
          intensity: state.config.theme.intensity,
          blur: state.config.theme.blur
        }
      );
    }
    renderProfileSelect();
    updateSwitchUi();
    switchTab(state.activeTab || 'textExpander', shouldSync);
    renderTextExpander();
    renderKeyRemapper();
    initWindowManager();
    initMouseGestures();
    initRadialMenu();
    renderAppLauncher();
    renderFolderCreator();
    initAutoClicker();
    renderMacroRecorder();
    renderScreenScanner();
    updateGlobalIndicators();
    renderCuratedPresets();
    renderCustomPresets();
    updateAllFeatureProfileBadges();
  }

  // Startup
  try {
    initListeners();
  } catch (err) {
    console.error('initListeners startup error:', err);
  }
  try {
    renderAll(false);
  } catch (err) {
    console.error('renderAll startup error:', err);
  }
  requestAnimationFrame(() => {
    try {
      updateSegmentedGlider(true);
      updateProfileGlider(true);
      updateTabsScrollButtons();
      updateProfilesScrollButtons();
    } catch (err) {
      console.warn('glider layout error:', err);
    }
  });
  initAhkBridge();

