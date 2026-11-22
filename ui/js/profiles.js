  // Profile Management System
  // ============================================================================

  function ensureProfilesConfig(cfg) {
    if (!cfg) return;
    if (!cfg.profiles || typeof cfg.profiles !== 'object') {
      cfg.profiles = {};
    }
    // If cfg.profiles is an Array, convert to an object map keyed by profile name
    if (Array.isArray(cfg.profiles)) {
      const converted = {};
      cfg.profiles.forEach(p => {
        if (!p) return;
        const name = p.name || p.id || 'Default';
        converted[name] = p;
      });
      cfg.profiles = converted;
    }
    if (!cfg.activeProfile || typeof cfg.activeProfile !== 'string' || !cfg.profiles[cfg.activeProfile]) {
      const keys = Object.keys(cfg.profiles);
      if (keys.length > 0 && keys.includes('Default')) {
        cfg.activeProfile = 'Default';
      } else if (keys.length > 0) {
        cfg.activeProfile = keys[0];
      } else {
        cfg.activeProfile = 'Default';
      }
    }
    if (!cfg.profiles['Default']) {
      cfg.profiles['Default'] = {
        name: 'Default',
        textExpander: JSON.parse(JSON.stringify(cfg.textExpander || { enabled: 1, items: [] })),
        keyRemapper: JSON.parse(JSON.stringify(cfg.keyRemapper || { enabled: 1, items: [] })),
        appLauncher: JSON.parse(JSON.stringify(cfg.appLauncher || { enabled: 1, items: [] })),
        folderCreator: JSON.parse(JSON.stringify(cfg.folderCreator || { enabled: 1, items: [] })),
        macroRecorder: JSON.parse(JSON.stringify(cfg.macroRecorder || { enabled: 1, items: [] })),
        windowManager: JSON.parse(JSON.stringify(cfg.windowManager || {})),
        mouseGestures: JSON.parse(JSON.stringify(cfg.mouseGestures || {})),
        radialMenu: JSON.parse(JSON.stringify(cfg.radialMenu || {})),
        autoClicker: JSON.parse(JSON.stringify(cfg.autoClicker || {})),
        screenScanner: JSON.parse(JSON.stringify(cfg.screenScanner || { enabled: 1, items: [], scanRate: 150 }))
      };
    } else {
      const def = cfg.profiles['Default'];
      const listMods = ['textExpander', 'keyRemapper', 'appLauncher', 'folderCreator', 'macroRecorder', 'autoClicker', 'screenScanner'];
      listMods.forEach(m => {
        if (!def[m] && cfg[m]) {
          def[m] = JSON.parse(JSON.stringify(cfg[m]));
        } else if (!def[m]) {
          def[m] = { enabled: 1, items: [] };
        }
      });
      const objMods = ['windowManager', 'mouseGestures', 'radialMenu'];
      objMods.forEach(m => {
        if (!def[m] && cfg[m]) {
          def[m] = JSON.parse(JSON.stringify(cfg[m]));
        } else if (!def[m]) {
          def[m] = {};
        }
      });
    }

    // Ensure all items across all modules in all profiles have an enabled property
    Object.keys(cfg.profiles).forEach(pName => {
      const p = cfg.profiles[pName];
        ['textExpander', 'keyRemapper', 'appLauncher', 'folderCreator', 'macroRecorder', 'autoClicker', 'screenScanner'].forEach(m => {
          if (p[m] && Array.isArray(p[m].items)) {
            p[m].items.forEach(item => {
              if (typeof item.enabled === 'undefined') {
                item.enabled = (pName === 'Default') ? 1 : 0;
              }
            });
          }
        });
      });

    const activeName = cfg.activeProfile;
    if (!cfg.profiles[activeName]) {
      cfg.activeProfile = 'Default';
    }
    const activeProf = cfg.profiles[cfg.activeProfile] || cfg.profiles['Default'];
    if (activeProf) {
        if (!activeProf.textExpander && cfg.textExpander) activeProf.textExpander = JSON.parse(JSON.stringify(cfg.textExpander));
        cfg.textExpander = activeProf.textExpander || { enabled: 1, items: [] };
        cfg.keyRemapper = activeProf.keyRemapper || { enabled: 1, items: [] };
        cfg.appLauncher = activeProf.appLauncher || { enabled: 1, items: [] };
        cfg.folderCreator = activeProf.folderCreator || { enabled: 1, items: [] };
        cfg.macroRecorder = activeProf.macroRecorder || { enabled: 1, items: [] };
        cfg.windowManager = activeProf.windowManager || {};
        cfg.mouseGestures = activeProf.mouseGestures || {};
        cfg.radialMenu = activeProf.radialMenu || {};
        cfg.autoClicker = activeProf.autoClicker || {};
        cfg.screenScanner = activeProf.screenScanner || { enabled: 1, items: [], scanRate: 150 };
      }
      applyForcedItemStates();
    }

  function applyForcedItemStates() {
        if (!state.config || !state.config.profiles) return;
        if (!state.config.forcedItemStates) state.config.forcedItemStates = {};
        const forcedStates = state.config.forcedItemStates;
        const profiles = state.config.profiles;
        const listModules = ['textExpander', 'keyRemapper', 'appLauncher', 'folderCreator', 'macroRecorder', 'autoClicker'];

        listModules.forEach(mod => {
          // 1. Collect forced items into forcedStates if not already tracked
          if (state.config[mod] && Array.isArray(state.config[mod].items)) {
            state.config[mod].items.forEach(item => {
              if (item && item.id && (item.forcedAllProfiles || item.allProfiles)) {
                if (typeof forcedStates[item.id] === 'undefined') {
                  forcedStates[item.id] = (item.enabled === 0 || item.enabled === false) ? 0 : 1;
                }
              }
            });
          }
          Object.keys(profiles).forEach(pName => {
            const prof = profiles[pName];
            if (prof && prof[mod] && Array.isArray(prof[mod].items)) {
              prof[mod].items.forEach(item => {
                if (item && item.id && (item.forcedAllProfiles || item.allProfiles)) {
                  if (typeof forcedStates[item.id] === 'undefined') {
                    forcedStates[item.id] = (item.enabled === 0 || item.enabled === false) ? 0 : 1;
                  }
                }
              });
            }
          });

          // 2. Enforce canonical forcedStates on active module and all profiles
          Object.keys(forcedStates).forEach(itemId => {
            const canonicalEnabled = forcedStates[itemId];

            // Active module items
            if (state.config[mod] && Array.isArray(state.config[mod].items)) {
              const mem = state.config[mod].items.find(i => i && i.id === itemId);
              if (mem) {
                mem.enabled = canonicalEnabled;
                mem.forcedAllProfiles = true;
              }
            }

            // All profiles
            Object.keys(profiles).forEach(pName => {
              const prof = profiles[pName];
              if (!prof) return;
              if (!prof[mod]) prof[mod] = { enabled: 1, items: [] };
              if (!Array.isArray(prof[mod].items)) prof[mod].items = [];

              let targetItem = prof[mod].items.find(i => i && i.id === itemId);
              if (targetItem) {
                targetItem.enabled = canonicalEnabled;
                targetItem.forcedAllProfiles = true;
              }
            });
          });
        });
      }

  function onItemToggleStateChanged(moduleName, item, isChecked) {
        if (!item) return;
        item.enabled = isChecked ? 1 : 0;
        const isForced = item.forcedAllProfiles || item.allProfiles || (state.config.forcedItemStates && (item.id in state.config.forcedItemStates));
        if (isForced) {
          if (!state.config.forcedItemStates) state.config.forcedItemStates = {};
          state.config.forcedItemStates[item.id] = isChecked ? 1 : 0;
          applyForcedItemStates();
        }
      }

  function saveCurrentProfileState() {
        if (!state.config) return;
        const currentProf = state.config.activeProfile || 'Default';
        if (!state.config.profiles || !state.config.profiles[currentProf]) return;
        const existing = state.config.profiles[currentProf];
        state.config.profiles[currentProf] = {
          ...existing,
          textExpander: JSON.parse(JSON.stringify(state.config.textExpander || { enabled: 1, items: [] })),
          keyRemapper: JSON.parse(JSON.stringify(state.config.keyRemapper || { enabled: 1, items: [] })),
          appLauncher: JSON.parse(JSON.stringify(state.config.appLauncher || { enabled: 1, items: [] })),
          folderCreator: JSON.parse(JSON.stringify(state.config.folderCreator || { enabled: 1, items: [] })),
          macroRecorder: JSON.parse(JSON.stringify(state.config.macroRecorder || { enabled: 1, items: [] })),
          windowManager: JSON.parse(JSON.stringify(state.config.windowManager || {})),
          mouseGestures: JSON.parse(JSON.stringify(state.config.mouseGestures || {})),
          radialMenu: JSON.parse(JSON.stringify(state.config.radialMenu || {})),
          autoClicker: JSON.parse(JSON.stringify(state.config.autoClicker || {})),
          screenScanner: JSON.parse(JSON.stringify(state.config.screenScanner || { enabled: 1, scanRate: 150, items: [] }))
        };
        applyForcedItemStates();
      }

  function getProfileIconHtml(pName, prof) {
        const isDefault = (pName === 'Default');
        if (isDefault) {
          return `<svg class="profile-card-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
        <line x1="8" y1="21" x2="16" y2="21"></line>
        <line x1="12" y1="17" x2="12" y2="21"></line>
      </svg>`;
        }

        const targetExe = (prof && prof.targetExe) ? prof.targetExe.trim() : '';
        const firstExe = targetExe ? targetExe.split(',')[0].trim().replace(/\.exe$/i, '') : '';

        const candidates = [];
        if (firstExe) {
          candidates.push(`icons/${encodeURIComponent(firstExe)}.png`);
          candidates.push(`icons/${encodeURIComponent(firstExe.toLowerCase())}.png`);
        }
        if (pName) {
          candidates.push(`icons/${encodeURIComponent(pName)}.png`);
          candidates.push(`icons/${encodeURIComponent(pName.toLowerCase())}.png`);
        }

        const uniqueCandidates = [];
        candidates.forEach(c => {
          if (!uniqueCandidates.includes(c)) uniqueCandidates.push(c);
        });

        if (uniqueCandidates.length > 0) {
          const primary = uniqueCandidates[0];
          const alts = uniqueCandidates.slice(1);
          const altsJson = JSON.stringify(alts).replace(/"/g, '&quot;');
          return `
        <img class="profile-card-img" src="${primary}" data-alts="${altsJson}" alt="${escapeHtml(pName)}"
             onerror="
               try {
                 var a = JSON.parse(this.getAttribute('data-alts') || '[]');
                 if (a && a.length > 0) {
                   var next = a.shift();
                   this.setAttribute('data-alts', JSON.stringify(a));
                   this.src = next;
                   return;
                 }
               } catch(e) {}
               this.style.display='none';
               if (this.nextElementSibling) this.nextElementSibling.style.display='flex';
             " />
        <div class="profile-card-fallback-badge" style="display:none;">
          <span>${escapeHtml(pName.charAt(0).toUpperCase())}</span>
        </div>`;
        }

        return `
      <div class="profile-card-fallback-badge">
        <span>${escapeHtml(pName.charAt(0).toUpperCase())}</span>
      </div>`;
      }

  function renderItemProfileBadges(moduleName, itemId) {
        if (!state.config) return '';
        // Ensure current profile in state.config.profiles reflects live in-memory module changes
        saveCurrentProfileState();
        if (!state.config.profiles) return '';
        const profiles = state.config.profiles;
        const currentProf = state.config.activeProfile || 'Default';
        const totalProfCount = Object.keys(profiles).length;

        let isForcedAll = false;
        const curProf = profiles[currentProf];
        let isCurrentEnabled = true;
        if (curProf && curProf[moduleName] && Array.isArray(curProf[moduleName].items)) {
          const it = curProf[moduleName].items.find(i => i.id === itemId);
          if (it) {
            if (it.forcedAllProfiles || it.allProfiles) isForcedAll = true;
            if (it.enabled === 0 || it.enabled === false) isCurrentEnabled = false;
          }
        }
        if (state.config.forcedItemStates && (itemId in state.config.forcedItemStates)) {
          isForcedAll = true;
          if (state.config.forcedItemStates[itemId] === 0 || state.config.forcedItemStates[itemId] === false) {
            isCurrentEnabled = false;
          }
        }

        // Find all profiles where this item is enabled
        const activeProfiles = [];
        Object.keys(profiles).forEach(pName => {
          const prof = profiles[pName];
          if (prof && prof[moduleName] && Array.isArray(prof[moduleName].items)) {
            const found = prof[moduleName].items.find(i => i.id === itemId);
            if (found && found.enabled !== false && found.enabled !== 0) {
              activeProfiles.push(pName);
              if (found.forcedAllProfiles || found.allProfiles) isForcedAll = true;
            }
          }
        });

        // Only show single globe badge if explicitly forced across all profiles
        if (isForcedAll) {
          const isItemActive = isCurrentEnabled && activeProfiles.length > 0;
          const statusClass = isItemActive ? 'is-active is-current' : 'is-disabled';
          const statusTitle = isItemActive
            ? `Forced on All Profiles (${activeProfiles.length}/${totalProfCount}) • Right-click to manage`
            : `Forced on All Profiles (Disabled) • Right-click to manage`;
          return `<div class="item-profiles-badges is-forced-all ${isItemActive ? '' : 'is-disabled'}" data-count="1" data-forced-all="true" data-module="${escapeHtml(moduleName)}" data-id="${escapeHtml(itemId)}"><div class="item-profile-badge is-all-profiles ${statusClass}" title="${escapeHtml(statusTitle)}" data-forced-all="true" data-module="${escapeHtml(moduleName)}" data-id="${escapeHtml(itemId)}"><svg class="profile-badge-svg all-profiles-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg></div></div>`;
        }

        if (activeProfiles.length === 0) return '';

        const badgesHtml = activeProfiles.map(pName => {
          const prof = profiles[pName] || {};
          const isCur = (pName === currentProf);
          const iconHtml = getProfileIconHtml(pName, prof);
          const tooltip = isCur ? `Active in Profile: ${pName} (Current Profile)` : `Active in Profile: ${pName} (Click to switch)`;
          return `<div class="item-profile-badge ${isCur ? 'is-current' : ''}" title="${escapeHtml(tooltip)}" data-switch-profile="${escapeHtml(pName)}">${iconHtml}</div>`;
        }).join('');

        const hasScrollbar = activeProfiles.length > 4;
        return `<div class="item-profiles-badges ${hasScrollbar ? 'has-scrollbar' : ''}" data-count="${activeProfiles.length}" data-module="${escapeHtml(moduleName)}" data-id="${escapeHtml(itemId)}">${badgesHtml}</div>`;
      }

  function updateCardProfileBadges(cardEl, moduleName, itemId) {
        if (!cardEl) return;
        let container = cardEl.querySelector('.item-profiles-badges');
        const newHtml = renderItemProfileBadges(moduleName, itemId);
        if (newHtml) {
          if (container) {
            container.outerHTML = newHtml;
          } else {
            // Find best insertion target depending on card structure
            const actions = cardEl.querySelector('.card-actions');
            if (actions) {
              actions.insertAdjacentHTML('beforebegin', newHtml);
            } else {
              const cardInfo = cardEl.querySelector('.card-info') || cardEl.querySelector('.macro-card-top');
              if (cardInfo) {
                cardInfo.insertAdjacentHTML('beforeend', newHtml);
              }
            }
          }
        } else if (container) {
          container.remove();
        }
      }

  const FEATURE_SWITCH_DEFINITIONS = [
      // Gestures & Corners
      { id: 'hcMasterSwitch', module: 'mouseGestures', key: 'cornersEnabled' },
      { id: 'mgMasterSwitch', module: 'mouseGestures', key: 'gesturesEnabled' },
      { id: 'mgRockerSwitch', module: 'mouseGestures', key: 'rockerEnabled' },
      { id: 'mgWheelSwitch', module: 'mouseGestures', key: 'wheelGestureEnabled' },
      // Radial Menu
      { id: 'rmMasterSwitch', module: 'radialMenu', key: 'enabled' },
      // System Tools (Window Manager)
      { id: 'wmSwitchAlwaysOnTop', module: 'windowManager', key: 'alwaysOnTopEnabled' },
      { id: 'wmSwitchCenterWindow', module: 'windowManager', key: 'centerWindowEnabled' },
      { id: 'wmSwitchHideWindow', module: 'windowManager', key: 'hideWindowEnabled' },
      { id: 'wmSwitchTransparencyWheel', module: 'windowManager', key: 'transparencyWheel' },
      { id: 'wmSwitchAppVolumeWheel', module: 'windowManager', key: 'appVolumeWheel' },
      { id: 'wmSwitchAppVolumeMute', module: 'windowManager', key: 'appVolumeMuteEnabled' },
      { id: 'wmSwitchMasterAudioMute', module: 'windowManager', key: 'masterAudioMuteEnabled' },
      { id: 'wmSwitchWindowShade', module: 'windowManager', key: 'windowShadeEnabled' },
      { id: 'wmSwitchBorderless', module: 'windowManager', key: 'borderlessEnabled' },
      { id: 'wmSwitchTextTransform', module: 'windowManager', key: 'textTransformEnabled' },
      { id: 'wmSwitchCleanText', module: 'windowManager', key: 'textTransformCleanEnabled' },
      { id: 'wmSwitchScreenOcr', module: 'windowManager', key: 'screenOcrEnabled' },
      { id: 'wmSwitchColorPicker', module: 'windowManager', key: 'colorPickerEnabled' },
      { id: 'wmSwitchVirtualDesktops', module: 'windowManager', key: 'virtualDesktopsEnabled' },
      { id: 'wmSwitchSleep', module: 'windowManager', key: 'sleepEnabled' }
    ];

    function updateAllFeatureProfileBadges() {
      if (!state.config) return;
      saveCurrentProfileState();
      if (!state.config.profiles) return;

      const profiles = state.config.profiles;
      const currentProf = state.config.activeProfile || 'Default';

      FEATURE_SWITCH_DEFINITIONS.forEach(({ id, module, key }) => {
        const sw = document.getElementById(id);
        if (!sw) return;

        const toggleWrapper = sw.closest('.toggle-wrapper');
        if (!toggleWrapper) return;

        const parent = toggleWrapper.parentElement;
        if (!parent) return;

        let container = parent.querySelector(`.item-profiles-badges[data-feature-key="${key}"]`);
        if (!container) {
          container = document.createElement('div');
          container.className = 'item-profiles-badges';
          container.setAttribute('data-module', module);
          container.setAttribute('data-feature-key', key);
          parent.insertBefore(container, toggleWrapper);
        } else {
          container.setAttribute('data-module', module);
          container.setAttribute('data-feature-key', key);
        }

        const activeProfiles = [];
        Object.keys(profiles).forEach(pName => {
          const prof = profiles[pName];
          if (prof) {
            const mod = prof[module] || (pName === 'Default' ? state.config[module] : null);
            if (mod) {
              let isEnabled = false;
              if (key === 'enabled') {
                isEnabled = (mod.enabled !== false && mod.enabled !== 0);
              } else if (key === 'cornersEnabled' || key === 'gesturesEnabled') {
                isEnabled = (mod[key] !== false && mod[key] !== 0);
              } else {
                isEnabled = (mod[key] === true || mod[key] === 1);
              }
              if (isEnabled) {
                activeProfiles.push(pName);
              }
            }
          }
        });

        if (activeProfiles.length === 0) {
          container.innerHTML = '';
          container.style.display = 'none';
          container.classList.remove('has-scrollbar');
          return;
        }

        const totalProfCount = Object.keys(profiles).length;
        const isForcedFeature = Boolean((state.config.forcedFeatures && state.config.forcedFeatures[`${module}.${key}`]) ||
          (profiles[currentProf] && profiles[currentProf][module] && profiles[currentProf][module].forcedAllProfiles && profiles[currentProf][module].forcedAllProfiles[key]));

        if (isForcedFeature) {
          container.className = 'item-profiles-badges is-forced-all';
          container.setAttribute('data-count', '1');
          container.setAttribute('data-forced-all', 'true');
          container.setAttribute('data-module', module);
          container.setAttribute('data-feature-key', key);
          container.style.display = 'grid';
          container.innerHTML = `
          <div class="item-profile-badge is-all-profiles is-current" 
               title="Forced on All Profiles (${activeProfiles.length}/${totalProfCount}) • Right-click to manage" 
               data-forced-all="true" 
               data-module="${escapeHtml(module)}" 
               data-feature-key="${escapeHtml(key)}">
            <svg class="profile-badge-svg all-profiles-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
          </div>
        `;
          return;
        }

        const hasMoreThan4 = activeProfiles.length > 4;
        container.className = `item-profiles-badges ${hasMoreThan4 ? 'has-scrollbar' : ''}`;
        container.setAttribute('data-count', activeProfiles.length);
        container.setAttribute('data-module', module);
        container.setAttribute('data-feature-key', key);

        const badgesHtml = activeProfiles.map(pName => {
          const prof = profiles[pName] || {};
          const isCur = (pName === currentProf);
          const iconHtml = getProfileIconHtml(pName, prof);
          const tooltip = isCur
            ? `Active in Profile: ${pName} (Current Profile) • Right-click to force on all profiles`
            : `Active in Profile: ${pName} (Click to switch) • Right-click to force on all profiles`;
          return `<div class="item-profile-badge ${isCur ? 'is-current' : ''}" title="${escapeHtml(tooltip)}" data-switch-profile="${escapeHtml(pName)}" data-module="${escapeHtml(module)}" data-feature-key="${escapeHtml(key)}">${iconHtml}</div>`;
        }).join('');

        container.innerHTML = badgesHtml;
        container.style.display = 'grid';
      });
    }

    function updateProfileLockButton() {
      const btnLock = document.getElementById('btnLockProfile');
      if (!btnLock) return;
      const isLocked = !!(state.config && (state.config.profileLocked === 1 || state.config.profileLocked === true));
      btnLock.classList.toggle('is-locked', isLocked);
      const curProfile = (state.config && state.config.activeProfile) || 'Default';
      if (isLocked) {
        btnLock.title = `Profile "${curProfile}" is Locked (Auto-switching paused. Click to unlock)`;
        btnLock.innerHTML = `
        <svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
      `;
      } else {
        btnLock.title = `Lock Profile "${curProfile}" (Prevent automatic switching)`;
        btnLock.innerHTML = `
        <svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
        </svg>
      `;
      }
    }

    function updateBlockSysKeysButton() {
      const btn = document.getElementById('btnBlockSysKeys');
      if (!btn) return;
      const curProfile = (state.config && state.config.activeProfile) || 'Default';
      const prof = (state.config && state.config.profiles && state.config.profiles[curProfile]) || {};
      const isBlocked = !!(prof.blockSystemKeys === 1 || prof.blockSystemKeys === true || (state.config && (state.config.blockSystemKeys === 1 || state.config.blockSystemKeys === true)));
      btn.classList.toggle('is-blocked', isBlocked);
      if (isBlocked) {
        btn.title = 'Key Presses Blocked (Windows shortcuts like Win+D suppressed. Click to allow)';
      } else {
        btn.title = 'Prevent Key Presses from Activating (Click to Block Win+D Desktop, Win Key, etc.)';
      }
    }

    function renderProfilesRibbon() {
      const track = document.getElementById('lgsProfilesTrack');
      const defaultSlot = document.getElementById('lgsDefaultProfileSlot');
      const select = document.getElementById('profileSelect');
      if (!track) return;

      const currentProfName = (state.config && state.config.activeProfile) || 'Default';
      const profiles = (state.config && state.config.profiles) ? state.config.profiles : { 'Default': {} };
      const allProfileNames = Object.keys(profiles);

      if (select) {
        select.innerHTML = '';
        allProfileNames.forEach(p => {
          const opt = document.createElement('option');
          opt.value = p;
          opt.textContent = p;
          if (p === currentProfName) opt.selected = true;
          select.appendChild(opt);
        });
      }

      const queryInput = document.getElementById('profileSearchInput');
      const query = (queryInput ? queryInput.value : '').trim().toLowerCase();

      const btnDelete = document.getElementById('btnDeleteProfile');
      if (btnDelete) {
        const canDelete = (currentProfName !== 'Default' && allProfileNames.length > 1);
        btnDelete.disabled = !canDelete;
        btnDelete.classList.toggle('is-disabled', !canDelete);
        btnDelete.title = canDelete ? `Delete Profile "${currentProfName}"` : 'Cannot delete Default profile';
      }

      updateProfileLockButton();
      updateBlockSysKeysButton();

      function createProfileCard(pName, isDef) {
        const prof = profiles[pName] || {};
        const isActive = (pName === currentProfName);
        const card = document.createElement('div');
        card.className = `lgs-profile-card ${isDef ? 'is-default' : ''} ${isActive ? 'active' : ''}`;
        card.setAttribute('data-profile', pName);
        card.title = isDef ? 'Default Profile (System Fallback)' : (prof.targetExe ? `${pName} (${prof.targetExe})` : pName);

        const iconBox = document.createElement('div');
        iconBox.className = 'lgs-icon-box';
        iconBox.innerHTML = getProfileIconHtml(pName, prof);

        const infoCol = document.createElement('div');
        infoCol.className = 'lgs-profile-info';

        const nameEl = document.createElement('div');
        nameEl.className = 'lgs-profile-name';
        nameEl.textContent = pName;

        const exeEl = document.createElement('div');
        exeEl.className = 'lgs-profile-exe';
        exeEl.textContent = isDef ? 'Default (System)' : (prof.targetExe ? prof.targetExe.split(',')[0].trim() : 'Manual Switch');

        infoCol.appendChild(nameEl);
        infoCol.appendChild(exeEl);

        card.appendChild(iconBox);
        card.appendChild(infoCol);

        card.addEventListener('click', (e) => {
          if (hasProfilesDragged) {
            e.preventDefault();
            e.stopPropagation();
            return;
          }
          if (state.config.activeProfile !== pName) {
            switchProfile(pName);
          } else {
            updateGlobalIndicators();
          }
        });

        card.addEventListener('dblclick', (e) => {
          if (hasProfilesDragged) {
            e.preventDefault();
            e.stopPropagation();
            return;
          }
          openProfileModal('edit');
        });

        return card;
      }

      // 1. Render Fixed Default Profile Slot
      if (defaultSlot) {
        const existingDefCard = defaultSlot.querySelector('.lgs-profile-card');
        const showDef = (!query || 'default'.includes(query) || ((profiles['Default'] && profiles['Default'].targetExe) || '').toLowerCase().includes(query));
        if (showDef) {
          defaultSlot.style.display = 'flex';
          if (existingDefCard) {
            existingDefCard.classList.toggle('active', currentProfName === 'Default');
          } else {
            defaultSlot.innerHTML = '';
            defaultSlot.appendChild(createProfileCard('Default', true));
          }
        } else {
          defaultSlot.style.display = 'none';
        }
      }

      // 2. Render App Profiles Track & Preserve Glider for True Bi-Directional Animation
      let glider = document.getElementById('lgsProfilesGlider');
      if (!glider) {
        glider = document.createElement('div');
        glider.className = 'lgs-profiles-glider';
        glider.id = 'lgsProfilesGlider';
        track.appendChild(glider);
      }

      const otherNames = allProfileNames.filter(n => n !== 'Default');
      const visibleNames = otherNames.filter(pName => {
        const prof = profiles[pName] || {};
        const targetLower = (prof.targetExe || '').toLowerCase();
        return !(query && !pName.toLowerCase().includes(query) && !targetLower.includes(query));
      });

      const existingCards = Array.from(track.querySelectorAll('.lgs-profile-card'));
      const existingNames = existingCards.map(c => c.getAttribute('data-profile'));

      const isSameStructure = (existingNames.length === visibleNames.length &&
        existingNames.every((n, i) => n === visibleNames[i]));

      if (isSameStructure) {
        // Structure didn't change: preserve existing DOM cards & glider
        // Update active state and subtitle text so CSS transition glides seamlessly in BOTH directions
        existingCards.forEach(card => {
          const pName = card.getAttribute('data-profile');
          const isActive = (pName === currentProfName);
          card.classList.toggle('active', isActive);
          const prof = profiles[pName] || {};
          const exeEl = card.querySelector('.lgs-profile-exe');
          if (exeEl) {
            exeEl.textContent = prof.targetExe ? prof.targetExe.split(',')[0].trim() : 'Manual Switch';
          }
        });
        updateProfileGlider(false);
        updateProfilesScrollButtons();
      } else {
        // Structure changed: remove cards only (glider remains!) and re-append cards
        existingCards.forEach(c => c.remove());
        visibleNames.forEach(pName => {
          track.appendChild(createProfileCard(pName, false));
        });
        requestAnimationFrame(() => {
          updateProfileGlider(false);
          updateProfilesScrollButtons();
        });
      }
    }

    function updateProfilesScrollButtons() {
      const track = document.getElementById('lgsProfilesTrack');
      const btnLeft = document.getElementById('btnScrollProfilesLeft');
      const btnRight = document.getElementById('btnScrollProfilesRight');
      if (!track) return;

      const cards = track.querySelectorAll('.lgs-profile-card');
      const profileCount = cards.length;
      // Don't show scrollbar/scroll buttons unless the icons don't fit AND there are more than 4 profile icons
      const isOverflowing = track.scrollWidth > (track.clientWidth + 4);
      const shouldShow = (profileCount > 4) && isOverflowing;

      if (btnLeft) {
        btnLeft.style.display = shouldShow ? 'flex' : 'none';
        btnLeft.classList.toggle('disabled-scroll', track.scrollLeft <= 2);
      }
      if (btnRight) {
        btnRight.style.display = shouldShow ? 'flex' : 'none';
        btnRight.classList.toggle('disabled-scroll', track.scrollLeft + track.clientWidth >= track.scrollWidth - 2);
      }
    }

    function updateProfileGlider(instant = false) {
      const track = document.getElementById('lgsProfilesTrack');
      const glider = document.getElementById('lgsProfilesGlider');
      if (!track || !glider) return;

      const activeCard = track.querySelector('.lgs-profile-card.active');
      if (!activeCard) {
        glider.style.opacity = '0';
        return;
      }

      const left = activeCard.offsetLeft;
      const width = activeCard.offsetWidth;

      if (width === 0) {
        requestAnimationFrame(() => updateProfileGlider(instant));
        return;
      }

      const wasHidden = (glider.style.opacity === '0' || !glider.style.opacity);

      if (instant || wasHidden) {
        glider.style.transition = 'none';
        glider.style.transform = `translateX(${left}px)`;
        glider.style.width = `${width}px`;
        if (wasHidden) {
          void glider.offsetWidth;
          glider.style.transition = 'opacity 0.25s ease';
        }
        glider.style.opacity = '1';
      } else {
        glider.style.transition = 'transform 0.32s cubic-bezier(0.25, 1, 0.5, 1), width 0.32s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.2s ease';
        glider.style.transform = `translateX(${left}px)`;
        glider.style.width = `${width}px`;
        glider.style.opacity = '1';
      }
    }

    function renderProfileSelect() {
      renderProfilesRibbon();
    }

    function switchProfile(name, shouldSync = true) {
      if (!state.config.profiles || !state.config.profiles[name]) return;
      try {
        if (typeof stopActiveBadgeRecording === 'function') stopActiveBadgeRecording(true);
        saveCurrentProfileState();
      } catch (e) {
        console.warn('saveCurrentProfileState error:', e);
      }

      state.config.activeProfile = name;

      const prof = state.config.profiles[name];
      state.config.textExpander = prof.textExpander || { enabled: 1, items: [] };
      state.config.keyRemapper = prof.keyRemapper || { enabled: 1, items: [] };
      state.config.appLauncher = prof.appLauncher || { enabled: 1, items: [] };
      state.config.folderCreator = prof.folderCreator || { enabled: 1, items: [] };
      state.config.macroRecorder = prof.macroRecorder || { enabled: 1, items: [] };
      state.config.windowManager = prof.windowManager || {};
      state.config.mouseGestures = prof.mouseGestures || {};
      state.config.radialMenu = prof.radialMenu || {};
      state.config.autoClicker = prof.autoClicker || {};
      state.config.screenScanner = prof.screenScanner || { enabled: 1, scanRate: 150, items: [] };

      applyForcedItemStates();

      state.config.blockSystemKeys = (prof.blockSystemKeys === 1 || prof.blockSystemKeys === true) ? 1 : 0;
      updateBlockSysKeysButton();
      sendToAhk('setBlockSystemKeys', { enabled: state.config.blockSystemKeys });

      // 1. Immediately update global active indicators so count badge refreshes instantaneously
      updateGlobalIndicators();

      // 2. Render each component safely inside individual try-catch blocks
      const renderSteps = [
        ['renderProfileSelect', renderProfileSelect],
        ['renderTextExpander', renderTextExpander],
        ['renderKeyRemapper', renderKeyRemapper],
        ['initWindowManager', initWindowManager],
        ['initMouseGestures', initMouseGestures],
        ['initRadialMenu', initRadialMenu],
        ['renderAppLauncher', renderAppLauncher],
        ['renderFolderCreator', renderFolderCreator],
        ['renderMacroRecorder', renderMacroRecorder],
        ['updateAutoClickerUI', updateAutoClickerUI],
        ['renderScreenScanner', renderScreenScanner],
        ['refreshAllActionSelects', refreshAllActionSelects],
        ['updateAllFeatureProfileBadges', updateAllFeatureProfileBadges]
      ];

      for (const [stepName, fn] of renderSteps) {
        try {
          if (typeof fn === 'function') fn();
        } catch (err) {
          console.error(`Error in ${stepName}:`, err);
        }
      }

      // 3. Ensure indicators are updated again in case a renderer modified any item state
      updateGlobalIndicators();

      if (shouldSync) {
        try {
          syncConfig();
          sendToAhk('showProfileOsd', { profile: name });
        } catch (err) {
          console.error('Error syncing config in switchProfile:', err);
        }
      }
    }

    function createNewProfile(name, targetExe = '', switchOnHover = false, showOsdIcon = true, switchTriggerEnabled = true, switchOnFocus = true) {
      name = (name || '').trim();
      if (!name) return false;
      if (state.config.profiles && state.config.profiles[name]) {
        showToast(`Profile "${name}" already exists!`);
        return false;
      }
      saveCurrentProfileState();

      const cloneItems = (items) => (items || []).map(i => ({ ...JSON.parse(JSON.stringify(i)), enabled: 0 }));

      const defaultWm = (state.config.profiles && state.config.profiles.Default && state.config.profiles.Default.windowManager)
        ? state.config.profiles.Default.windowManager
        : (state.config.windowManager || {});
      const newWm = JSON.parse(JSON.stringify(defaultWm));

      const curAc = state.config.autoClicker || {};
      const newAc = { ...JSON.parse(JSON.stringify(curAc)), enabled: 0 };

      const curMg = state.config.mouseGestures || {};
      const newMg = { ...JSON.parse(JSON.stringify(curMg)), cornersEnabled: 0, gesturesEnabled: 0 };

      const curRm = state.config.radialMenu || {};
      const newRm = { ...JSON.parse(JSON.stringify(curRm)), enabled: 0 };

      const newProfile = {
        targetExe: targetExe,
        switchTriggerEnabled: Boolean(switchTriggerEnabled),
        switchOnFocus: Boolean(switchOnFocus),
        switchOnHover: Boolean(switchOnHover),
        showOsdIcon: Boolean(showOsdIcon),
        textExpander: {
          enabled: 1,
          items: cloneItems(state.config.textExpander && state.config.textExpander.items)
        },
        keyRemapper: {
          enabled: 1,
          items: cloneItems(state.config.keyRemapper && state.config.keyRemapper.items)
        },
        appLauncher: {
          enabled: 1,
          items: cloneItems(state.config.appLauncher && state.config.appLauncher.items)
        },
        folderCreator: {
          enabled: 1,
          items: cloneItems(state.config.folderCreator && state.config.folderCreator.items)
        },
        macroRecorder: {
          enabled: 1,
          items: cloneItems(state.config.macroRecorder && state.config.macroRecorder.items),
          useStandardDelays: (state.config.macroRecorder && state.config.macroRecorder.useStandardDelays) || 1
        },
        windowManager: newWm,
        mouseGestures: newMg,
        radialMenu: newRm,
        autoClicker: newAc
      };

      if (!state.config.profiles) state.config.profiles = {};
      state.config.profiles[name] = newProfile;
      switchProfile(name);
      showToast(`Created & switched to profile "${name}"`);
      closeProfileModal();
      return true;
    }

    function updateProfileSettings(name, targetExe, switchOnHover, showOsdIcon, switchTriggerEnabled = true, switchOnFocus = true) {
      name = (name || '').trim();
      if (!name || !state.config.profiles || !state.config.profiles[name]) return false;
      saveCurrentProfileState();
      const prof = state.config.profiles[name];
      if (name !== 'Default') {
        prof.targetExe = targetExe;
        prof.showOsdIcon = Boolean(showOsdIcon);
      }
      prof.switchTriggerEnabled = Boolean(switchTriggerEnabled);
      prof.switchOnFocus = Boolean(switchOnFocus);
      prof.switchOnHover = Boolean(switchOnHover);
      renderProfilesRibbon();
      syncConfig();
      showToast(`Updated settings for "${name}"`);
      return true;
    }

    function renameProfile(oldName, newName) {
      newName = (newName || '').trim();
      if (!newName || newName === oldName) return false;
      if (state.config.profiles[newName]) {
        showToast(`Profile "${newName}" already exists!`);
        return false;
      }
      saveCurrentProfileState();
      state.config.profiles[newName] = state.config.profiles[oldName];
      delete state.config.profiles[oldName];
      if (state.config.activeProfile === oldName) {
        state.config.activeProfile = newName;
      }
      renderProfileSelect();
      syncConfig();
      showToast(`Renamed profile to "${newName}"`);
      return true;
    }

    function deleteProfile(name) {
      if (!state.config || !state.config.profiles) return false;
      const profileNames = Object.keys(state.config.profiles);
      if (profileNames.length <= 1) {
        showToast('Cannot delete the only profile!');
        return false;
      }
      if (name === 'Default') {
        showToast('Cannot delete System Default profile!');
        return false;
      }

      // Always close the modal window immediately
      closeProfileModal();

      delete state.config.profiles[name];

      if (state.config.activeProfile === name) {
        const remaining = Object.keys(state.config.profiles);
        const fallback = remaining.includes('Default') ? 'Default' : remaining[0];
        switchProfile(fallback, true);
      } else {
        renderProfileSelect();
        syncConfig();
      }
      showToast(`Profile "${name}" deleted`);
      return true;
    }

    // ==========================================================================
    // Profile Context Menu & Active Scripts Copy / Paste Engine
    // ==========================================================================
    let activeContextProfile = null;
    let profileScriptsClipboard = null;
    let hasProfilesDragged = false;
    try {
      const saved = localStorage.getItem('ahk_profile_clipboard');
      if (saved) profileScriptsClipboard = JSON.parse(saved);
    } catch (e) { }

    function getProfileActiveScriptsCount(pName) {
      if (!state.config) return 0;
      const currentName = pName || state.config.activeProfile || 'Default';
      if (state.config.activeProfile === currentName) {
        saveCurrentProfileState();
      }
      let prof = null;
      if (state.config.profiles) {
        if (!Array.isArray(state.config.profiles) && state.config.profiles[currentName]) {
          prof = state.config.profiles[currentName];
        } else if (Array.isArray(state.config.profiles)) {
          prof = state.config.profiles.find(p => p && (p.name === currentName || p.id === currentName));
        }
      }
      if (!prof) prof = state.config;
      if (!prof) return 0;

      let count = 0;
      const listModules = ['textExpander', 'keyRemapper', 'appLauncher', 'folderCreator', 'macroRecorder', 'screenScanner'];
      listModules.forEach(mod => {
        const m = prof[mod] || (state.config && state.config[mod]);
        if (m && Array.isArray(m.items)) {
          m.items.forEach(item => {
            if (item && item.enabled !== false && item.enabled !== 0) {
              count++;
            }
          });
        }
      });

      const wm = prof.windowManager || prof.systemTools || (state.config && (state.config.windowManager || state.config.systemTools));
      if (wm) {
        const wmKeys = [
          'alwaysOnTopEnabled', 'centerWindowEnabled', 'hideWindowEnabled',
          'appVolumeMuteEnabled', 'masterAudioMuteEnabled', 'windowShadeEnabled',
          'borderlessEnabled', 'textTransformEnabled', 'textTransformCleanEnabled',
          'screenOcrEnabled', 'colorPickerEnabled', 'virtualDesktopsEnabled', 'sleepEnabled',
          'appVolumeWheel', 'transparencyWheel', 'clickThroughGhost', 'taskbarScrollEnabled'
        ];
        wmKeys.forEach(k => {
          if (wm[k] === 1 || wm[k] === true) count++;
        });
      }

      const mg = prof.mouseGestures || prof.gesturesAndCorners || (state.config && (state.config.mouseGestures || state.config.gesturesAndCorners));
      if (mg) {
        if (mg.cornersEnabled === 1 || mg.cornersEnabled === true) count++;
        if (mg.gesturesEnabled === 1 || mg.gesturesEnabled === true) count++;
      }

      const rm = prof.radialMenu || (state.config && state.config.radialMenu);
      if (rm && (rm.enabled === 1 || rm.enabled === true)) count++;

      const ac = prof.autoClicker || (state.config && state.config.autoClicker);
      if (ac && (ac.enabled === 1 || ac.enabled === true)) count++;

      return count;
    }

    function copyProfileActiveScripts(pName) {
      if (!state.config || !state.config.profiles || !state.config.profiles[pName]) return;
      if (state.config.activeProfile === pName) {
        saveCurrentProfileState();
      }
      const prof = state.config.profiles[pName];

      const snapshot = {
        sourceProfile: pName,
        copiedAt: Date.now(),
        listModules: {},
        windowManager: {},
        mouseGestures: {},
        radialMenu: {},
        autoClicker: {}
      };

      let totalActive = 0;

      const listModules = ['textExpander', 'keyRemapper', 'appLauncher', 'folderCreator', 'macroRecorder', 'screenScanner'];
      listModules.forEach(mod => {
        snapshot.listModules[mod] = [];
        if (prof[mod] && Array.isArray(prof[mod].items)) {
          prof[mod].items.forEach(item => {
            if (item && item.enabled !== false && item.enabled !== 0) {
              snapshot.listModules[mod].push(JSON.parse(JSON.stringify(item)));
              totalActive++;
            }
          });
        }
      });

      if (prof.windowManager) {
        const wmKeys = [
          'alwaysOnTopEnabled', 'centerWindowEnabled', 'hideWindowEnabled',
          'appVolumeMuteEnabled', 'masterAudioMuteEnabled', 'windowShadeEnabled',
          'borderlessEnabled', 'textTransformEnabled', 'textTransformCleanEnabled',
          'screenOcrEnabled', 'colorPickerEnabled', 'virtualDesktopsEnabled', 'sleepEnabled'
        ];
        wmKeys.forEach(k => {
          if (prof.windowManager[k] === 1 || prof.windowManager[k] === true) {
            snapshot.windowManager[k] = 1;
            totalActive++;
          }
        });
        const hkFields = [
          'alwaysOnTopHotkey', 'centerWindowHotkey', 'hideWindowHotkey',
          'appVolumeMuteHotkey', 'masterAudioMuteHotkey', 'windowShadeHotkey',
          'borderlessHotkey', 'textTransformHotkey', 'textTransformCleanHotkey',
          'screenOcrHotkey', 'colorPickerHotkey', 'sleepHotkey', 'sleepModeHibernate',
          'sleepTimerSeconds'
        ];
        hkFields.forEach(hk => {
          if (prof.windowManager[hk] !== undefined) {
            snapshot.windowManager[hk] = prof.windowManager[hk];
          }
        });
      }

      if (prof.mouseGestures) {
        if (prof.mouseGestures.cornersEnabled === 1 || prof.mouseGestures.cornersEnabled === true) {
          snapshot.mouseGestures.cornersEnabled = 1;
          totalActive++;
        }
        if (prof.mouseGestures.gesturesEnabled === 1 || prof.mouseGestures.gesturesEnabled === true) {
          snapshot.mouseGestures.gesturesEnabled = 1;
          totalActive++;
        }
        Object.keys(prof.mouseGestures).forEach(k => {
          if (k !== 'cornersEnabled' && k !== 'gesturesEnabled') {
            snapshot.mouseGestures[k] = prof.mouseGestures[k];
          }
        });
      }

      if (prof.radialMenu && (prof.radialMenu.enabled === 1 || prof.radialMenu.enabled === true)) {
        snapshot.radialMenu = JSON.parse(JSON.stringify(prof.radialMenu));
        snapshot.radialMenu.enabled = 1;
        totalActive++;
      }

      if (prof.autoClicker && (prof.autoClicker.enabled === 1 || prof.autoClicker.enabled === true)) {
        snapshot.autoClicker = JSON.parse(JSON.stringify(prof.autoClicker));
        snapshot.autoClicker.enabled = 1;
        totalActive++;
      }

      snapshot.activeCount = totalActive;
      profileScriptsClipboard = snapshot;
      window.__profileScriptsClipboard = snapshot;
      try {
        localStorage.setItem('ahk_profile_clipboard', JSON.stringify(snapshot));
      } catch (e) { }

      showToast(`Copied ${totalActive} active script${totalActive === 1 ? '' : 's'} from "${pName}"`);
    }

    function pasteProfileActiveScripts(targetProfileName) {
      const clipboard = profileScriptsClipboard || window.__profileScriptsClipboard;
      if (!clipboard) {
        showToast('Clipboard is empty. Right-click a profile to copy first.', 'error');
        return;
      }
      if (!state.config || !state.config.profiles || !state.config.profiles[targetProfileName]) {
        showToast(`Target profile "${targetProfileName}" does not exist.`, 'error');
        return;
      }

      const targetProf = state.config.profiles[targetProfileName];
      let pastedCount = 0;

      const listModules = ['textExpander', 'keyRemapper', 'appLauncher', 'folderCreator', 'macroRecorder', 'screenScanner'];
      listModules.forEach(mod => {
        const sourceActiveItems = (clipboard.listModules && clipboard.listModules[mod]) || [];
        if (!targetProf[mod]) {
          targetProf[mod] = { enabled: 1, items: [] };
        }
        if (!Array.isArray(targetProf[mod].items)) {
          targetProf[mod].items = [];
        }

        sourceActiveItems.forEach(srcItem => {
          let match = null;
          if (srcItem.id) {
            match = targetProf[mod].items.find(t => t.id === srcItem.id);
          }
          if (!match) {
            if (mod === 'textExpander') {
              match = targetProf[mod].items.find(t => t.trigger === srcItem.trigger);
            } else if (mod === 'keyRemapper') {
              match = targetProf[mod].items.find(t => t.originalKey === srcItem.originalKey);
            } else if (mod === 'appLauncher' || mod === 'folderCreator') {
              match = targetProf[mod].items.find(t => t.path === srcItem.path || t.name === srcItem.name);
            } else if (mod === 'macroRecorder') {
              match = targetProf[mod].items.find(t => t.name === srcItem.name);
            }
          }

          if (match) {
            match.enabled = 1;
            pastedCount++;
          } else {
            const newItem = JSON.parse(JSON.stringify(srcItem));
            newItem.enabled = 1;
            targetProf[mod].items.push(newItem);
            pastedCount++;
          }
        });
      });

      if (clipboard.windowManager && Object.keys(clipboard.windowManager).length > 0) {
        if (!targetProf.windowManager) targetProf.windowManager = {};
        Object.keys(clipboard.windowManager).forEach(k => {
          targetProf.windowManager[k] = clipboard.windowManager[k];
          if (k.endsWith('Enabled') && clipboard.windowManager[k] === 1) {
            pastedCount++;
          }
        });
      }

      if (clipboard.mouseGestures && Object.keys(clipboard.mouseGestures).length > 0) {
        if (!targetProf.mouseGestures) targetProf.mouseGestures = {};
        Object.keys(clipboard.mouseGestures).forEach(k => {
          targetProf.mouseGestures[k] = clipboard.mouseGestures[k];
          if ((k === 'cornersEnabled' || k === 'gesturesEnabled') && clipboard.mouseGestures[k] === 1) {
            pastedCount++;
          }
        });
      }

      if (clipboard.radialMenu && clipboard.radialMenu.enabled === 1) {
        targetProf.radialMenu = JSON.parse(JSON.stringify(clipboard.radialMenu));
        pastedCount++;
      }

      if (clipboard.autoClicker && clipboard.autoClicker.enabled === 1) {
        targetProf.autoClicker = JSON.parse(JSON.stringify(clipboard.autoClicker));
        pastedCount++;
      }

      if (state.config.activeProfile === targetProfileName) {
        state.config.textExpander = targetProf.textExpander;
        state.config.keyRemapper = targetProf.keyRemapper;
        state.config.appLauncher = targetProf.appLauncher;
        state.config.folderCreator = targetProf.folderCreator;
        state.config.macroRecorder = targetProf.macroRecorder;
        state.config.windowManager = targetProf.windowManager;
        state.config.mouseGestures = targetProf.mouseGestures;
        state.config.radialMenu = targetProf.radialMenu;
        state.config.autoClicker = targetProf.autoClicker;

        renderAll(true);
      } else {
        updateAllFeatureProfileBadges();
        syncConfig();
      }

      showToast(`Pasted active scripts from "${clipboard.sourceProfile}" into "${targetProfileName}"!`);
    }

    function showProfileContextMenu(e, pName) {
      const menu = document.getElementById('profileContextMenu');
      if (!menu) return;

      activeContextProfile = pName;
      const prof = (state.config && state.config.profiles && state.config.profiles[pName]) || {};
      const count = getProfileActiveScriptsCount(pName);

      const titleEl = document.getElementById('profileCtxTitle');
      const iconEl = document.getElementById('profileCtxIcon');
      const subEl = document.getElementById('profileCtxSub');
      const copyHintEl = document.getElementById('profileCtxCopyHint');
      const btnPaste = document.getElementById('btnCtxPasteProfile');
      const pasteHintEl = document.getElementById('profileCtxPasteHint');
      const btnSwitch = document.getElementById('btnCtxSwitchProfile');

      if (titleEl) titleEl.textContent = pName;
      if (iconEl) iconEl.innerHTML = getProfileIconHtml(pName, prof);
      if (subEl) subEl.textContent = `${count} active script${count === 1 ? '' : 's'}`;

      if (copyHintEl) {
        copyHintEl.textContent = count > 0
          ? `Copy ${count} active script${count === 1 ? '' : 's'} from this profile`
          : 'Copy active scripts from this profile';
      }

      const clipboard = profileScriptsClipboard || window.__profileScriptsClipboard;
      if (btnPaste) {
        if (!clipboard || !clipboard.sourceProfile) {
          btnPaste.classList.add('is-disabled');
          if (pasteHintEl) pasteHintEl.textContent = 'Clipboard is empty. Copy a profile first';
        } else {
          btnPaste.classList.remove('is-disabled');
          if (pasteHintEl) {
            pasteHintEl.textContent = `Apply ${clipboard.activeCount || 0} active script(s) from "${clipboard.sourceProfile}"`;
          }
        }
      }

      if (btnSwitch) {
        const isCur = (state.config && state.config.activeProfile === pName);
        btnSwitch.classList.toggle('is-disabled', isCur);
      }

      menu.style.display = 'flex';
      menu.classList.add('is-visible');
      const menuW = 270;
      const menuH = 190;
      let posX = e.clientX;
      let posY = e.clientY;

      if (posX + menuW > window.innerWidth - 10) {
        posX = window.innerWidth - menuW - 10;
      }
      if (posY + menuH > window.innerHeight - 10) {
        posY = window.innerHeight - menuH - 10;
      }
      posX = Math.max(10, posX);
      posY = Math.max(10, posY);

      menu.style.left = `${posX}px`;
      menu.style.top = `${posY}px`;
    }

    function closeProfileContextMenu() {
      const menu = document.getElementById('profileContextMenu');
      if (menu) {
        menu.classList.remove('is-visible');
        menu.style.display = 'none';
      }
      activeContextProfile = null;
    }

    function initProfileContextMenu() {
      const menu = document.getElementById('profileContextMenu');
      const btnCopy = document.getElementById('btnCtxCopyProfile');
      const btnPaste = document.getElementById('btnCtxPasteProfile');
      const btnSwitch = document.getElementById('btnCtxSwitchProfile');

      if (btnCopy) {
        btnCopy.addEventListener('click', (e) => {
          e.stopPropagation();
          if (activeContextProfile) {
            copyProfileActiveScripts(activeContextProfile);
          }
          closeProfileContextMenu();
        });
      }

      if (btnPaste) {
        btnPaste.addEventListener('click', (e) => {
          e.stopPropagation();
          if (activeContextProfile) {
            pasteProfileActiveScripts(activeContextProfile);
          }
          closeProfileContextMenu();
        });
      }

      if (btnSwitch) {
        btnSwitch.addEventListener('click', (e) => {
          e.stopPropagation();
          if (activeContextProfile && state.config && state.config.activeProfile !== activeContextProfile) {
            switchProfile(activeContextProfile);
          }
          closeProfileContextMenu();
        });
      }

      // Dismiss context menu on click-outside, escape, or resize
      function onDismissProfileMenu(e) {
        if (menu && menu.classList.contains('is-visible') && !menu.contains(e.target)) {
          closeProfileContextMenu();
        }
      }
      document.addEventListener('pointerdown', onDismissProfileMenu, true);
      document.addEventListener('mousedown', onDismissProfileMenu, true);
      document.addEventListener('click', onDismissProfileMenu, true);

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeProfileContextMenu();
      });

      window.addEventListener('resize', closeProfileContextMenu);
      window.addEventListener('scroll', closeProfileContextMenu, true);

      // Global right-click delegation
      document.addEventListener('contextmenu', (e) => {
        // 1. Profile cards in top ribbon
        const profCard = e.target.closest('.lgs-profile-card');
        if (profCard) {
          e.preventDefault();
          e.stopPropagation();
          closeScriptContextMenu();
          const pName = profCard.getAttribute('data-profile');
          if (pName) showProfileContextMenu(e, pName);
          return;
        }

        // 2. Script or item with switch / profile badge
        const scriptInfo = getScriptInfo(e.target);
        if (scriptInfo) {
          e.preventDefault();
          e.stopPropagation();
          closeProfileContextMenu();
          showScriptContextMenu(e, scriptInfo);
          return;
        }

        // 3. Normal profile badge fallback
        const badge = e.target.closest('.item-profile-badge');
        if (badge) {
          const pName = badge.getAttribute('data-switch-profile');
          if (pName) {
            e.preventDefault();
            e.stopPropagation();
            showProfileContextMenu(e, pName);
          }
        }
      });
    }

    // ============================================================================
    // Script / Switch Neumorphic Context Menu (Force on All Profiles)
    // ============================================================================

    let activeScriptContextInfo = null;

    function closeScriptContextMenu() {
      const menu = document.getElementById('scriptContextMenu');
      if (menu) {
        menu.classList.remove('is-visible');
        menu.style.display = 'none';
      }
      activeScriptContextInfo = null;
    }

    function getModuleDisplayName(mod) {
      switch (mod) {
        case 'textExpander': return 'Text Expander';
        case 'keyRemapper': return 'Key Remapper';
        case 'appLauncher': return 'App Launcher';
        case 'folderCreator': return 'Folder Creator';
        case 'macroRecorder': return 'Macro Recorder';
        case 'windowManager': return 'System Tools';
        case 'mouseGestures': return 'Gestures & Corners';
        case 'radialMenu': return 'Radial Menu';
        case 'autoClicker': return 'Auto Clicker';
        default: return mod;
      }
    }

    function getFeatureFriendlyTitle(mod, key) {
      const titles = {
        alwaysOnTopEnabled: 'Pin Always on Top',
        centerWindowEnabled: 'Center Active Window',
        hideWindowEnabled: 'Boss Key (Hide Window)',
        transparencyWheel: 'Scrollwheel Transparency',
        appVolumeWheel: 'Hover App Volume Wheel',
        appVolumeMuteEnabled: 'Mute Active App',
        masterAudioMuteEnabled: 'Mute Master Audio',
        windowShadeEnabled: 'Window Shade Roll-Up',
        borderlessEnabled: 'Borderless Fullscreen',
        textTransformEnabled: 'Text Case Transformer',
        textTransformCleanEnabled: 'Clean Plain Text',
        screenOcrEnabled: 'Instant Screen OCR',
        colorPickerEnabled: 'Color Picker Eyedropper',
        virtualDesktopsEnabled: 'Virtual Desktop Navigation',
        sleepEnabled: 'Quick Sleep / Hibernate',
        cornersEnabled: 'Screen Hot Corners',
        gesturesEnabled: 'Mouse Gestures',
        rockerEnabled: 'Rocker Gestures',
        wheelGestureEnabled: 'Gesture Wheel Action'
      };
      if (titles[key]) return titles[key];
      if (key === 'enabled') return mod === 'radialMenu' ? 'Radial Menu' : 'Auto Clicker';
      return key;
    }

    function resolveScriptInfo(moduleName, itemId, featureKey, cardEl, switchEl) {
      if (!state.config) return null;
      saveCurrentProfileState();
      const currentProfName = state.config.activeProfile || 'Default';
      const prof = (state.config.profiles && state.config.profiles[currentProfName]) || state.config;

      if (!switchEl && cardEl) {
        switchEl = cardEl.querySelector('.toggle-checkbox');
      }
      if (!switchEl && featureKey) {
        const def = FEATURE_SWITCH_DEFINITIONS.find(d => d.module === moduleName && d.key === featureKey);
        if (def) switchEl = document.getElementById(def.id);
      }

      if (itemId) {
        const items = (prof[moduleName] && prof[moduleName].items) || [];
        const item = items.find(i => i.id === itemId);
        if (!item) return null;

        let title = item.name || '';
        if (!title) {
          if (moduleName === 'textExpander') title = item.input ? `${item.input} → ${item.output.slice(0, 24)}` : 'Text Expander';
          else if (moduleName === 'keyRemapper') title = `${formatKeyDisplay(item.source)} → ${formatKeyDisplay(item.target)}`;
          else if (moduleName === 'appLauncher') title = item.trigger ? `${item.trigger} (Launch)` : (item.target || 'Launcher');
          else if (moduleName === 'folderCreator') title = item.trigger ? `${item.trigger} (Folder)` : 'Folder Creator';
          else if (moduleName === 'macroRecorder') title = item.trigger ? `${item.trigger} (Macro)` : 'Macro';
          else title = 'Script Item';
        }

        const modDisplayName = getModuleDisplayName(moduleName);
        const isForced = Boolean(item.forcedAllProfiles || item.allProfiles);
        const isEnabled = (item.enabled !== false && item.enabled !== 0);

        return {
          type: 'item',
          moduleName,
          itemId,
          featureKey: null,
          item,
          title,
          sub: modDisplayName,
          isForced,
          isEnabled,
          cardEl,
          switchEl
        };
      } else if (featureKey) {
        const mod = prof[moduleName] || {};
        let isEnabled = false;
        if (switchEl) {
          isEnabled = Boolean(switchEl.checked);
        } else if (featureKey === 'enabled' || featureKey === 'cornersEnabled' || featureKey === 'gesturesEnabled') {
          isEnabled = (mod[featureKey] !== false && mod[featureKey] !== 0);
        } else {
          isEnabled = (mod[featureKey] === 1 || mod[featureKey] === true);
        }

        const featureId = `${moduleName}.${featureKey}`;
        const isForced = Boolean((state.config.forcedFeatures && state.config.forcedFeatures[featureId]) ||
          (prof[moduleName] && prof[moduleName].forcedAllProfiles && prof[moduleName].forcedAllProfiles[featureKey]));

        const title = getFeatureFriendlyTitle(moduleName, featureKey);
        const modDisplayName = getModuleDisplayName(moduleName);

        return {
          type: 'feature',
          moduleName,
          itemId: null,
          featureKey,
          item: null,
          title,
          sub: modDisplayName,
          isForced,
          isEnabled,
          cardEl,
          switchEl
        };
      }

      return null;
    }

    function getScriptInfo(target) {
      if (!target) return null;

      // 1. Check if directly clicking a badge or badges container
      const badge = target.closest('.item-profile-badge, .item-profiles-badges');
      if (badge) {
        const mod = badge.dataset.module;
        const itemId = badge.dataset.id;
        const fKey = badge.dataset.featureKey;
        if (mod && (itemId || fKey)) {
          return resolveScriptInfo(mod, itemId, fKey, badge);
        }
        if (fKey) {
          const def = FEATURE_SWITCH_DEFINITIONS.find(d => d.key === fKey);
          if (def) return resolveScriptInfo(def.module, null, def.key, badge);
        }
      }

      // 2. Check if inside a card with data-module
      const card = target.closest('.shortcut-card, .key-remap-card, .app-card, .folder-card, .macro-card, .wm-card, .active-script-card');
      if (card) {
        const mod = card.dataset.module;
        const itemId = card.dataset.id;
        const fKey = card.dataset.featureKey;
        if (mod && (itemId || fKey)) {
          return resolveScriptInfo(mod, itemId, fKey, card);
        }

        // Check if card has a switch in FEATURE_SWITCH_DEFINITIONS
        const sw = card.querySelector('.toggle-checkbox');
        if (sw && sw.id) {
          const def = FEATURE_SWITCH_DEFINITIONS.find(d => d.id === sw.id);
          if (def) {
            return resolveScriptInfo(def.module, null, def.key, card, sw);
          }
        }
      }

      // 3. Check if inside a column header, column, or feature subcard
      // E.g. Screen Hot Corners, Mouse Stroke Gestures, Radial Menu, Rocker Gestures
      const featureContainer = target.closest('.mg-column-header, .mg-column, .rm-column-preview, .mg-config-subcard, .mg-title-group, .mg-header-meta');
      if (featureContainer) {
        const sw = featureContainer.querySelector('.toggle-checkbox') ||
          (featureContainer.closest('.mg-column, .mg-column-header') ? featureContainer.closest('.mg-column, .mg-column-header').querySelector('.toggle-checkbox') : null);
        if (sw && sw.id) {
          const def = FEATURE_SWITCH_DEFINITIONS.find(d => d.id === sw.id);
          if (def) {
            return resolveScriptInfo(def.module, null, def.key, featureContainer, sw);
          }
        }
      }

      // 4. Check if directly on or inside a toggle-wrapper
      const toggleWrap = target.closest('.toggle-wrapper');
      if (toggleWrap) {
        const sw = toggleWrap.querySelector('.toggle-checkbox');
        if (sw && sw.id) {
          const def = FEATURE_SWITCH_DEFINITIONS.find(d => d.id === sw.id);
          if (def) {
            return resolveScriptInfo(def.module, null, def.key, toggleWrap, sw);
          }
        }
        const parentCard = toggleWrap.closest('[data-module]');
        if (parentCard) {
          return resolveScriptInfo(parentCard.dataset.module, parentCard.dataset.id, parentCard.dataset.featureKey, parentCard, sw);
        }
      }

      // 5. Fallback for entire Radial Menu panel
      const rmPanel = target.closest('#panel-radialMenu');
      if (rmPanel) {
        const sw = document.getElementById('rmMasterSwitch');
        if (sw) return resolveScriptInfo('radialMenu', null, 'enabled', rmPanel, sw);
      }

      return null;
    }

    function showScriptContextMenu(e, info) {
      const menu = document.getElementById('scriptContextMenu');
      if (!menu || !info) return;

      closeProfileContextMenu();
      activeScriptContextInfo = info;

      const titleEl = document.getElementById('scriptCtxTitle');
      const subEl = document.getElementById('scriptCtxSub');
      const forceTitleEl = document.getElementById('scriptCtxForceTitle');
      const forceHintEl = document.getElementById('scriptCtxForceHint');
      const toggleTitleEl = document.getElementById('scriptCtxToggleTitle');
      const toggleHintEl = document.getElementById('scriptCtxToggleHint');

      if (titleEl) titleEl.textContent = info.title;
      if (subEl) {
        subEl.textContent = info.isForced
          ? `⚡ Forced on All Profiles • ${info.sub}`
          : `${info.sub} • Active in: ${state.config.activeProfile || 'Default'}`;
      }

      if (forceTitleEl) {
        forceTitleEl.textContent = info.isForced
          ? 'Unforce from All Profiles'
          : 'Force on All Profiles';
      }
      if (forceHintEl) {
        forceHintEl.textContent = info.isForced
          ? `Restore to run only in "${state.config.activeProfile || 'Default'}"`
          : 'Force this script to run active across every profile';
      }

      if (toggleTitleEl) {
        toggleTitleEl.textContent = info.isEnabled ? 'Turn Off Script' : 'Turn On Script';
      }
      if (toggleHintEl) {
        toggleHintEl.textContent = info.isEnabled ? 'Currently Active' : 'Currently Disabled';
      }

      menu.style.display = 'flex';
      menu.classList.add('is-visible');

      const menuW = 270;
      const menuH = 150;
      let posX = e.clientX;
      let posY = e.clientY;

      if (posX + menuW > window.innerWidth - 12) {
        posX = window.innerWidth - menuW - 12;
      }
      if (posY + menuH > window.innerHeight - 12) {
        posY = window.innerHeight - menuH - 12;
      }
      if (posX < 8) posX = 8;
      if (posY < 8) posY = 8;

      menu.style.left = `${posX}px`;
      menu.style.top = `${posY}px`;
    }

    function toggleForceScript(info) {
      if (!info) return;
      const newForcedState = !info.isForced;
      const profiles = state.config.profiles || {};
      const curProfName = state.config.activeProfile || 'Default';

      if (info.type === 'item') {
        const { moduleName, itemId } = info;
        const targetItem = info.item;
        targetItem.forcedAllProfiles = newForcedState;
        if (!state.config.forcedItemStates) state.config.forcedItemStates = {};
        if (newForcedState) {
          targetItem.enabled = 1;
          state.config.forcedItemStates[itemId] = 1;
        } else {
          delete state.config.forcedItemStates[itemId];
        }

        Object.keys(profiles).forEach(pName => {
          const p = profiles[pName];
          if (!p[moduleName]) p[moduleName] = { items: [] };
          if (!Array.isArray(p[moduleName].items)) p[moduleName].items = [];

          const existingIdx = p[moduleName].items.findIndex(i => i.id === itemId);
          if (newForcedState) {
            const cloned = JSON.parse(JSON.stringify(targetItem));
            cloned.enabled = 1;
            cloned.forcedAllProfiles = true;
            if (existingIdx !== -1) {
              p[moduleName].items[existingIdx] = cloned;
            } else {
              p[moduleName].items.unshift(cloned);
            }
          } else {
            if (existingIdx !== -1) {
              p[moduleName].items[existingIdx].forcedAllProfiles = false;
              if (pName !== curProfName) {
                p[moduleName].items[existingIdx].enabled = 0;
              }
            }
          }
        });

        if (state.config[moduleName] && Array.isArray(state.config[moduleName].items)) {
          const mem = state.config[moduleName].items.find(i => i.id === itemId);
          if (mem) {
            mem.forcedAllProfiles = newForcedState;
            if (newForcedState) mem.enabled = 1;
          }
        }

        if (info.cardEl) {
          updateCardProfileBadges(info.cardEl, moduleName, itemId);
          if (newForcedState) {
            info.cardEl.classList.remove('is-disabled');
            const sw = info.cardEl.querySelector('.toggle-checkbox');
            if (sw) sw.checked = true;
            const badge = info.cardEl.querySelector('.trigger-badge');
            if (badge) badge.classList.remove('is-disabled');
          }
        }

        showToast(newForcedState
          ? `⚡ "${info.title}" is now forced on ALL profiles!`
          : `"${info.title}" will now run only in "${curProfName}".`
        );
      } else if (info.type === 'feature') {
        const { moduleName, featureKey } = info;
        if (!state.config.forcedFeatures) state.config.forcedFeatures = {};
        const fId = `${moduleName}.${featureKey}`;
        state.config.forcedFeatures[fId] = newForcedState;

        Object.keys(profiles).forEach(pName => {
          const p = profiles[pName];
          if (!p[moduleName]) p[moduleName] = {};
          if (newForcedState) {
            p[moduleName][featureKey] = 1;
            p[moduleName].forcedAllProfiles = p[moduleName].forcedAllProfiles || {};
            p[moduleName].forcedAllProfiles[featureKey] = true;
          } else {
            if (p[moduleName].forcedAllProfiles) {
              delete p[moduleName].forcedAllProfiles[featureKey];
            }
            if (pName !== curProfName) {
              p[moduleName][featureKey] = 0;
            }
          }
        });

        if (state.config[moduleName]) {
          if (newForcedState) state.config[moduleName][featureKey] = 1;
        }

        if (info.switchEl) {
          if (newForcedState) {
            info.switchEl.checked = true;
            const col = info.switchEl.closest('.mg-column, .wm-card');
            if (col) col.classList.remove('is-disabled');
          }
        }

        updateAllFeatureProfileBadges();

        showToast(newForcedState
          ? `⚡ "${info.title}" is now forced on ALL profiles!`
          : `"${info.title}" will now run only in "${curProfName}".`
        );
      }

      saveCurrentProfileState();
      syncConfig();
      updateGlobalIndicators();
    }

    function initScriptContextMenu() {
      const menu = document.getElementById('scriptContextMenu');
      const btnForce = document.getElementById('btnCtxForceAllProfiles');
      const btnToggle = document.getElementById('btnCtxToggleScript');

      if (btnForce) {
        btnForce.addEventListener('click', (e) => {
          e.stopPropagation();
          if (activeScriptContextInfo) {
            toggleForceScript(activeScriptContextInfo);
          }
          closeScriptContextMenu();
        });
      }

      if (btnToggle) {
        btnToggle.addEventListener('click', (e) => {
          e.stopPropagation();
          if (activeScriptContextInfo && activeScriptContextInfo.switchEl) {
            activeScriptContextInfo.switchEl.checked = !activeScriptContextInfo.switchEl.checked;
            activeScriptContextInfo.switchEl.dispatchEvent(new Event('change'));
          }
          closeScriptContextMenu();
        });
      }

      function onDismissScriptMenu(e) {
        if (menu && menu.classList.contains('is-visible') && !menu.contains(e.target)) {
          closeScriptContextMenu();
        }
      }
      document.addEventListener('pointerdown', onDismissScriptMenu, true);
      document.addEventListener('mousedown', onDismissScriptMenu, true);
      document.addEventListener('click', onDismissScriptMenu, true);

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeScriptContextMenu();
      });

      window.addEventListener('resize', closeScriptContextMenu);
      window.addEventListener('scroll', closeScriptContextMenu, true);
    }

    function addItemAcrossProfiles(moduleName, item) {
      if (state.config && state.config.profiles) {
        const currentProf = state.config.activeProfile || 'Default';
        Object.keys(state.config.profiles).forEach(pName => {
          if (pName !== currentProf) {
            const prof = state.config.profiles[pName];
            if (prof && prof[moduleName] && Array.isArray(prof[moduleName].items)) {
              if (!prof[moduleName].items.some(i => i.id === item.id)) {
                prof[moduleName].items.unshift({ ...JSON.parse(JSON.stringify(item)), enabled: 0 });
              }
            }
          }
        });
      }
    }

    function deleteItemAcrossProfiles(moduleName, itemId) {
      if (state.config && state.config.profiles) {
        Object.keys(state.config.profiles).forEach(pName => {
          const prof = state.config.profiles[pName];
          if (prof && prof[moduleName] && Array.isArray(prof[moduleName].items)) {
            prof[moduleName].items = prof[moduleName].items.filter(i => i.id !== itemId);
          }
        });
      }
    }

    function updateItemAcrossProfiles(moduleName, updatedItem) {
      if (state.config && state.config.profiles) {
        const currentProf = state.config.activeProfile || 'Default';
        Object.keys(state.config.profiles).forEach(pName => {
          if (pName !== currentProf) {
            const prof = state.config.profiles[pName];
            if (prof && prof[moduleName] && Array.isArray(prof[moduleName].items)) {
              const idx = prof[moduleName].items.findIndex(i => i.id === updatedItem.id);
              if (idx !== -1) {
                const prevEnabled = prof[moduleName].items[idx].enabled;
                prof[moduleName].items[idx] = { ...JSON.parse(JSON.stringify(updatedItem)), enabled: prevEnabled };
              }
            }
          }
        });
      }
    }

    function updateAutoClickerUI() {
      const ac = (state.config && state.config.autoClicker) || {};

      // Mode: Recorder vs Clicker (Default to recorder)
      const mode = ac.mode || 'recorder';
      if (mouseModeSelector) {
        mouseModeSelector.querySelectorAll('.mouse-mode-btn').forEach(btn => {
          btn.classList.toggle('active', btn.dataset.mode === mode);
        });
      }
      if (acClickerSection) {
        acClickerSection.classList.toggle('hidden-field', mode !== 'clicker');
      }
      if (acRecorderSection) {
        acRecorderSection.classList.toggle('hidden-field', mode !== 'recorder');
      }
      if (mrListSection) {
        mrListSection.classList.toggle('hidden-field', mode !== 'recorder');
      }

      // Clicker UI
      if (acCpsSlider) {
        acCpsSlider.value = ac.cps || 20;
        if (acCpsValue) acCpsValue.textContent = `${ac.cps || 20} CPS`;
        updateSliderProgress(acCpsSlider);
      }
      if (acButtonSelector) {
        acButtonSelector.querySelectorAll('.ac-pill-btn').forEach(btn => {
          btn.classList.toggle('active', btn.dataset.val === ac.button);
        });
      }
      if (acTypeSelector) {
        acTypeSelector.querySelectorAll('.ac-pill-btn').forEach(btn => {
          btn.classList.toggle('active', btn.dataset.val === ac.clickType);
        });
      }

      // Recorder UI
      const tech = ac.recordTechnique || 'polling';
      if (techniquePolling) techniquePolling.classList.toggle('active', tech === 'polling');
      if (techniqueHook) techniqueHook.classList.toggle('active', tech === 'hook');
      if (mrActiveTechniqueTag) {
        mrActiveTechniqueTag.textContent = (tech === 'hook') ? 'Low-Level Hook' : 'High-Frequency Polling';
      }

      const pollingRate = ac.pollingRate || 20;
      if (mrPollingRateSelector) {
        mrPollingRateSelector.querySelectorAll('.ac-pill-btn').forEach(btn => {
          btn.classList.toggle('active', parseInt(btn.dataset.val, 10) === pollingRate);
        });
      }

      const pbSpeed = ac.playbackSpeed !== undefined ? parseFloat(ac.playbackSpeed) : 1.0;
      if (mrPlaybackSpeedSelector) {
        mrPlaybackSpeedSelector.querySelectorAll('.ac-pill-btn').forEach(btn => {
          btn.classList.toggle('active', parseFloat(btn.dataset.val) === pbSpeed);
        });
      }
      const mrPlaybackSpeedDisplay = document.getElementById('mrPlaybackSpeedDisplay');
      if (mrPlaybackSpeedDisplay) mrPlaybackSpeedDisplay.textContent = `${pbSpeed}x`;
      const mrPlaybackSpeedInput = document.getElementById('mrPlaybackSpeedInput');
      if (mrPlaybackSpeedInput) mrPlaybackSpeedInput.value = pbSpeed;

      const originMode = ac.originMode || 'absolute';
      if (mrOriginSelector) {
        mrOriginSelector.querySelectorAll('.ac-pill-btn').forEach(btn => {
          btn.classList.toggle('active', btn.dataset.val === originMode);
        });
      }

      const isInfinite = Boolean(ac.playbackInfinite);
      const repeatCount = (ac.playbackRepeatCount !== undefined) ? parseInt(ac.playbackRepeatCount, 10) : ((ac.playbackLoop !== undefined && ac.playbackLoop > 0) ? parseInt(ac.playbackLoop, 10) : 1);
      if (mrRepeatInfinite) {
        mrRepeatInfinite.checked = isInfinite;
      }
      if (mrRepeatCountInput) {
        mrRepeatCountInput.value = isInfinite ? '' : (repeatCount > 0 ? repeatCount : 1);
        mrRepeatCountInput.disabled = isInfinite;
        mrRepeatCountInput.placeholder = isInfinite ? '∞ Infinite' : '1';
      }

      if (mrRepeatBox) {
        mrRepeatBox.style.opacity = isInfinite ? '0.5' : '1';
      }

      // Advanced Playback Modifiers
      if (mrOptClicksOnly) mrOptClicksOnly.checked = Boolean(ac.clicksOnly);
      if (mrOptHumanize) mrOptHumanize.checked = Boolean(ac.humanize);
      if (mrOptBezier) mrOptBezier.checked = Boolean(ac.bezier);
      if (mrOptEmergencyStop) mrOptEmergencyStop.checked = (ac.emergencyStop !== undefined) ? Boolean(ac.emergencyStop) : true;
      if (mrOptRecordKeys) mrOptRecordKeys.checked = (ac.recordKeys !== undefined) ? Boolean(ac.recordKeys) : true;

      const countdown = (ac.countdown !== undefined) ? parseInt(ac.countdown, 10) : 0;
      if (mrCountdownSelector) {
        mrCountdownSelector.querySelectorAll('.ac-pill-btn').forEach(btn => {
          btn.classList.toggle('active', parseInt(btn.dataset.val, 10) === countdown);
        });
      }

      updateMouseRecorderStats();

      // Hotkey & Master Switch
      const hk = (ac.hotkey && String(ac.hotkey).trim() !== '') ? String(ac.hotkey).trim() : 'F8';
      if (acHotkeyLabel) {
        acHotkeyLabel.textContent = formatKeyDisplay(hk);
      }
      if (acHotkeyBox) {
        acHotkeyBox.title = `Click to record shortcut (Current: ${formatKeyDisplay(hk)})`;
      }
      if (mrHotkeyLabel) {
        mrHotkeyLabel.textContent = formatKeyDisplay(hk);
      }
      if (mrHotkeyBox) {
        mrHotkeyBox.title = `Click to record shortcut (Current: ${formatKeyDisplay(hk)})`;
      }
      if (mrRecordCountdownSelector) {
        const cd = String(ac.recordCountdown || 0);
        mrRecordCountdownSelector.querySelectorAll('.ac-pill-btn').forEach(btn => {
          btn.classList.toggle('active', btn.dataset.val === cd);
        });
      }
      const isEnabled = (ac.enabled === 1 || ac.enabled === true);
      if (acMasterSwitch) {
        acMasterSwitch.checked = isEnabled;
      }
      if (acContainer) {
        acContainer.classList.toggle('is-disabled', !isEnabled);
      }
      updateAutoClickerUi(state.autoClickerRunning);
      updateMouseRecorderUI();
    }

    function updateMouseRecorderStats(customEvents) {
      const ac = (state.config && state.config.autoClicker) || {};
      const events = Array.isArray(customEvents)
        ? customEvents
        : (Array.isArray(ac.recordedPath) && ac.recordedPath.length > 0
          ? ac.recordedPath
          : (ac.items && ac.items[0] && Array.isArray(ac.items[0].events) ? ac.items[0].events : []));
      let points = 0;
      let clicks = 0;
      let keys = 0;
      let totalDelay = 0;

      for (const ev of events) {
        if (ev.type === 'move') {
          points++;
        } else if (ev.type === 'click') {
          if (ev.action === 'Down' || ev.action === 'Click') clicks++;
        } else if (ev.type === 'key') {
          if (ev.action === 'Down') keys++;
        }
        totalDelay += (ev.delay || 0);
      }

      if (mrStatPoints) mrStatPoints.textContent = points;
      if (mrStatDuration) mrStatDuration.textContent = `${(totalDelay / 1000).toFixed(1)}s`;
      if (mrStatClicks) mrStatClicks.textContent = clicks;
      if (mrStatKeys) mrStatKeys.textContent = keys;
    }

    let mouseRecordingActive = false;
    let mousePlaybackActive = false;
    let mouseCountdownActive = false;
    let mouseCountdownSeconds = 0;

    function updateMouseRecorderUI() {
      const ac = (state.config && state.config.autoClicker) || {};
      const hk = (ac.hotkey && String(ac.hotkey).trim() !== '') ? String(ac.hotkey).trim() : 'F8';
      const hkDisplay = formatKeyDisplay(hk);

      if (mrRecordBtn) {
        mrRecordBtn.classList.toggle('running', mouseRecordingActive || mouseCountdownActive);
      }
      if (mrRecordBtnText) {
        if (mouseCountdownActive) {
          mrRecordBtnText.textContent = `STARTING IN ${mouseCountdownSeconds}s (ESC)`;
        } else if (mouseRecordingActive) {
          mrRecordBtnText.textContent = `STOP RECORDING (${hkDisplay} / ESC)`;
        } else {
          mrRecordBtnText.textContent = `RECORD PATH (${hkDisplay})`;
        }
      }
      if (mrPlayBtn) {
        mrPlayBtn.classList.toggle('running', mousePlaybackActive);
      }
      if (mrPlayBtnText) {
        mrPlayBtnText.textContent = mousePlaybackActive ? 'STOP PLAYING (ESC)' : 'PLAY BACK';
      }
      if (mrStatusHint) {
        if (mouseCountdownActive) {
          mrStatusHint.textContent = `Starting mouse recording in ${mouseCountdownSeconds}s... Press ESC or ${hkDisplay} to cancel.`;
        } else if (mouseRecordingActive) {
          mrStatusHint.textContent = `Recording mouse movement... Press ${hkDisplay} or ESC anywhere to stop.`;
        } else if (mousePlaybackActive) {
          mrStatusHint.textContent = `Playing back recorded path... Press ${hkDisplay} or ESC anywhere to stop.`;
        } else {
          mrStatusHint.textContent = `Ready - Press ${hkDisplay} anywhere or click Record Path to record mouse movement.`;
        }
      }
    }

    let profileModalMode = 'add'; // 'add' | 'edit' | 'rename' | 'delete'
    let cachedRunningApps = [];

    // Profile Trigger Mode: 'off' | 'focus' | 'hover'
    let modalTriggerMode = 'focus';
    let modalLastActiveTrigger = 'focus';

    function updateProfileTriggerModeUI(mode) {
      if (mode === 'off' || mode === 'focus' || mode === 'hover') {
        modalTriggerMode = mode;
        if (mode !== 'off') modalLastActiveTrigger = mode;
      } else if (typeof mode === 'boolean') {
        modalTriggerMode = mode ? modalLastActiveTrigger : 'off';
      }

      const profSwitchAutoSwitch = document.getElementById('profSwitchAutoSwitch');
      const chipTriggerFocus = document.getElementById('chipTriggerFocus');
      const chipTriggerHover = document.getElementById('chipTriggerHover');
      const profAutoSwitchPills = document.getElementById('profAutoSwitchPills');
      const profTriggerDesc = document.getElementById('profTriggerDesc');

      const isAutoOn = (modalTriggerMode !== 'off');
      if (profSwitchAutoSwitch) {
        profSwitchAutoSwitch.checked = isAutoOn;
      }

      if (profAutoSwitchPills) {
        profAutoSwitchPills.classList.toggle('disabled-pills', !isAutoOn);
      }

      if (chipTriggerFocus) {
        chipTriggerFocus.classList.toggle('active', modalTriggerMode === 'focus');
      }
      if (chipTriggerHover) {
        chipTriggerHover.classList.toggle('active', modalTriggerMode === 'hover');
      }

      if (profTriggerDesc) {
        if (!isAutoOn) {
          profTriggerDesc.textContent = 'Disabled. This profile will only be activated manually.';
        } else if (modalTriggerMode === 'focus') {
          profTriggerDesc.textContent = 'Active. Automatically switches to this profile whenever its target window gains focus.';
        } else if (modalTriggerMode === 'hover') {
          profTriggerDesc.textContent = 'Active. Automatically switches to this profile whenever your mouse cursor hovers over its window.';
        }
      }
    }

    function openProfileModal(mode) {
      profileModalMode = mode;
      const curName = (state.config && state.config.activeProfile) || 'Default';
      if (!profileModal) return;

      const profileConfigCard = document.getElementById('profileConfigCard');
      const profileDeleteNotice = document.getElementById('profileDeleteNotice');
      const profileNameGroup = document.getElementById('profileNameGroup');
      const defaultProfileBadgeNotice = document.getElementById('defaultProfileBadgeNotice');
      const profileExeGroup = document.getElementById('profileExeGroup');
      const profHoverRow = document.getElementById('profHoverRow');
      const profOsdRow = document.getElementById('profOsdRow');
      const profileAppsColumn = document.getElementById('profileAppsColumn');
      const profileInfoTip = document.getElementById('profileInfoTip');

      const profInputExe = document.getElementById('profInputExe');
      const profSwitchOsdIcon = document.getElementById('profSwitchOsdIcon');
      const runningAppsFilterInput = document.getElementById('runningAppsFilterInput');

      if (runningAppsFilterInput) runningAppsFilterInput.value = '';

      const isCompact = (mode === 'delete' || mode === 'rename');
      profileModal.classList.toggle('has-mode-delete', isCompact);

      if (mode === 'delete') {
        if (profileConfigCard) {
          profileConfigCard.classList.add('mode-delete');
          profileConfigCard.classList.remove('is-default-mode');
        }
        if (profileModalTitle) profileModalTitle.textContent = 'DELETE PROFILE';
        if (profileDeleteNotice) profileDeleteNotice.classList.remove('hidden-field');
        if (profileModalDesc) profileModalDesc.textContent = `Are you sure you want to delete profile "${curName}"?`;
        if (profileNameGroup) profileNameGroup.classList.add('hidden-field');
        if (defaultProfileBadgeNotice) defaultProfileBadgeNotice.classList.add('hidden-field');
        if (profileExeGroup) profileExeGroup.classList.add('hidden-field');
        if (profHoverRow) profHoverRow.classList.add('hidden-field');
        if (profOsdRow) profOsdRow.classList.add('hidden-field');
        if (profileAppsColumn) profileAppsColumn.classList.add('hidden-field');
        if (profileInfoTip) profileInfoTip.classList.add('hidden-field');
        if (btnConfirmProfileModal) {
          btnConfirmProfileModal.textContent = 'Delete Profile';
          btnConfirmProfileModal.classList.add('danger');
        }
      } else {
        const isDefault = (mode === 'edit' && curName === 'Default');
        if (profileConfigCard) {
          profileConfigCard.classList.toggle('mode-delete', isCompact);
          profileConfigCard.classList.toggle('is-default-mode', isDefault);
        }
        if (profileDeleteNotice) profileDeleteNotice.classList.add('hidden-field');
        if (profileNameGroup) profileNameGroup.classList.remove('hidden-field');
        if (profileExeGroup) profileExeGroup.classList.remove('hidden-field');
        if (profHoverRow) profHoverRow.classList.remove('hidden-field');
        if (profOsdRow) profOsdRow.classList.remove('hidden-field');
        if (profileAppsColumn) profileAppsColumn.classList.remove('hidden-field');
        if (profileInfoTip) profileInfoTip.classList.remove('hidden-field');
        if (btnConfirmProfileModal) {
          btnConfirmProfileModal.classList.remove('danger');
        }

        if (defaultProfileBadgeNotice) {
          defaultProfileBadgeNotice.classList.toggle('hidden-field', !isDefault);
        }
        if (profileExeGroup) {
          profileExeGroup.style.display = isDefault ? 'none' : 'flex';
        }
        if (profHoverRow) {
          profHoverRow.style.display = 'flex';
        }
        if (profOsdRow) {
          profOsdRow.style.display = isDefault ? 'none' : 'flex';
        }
        if (profileAppsColumn) {
          profileAppsColumn.style.display = isDefault ? 'none' : 'flex';
        }

        if (mode === 'add') {
          if (profileModalTitle) profileModalTitle.textContent = 'CREATE APP PROFILE';
          if (profileNameInput) {
            profileNameInput.value = '';
            profileNameInput.disabled = false;
            profileNameInput.placeholder = 'e.g. Chrome, Blender, Gaming, VS Code...';
          }
          if (profInputExe) {
            profInputExe.value = '';
            profInputExe.disabled = false;
          }
          updateProfileTriggerModeUI('focus');
          if (profSwitchOsdIcon) profSwitchOsdIcon.checked = true;
          if (btnConfirmProfileModal) btnConfirmProfileModal.textContent = 'Create Profile';
        } else if (mode === 'edit') {
          if (profileModalTitle) profileModalTitle.textContent = `CONFIGURE PROFILE: ${curName}`;
          if (profileNameInput) {
            profileNameInput.value = curName;
            profileNameInput.disabled = isDefault;
          }
          const prof = (state.config.profiles && state.config.profiles[curName]) || {};
          if (profInputExe) {
            profInputExe.value = prof.targetExe || '';
            profInputExe.disabled = isDefault;
          }

          const triggerEnabled = (typeof prof.switchTriggerEnabled !== 'undefined')
            ? Boolean(prof.switchTriggerEnabled)
            : true;

          let triggerMode = 'focus';
          if (!triggerEnabled) {
            triggerMode = 'off';
          } else if (prof.switchOnHover) {
            triggerMode = 'hover';
          } else {
            triggerMode = 'focus';
          }

          updateProfileTriggerModeUI(triggerMode);
          if (profSwitchOsdIcon) {
            profSwitchOsdIcon.checked = typeof prof.showOsdIcon !== 'undefined' ? Boolean(prof.showOsdIcon) : true;
          }
          if (btnConfirmProfileModal) btnConfirmProfileModal.textContent = 'Save Changes';
        } else if (mode === 'rename') {
          if (profileModalTitle) profileModalTitle.textContent = 'RENAME PROFILE';
          if (profileNameInput) {
            profileNameInput.value = curName;
            profileNameInput.disabled = false;
          }
          if (profileExeGroup) profileExeGroup.classList.add('hidden-field');
          if (profHoverRow) profHoverRow.classList.add('hidden-field');
          if (profOsdRow) profOsdRow.classList.add('hidden-field');
          if (profileAppsColumn) profileAppsColumn.classList.add('hidden-field');
          if (profileInfoTip) profileInfoTip.classList.add('hidden-field');
          if (btnConfirmProfileModal) btnConfirmProfileModal.textContent = 'Rename';
        }

        // Render immediately if cached running apps exist, then request fresh scan
        if (cachedRunningApps && cachedRunningApps.length > 0) {
          renderRunningAppsList();
        }
        sendToAhk('getRunningApps');
      }

      profileModal.style.display = '';
      profileModal.classList.remove('hidden-field');
      if (mode === 'add' && profileNameInput) {
        setTimeout(() => profileNameInput.focus(), 60);
      }
    }

    function closeProfileModal() {
      if (profileModal) {
        profileModal.classList.add('hidden-field');
        profileModal.style.display = 'none';
        profileModal.classList.remove('has-mode-delete');
      }
      const profileConfigCard = document.getElementById('profileConfigCard');
      if (profileConfigCard) {
        profileConfigCard.classList.remove('mode-delete');
        profileConfigCard.classList.remove('is-default-mode');
      }
      if (btnConfirmProfileModal) {
        btnConfirmProfileModal.classList.remove('danger');
        btnConfirmProfileModal.textContent = 'Save Profile';
      }
    }

    function handleProfileModalConfirm() {
      const curName = (state.config && state.config.activeProfile) || 'Default';
      const profInputExe = document.getElementById('profInputExe');
      const profSwitchOsdIcon = document.getElementById('profSwitchOsdIcon');
      const profSwitchAutoSwitch = document.getElementById('profSwitchAutoSwitch');

      const targetExe = profInputExe ? profInputExe.value.trim() : '';
      const switchTriggerEnabled = profSwitchAutoSwitch ? Boolean(profSwitchAutoSwitch.checked) : (modalTriggerMode !== 'off');
      const switchOnFocus = (modalTriggerMode === 'focus');
      const switchOnHover = (modalTriggerMode === 'hover');
      const showOsdIcon = profSwitchOsdIcon ? profSwitchOsdIcon.checked : true;

      if (profileModalMode === 'add') {
        const name = profileNameInput ? profileNameInput.value.trim() : '';
        if (!name) {
          if (profileNameInput) profileNameInput.focus();
          showToast('Please enter a name for the profile');
          return;
        }
        if (createNewProfile(name, targetExe, switchOnHover, showOsdIcon, switchTriggerEnabled, switchOnFocus)) {
          closeProfileModal();
        }
      } else if (profileModalMode === 'edit') {
        const newName = profileNameInput ? profileNameInput.value.trim() : curName;
        if (curName !== 'Default' && newName && newName !== curName) {
          renameProfile(curName, newName);
        }
        const actualName = (curName !== 'Default' && newName) ? newName : curName;
        if (updateProfileSettings(actualName, targetExe, switchOnHover, showOsdIcon, switchTriggerEnabled, switchOnFocus)) {
          closeProfileModal();
        }
      } else if (profileModalMode === 'rename') {
        const name = profileNameInput ? profileNameInput.value.trim() : '';
        if (!name) {
          if (profileNameInput) profileNameInput.focus();
          return;
        }
        if (renameProfile(curName, name)) {
          closeProfileModal();
        }
      } else if (profileModalMode === 'delete') {
        try {
          deleteProfile(curName);
        } finally {
          closeProfileModal();
        }
      }
    }

    function renderRunningAppsList(apps) {
      if (Array.isArray(apps)) cachedRunningApps = apps;
      const container = document.getElementById('runningAppsList');
      if (!container) return;

      const filterInput = document.getElementById('runningAppsFilterInput');
      const filter = (filterInput ? filterInput.value : '').trim().toLowerCase();

      const profInputExe = document.getElementById('profInputExe');
      const rawExeVal = profInputExe ? profInputExe.value : '';
      const selectedExes = rawExeVal.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);

      const filtered = (cachedRunningApps || []).filter(app => {
        if (!filter) return true;
        const t = (app.title || '').toLowerCase();
        const p = (app.process || '').toLowerCase();
        return t.includes(filter) || p.includes(filter);
      });

      if (filtered.length === 0) {
        container.innerHTML = `<div class="apps-empty-state">${cachedRunningApps.length === 0 ? 'No open eligible application windows found.' : 'No open windows match filter.'}</div>`;
        return;
      }

      container.innerHTML = '';
      filtered.forEach(app => {
        const cleanProc = (app.process || '').replace(/\.exe$/i, '');
        const isSelected = selectedExes.includes((app.process || '').toLowerCase());

        const card = document.createElement('div');
        card.className = `running-app-item-card ${isSelected ? 'is-selected' : ''}`;
        card.setAttribute('data-process', (app.process || '').toLowerCase());
        card.title = `${app.title}\nExecutable: ${app.process}\nClick to toggle binding for this profile`;

        card.innerHTML = `
        <div class="app-icon-thumb-box">
          <img class="app-icon-thumb-img" src="icons/${encodeURIComponent(cleanProc)}.png" alt="${cleanProc}" onerror="this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.style.display='flex';" />
          <div class="app-icon-thumb-fallback" style="display: none;">
            <svg class="icon-svg-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="8" y1="21" x2="16" y2="21"></line>
              <line x1="12" y1="17" x2="12" y2="21"></line>
            </svg>
          </div>
        </div>
        <div class="app-item-info">
          <div class="app-item-title-row">
            <span class="app-item-title">${escapeHtml(app.title || cleanProc)}</span>
            <span class="app-item-badge-assigned">
              <svg class="icon-svg-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg> Assigned
            </span>
          </div>
          <span class="app-item-exe-name">${escapeHtml(app.process || '')}</span>
        </div>
      `;

        card.addEventListener('click', () => {
          if (!profInputExe || profInputExe.disabled) return;
          const curList = profInputExe.value.split(',').map(s => s.trim()).filter(Boolean);
          const lowerList = curList.map(s => s.toLowerCase());
          const procLower = (app.process || '').toLowerCase();

          if (lowerList.includes(procLower)) {
            const updated = curList.filter(s => s.toLowerCase() !== procLower);
            profInputExe.value = updated.join(', ');
            card.classList.remove('is-selected');
          } else {
            curList.push(app.process);
            profInputExe.value = curList.join(', ');
            card.classList.add('is-selected');
          }

          // Auto-fill profile name if it's currently empty and in create mode
          if (profileModalMode === 'add' && profileNameInput && !profileNameInput.value.trim()) {
            profileNameInput.value = cleanProc.charAt(0).toUpperCase() + cleanProc.slice(1);
          }
        });

        container.appendChild(card);
      });
    }

    // ============================================================================
    // Tab Management
    // ============================================================================

    function updateTabsScrollButtons() {
      const bar = document.getElementById('segmentedBar');
      const btnLeft = document.getElementById('btnScrollTabsLeft');
      const btnRight = document.getElementById('btnScrollTabsRight');
      if (!bar) return;

      const isOverflowing = bar.scrollWidth > (bar.clientWidth + 4);
      if (btnLeft) {
        btnLeft.style.display = isOverflowing ? 'flex' : 'none';
        btnLeft.classList.toggle('disabled-scroll', bar.scrollLeft <= 2);
      }
      if (btnRight) {
        btnRight.style.display = isOverflowing ? 'flex' : 'none';
        btnRight.classList.toggle('disabled-scroll', bar.scrollLeft + bar.clientWidth >= bar.scrollWidth - 2);
      }
    }

    function updateSegmentedGlider(instant = false) {
      const segmentedBar = document.getElementById('segmentedBar');
      const glider = document.getElementById('segmentedGlider');
      if (!segmentedBar || !glider) return;

      const activeBtn = segmentedBar.querySelector('.segment-btn.active');
      if (!activeBtn) {
        glider.style.opacity = '0';
        return;
      }

      const left = activeBtn.offsetLeft;
      const width = activeBtn.offsetWidth;

      if (width === 0) {
        requestAnimationFrame(() => updateSegmentedGlider(instant));
        return;
      }

      if (instant) {
        glider.style.transition = 'none';
      } else {
        glider.style.transition = 'transform 0.32s cubic-bezier(0.25, 1, 0.5, 1), width 0.32s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.2s ease';
      }

      glider.style.transform = `translateX(${left}px)`;
      glider.style.width = `${width}px`;
      glider.style.opacity = '1';

      if (instant) {
        glider.offsetHeight;
        glider.style.transition = '';
      }

      updateTabsScrollButtons();
    }

    function switchTab(tabName, shouldSync = true) {
      if (typeof stopActiveBadgeRecording === 'function') stopActiveBadgeRecording(true);
      state.activeTab = tabName;
      const segmentedBar = document.getElementById('segmentedBar');
      let activeBtn = null;
      if (segmentedBar) {
        segmentedBar.querySelectorAll('.segment-btn').forEach(btn => {
          const isMatch = btn.dataset.tab === tabName;
          btn.classList.toggle('active', isMatch);
          if (isMatch) activeBtn = btn;
        });
      } else {
        document.querySelectorAll('.segment-btn').forEach(btn => {
          const isMatch = btn.dataset.tab === tabName;
          btn.classList.toggle('active', isMatch);
          if (isMatch) activeBtn = btn;
        });
      }
      document.querySelectorAll('.module-panel').forEach(panel => {
        panel.classList.toggle('active', panel.id === `panel-${tabName}`);
      });
      if (tabName === 'windowManager' || tabName === 'mouseGestures' || tabName === 'radialMenu') {
        updateAllFeatureProfileBadges();
        if (tabName === 'windowManager') {
          sendToAhk('getActiveAppVolume');
        }
        if (tabName === 'mouseGestures' || tabName === 'radialMenu') {
          refreshAllActionSelects();
        }
      }
      if (tabName === 'autoClicker') {
        updateAutoClickerUI();
        renderMouseScriptsList();
      }
      if (tabName === 'screenScanner') {
        renderScreenScanner();
        populateScannerActionDropdowns();
      }
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      }
      updateSegmentedGlider(false);
      if (shouldSync && isInitialized) {
        syncConfig();
      }
    }

    // ============================================================================
    // Module 1: Text Expander (with Multiline Support)
    // ============================================================================

    function toggleMultiline(force) {
      state.isMultiline = typeof force === 'boolean' ? force : !state.isMultiline;
      teToggleMultiline.classList.toggle('active', state.isMultiline);

      if (state.isMultiline) {
        teOutputContainer.classList.add('multiline-active');
        teInputOutput.classList.add('hidden-field');
        teTextareaOutput.classList.remove('hidden-field');
        if (teInputOutput.value && !teTextareaOutput.value) {
          teTextareaOutput.value = teInputOutput.value;
        }
        teTextareaOutput.focus();
      } else {
        teOutputContainer.classList.remove('multiline-active');
        teTextareaOutput.classList.add('hidden-field');
        teInputOutput.classList.remove('hidden-field');
        if (teTextareaOutput.value && !teInputOutput.value) {
          teInputOutput.value = teTextareaOutput.value.replace(/\n/g, ' ');
        }
        teInputOutput.focus();
      }
    }

