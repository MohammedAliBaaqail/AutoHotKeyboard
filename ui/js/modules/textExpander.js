    function renderTextExpander() {
      teShortcutsContainer.innerHTML = '';
      const items = state.config.textExpander.items || [];
      const query = (teSearchFilter.value || '').toLowerCase();

      const filtered = items.filter(item => {
        if (!query) return true;
        return item.input.toLowerCase().includes(query) || item.output.toLowerCase().includes(query);
      });

      if (filtered.length === 0) {
        teShortcutsContainer.innerHTML = `
        <div class="empty-state">
          <span>No text expanders configured</span>
          <span style="font-size: 11px;">Type trigger & snippet above and click GO</span>
        </div>
      `;
        return;
      }

      filtered.forEach(item => {
        const isEnabled = item.enabled !== false && item.enabled !== 0;
        const card = document.createElement('div');
        card.className = `shortcut-card ${isEnabled ? '' : 'is-disabled'} ${state.editingTeId === item.id ? 'editing' : ''}`;
        card.dataset.module = 'textExpander';
        card.dataset.id = item.id;

        const isMulti = item.multiline || item.output.includes('\n');
        const previewText = item.output.replace(/\n/g, ' \\n ');
        const profileBadgesHtml = renderItemProfileBadges('textExpander', item.id);

        card.innerHTML = `
        <div class="card-info">
          <span class="trigger-badge ${isEnabled ? '' : 'is-disabled'}">${escapeHtml(item.input)}</span>
          <span class="arrow-divider"><svg class="arrow-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg></span>
          <span class="expansion-text" title="${escapeHtml(item.output)}">${escapeHtml(previewText)}</span>
          ${isMulti ? '<span class="multiline-badge">Multiline</span>' : ''}
        </div>
        ${profileBadgesHtml}
        <div class="card-actions">
          <button class="card-btn btn-copy" title="Copy Replacement" data-id="${item.id}">
            <svg style="width:14px;height:14px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
          <button class="card-btn btn-edit" title="Edit Snippet" data-id="${item.id}">
            <svg style="width:14px;height:14px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button class="card-btn btn-delete" title="Delete Snippet" data-id="${item.id}">
            <svg style="width:14px;height:14px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
          <div class="toggle-wrapper" title="Enable / Disable Text Expander">
            <input class="toggle-checkbox te-switch" type="checkbox" ${isEnabled ? 'checked' : ''}>
            <div class="toggle-container">
              <div class="toggle-button"></div>
            </div>
          </div>
        </div>
      `;

        card.querySelector('.btn-copy').addEventListener('click', (e) => {
          e.stopPropagation();
          navigator.clipboard.writeText(item.output);
        });

        card.querySelector('.btn-edit').addEventListener('click', (e) => {
          e.stopPropagation();
          startEditTe(item);
        });

        card.querySelector('.btn-delete').addEventListener('click', (e) => {
          e.stopPropagation();
          deleteTe(item.id);
        });

        // Toggle switch logic
        const sw = card.querySelector('.te-switch');
        const badge = card.querySelector('.trigger-badge');
        sw.addEventListener('change', () => {
          const isChecked = sw.checked;
          onItemToggleStateChanged('textExpander', item, isChecked);
          card.classList.toggle('is-disabled', !isChecked);
          if (badge) badge.classList.toggle('is-disabled', !isChecked);
          syncConfig();
          updateCardProfileBadges(card, 'textExpander', item.id);
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

        teShortcutsContainer.appendChild(card);
      });
    }

    function submitTextExpander() {
      const trigger = teInputTrigger.value.trim();
      const output = state.isMultiline ? teTextareaOutput.value : teInputOutput.value;

      if (!trigger) {
        teInputTrigger.focus();
        return;
      }
      if (!output) {
        if (state.isMultiline) teTextareaOutput.focus();
        else teInputOutput.focus();
        return;
      }

      const items = state.config.textExpander.items;
      const isMulti = state.isMultiline || output.includes('\n');

      if (state.editingTeId) {
        const idx = items.findIndex(s => s.id === state.editingTeId);
        if (idx !== -1) {
          items[idx].input = trigger;
          items[idx].output = output;
          items[idx].multiline = isMulti;
          updateItemAcrossProfiles('textExpander', items[idx]);
        }
        state.editingTeId = null;
        teBtnSubmitText.textContent = 'GO';
      } else {
        const exists = items.find(s => s.input.toLowerCase() === trigger.toLowerCase());
        if (exists) {
          exists.output = output;
          exists.multiline = isMulti;
          updateItemAcrossProfiles('textExpander', exists);
        } else {
          const newItem = {
            id: 'te-' + Date.now(),
            input: trigger,
            output: output,
            multiline: isMulti,
            enabled: 1
          };
          items.unshift(newItem);
          addItemAcrossProfiles('textExpander', newItem);
        }
      }

      teInputTrigger.value = '';
      teInputOutput.value = '';
      teTextareaOutput.value = '';
      toggleMultiline(false);
      teInputTrigger.focus();

      renderTextExpander();
      syncConfig();
    }

    function startEditTe(item) {
      state.editingTeId = item.id;
      teInputTrigger.value = item.input;
      if (item.multiline || item.output.includes('\n')) {
        toggleMultiline(true);
        teTextareaOutput.value = item.output;
        teTextareaOutput.focus();
      } else {
        toggleMultiline(false);
        teInputOutput.value = item.output;
        teInputOutput.focus();
      }
      teBtnSubmitText.textContent = 'SAVE';
      renderTextExpander();
    }

    function deleteTe(id) {
      deleteItemAcrossProfiles('textExpander', id);
      state.config.textExpander.items = state.config.textExpander.items.filter(s => s.id !== id);
      if (state.editingTeId === id) {
        state.editingTeId = null;
        teInputTrigger.value = '';
        teInputOutput.value = '';
        teTextareaOutput.value = '';
        teBtnSubmitText.textContent = 'GO';
      }
      renderTextExpander();
      syncConfig();
    }

    // ============================================================================
    // Module 2: Key Remapper
    // ============================================================================

    function normalizeKeySource(src) {
      if (!src) return '';
      let s = String(src).trim().toLowerCase();

      // Expand leading AHK modifier symbols (^, !, +, #) if present
      if (/^[\^!+#]+/.test(s)) {
        const modMap = { '^': 'ctrl', '!': 'alt', '+': 'shift', '#': 'win' };
        const mods = [];
        let i = 0;
        while (i < s.length && modMap[s[i]]) {
          mods.push(modMap[s[i]]);
          i++;
        }
        const rest = s.slice(i).trim();
        if (rest) {
          mods.push(rest);
          s = mods.join('+');
        }
      }

      const tokens = s.split(/\s*\+\s*/).map(t => t.trim()).filter(Boolean);
      const modOrder = { 'ctrl': 1, 'control': 1, 'alt': 2, 'shift': 3, 'win': 4, 'meta': 4 };
      const mods = [];
      const keys = [];
      tokens.forEach(tok => {
        const canon = tok.toLowerCase();
        if (modOrder[canon]) {
          mods.push(canon === 'control' ? 'ctrl' : (canon === 'meta' ? 'win' : canon));
        } else {
          keys.push(canon);
        }
      });
      mods.sort((a, b) => modOrder[a] - modOrder[b]);
      return [...mods, ...keys].join('+');
    }

    function formatKeyDisplay(raw) {
      if (!raw || typeof raw !== 'string') return '';
      let s = raw.trim();
      if (!s) return '';
      if (s.startsWith('@') || s.startsWith(':*:') || s.startsWith('::')) return s;

      // Strip AHK hook/modifier prefixes like *, $, ~
      s = s.replace(/^[\*\$~]+/, '');

      const mods = [];
      let rest = s;
      const ahkModPattern = /^([<>]*[\^!+#]+)(.+)$/;
      const match = rest.match(ahkModPattern);
      if (match) {
        const syms = match[1];
        rest = match[2];
        for (let i = 0; i < syms.length; i++) {
          const ch = syms[i];
          if (ch === '^' && !mods.includes('Ctrl')) mods.push('Ctrl');
          else if (ch === '!' && !mods.includes('Alt')) mods.push('Alt');
          else if (ch === '+' && !mods.includes('Shift')) mods.push('Shift');
          else if (ch === '#' && !mods.includes('Win')) mods.push('Win');
        }
      }

      const tokens = rest.split(/\s*\+\s*/).map(t => t.trim()).filter(Boolean);
      const keys = [];
      const keyMap = {
        'ctrl': 'Ctrl', 'control': 'Ctrl',
        'alt': 'Alt', 'menu': 'Alt',
        'shift': 'Shift',
        'win': 'Win', 'windows': 'Win', 'meta': 'Win', 'cmd': 'Win',
        'capslock': 'CapsLock',
        'space': 'Space',
        'esc': 'Esc', 'escape': 'Esc',
        'enter': 'Enter', 'return': 'Enter',
        'tab': 'Tab',
        'backspace': 'Backspace', 'bs': 'Backspace',
        'delete': 'Delete', 'del': 'Del',
        'insert': 'Insert', 'ins': 'Ins',
        'home': 'Home', 'end': 'End',
        'pgup': 'PgUp', 'pageup': 'PgUp',
        'pgdn': 'PgDn', 'pagedown': 'PgDn',
        'up': 'Up', 'down': 'Down', 'left': 'Left', 'right': 'Right'
      };

      tokens.forEach(tok => {
        const lower = tok.toLowerCase();
        if (lower === 'ctrl' || lower === 'control') {
          if (!mods.includes('Ctrl')) mods.push('Ctrl');
        } else if (lower === 'alt' || lower === 'menu') {
          if (!mods.includes('Alt')) mods.push('Alt');
        } else if (lower === 'shift') {
          if (!mods.includes('Shift')) mods.push('Shift');
        } else if (lower === 'win' || lower === 'windows' || lower === 'meta' || lower === 'cmd') {
          if (!mods.includes('Win')) mods.push('Win');
        } else if (keyMap[lower]) {
          keys.push(keyMap[lower]);
        } else if (tok.length === 1) {
          keys.push(tok.toUpperCase());
        } else if (/^f\d{1,2}$/i.test(tok)) {
          keys.push(tok.toUpperCase());
        } else {
          keys.push(tok);
        }
      });

      const order = { 'Ctrl': 1, 'Alt': 2, 'Shift': 3, 'Win': 4 };
      mods.sort((a, b) => (order[a] || 99) - (order[b] || 99));
      const all = [...mods, ...keys];
      return all.length > 0 ? all.join(' + ') : raw;
    }

    function comboToAhk(combo) {
      if (!combo || typeof combo !== 'string') return '';
      const clean = combo.trim();
      if (!clean) return '';
      if (/^[\$*~<>\^!+#]+[A-Za-z0-9_]+$/.test(clean)) return clean;
      const parts = clean.split('+').map(p => p.trim());
      let mods = '';
      let key = '';
      for (const part of parts) {
        const lower = part.toLowerCase();
        if (lower === 'ctrl' || lower === 'control') mods += '^';
        else if (lower === 'alt' || lower === 'menu') mods += '!';
        else if (lower === 'shift') mods += '+';
        else if (lower === 'win' || lower === 'windows' || lower === 'meta' || lower === 'cmd') mods += '#';
        else {
          key = part;
        }
      }
      if (!key) return clean;
      return mods + key;
    }

    function isSameSourceKey(src1, src2) {
      if (!src1 || !src2) return false;
      return normalizeKeySource(src1) === normalizeKeySource(src2);
    }

