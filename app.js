// ============================================================================
// ResuCraft Pro — 100% Customizable Public Resume Studio Controller
// (Dynamic Headings, Unlimited Sections, Direct On-Paper Editing, Undo/Redo)
// ============================================================================

(function () {
  const OLD_STORAGE_KEY = 'resucraft_profiles_v1';
  const STORAGE_KEY = 'resucraft_public_v2';
  const THEME_KEY = 'resucraft_theme_v1';

  let appState = {
    activeProfileId: 'prof-default',
    profiles: {},
    zoom: 0.82,
    jdText: ''
  };

  // Undo / Redo History Stacks (stores serialized resume snapshots for active profile)
  const MAX_HISTORY = 40;
  let undoStack = [];
  let redoStack = [];
  let lastSavedSnapshot = '';
  let historyDebounceTimer = null;

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function esc(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function toHref(rawUrl) {
    if (!rawUrl) return '#';
    const trimmed = rawUrl.trim();
    if (/^https?:\/\//i.test(trimmed) || /^mailto:/i.test(trimmed)) return trimmed;
    return 'https://' + trimmed;
  }

  function showToast(msg) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.25s ease';
      setTimeout(() => toast.remove(), 260);
    }, 2400);
  }

  // ==========================================================================
  // Undo / Redo History Management
  // ==========================================================================
  function resetHistoryForCurrentProfile() {
    const r = getActiveResume();
    lastSavedSnapshot = r ? JSON.stringify(r) : '';
    undoStack = [];
    redoStack = [];
    updateUndoRedoButtons();
  }

  function recordHistoryImmediate() {
    clearTimeout(historyDebounceTimer);
    const r = getActiveResume();
    if (!r) return;
    const currentSnap = JSON.stringify(r);
    if (lastSavedSnapshot && currentSnap !== lastSavedSnapshot) {
      undoStack.push(lastSavedSnapshot);
      if (undoStack.length > MAX_HISTORY) undoStack.shift();
      redoStack = [];
      lastSavedSnapshot = currentSnap;
      updateUndoRedoButtons();
    }
  }

  function recordHistoryDebounced() {
    clearTimeout(historyDebounceTimer);
    historyDebounceTimer = setTimeout(() => {
      recordHistoryImmediate();
    }, 450);
  }

  function performUndo() {
    clearTimeout(historyDebounceTimer);
    const prof = getActiveProfile();
    if (!prof || undoStack.length === 0) return;
    const currentSnap = JSON.stringify(prof.resume);
    redoStack.push(currentSnap);
    const prevSnap = undoStack.pop();
    lastSavedSnapshot = prevSnap;
    prof.resume = JSON.parse(prevSnap);
    saveState();
    renderAll();
    updateUndoRedoButtons();
    showToast('↶ Undid last change');
  }

  function performRedo() {
    clearTimeout(historyDebounceTimer);
    const prof = getActiveProfile();
    if (!prof || redoStack.length === 0) return;
    const currentSnap = JSON.stringify(prof.resume);
    undoStack.push(currentSnap);
    const nextSnap = redoStack.pop();
    lastSavedSnapshot = nextSnap;
    prof.resume = JSON.parse(nextSnap);
    saveState();
    renderAll();
    updateUndoRedoButtons();
    showToast('↷ Redid change');
  }

  function updateUndoRedoButtons() {
    const btnU = document.getElementById('btnUndo');
    const btnR = document.getElementById('btnRedo');
    if (btnU) btnU.disabled = undoStack.length === 0;
    if (btnR) btnR.disabled = redoStack.length === 0;
  }

  // ==========================================================================
  // Load & Save State (Clean Public Blank Slate)
  // ==========================================================================
  function loadState() {
    try {
      localStorage.removeItem(OLD_STORAGE_KEY);
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.profiles && Object.keys(parsed.profiles).length > 0) {
          appState.profiles = parsed.profiles;
          appState.activeProfileId = parsed.activeProfileId && parsed.profiles[parsed.activeProfileId]
            ? parsed.activeProfileId
            : Object.keys(parsed.profiles)[0];
          appState.jdText = parsed.jdText || '';
          resetHistoryForCurrentProfile();
          return;
        }
      }
    } catch (e) {
      console.warn('Initializing fresh state:', e);
    }

    const defaultId = 'prof-default';
    appState.profiles = {
      [defaultId]: {
        id: defaultId,
        name: 'My Resume',
        updatedAt: Date.now(),
        resume: window.RESUCRAFT_DATA.createBlankResume()
      }
    };
    appState.activeProfileId = defaultId;
    appState.jdText = '';
    saveState();
    resetHistoryForCurrentProfile();
  }

  function saveState() {
    try {
      const activeProf = getActiveProfile();
      if (activeProf) activeProf.updatedAt = Date.now();
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        activeProfileId: appState.activeProfileId,
        profiles: appState.profiles,
        jdText: appState.jdText
      }));
      const pill = document.getElementById('saveStatusPill');
      if (pill) pill.textContent = '✓ Auto-Saved';
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  }

  function getActiveProfile() {
    return appState.profiles[appState.activeProfileId];
  }

  function getActiveResume() {
    const prof = getActiveProfile();
    return prof ? prof.resume : null;
  }

  // ==========================================================================
  // Multi-Resume Profile Manager
  // ==========================================================================
  function renderProfileSelect() {
    const sel = document.getElementById('profileSelect');
    if (!sel) return;
    sel.innerHTML = '';
    Object.values(appState.profiles).forEach(prof => {
      const opt = document.createElement('option');
      opt.value = prof.id;
      opt.textContent = prof.name;
      if (prof.id === appState.activeProfileId) opt.selected = true;
      sel.appendChild(opt);
    });
  }

  function createNewProfile() {
    const namePrompt = window.prompt('Enter a name for your new resume:', `Resume ${Object.keys(appState.profiles).length + 1}`);
    if (namePrompt === null) return;
    const name = namePrompt.trim() || `Resume ${Object.keys(appState.profiles).length + 1}`;
    const id = 'prof-' + Date.now();
    appState.profiles[id] = {
      id,
      name,
      updatedAt: Date.now(),
      resume: window.RESUCRAFT_DATA.createBlankResume()
    };
    appState.activeProfileId = id;
    saveState();
    resetHistoryForCurrentProfile();
    renderAll();
    showToast(`Created new blank resume "${name}"`);
  }

  function duplicateActiveProfile() {
    const current = getActiveProfile();
    if (!current) return;
    const id = 'prof-' + Date.now();
    const name = `${current.name} (Copy)`;
    appState.profiles[id] = {
      id,
      name,
      updatedAt: Date.now(),
      resume: clone(current.resume)
    };
    appState.activeProfileId = id;
    saveState();
    resetHistoryForCurrentProfile();
    renderAll();
    showToast(`Duplicated as "${name}"`);
  }

  function renameActiveProfile() {
    const current = getActiveProfile();
    if (!current) return;
    const nextName = window.prompt('Rename current resume:', current.name);
    if (nextName && nextName.trim()) {
      current.name = nextName.trim();
      saveState();
      renderProfileSelect();
      showToast('Resume renamed');
    }
  }

  function deleteActiveProfile() {
    const keys = Object.keys(appState.profiles);
    if (keys.length <= 1) {
      resetActiveResume();
      return;
    }
    const current = getActiveProfile();
    if (!window.confirm(`Delete resume "${current.name}"?`)) return;
    delete appState.profiles[current.id];
    appState.activeProfileId = Object.keys(appState.profiles)[0];
    saveState();
    resetHistoryForCurrentProfile();
    renderAll();
    showToast('Resume deleted');
  }

  function resetActiveResume() {
    if (!window.confirm('Clear all fields in the current resume and start fresh?')) return;
    const current = getActiveProfile();
    if (!current) return;
    current.resume = window.RESUCRAFT_DATA.createBlankResume();
    recordHistoryImmediate();
    saveState();
    renderAll();
    showToast('Cleared all resume data');
  }

  // ==========================================================================
  // Render Personal Info & Unlimited Custom Contact Fields
  // ==========================================================================
  function renderPersonalEditor() {
    const r = getActiveResume();
    if (!r) return;
    const p = r.personal || {};

    const fields = [
      ['inpFullName', 'fullName'],
      ['inpJobTitle', 'jobTitle'],
      ['inpEmail', 'email'],
      ['inpPhone', 'phone'],
      ['inpLocation', 'location'],
      ['inpWebsite', 'website'],
      ['inpLinkedin', 'linkedin'],
      ['inpGithub', 'github']
    ];

    fields.forEach(([elId, key]) => {
      const el = document.getElementById(elId);
      if (el && document.activeElement !== el) {
        el.value = p[key] || '';
      }
    });

    renderCustomLinksEditor();
  }

  function renderCustomLinksEditor() {
    const r = getActiveResume();
    const box = document.getElementById('customLinksContainer');
    if (!r || !box) return;
    r.personal.customLinks = r.personal.customLinks || [];

    box.innerHTML = r.personal.customLinks.map((lnk, idx) => `
      <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
        <input type="text" class="form-input custom-link-input" style="width: 35%;"
          data-link-idx="${idx}" data-link-key="label"
          value="${esc(lnk.label)}" placeholder="Label (e.g. Portfolio, Visa)" />
        <input type="text" class="form-input custom-link-input" style="flex: 1;"
          data-link-idx="${idx}" data-link-key="value"
          value="${esc(lnk.value)}" placeholder="Value or URL" />
        <button type="button" class="btn btn-sm btn-danger btn-del-custom-link" data-link-idx="${idx}" title="Delete Field">✕</button>
      </div>
    `).join('');
  }

  // ==========================================================================
  // Render Dynamic Sections & Headings Editor (#dynamicSectionsContainer)
  // ==========================================================================
  function renderBulletListEditorHTML(bullets, secIdx, itemIdx) {
    const list = Array.isArray(bullets) ? bullets : [];
    const itemAttr = itemIdx !== null && itemIdx !== undefined ? `data-item-idx="${itemIdx}"` : '';
    const idPrefix = `${secIdx}-${itemIdx !== null && itemIdx !== undefined ? itemIdx : 'sec'}`;

    return `
      <div class="bullets-container">
        <div class="form-label" style="margin-bottom: 6px;">
          <span>Bullet Points (Add, edit, reorder, or delete any bullet)</span>
        </div>
        ${list.map((b, bIdx) => {
          const isQuant = window.ATSEngine.hasQuantifiedMetric(b);
          const drawerId = `ai-drawer-${idPrefix}-${bIdx}`;
          return `
            <div class="bullet-row">
              <span class="bullet-index">•</span>
              <div class="bullet-input-wrap">
                <textarea class="form-textarea dyn-bullet-input"
                  data-sec-idx="${secIdx}" ${itemAttr} data-bullet-idx="${bIdx}"
                  rows="2"
                  placeholder="Enter achievement or responsibility bullet point...">${esc(b)}</textarea>
                <div class="bullet-meta-bar">
                  <div>
                    <span class="metric-badge ${isQuant ? 'quantified' : 'unquantified'}" id="badge-${idPrefix}-${bIdx}">
                      ${isQuant ? '✓ Quantified' : '⚠️ Add Metric (%, $, #)'}
                    </span>
                    <span id="char-${idPrefix}-${bIdx}" style="margin-left: 6px;">${(b || '').length} chars</span>
                  </div>
                  <div style="display: flex; gap: 4px;">
                    <button type="button" class="btn btn-sm btn-ai btn-dyn-enhance-bullet"
                      data-sec-idx="${secIdx}" ${itemAttr} data-bullet-idx="${bIdx}"
                      title="Generate stronger variations for this bullet">
                      ✨ Enhance
                    </button>
                    <button type="button" class="btn btn-sm btn-dyn-move-bullet"
                      data-sec-idx="${secIdx}" ${itemAttr} data-bullet-idx="${bIdx}" data-dir="-1" title="Move Bullet Up">↑</button>
                    <button type="button" class="btn btn-sm btn-dyn-move-bullet"
                      data-sec-idx="${secIdx}" ${itemAttr} data-bullet-idx="${bIdx}" data-dir="1" title="Move Bullet Down">↓</button>
                    <button type="button" class="btn btn-sm btn-danger btn-dyn-del-bullet"
                      data-sec-idx="${secIdx}" ${itemAttr} data-bullet-idx="${bIdx}" title="Delete Bullet">✕</button>
                  </div>
                </div>
                <div id="${drawerId}" class="ai-suggestions-drawer" style="display: none;"></div>
              </div>
            </div>
          `;
        }).join('')}
        <button type="button" class="btn btn-sm btn-dyn-add-bullet" data-sec-idx="${secIdx}" ${itemAttr} style="margin-top: 4px;">
          + Add Bullet Point
        </button>
      </div>
    `;
  }

  function renderSectionBodyEditorHTML(sec, secIdx) {
    if (sec.type === 'text') {
      return `
        <div class="form-group">
          <div class="form-label">
            <span>Section Text / Paragraph Content</span>
            <button type="button" class="btn btn-sm btn-ai btn-dyn-gen-summary" data-sec-idx="${secIdx}">✨ Generate Summary Templates</button>
          </div>
          <textarea class="form-textarea dyn-sec-text" data-sec-idx="${secIdx}" rows="3" placeholder="Write your summary, objective, or custom paragraph text here...">${esc(sec.content || '')}</textarea>
          <div id="sum-drawer-${secIdx}" style="display: none; margin-top: 8px;"></div>
        </div>
      `;
    }

    if (sec.type === 'bullets') {
      sec.bullets = Array.isArray(sec.bullets) ? sec.bullets : [''];
      return renderBulletListEditorHTML(sec.bullets, secIdx, null);
    }

    if (sec.type === 'detailed') {
      const items = Array.isArray(sec.items) ? sec.items : [];
      return `
        ${items.map((item, iIdx) => `
          <div class="entry-block">
            <div class="entry-block-header">
              <div class="entry-block-title">
                ${esc(item.title || `Entry #${iIdx + 1}`)} ${item.subtitle ? `— ${esc(item.subtitle)}` : ''}
              </div>
              <div class="entry-controls">
                <button type="button" class="btn btn-sm btn-dyn-move-item" data-sec-idx="${secIdx}" data-item-idx="${iIdx}" data-dir="-1" title="Move Entry Up">↑</button>
                <button type="button" class="btn btn-sm btn-dyn-move-item" data-sec-idx="${secIdx}" data-item-idx="${iIdx}" data-dir="1" title="Move Entry Down">↓</button>
                <button type="button" class="btn btn-sm btn-danger btn-dyn-del-item" data-sec-idx="${secIdx}" data-item-idx="${iIdx}" title="Delete Entry">🗑️ Delete Entry</button>
              </div>
            </div>
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">Title / Role / Project Name</label>
                <input type="text" class="form-input dyn-item-field" data-sec-idx="${secIdx}" data-item-idx="${iIdx}" data-key="title" value="${esc(item.title)}" placeholder="e.g. Job Title, Project Name, or Role" />
              </div>
              <div class="form-group">
                <label class="form-label">Organization / Company / Tech Stack</label>
                <input type="text" class="form-input dyn-item-field" data-sec-idx="${secIdx}" data-item-idx="${iIdx}" data-key="subtitle" value="${esc(item.subtitle)}" placeholder="e.g. Company Name or Technologies" />
              </div>
              <div class="form-group">
                <label class="form-label">Start Date</label>
                <input type="text" class="form-input dyn-item-field" data-sec-idx="${secIdx}" data-item-idx="${iIdx}" data-key="startDate" value="${esc(item.startDate)}" placeholder="e.g. Jan 2023" />
              </div>
              <div class="form-group">
                <label class="form-label">End Date</label>
                <input type="text" class="form-input dyn-item-field" data-sec-idx="${secIdx}" data-item-idx="${iIdx}" data-key="endDate" value="${esc(item.endDate)}" placeholder="e.g. Present" />
              </div>
              <div class="form-group">
                <label class="form-label">Location (Optional)</label>
                <input type="text" class="form-input dyn-item-field" data-sec-idx="${secIdx}" data-item-idx="${iIdx}" data-key="location" value="${esc(item.location)}" placeholder="City, Country or Remote" />
              </div>
              <div class="form-group">
                <label class="form-label">Link / URL (Optional)</label>
                <input type="text" class="form-input dyn-item-field" data-sec-idx="${secIdx}" data-item-idx="${iIdx}" data-key="link" value="${esc(item.link)}" placeholder="Project or reference URL" />
              </div>
            </div>
            ${renderBulletListEditorHTML(item.bullets || [], secIdx, iIdx)}
          </div>
        `).join('')}
        <button type="button" class="btn btn-primary btn-dyn-add-item" data-sec-idx="${secIdx}" style="width: 100%;">
          + Add Entry to "${esc(sec.title)}"
        </button>
      `;
    }

    if (sec.type === 'education') {
      const items = Array.isArray(sec.items) ? sec.items : [];
      return `
        ${items.map((item, iIdx) => `
          <div class="entry-block">
            <div class="entry-block-header">
              <div class="entry-block-title">${esc(item.institution || item.degree || `Education #${iIdx + 1}`)}</div>
              <div class="entry-controls">
                <button type="button" class="btn btn-sm btn-dyn-move-item" data-sec-idx="${secIdx}" data-item-idx="${iIdx}" data-dir="-1" title="Move Up">↑</button>
                <button type="button" class="btn btn-sm btn-dyn-move-item" data-sec-idx="${secIdx}" data-item-idx="${iIdx}" data-dir="1" title="Move Down">↓</button>
                <button type="button" class="btn btn-sm btn-danger btn-dyn-del-item" data-sec-idx="${secIdx}" data-item-idx="${iIdx}" title="Delete">🗑️ Delete</button>
              </div>
            </div>
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">Institution / School / University</label>
                <input type="text" class="form-input dyn-item-field" data-sec-idx="${secIdx}" data-item-idx="${iIdx}" data-key="institution" value="${esc(item.institution)}" placeholder="Enter institution name" />
              </div>
              <div class="form-group">
                <label class="form-label">Degree / Qualification / Major</label>
                <input type="text" class="form-input dyn-item-field" data-sec-idx="${secIdx}" data-item-idx="${iIdx}" data-key="degree" value="${esc(item.degree)}" placeholder="Enter degree or program" />
              </div>
              <div class="form-group">
                <label class="form-label">Date / Year</label>
                <input type="text" class="form-input dyn-item-field" data-sec-idx="${secIdx}" data-item-idx="${iIdx}" data-key="date" value="${esc(item.date)}" placeholder="e.g. 2020 – 2024" />
              </div>
              <div class="form-group">
                <label class="form-label">GPA / Percentage / Grade (Optional)</label>
                <input type="text" class="form-input dyn-item-field" data-sec-idx="${secIdx}" data-item-idx="${iIdx}" data-key="gpa" value="${esc(item.gpa)}" placeholder="e.g. 3.9/4.0 or 9.2 CGPA" />
              </div>
              <div class="form-group full-width">
                <label class="form-label">Location (Optional)</label>
                <input type="text" class="form-input dyn-item-field" data-sec-idx="${secIdx}" data-item-idx="${iIdx}" data-key="location" value="${esc(item.location)}" placeholder="City, State / Country" />
              </div>
              <div class="form-group full-width">
                <label class="form-label">Coursework / Honors / Details (Optional)</label>
                <input type="text" class="form-input dyn-item-field" data-sec-idx="${secIdx}" data-item-idx="${iIdx}" data-key="details" value="${esc(item.details)}" placeholder="Relevant coursework, honors, thesis, or activities" />
              </div>
            </div>
            ${renderBulletListEditorHTML(item.bullets || [], secIdx, iIdx)}
          </div>
        `).join('')}
        <button type="button" class="btn btn-primary btn-dyn-add-item" data-sec-idx="${secIdx}" style="width: 100%;">
          + Add Education Entry
        </button>
      `;
    }

    if (sec.type === 'skills') {
      const items = Array.isArray(sec.items) ? sec.items : [];
      return `
        ${items.map((item, iIdx) => `
          <div class="entry-block" style="padding: 10px;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <input type="text" class="form-input dyn-item-field" style="width: 34%; font-weight: 600;"
                data-sec-idx="${secIdx}" data-item-idx="${iIdx}" data-key="category"
                value="${esc(item.category)}" placeholder="Sub-heading (optional)" />
              <input type="text" class="form-input dyn-item-field" style="flex: 1;"
                data-sec-idx="${secIdx}" data-item-idx="${iIdx}" data-key="skillsText"
                value="${esc(item.skillsText)}" placeholder="Items (comma-separated)" />
              <button type="button" class="btn btn-sm btn-dyn-move-item" data-sec-idx="${secIdx}" data-item-idx="${iIdx}" data-dir="-1" title="Move Up">↑</button>
              <button type="button" class="btn btn-sm btn-dyn-move-item" data-sec-idx="${secIdx}" data-item-idx="${iIdx}" data-dir="1" title="Move Down">↓</button>
              <button type="button" class="btn btn-sm btn-danger btn-dyn-del-item" data-sec-idx="${secIdx}" data-item-idx="${iIdx}" title="Delete Row">✕</button>
            </div>
          </div>
        `).join('')}
        <button type="button" class="btn btn-primary btn-dyn-add-item" data-sec-idx="${secIdx}" style="width: 100%;">
          + Add Category / Skill Row
        </button>
      `;
    }

    if (sec.type === 'compact') {
      const items = Array.isArray(sec.items) ? sec.items : [];
      return `
        ${items.map((item, iIdx) => `
          <div class="entry-block">
            <div class="entry-block-header">
              <div class="entry-block-title">${esc(item.title || `Item #${iIdx + 1}`)}</div>
              <div class="entry-controls">
                <button type="button" class="btn btn-sm btn-dyn-move-item" data-sec-idx="${secIdx}" data-item-idx="${iIdx}" data-dir="-1" title="Move Up">↑</button>
                <button type="button" class="btn btn-sm btn-dyn-move-item" data-sec-idx="${secIdx}" data-item-idx="${iIdx}" data-dir="1" title="Move Down">↓</button>
                <button type="button" class="btn btn-sm btn-danger btn-dyn-del-item" data-sec-idx="${secIdx}" data-item-idx="${iIdx}" title="Delete Item">🗑️ Delete</button>
              </div>
            </div>
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">Title / Name</label>
                <input type="text" class="form-input dyn-item-field" data-sec-idx="${secIdx}" data-item-idx="${iIdx}" data-key="title" value="${esc(item.title)}" placeholder="Certification, Award, or Publication title" />
              </div>
              <div class="form-group">
                <label class="form-label">Issuer / Organization</label>
                <input type="text" class="form-input dyn-item-field" data-sec-idx="${secIdx}" data-item-idx="${iIdx}" data-key="issuer" value="${esc(item.issuer)}" placeholder="Issuing body or organization" />
              </div>
              <div class="form-group">
                <label class="form-label">Date / Year</label>
                <input type="text" class="form-input dyn-item-field" data-sec-idx="${secIdx}" data-item-idx="${iIdx}" data-key="date" value="${esc(item.date)}" placeholder="Year or date" />
              </div>
              <div class="form-group">
                <label class="form-label">Additional Details / Link</label>
                <input type="text" class="form-input dyn-item-field" data-sec-idx="${secIdx}" data-item-idx="${iIdx}" data-key="details" value="${esc(item.details)}" placeholder="Credential ID, link, or notes" />
              </div>
            </div>
          </div>
        `).join('')}
        <button type="button" class="btn btn-primary btn-dyn-add-item" data-sec-idx="${secIdx}" style="width: 100%;">
          + Add Item to "${esc(sec.title)}"
        </button>
      `;
    }

    return '';
  }

  function renderDynamicSectionsEditor() {
    const r = getActiveResume();
    const container = document.getElementById('dynamicSectionsContainer');
    if (!r || !container) return;

    r.sections = Array.isArray(r.sections) ? r.sections : [];

    if (r.sections.length === 0) {
      container.innerHTML = `
        <div class="editor-card" style="padding: 20px; text-align: center; color: var(--text-secondary);">
          No sections yet. Use the <strong>"➕ Add New Heading / Section"</strong> box above to add any section you want!
        </div>
      `;
      return;
    }

    container.innerHTML = r.sections.map((sec, secIdx) => `
      <div class="editor-card" id="sec-card-${sec.id}" data-sec-idx="${secIdx}">
        <div class="card-header" style="gap: 8px; cursor: default;">
          <div style="display: flex; align-items: center; gap: 8px; flex: 1;">
            <input type="checkbox" class="dyn-sec-vis" data-sec-idx="${secIdx}" ${sec.visible !== false ? 'checked' : ''} title="Show / Hide this section on resume" />
            <input type="text" class="form-input dyn-sec-heading-input"
              data-sec-idx="${secIdx}"
              value="${esc(sec.title)}"
              placeholder="Section Heading Name..."
              title="Edit Section Heading Name"
              style="font-weight: 700; font-size: 13.5px; padding: 4px 8px;" />
          </div>
          <div style="display: flex; align-items: center; gap: 4px;">
            <button type="button" class="btn btn-sm btn-dyn-move-sec" data-sec-idx="${secIdx}" data-dir="-1" title="Move Section Up">↑</button>
            <button type="button" class="btn btn-sm btn-dyn-move-sec" data-sec-idx="${secIdx}" data-dir="1" title="Move Section Down">↓</button>
            <button type="button" class="btn btn-sm btn-danger btn-dyn-del-sec" data-sec-idx="${secIdx}" title="Delete Entire Section / Heading">🗑️ Delete Heading</button>
            <button type="button" class="btn btn-sm btn-dyn-collapse-sec" data-card-id="sec-card-${sec.id}" title="Collapse / Expand">▼</button>
          </div>
        </div>
        <div class="card-body">
          ${renderSectionBodyEditorHTML(sec, secIdx)}
        </div>
      </div>
    `).join('');
  }

  // ==========================================================================
  // Render Design Controls
  // ==========================================================================
  function renderDesignControls() {
    const r = getActiveResume();
    if (!r) return;
    const s = r.settings || {};

    const tplGrid = document.getElementById('templateGridContainer');
    if (tplGrid) {
      tplGrid.innerHTML = window.RESUCRAFT_DATA.templates.map(t => `
        <div class="template-card ${s.template === t.id ? 'active' : ''}" data-template-id="${t.id}">
          <div class="template-card-top">
            <span class="template-name">${esc(t.name)}</span>
            <span class="template-badge">${esc(t.badge)}</span>
          </div>
          <div class="template-desc">${esc(t.desc)}</div>
        </div>
      `).join('');
    }

    const swatchBox = document.getElementById('colorSwatchContainer');
    if (swatchBox) {
      swatchBox.innerHTML = window.RESUCRAFT_DATA.colorSwatches.map(sw => `
        <button type="button" class="color-swatch ${s.accentColor === sw.hex ? 'active' : ''}"
          style="background-color: ${sw.hex};"
          data-color="${sw.hex}"
          title="${esc(sw.name)}"></button>
      `).join('');
    }

    const customCol = document.getElementById('inpCustomColor');
    if (customCol && s.accentColor) customCol.value = s.accentColor;

    const selFont = document.getElementById('selFontFamily');
    if (selFont && s.fontFamily) selFont.value = s.fontFamily;

    const selSize = document.getElementById('selFontSize');
    if (selSize && s.fontSize) selSize.value = s.fontSize;

    const rngLH = document.getElementById('rngLineHeight');
    const lblLH = document.getElementById('lblLineHeightVal');
    if (rngLH && s.lineHeight) {
      rngLH.value = s.lineHeight;
      if (lblLH) lblLH.textContent = s.lineHeight;
    }

    const rngGap = document.getElementById('rngSectionSpacing');
    const lblGap = document.getElementById('lblSectionSpacingVal');
    if (rngGap && s.sectionSpacing) {
      rngGap.value = s.sectionSpacing;
      if (lblGap) lblGap.textContent = s.sectionSpacing + 'px';
    }

    const rngMar = document.getElementById('rngPageMargin');
    const lblMar = document.getElementById('lblPageMarginVal');
    if (rngMar && s.pageMargin) {
      rngMar.value = s.pageMargin;
      if (lblMar) lblMar.textContent = s.pageMargin + 'mm';
    }

    const selPaper = document.getElementById('selPaperSize');
    if (selPaper && s.paperSize) selPaper.value = s.paperSize;

    const selAlign = document.getElementById('selHeaderAlign');
    if (selAlign && s.headerAlign) selAlign.value = s.headerAlign;

    const chkIcons = document.getElementById('chkShowIcons');
    if (chkIcons) chkIcons.checked = s.showIcons !== false;

    const chkLinks = document.getElementById('chkUnderlineLinks');
    if (chkLinks) chkLinks.checked = s.underlineLinks !== false;

    const chkPlace = document.getElementById('chkShowPlaceholders');
    if (chkPlace) chkPlace.checked = s.showEmptyPlaceholders !== false;
  }

  // ==========================================================================
  // Smart Empty-Detection Helpers (For Clean Print/PDF & Placeholder Hiding)
  // ==========================================================================
  function hasNonEmptyString(val) {
    return Boolean(val && String(val).trim().length > 0);
  }

  function hasSectionContent(sec) {
    if (!sec) return false;
    if (sec.type === 'text') return hasNonEmptyString(sec.content);
    if (sec.type === 'bullets') return (sec.bullets || []).some(hasNonEmptyString);
    if (sec.type === 'detailed') {
      return (sec.items || []).some(it =>
        hasNonEmptyString(it.title) ||
        hasNonEmptyString(it.subtitle) ||
        hasNonEmptyString(it.startDate) ||
        hasNonEmptyString(it.endDate) ||
        hasNonEmptyString(it.location) ||
        hasNonEmptyString(it.link) ||
        (it.bullets || []).some(hasNonEmptyString)
      );
    }
    if (sec.type === 'education') {
      return (sec.items || []).some(it =>
        hasNonEmptyString(it.institution) ||
        hasNonEmptyString(it.degree) ||
        hasNonEmptyString(it.date) ||
        hasNonEmptyString(it.gpa) ||
        hasNonEmptyString(it.location) ||
        hasNonEmptyString(it.details) ||
        (it.bullets || []).some(hasNonEmptyString)
      );
    }
    if (sec.type === 'skills') {
      return (sec.items || []).some(it => hasNonEmptyString(it.category) || hasNonEmptyString(it.skillsText));
    }
    if (sec.type === 'compact') {
      return (sec.items || []).some(it =>
        hasNonEmptyString(it.title) ||
        hasNonEmptyString(it.issuer) ||
        hasNonEmptyString(it.date) ||
        hasNonEmptyString(it.details)
      );
    }
    return false;
  }

  // ==========================================================================
  // Render Live Interactive Paper Preview (#resumeSheet) with Direct Editing!
  // ==========================================================================
  function renderCanvasToolbarHTML(secIdx, secType) {
    const canAddItem = secType !== 'text';
    return `
      <div class="r-canvas-toolbar" contenteditable="false">
        ${canAddItem ? `<button type="button" class="r-canvas-btn" data-canvas-action="add-item" data-sec-idx="${secIdx}" title="Add item to this section">+ Add</button>` : ''}
        <button type="button" class="r-canvas-btn" data-canvas-action="move-up" data-sec-idx="${secIdx}" title="Move Heading Up">↑</button>
        <button type="button" class="r-canvas-btn" data-canvas-action="move-down" data-sec-idx="${secIdx}" title="Move Heading Down">↓</button>
        <button type="button" class="r-canvas-btn danger" data-canvas-action="delete-sec" data-sec-idx="${secIdx}" title="Delete this Heading / Section">🗑️ Delete</button>
      </div>
    `;
  }

  function renderSectionOnPaperHTML(sec, secIdx) {
    const secEmptyClass = !hasSectionContent(sec) ? 'r-screen-only-placeholder' : '';
    const headingHTML = `
      <h2 class="r-section-title"
          contenteditable="true"
          data-edit-kind="sec-title"
          data-sec-idx="${secIdx}"
          data-placeholder="[Click to edit section heading]">${esc(sec.title)}</h2>
    `;

    const toolbarHTML = renderCanvasToolbarHTML(secIdx, sec.type);

    if (sec.type === 'text') {
      return `
        <section class="r-section ${secEmptyClass}" data-sec-idx="${secIdx}">
          ${toolbarHTML}
          ${headingHTML}
          <div class="r-section-body">
            <div class="r-summary-text"
                 contenteditable="true"
                 data-edit-kind="sec-text"
                 data-sec-idx="${secIdx}"
                 data-placeholder="Click here to type your ${esc(sec.title || 'content')}...">${esc(sec.content || '')}</div>
          </div>
        </section>
      `;
    }

    if (sec.type === 'bullets') {
      const bullets = Array.isArray(sec.bullets) && sec.bullets.length ? sec.bullets : [''];
      return `
        <section class="r-section ${secEmptyClass}" data-sec-idx="${secIdx}">
          ${toolbarHTML}
          ${headingHTML}
          <div class="r-section-body">
            <ul class="r-bullets">
              ${bullets.map((b, bIdx) => `
                <li class="${!hasNonEmptyString(b) ? 'r-screen-only-placeholder' : ''}"
                    contenteditable="true"
                    data-edit-kind="sec-bullet"
                    data-sec-idx="${secIdx}"
                    data-bullet-idx="${bIdx}"
                    data-placeholder="Click to enter bullet point (Press Enter for new bullet)...">${esc(b)}</li>
              `).join('')}
            </ul>
          </div>
        </section>
      `;
    }

    if (sec.type === 'detailed') {
      const items = Array.isArray(sec.items) ? sec.items : [];
      return `
        <section class="r-section ${secEmptyClass}" data-sec-idx="${secIdx}">
          ${toolbarHTML}
          ${headingHTML}
          <div class="r-section-body">
            ${items.map((it, iIdx) => {
              const bullets = Array.isArray(it.bullets) ? it.bullets : [];
              const hasSub = hasNonEmptyString(it.subtitle);
              const hasStart = hasNonEmptyString(it.startDate);
              const hasEnd = hasNonEmptyString(it.endDate);
              const hasLoc = hasNonEmptyString(it.location);
              const itemEmpty = !hasNonEmptyString(it.title) && !hasSub && !hasStart && !hasEnd && !hasLoc && !bullets.some(hasNonEmptyString);

              return `
                <div class="r-entry ${itemEmpty ? 'r-screen-only-placeholder' : ''}">
                  <div class="r-entry-top">
                    <div>
                      <span class="r-entry-title"
                            contenteditable="true"
                            data-edit-kind="item-field"
                            data-sec-idx="${secIdx}"
                            data-item-idx="${iIdx}"
                            data-key="title"
                            data-placeholder="[Role / Title]">${esc(it.title)}</span>
                      <span class="r-sep ${!hasSub ? 'r-screen-only-placeholder' : ''}"> — </span>
                      <span class="r-entry-subtitle ${!hasSub ? 'r-screen-only-placeholder' : ''}"
                            contenteditable="true"
                            data-edit-kind="item-field"
                            data-sec-idx="${secIdx}"
                            data-item-idx="${iIdx}"
                            data-key="subtitle"
                            data-placeholder="[Company / Organization / Tech]">${esc(it.subtitle)}</span>
                      ${it.link ? ` • <a class="r-link" href="${esc(toHref(it.link))}" target="_blank" rel="noopener" style="color: var(--resume-accent); font-size: 0.9em;">${esc(it.link)}</a>` : ''}
                    </div>
                    <div class="r-entry-meta">
                      <span class="${!hasStart ? 'r-screen-only-placeholder' : ''}"
                            contenteditable="true"
                            data-edit-kind="item-field"
                            data-sec-idx="${secIdx}"
                            data-item-idx="${iIdx}"
                            data-key="startDate"
                            data-placeholder="[Start Date]">${esc(it.startDate)}</span>
                      <span class="${(!hasStart || !hasEnd) ? 'r-screen-only-placeholder' : ''}"> – </span>
                      <span class="${!hasEnd ? 'r-screen-only-placeholder' : ''}"
                            contenteditable="true"
                            data-edit-kind="item-field"
                            data-sec-idx="${secIdx}"
                            data-item-idx="${iIdx}"
                            data-key="endDate"
                            data-placeholder="[End Date]">${esc(it.endDate)}</span>
                      <span class="${!hasLoc ? 'r-screen-only-placeholder' : ''}"> | </span>
                      <span class="${!hasLoc ? 'r-screen-only-placeholder' : ''}"
                            contenteditable="true"
                            data-edit-kind="item-field"
                            data-sec-idx="${secIdx}"
                            data-item-idx="${iIdx}"
                            data-key="location"
                            data-placeholder="[Location]">${esc(it.location)}</span>
                    </div>
                  </div>
                  ${bullets.length ? `
                    <ul class="r-bullets">
                      ${bullets.map((b, bIdx) => `
                        <li class="${!hasNonEmptyString(b) ? 'r-screen-only-placeholder' : ''}"
                            contenteditable="true"
                            data-edit-kind="item-bullet"
                            data-sec-idx="${secIdx}"
                            data-item-idx="${iIdx}"
                            data-bullet-idx="${bIdx}"
                            data-placeholder="Click to enter achievement (Press Enter for new bullet)...">${esc(b)}</li>
                      `).join('')}
                    </ul>
                  ` : ''}
                </div>
              `;
            }).join('')}
          </div>
        </section>
      `;
    }

    if (sec.type === 'education') {
      const items = Array.isArray(sec.items) ? sec.items : [];
      return `
        <section class="r-section ${secEmptyClass}" data-sec-idx="${secIdx}">
          ${toolbarHTML}
          ${headingHTML}
          <div class="r-section-body">
            ${items.map((ed, iIdx) => {
              const bullets = Array.isArray(ed.bullets) ? ed.bullets : [];
              const hasDeg = hasNonEmptyString(ed.degree);
              const hasGpa = hasNonEmptyString(ed.gpa);
              const hasDate = hasNonEmptyString(ed.date);
              const hasLoc = hasNonEmptyString(ed.location);
              const hasDet = hasNonEmptyString(ed.details);
              const itemEmpty = !hasNonEmptyString(ed.institution) && !hasDeg && !hasDate && !hasGpa && !hasLoc && !hasDet && !bullets.some(hasNonEmptyString);

              return `
                <div class="r-entry ${itemEmpty ? 'r-screen-only-placeholder' : ''}">
                  <div class="r-entry-top">
                    <div>
                      <span class="r-entry-title"
                            contenteditable="true"
                            data-edit-kind="item-field"
                            data-sec-idx="${secIdx}"
                            data-item-idx="${iIdx}"
                            data-key="institution"
                            data-placeholder="[Institution / University]">${esc(ed.institution)}</span>
                      <span class="r-sep ${!hasDeg ? 'r-screen-only-placeholder' : ''}"> — </span>
                      <span class="r-entry-subtitle ${!hasDeg ? 'r-screen-only-placeholder' : ''}"
                            contenteditable="true"
                            data-edit-kind="item-field"
                            data-sec-idx="${secIdx}"
                            data-item-idx="${iIdx}"
                            data-key="degree"
                            data-placeholder="[Degree / Major]">${esc(ed.degree)}</span>
                      <span class="r-entry-subtitle ${!hasGpa ? 'r-screen-only-placeholder' : ''}">
                        (GPA: <span contenteditable="true" data-edit-kind="item-field" data-sec-idx="${secIdx}" data-item-idx="${iIdx}" data-key="gpa" data-placeholder="[GPA]">${esc(ed.gpa)}</span>)
                      </span>
                    </div>
                    <div class="r-entry-meta">
                      <span class="${!hasDate ? 'r-screen-only-placeholder' : ''}"
                            contenteditable="true"
                            data-edit-kind="item-field"
                            data-sec-idx="${secIdx}"
                            data-item-idx="${iIdx}"
                            data-key="date"
                            data-placeholder="[Graduation Date]">${esc(ed.date)}</span>
                      <span class="${!hasLoc ? 'r-screen-only-placeholder' : ''}"> | </span>
                      <span class="${!hasLoc ? 'r-screen-only-placeholder' : ''}"
                            contenteditable="true"
                            data-edit-kind="item-field"
                            data-sec-idx="${secIdx}"
                            data-item-idx="${iIdx}"
                            data-key="location"
                            data-placeholder="[Location]">${esc(ed.location)}</span>
                    </div>
                  </div>
                  <div class="${!hasDet ? 'r-screen-only-placeholder' : ''}"
                       style="font-size: 0.92em; color: #374151; margin-top: 2px;"
                       contenteditable="true"
                       data-edit-kind="item-field"
                       data-sec-idx="${secIdx}"
                       data-item-idx="${iIdx}"
                       data-key="details"
                       data-placeholder="[Click to add coursework, honors, or societies...]">${esc(ed.details)}</div>
                  ${bullets.length ? `
                    <ul class="r-bullets">
                      ${bullets.map((b, bIdx) => `
                        <li class="${!hasNonEmptyString(b) ? 'r-screen-only-placeholder' : ''}"
                            contenteditable="true"
                            data-edit-kind="item-bullet"
                            data-sec-idx="${secIdx}"
                            data-item-idx="${iIdx}"
                            data-bullet-idx="${bIdx}"
                            data-placeholder="Click to enter detail...">${esc(b)}</li>
                      `).join('')}
                    </ul>
                  ` : ''}
                </div>
              `;
            }).join('')}
          </div>
        </section>
      `;
    }

    if (sec.type === 'skills') {
      const items = Array.isArray(sec.items) ? sec.items : [];
      return `
        <section class="r-section ${secEmptyClass}" data-sec-idx="${secIdx}">
          ${toolbarHTML}
          ${headingHTML}
          <div class="r-section-body r-skills-grid">
            ${items.map((sk, iIdx) => {
              const hasCat = hasNonEmptyString(sk.category);
              const hasTxt = hasNonEmptyString(sk.skillsText);
              const rowEmpty = !hasCat && !hasTxt;
              return `
                <div class="r-skill-row ${rowEmpty ? 'r-screen-only-placeholder' : ''}">
                  <span class="r-skill-cat ${!hasCat ? 'r-screen-only-placeholder' : ''}"
                        contenteditable="true"
                        data-edit-kind="item-field"
                        data-sec-idx="${secIdx}"
                        data-item-idx="${iIdx}"
                        data-key="category"
                        data-placeholder="[Category]">${esc(sk.category)}</span><span class="${!hasCat ? 'r-screen-only-placeholder' : ''}">: </span>
                  <span class="r-skill-items"
                        contenteditable="true"
                        data-edit-kind="item-field"
                        data-sec-idx="${secIdx}"
                        data-item-idx="${iIdx}"
                        data-key="skillsText"
                        data-placeholder="[Click to enter skills, tools, or items...]">${esc(sk.skillsText)}</span>
                </div>
              `;
            }).join('')}
          </div>
        </section>
      `;
    }

    if (sec.type === 'compact') {
      const items = Array.isArray(sec.items) ? sec.items : [];
      return `
        <section class="r-section ${secEmptyClass}" data-sec-idx="${secIdx}">
          ${toolbarHTML}
          ${headingHTML}
          <div class="r-section-body">
            ${items.map((c, iIdx) => {
              const hasIss = hasNonEmptyString(c.issuer);
              const hasDet = hasNonEmptyString(c.details);
              const hasDate = hasNonEmptyString(c.date);
              const itemEmpty = !hasNonEmptyString(c.title) && !hasIss && !hasDet && !hasDate;
              return `
                <div class="r-entry ${itemEmpty ? 'r-screen-only-placeholder' : ''}" style="margin-bottom: 5px;">
                  <div class="r-entry-top">
                    <div>
                      <span class="r-entry-title"
                            contenteditable="true"
                            data-edit-kind="item-field"
                            data-sec-idx="${secIdx}"
                            data-item-idx="${iIdx}"
                            data-key="title"
                            data-placeholder="[Certification / Award / Item Title]">${esc(c.title)}</span>
                      <span class="r-sep ${!hasIss ? 'r-screen-only-placeholder' : ''}"> — </span>
                      <span class="r-entry-subtitle ${!hasIss ? 'r-screen-only-placeholder' : ''}"
                            contenteditable="true"
                            data-edit-kind="item-field"
                            data-sec-idx="${secIdx}"
                            data-item-idx="${iIdx}"
                            data-key="issuer"
                            data-placeholder="[Issuer / Organization]">${esc(c.issuer)}</span>
                      <span class="${!hasDet ? 'r-screen-only-placeholder' : ''}" style="font-size: 0.9em; color: #4b5563;">
                        (<span contenteditable="true" data-edit-kind="item-field" data-sec-idx="${secIdx}" data-item-idx="${iIdx}" data-key="details" data-placeholder="[Details]">${esc(c.details)}</span>)
                      </span>
                    </div>
                    <div class="r-entry-meta ${!hasDate ? 'r-screen-only-placeholder' : ''}"
                         contenteditable="true"
                         data-edit-kind="item-field"
                         data-sec-idx="${secIdx}"
                         data-item-idx="${iIdx}"
                         data-key="date"
                         data-placeholder="[Date]">${esc(c.date)}</div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </section>
      `;
    }

    return '';
  }

  function renderResumePreview() {
    const r = getActiveResume();
    const sheet = document.getElementById('resumeSheet');
    if (!r || !sheet) return;

    const s = r.settings || {};
    const p = r.personal || {};

    const tplClass = `template-${s.template || 'classic-ats'}`;
    const sizeClass = `size-${s.fontSize || 'medium'}`;
    const paperClass = s.paperSize === 'letter' ? 'paper-letter' : 'paper-a4';
    const linkClass = s.underlineLinks !== false ? 'underline-links' : '';
    const placeClass = s.showEmptyPlaceholders === false ? 'hide-placeholders' : '';

    sheet.className = `resume-sheet ${tplClass} ${sizeClass} ${paperClass} ${linkClass} ${placeClass}`;
    sheet.style.setProperty('--resume-font', s.fontFamily || "'Inter', sans-serif");
    sheet.style.setProperty('--resume-accent', s.accentColor || '#1d4ed8');
    sheet.style.setProperty('--resume-line-height', s.lineHeight || '1.42');
    sheet.style.setProperty('--resume-section-gap', (s.sectionSpacing || '14') + 'px');
    sheet.style.setProperty('--resume-margin', (s.pageMargin || '14') + 'mm');

    const pageBreakEl = document.getElementById('pageBreakIndicator');
    if (pageBreakEl) {
      pageBreakEl.style.top = s.paperSize === 'letter' ? '279.4mm' : '297mm';
    }

    const showIcons = s.showIcons !== false;
    const contactParts = [];

    if (p.location || s.showEmptyPlaceholders !== false) {
      contactParts.push(`<span class="r-contact-item ${!p.location ? 'r-screen-only-placeholder' : ''}">${showIcons ? '📍 ' : ''}<span contenteditable="true" data-edit-kind="personal" data-key="location" data-placeholder="[Location]">${esc(p.location)}</span></span>`);
    }
    if (p.email || s.showEmptyPlaceholders !== false) {
      contactParts.push(`<span class="r-contact-item ${!p.email ? 'r-screen-only-placeholder' : ''}">${showIcons ? '✉️ ' : ''}<span contenteditable="true" data-edit-kind="personal" data-key="email" data-placeholder="[Email]">${esc(p.email)}</span></span>`);
    }
    if (p.phone || s.showEmptyPlaceholders !== false) {
      contactParts.push(`<span class="r-contact-item ${!p.phone ? 'r-screen-only-placeholder' : ''}">${showIcons ? '📞 ' : ''}<span contenteditable="true" data-edit-kind="personal" data-key="phone" data-placeholder="[Phone]">${esc(p.phone)}</span></span>`);
    }
    if (p.website) {
      contactParts.push(`<span class="r-contact-item">${showIcons ? '🌐 ' : ''}<span contenteditable="true" data-edit-kind="personal" data-key="website">${esc(p.website)}</span></span>`);
    }
    if (p.linkedin) {
      contactParts.push(`<span class="r-contact-item">${showIcons ? '🔗 ' : ''}<span contenteditable="true" data-edit-kind="personal" data-key="linkedin">${esc(p.linkedin)}</span></span>`);
    }
    if (p.github) {
      contactParts.push(`<span class="r-contact-item">${showIcons ? '💻 ' : ''}<span contenteditable="true" data-edit-kind="personal" data-key="github">${esc(p.github)}</span></span>`);
    }
    (p.customLinks || []).forEach((lnk, cIdx) => {
      if (lnk.label || lnk.value) {
        contactParts.push(`
          <span class="r-contact-item">
            ${lnk.label ? `<strong>${esc(lnk.label)}:</strong> ` : ''}
            <span contenteditable="true" data-edit-kind="custom-link" data-link-idx="${cIdx}">${esc(lnk.value)}</span>
          </span>
        `);
      }
    });

    const alignClass = `align-${s.headerAlign || 'center'}`;
    const headerHTML = `
      <header class="r-header ${alignClass}">
        <div>
          <h1 class="r-name"
              contenteditable="true"
              data-edit-kind="personal"
              data-key="fullName"
              data-placeholder="[Click to Enter Your Full Name]">${esc(p.fullName)}</h1>
          <div class="r-job-title ${!hasNonEmptyString(p.jobTitle) ? 'r-screen-only-placeholder' : ''}"
               contenteditable="true"
               data-edit-kind="personal"
               data-key="jobTitle"
               data-placeholder="[Click to Enter Target Role / Headline]">${esc(p.jobTitle)}</div>
        </div>
        ${contactParts.length ? `
          <div class="r-contact-bar">
            ${contactParts.join('<span class="r-sep r-screen-only-placeholder">•</span>')}
          </div>
        ` : ''}
      </header>
    `;

    const allSectionsWithIdx = (r.sections || []).map((sec, idx) => ({ sec, idx })).filter(x => x.sec.visible !== false);

    if (s.template === 'sidebar-split') {
      const sideTypes = new Set(['skills', 'education', 'compact']);
      const mainList = allSectionsWithIdx.filter(x => !sideTypes.has(x.sec.type));
      const sideList = allSectionsWithIdx.filter(x => sideTypes.has(x.sec.type));

      sheet.innerHTML = `
        ${headerHTML}
        <div class="r-body-split">
          <div class="r-main-col">
            ${mainList.map(x => renderSectionOnPaperHTML(x.sec, x.idx)).join('')}
          </div>
          <aside class="r-sidebar-col">
            ${sideList.map(x => renderSectionOnPaperHTML(x.sec, x.idx)).join('')}
          </aside>
        </div>
      `;
    } else {
      sheet.innerHTML = `
        ${headerHTML}
        <div class="r-body-single">
          ${allSectionsWithIdx.map(x => renderSectionOnPaperHTML(x.sec, x.idx)).join('')}
        </div>
      `;
    }

    requestAnimationFrame(checkPageHeightStatus);
  }

  function checkPageHeightStatus() {
    const sheet = document.getElementById('resumeSheet');
    const badge = document.getElementById('pageCountStatus');
    const r = getActiveResume();
    if (!sheet || !badge || !r) return;

    const isLetter = r.settings && r.settings.paperSize === 'letter';
    const onePageHeightPx = (isLetter ? 279.4 : 297) * 3.7795275591;
    const actualHeight = sheet.scrollHeight;

    if (actualHeight > onePageHeightPx + 12) {
      const pagesApprox = (actualHeight / onePageHeightPx).toFixed(1);
      badge.className = 'page-status-badge overflow';
      badge.textContent = `⚠️ Spills to Page 2 (~${pagesApprox} pages)`;
    } else {
      badge.className = 'page-status-badge';
      badge.textContent = '✓ Fits Cleanly on 1 Page';
    }
  }

  // ==========================================================================
  // Render ATS Score & Job Description Keyword Matcher
  // ==========================================================================
  function renderATSDashboard() {
    const r = getActiveResume();
    if (!r || !window.ATSEngine) return;

    const evaluation = window.ATSEngine.evaluateResume(r);
    const jdResult = window.ATSEngine.analyzeJobDescription(appState.jdText, r);

    const displayScore = jdResult.hasJD
      ? Math.round(evaluation.totalScore * 0.7 + jdResult.matchRate * 0.3)
      : evaluation.totalScore;

    const navBadge = document.getElementById('navAtsBadge');
    if (navBadge) navBadge.textContent = displayScore;

    const scoreNum = document.getElementById('atsScoreNumber');
    if (scoreNum) scoreNum.textContent = displayScore;

    const circle = document.getElementById('atsScoreCircle');
    if (circle) {
      const circumference = 251.2;
      const offset = circumference - (displayScore / 100) * circumference;
      circle.style.strokeDashoffset = String(offset);
      circle.style.stroke = displayScore >= 80 ? 'var(--success)' : displayScore >= 55 ? 'var(--warning)' : 'var(--danger)';
    }

    const checksBox = document.getElementById('atsChecksContainer');
    if (checksBox) {
      checksBox.innerHTML = evaluation.checks.map(c => {
        const pct = Math.round((c.score / c.max) * 100);
        const color = c.status === 'good' ? 'var(--success)' : c.status === 'warn' ? 'var(--warning)' : 'var(--danger)';
        return `
          <div class="check-bar-row">
            <div class="check-bar-header">
              <span>${esc(c.label)}</span>
              <span>${c.score} / ${c.max} pts</span>
            </div>
            <div class="check-bar-track">
              <div class="check-bar-fill" style="width: ${pct}%; background: ${color};"></div>
            </div>
          </div>
        `;
      }).join('');
    }

    const tipsBox = document.getElementById('atsTipsContainer');
    if (tipsBox) {
      if (evaluation.actionableTips.length === 0) {
        tipsBox.innerHTML = `<div style="color: var(--success); font-weight: 600; font-size: 12.5px;">🎉 Great job! All core ATS and quantification checks are satisfied.</div>`;
      } else {
        tipsBox.innerHTML = evaluation.actionableTips.map(t => `
          <div class="tip-item ${t.severity}">
            <div>
              <div class="tip-title">${esc(t.title)}</div>
              <div class="tip-desc">${esc(t.desc)}</div>
            </div>
          </div>
        `).join('');
      }
    }

    const jdInput = document.getElementById('inpJobDescription');
    if (jdInput && document.activeElement !== jdInput) {
      jdInput.value = appState.jdText || '';
    }

    const jdBox = document.getElementById('jdResultsBox');
    if (jdBox) {
      if (!jdResult.hasJD) {
        jdBox.style.display = 'none';
      } else {
        jdBox.style.display = 'block';
        const matchBadge = document.getElementById('jdMatchBadge');
        if (matchBadge) {
          matchBadge.textContent = `${jdResult.matchRate}% Match (${jdResult.matched.length}/${jdResult.matched.length + jdResult.missing.length} keywords)`;
        }

        const missingBox = document.getElementById('jdMissingPills');
        if (missingBox) {
          missingBox.innerHTML = jdResult.missing.length
            ? jdResult.missing.map(kw => `
                <button type="button" class="kw-pill missing btn-inject-kw" data-kw="${esc(kw)}" title="Click to add '${esc(kw)}' to your Skills section">
                  + ${esc(kw)}
                </button>
              `).join('')
            : `<span style="font-size: 12px; color: var(--success);">All extracted JD keywords are present in your resume!</span>`;
        }

        const matchedBox = document.getElementById('jdMatchedPills');
        if (matchedBox) {
          matchedBox.innerHTML = jdResult.matched.length
            ? jdResult.matched.map(kw => `<span class="kw-pill matched">✓ ${esc(kw)}</span>`).join('')
            : `<span style="font-size: 12px; color: var(--text-muted);">No matching keywords detected yet.</span>`;
        }
      }
    }
  }

  function renderActionVerbDictionary() {
    const container = document.getElementById('actionVerbsDictionaryContainer');
    if (!container || !window.RESUCRAFT_DATA) return;

    const groups = window.RESUCRAFT_DATA.actionVerbs || {};
    container.innerHTML = Object.entries(groups).map(([cat, verbs]) => `
      <div style="margin-bottom: 12px;">
        <div style="font-size: 11.5px; font-weight: 700; color: var(--accent-primary); text-transform: uppercase; margin-bottom: 6px;">
          ${esc(cat)}
        </div>
        <div class="keyword-pills">
          ${verbs.map(v => `
            <button type="button" class="btn btn-sm btn-copy-verb" data-verb="${esc(v)}" style="font-size: 11.5px; padding: 3px 9px;">
              ${esc(v)}
            </button>
          `).join('')}
        </div>
      </div>
    `).join('');
  }

  function updateAIProviderBadge() {
    const cfg = window.AIAssistant.getConfig();
    const badge = document.getElementById('aiStudioProviderBadge');
    if (badge) {
      badge.textContent = cfg.provider === 'local' || !cfg.apiKey
        ? 'Engine: Built-in Smart Heuristics (Offline Ready)'
        : `Engine: Live ${cfg.provider.toUpperCase()} (${cfg.model})`;
    }
  }

  function renderAll() {
    renderProfileSelect();
    renderPersonalEditor();
    renderDynamicSectionsEditor();
    renderDesignControls();
    renderResumePreview();
    renderATSDashboard();
    updateAIProviderBadge();
  }

  function onLeftFormMutated(immediateHistory = false) {
    if (immediateHistory) {
      recordHistoryImmediate();
    } else {
      recordHistoryDebounced();
    }
    saveState();
    renderResumePreview();
    renderATSDashboard();
  }

  function addNewSection(type, customTitle) {
    const r = getActiveResume();
    if (!r) return;
    const bp = window.RESUCRAFT_DATA.sectionBlueprints[type] || window.RESUCRAFT_DATA.sectionBlueprints.detailed;
    const title = (customTitle && customTitle.trim()) ? customTitle.trim() : bp.defaultTitle;

    const newSec = {
      id: 'sec-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      type,
      title,
      visible: true
    };

    if (type === 'text') {
      newSec.content = '';
    } else if (type === 'bullets') {
      newSec.bullets = [''];
    } else {
      newSec.items = [bp.createDefaultItem()];
    }

    r.sections = r.sections || [];
    r.sections.push(newSec);
    recordHistoryImmediate();
    saveState();
    renderDynamicSectionsEditor();
    renderResumePreview();
    renderATSDashboard();
    showToast(`Added section "${title}"`);

    setTimeout(() => {
      const card = document.getElementById(`sec-card-${newSec.id}`);
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        card.classList.add('highlight-pulse');
        setTimeout(() => card.classList.remove('highlight-pulse'), 1400);
      }
    }, 50);
  }

  // ==========================================================================
  // Zoom & Viewport Helpers
  // ==========================================================================
  function applyZoom(nextZoom) {
    appState.zoom = Math.min(1.35, Math.max(0.45, nextZoom));
    const wrapper = document.getElementById('previewScaleWrapper');
    const lbl = document.getElementById('lblZoomLevel');
    if (wrapper) wrapper.style.transform = `scale(${appState.zoom})`;
    if (lbl) lbl.textContent = `${Math.round(appState.zoom * 100)}%`;
  }

  function fitZoomToViewport() {
    const viewport = document.getElementById('previewViewport');
    if (!viewport) return;
    const availWidth = viewport.clientWidth - 64;
    const sheetWidthPx = 210 * 3.7795;
    const ideal = Math.min(1.0, Math.max(0.5, availWidth / sheetWidthPx));
    applyZoom(ideal);
  }

  // ==========================================================================
  // Event Listeners
  // ==========================================================================
  function initEventListeners() {
    // Undo / Redo Buttons & Global Keyboard Shortcuts
    document.getElementById('btnUndo')?.addEventListener('click', performUndo);
    document.getElementById('btnRedo')?.addEventListener('click', performRedo);

    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && !e.altKey) {
        if (e.key.toLowerCase() === 'z' && !e.shiftKey) {
          if (undoStack.length > 0) {
            e.preventDefault();
            performUndo();
          }
        } else if (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey)) {
          if (redoStack.length > 0) {
            e.preventDefault();
            performRedo();
          }
        }
      }
    });

    // 1. Navigation Tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.getAttribute('data-tab');
        document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(`tab-${target}`)?.classList.add('active');
      });
    });

    // 2. Personal Card Toggle
    document.querySelector('[data-toggle-card="card-personal"]')?.addEventListener('click', () => {
      document.getElementById('card-personal')?.classList.toggle('collapsed');
    });

    // 3. Profile Manager & Reset
    document.getElementById('profileSelect')?.addEventListener('change', e => {
      const nextId = e.target.value;
      if (appState.profiles[nextId]) {
        appState.activeProfileId = nextId;
        saveState();
        resetHistoryForCurrentProfile();
        renderAll();
        showToast(`Switched to "${appState.profiles[nextId].name}"`);
      }
    });
    document.getElementById('btnNewProfile')?.addEventListener('click', createNewProfile);
    document.getElementById('btnDuplicateProfile')?.addEventListener('click', duplicateActiveProfile);
    document.getElementById('btnRenameProfile')?.addEventListener('click', renameActiveProfile);
    document.getElementById('btnDeleteProfile')?.addEventListener('click', deleteActiveProfile);
    document.getElementById('btnResetResume')?.addEventListener('click', resetActiveResume);

    // 4. Personal Info Inputs & Custom Header Fields
    const personalMap = {
      inpFullName: 'fullName',
      inpJobTitle: 'jobTitle',
      inpEmail: 'email',
      inpPhone: 'phone',
      inpLocation: 'location',
      inpWebsite: 'website',
      inpLinkedin: 'linkedin',
      inpGithub: 'github'
    };

    Object.entries(personalMap).forEach(([elId, key]) => {
      document.getElementById(elId)?.addEventListener('input', e => {
        const r = getActiveResume();
        if (!r) return;
        r.personal = r.personal || {};
        r.personal[key] = e.target.value;
        onLeftFormMutated(false);
      });
    });

    document.getElementById('btnAddCustomHeaderField')?.addEventListener('click', () => {
      const r = getActiveResume();
      if (!r) return;
      r.personal.customLinks = r.personal.customLinks || [];
      r.personal.customLinks.push({ id: 'lnk-' + Date.now(), label: '', value: '' });
      renderCustomLinksEditor();
      onLeftFormMutated(true);
    });

    document.getElementById('customLinksContainer')?.addEventListener('input', e => {
      const inp = e.target.closest('.custom-link-input');
      if (!inp) return;
      const r = getActiveResume();
      const idx = Number(inp.getAttribute('data-link-idx'));
      const key = inp.getAttribute('data-link-key');
      if (r?.personal?.customLinks?.[idx]) {
        r.personal.customLinks[idx][key] = inp.value;
        onLeftFormMutated(false);
      }
    });

    document.getElementById('customLinksContainer')?.addEventListener('click', e => {
      const btn = e.target.closest('.btn-del-custom-link');
      if (!btn) return;
      const r = getActiveResume();
      const idx = Number(btn.getAttribute('data-link-idx'));
      if (r?.personal?.customLinks) {
        r.personal.customLinks.splice(idx, 1);
        renderCustomLinksEditor();
        onLeftFormMutated(true);
      }
    });

    // 5. Add New Section / Heading Builder & Quick-Add Chips
    document.getElementById('btnAddCustomSection')?.addEventListener('click', () => {
      const titleInp = document.getElementById('inpNewSectionTitle');
      const typeSel = document.getElementById('selNewSectionType');
      const type = typeSel ? typeSel.value : 'detailed';
      const title = titleInp ? titleInp.value.trim() : '';
      addNewSection(type, title);
      if (titleInp) titleInp.value = '';
    });

    document.getElementById('quickAddSectionChips')?.addEventListener('click', e => {
      const btn = e.target.closest('[data-quick-type]');
      if (!btn) return;
      const type = btn.getAttribute('data-quick-type');
      const title = btn.getAttribute('data-quick-title');
      addNewSection(type, title);
    });

    // 6. Dynamic Sections Container Delegation
    const dynContainer = document.getElementById('dynamicSectionsContainer');
    if (dynContainer) {
      dynContainer.addEventListener('input', e => {
        const target = e.target;
        const r = getActiveResume();
        if (!r) return;

        if (target.classList.contains('dyn-sec-heading-input')) {
          const sIdx = Number(target.getAttribute('data-sec-idx'));
          if (r.sections?.[sIdx]) {
            r.sections[sIdx].title = target.value;
            onLeftFormMutated(false);
          }
          return;
        }

        if (target.classList.contains('dyn-sec-text')) {
          const sIdx = Number(target.getAttribute('data-sec-idx'));
          if (r.sections?.[sIdx]) {
            r.sections[sIdx].content = target.value;
            onLeftFormMutated(false);
          }
          return;
        }

        if (target.classList.contains('dyn-item-field')) {
          const sIdx = Number(target.getAttribute('data-sec-idx'));
          const iIdx = Number(target.getAttribute('data-item-idx'));
          const key = target.getAttribute('data-key');
          if (r.sections?.[sIdx]?.items?.[iIdx]) {
            r.sections[sIdx].items[iIdx][key] = target.value;
            onLeftFormMutated(false);
          }
          return;
        }

        if (target.classList.contains('dyn-bullet-input')) {
          const sIdx = Number(target.getAttribute('data-sec-idx'));
          const itemAttr = target.getAttribute('data-item-idx');
          const bIdx = Number(target.getAttribute('data-bullet-idx'));
          const val = target.value;
          const sec = r.sections?.[sIdx];
          if (!sec) return;

          if (itemAttr !== null && itemAttr !== '') {
            const iIdx = Number(itemAttr);
            if (sec.items?.[iIdx]?.bullets) {
              sec.items[iIdx].bullets[bIdx] = val;
            }
          } else if (Array.isArray(sec.bullets)) {
            sec.bullets[bIdx] = val;
          }

          const idPrefix = `${sIdx}-${itemAttr !== null && itemAttr !== '' ? itemAttr : 'sec'}`;
          const isQuant = window.ATSEngine.hasQuantifiedMetric(val);
          const badge = document.getElementById(`badge-${idPrefix}-${bIdx}`);
          if (badge) {
            badge.className = `metric-badge ${isQuant ? 'quantified' : 'unquantified'}`;
            badge.textContent = isQuant ? '✓ Quantified' : '⚠️ Add Metric (%, $, #)';
          }
          const charEl = document.getElementById(`char-${idPrefix}-${bIdx}`);
          if (charEl) charEl.textContent = `${val.length} chars`;

          onLeftFormMutated(false);
        }
      });

      dynContainer.addEventListener('change', e => {
        const target = e.target;
        const r = getActiveResume();
        if (!r) return;

        if (target.classList.contains('dyn-sec-vis')) {
          const sIdx = Number(target.getAttribute('data-sec-idx'));
          if (r.sections?.[sIdx]) {
            r.sections[sIdx].visible = target.checked;
            onLeftFormMutated(true);
          }
        }
      });

      dynContainer.addEventListener('click', async e => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const r = getActiveResume();
        if (!r) return;

        if (btn.classList.contains('btn-dyn-collapse-sec')) {
          const cardId = btn.getAttribute('data-card-id');
          document.getElementById(cardId)?.classList.toggle('collapsed');
          return;
        }

        if (btn.classList.contains('btn-dyn-move-sec')) {
          const sIdx = Number(btn.getAttribute('data-sec-idx'));
          const dir = Number(btn.getAttribute('data-dir'));
          const targetIdx = sIdx + dir;
          if (targetIdx >= 0 && targetIdx < r.sections.length) {
            const tmp = r.sections[sIdx];
            r.sections[sIdx] = r.sections[targetIdx];
            r.sections[targetIdx] = tmp;
            renderDynamicSectionsEditor();
            onLeftFormMutated(true);
          }
          return;
        }

        if (btn.classList.contains('btn-dyn-del-sec')) {
          const sIdx = Number(btn.getAttribute('data-sec-idx'));
          const sec = r.sections?.[sIdx];
          if (!sec) return;
          r.sections.splice(sIdx, 1);
          renderDynamicSectionsEditor();
          onLeftFormMutated(true);
          showToast(`Deleted section "${sec.title}" (Ctrl+Z to undo)`);
          return;
        }

        if (btn.classList.contains('btn-dyn-add-item')) {
          const sIdx = Number(btn.getAttribute('data-sec-idx'));
          const sec = r.sections?.[sIdx];
          if (!sec) return;
          const bp = window.RESUCRAFT_DATA.sectionBlueprints[sec.type];
          if (bp) {
            sec.items = sec.items || [];
            sec.items.push(bp.createDefaultItem());
            renderDynamicSectionsEditor();
            onLeftFormMutated(true);
          }
          return;
        }

        if (btn.classList.contains('btn-dyn-move-item')) {
          const sIdx = Number(btn.getAttribute('data-sec-idx'));
          const iIdx = Number(btn.getAttribute('data-item-idx'));
          const dir = Number(btn.getAttribute('data-dir'));
          const items = r.sections?.[sIdx]?.items;
          if (Array.isArray(items)) {
            const targetIdx = iIdx + dir;
            if (targetIdx >= 0 && targetIdx < items.length) {
              const tmp = items[iIdx];
              items[iIdx] = items[targetIdx];
              items[targetIdx] = tmp;
              renderDynamicSectionsEditor();
              onLeftFormMutated(true);
            }
          }
          return;
        }

        if (btn.classList.contains('btn-dyn-del-item')) {
          const sIdx = Number(btn.getAttribute('data-sec-idx'));
          const iIdx = Number(btn.getAttribute('data-item-idx'));
          const items = r.sections?.[sIdx]?.items;
          if (Array.isArray(items)) {
            items.splice(iIdx, 1);
            renderDynamicSectionsEditor();
            onLeftFormMutated(true);
          }
          return;
        }

        if (btn.classList.contains('btn-dyn-add-bullet')) {
          const sIdx = Number(btn.getAttribute('data-sec-idx'));
          const itemAttr = btn.getAttribute('data-item-idx');
          const sec = r.sections?.[sIdx];
          if (!sec) return;
          if (itemAttr !== null && itemAttr !== '') {
            const iIdx = Number(itemAttr);
            sec.items[iIdx].bullets = sec.items[iIdx].bullets || [];
            sec.items[iIdx].bullets.push('');
          } else {
            sec.bullets = sec.bullets || [];
            sec.bullets.push('');
          }
          renderDynamicSectionsEditor();
          onLeftFormMutated(true);
          return;
        }

        if (btn.classList.contains('btn-dyn-move-bullet')) {
          const sIdx = Number(btn.getAttribute('data-sec-idx'));
          const itemAttr = btn.getAttribute('data-item-idx');
          const bIdx = Number(btn.getAttribute('data-bullet-idx'));
          const dir = Number(btn.getAttribute('data-dir'));
          const sec = r.sections?.[sIdx];
          if (!sec) return;
          const arr = (itemAttr !== null && itemAttr !== '') ? sec.items?.[Number(itemAttr)]?.bullets : sec.bullets;
          if (Array.isArray(arr)) {
            const targetIdx = bIdx + dir;
            if (targetIdx >= 0 && targetIdx < arr.length) {
              const tmp = arr[bIdx];
              arr[bIdx] = arr[targetIdx];
              arr[targetIdx] = tmp;
              renderDynamicSectionsEditor();
              onLeftFormMutated(true);
            }
          }
          return;
        }

        if (btn.classList.contains('btn-dyn-del-bullet')) {
          const sIdx = Number(btn.getAttribute('data-sec-idx'));
          const itemAttr = btn.getAttribute('data-item-idx');
          const bIdx = Number(btn.getAttribute('data-bullet-idx'));
          const sec = r.sections?.[sIdx];
          if (!sec) return;
          const arr = (itemAttr !== null && itemAttr !== '') ? sec.items?.[Number(itemAttr)]?.bullets : sec.bullets;
          if (Array.isArray(arr)) {
            arr.splice(bIdx, 1);
            renderDynamicSectionsEditor();
            onLeftFormMutated(true);
          }
          return;
        }

        if (btn.classList.contains('btn-dyn-gen-summary')) {
          const sIdx = Number(btn.getAttribute('data-sec-idx'));
          const sec = r.sections?.[sIdx];
          const drawer = document.getElementById(`sum-drawer-${sIdx}`);
          if (!sec || !drawer) return;
          const options = window.AIAssistant.generateSummariesLocal(r);
          drawer.style.display = 'block';
          drawer.innerHTML = `
            <div class="ai-suggestions-drawer">
              <div class="ai-drawer-header">
                <span>✨ Click a template below to insert and customize:</span>
                <button type="button" class="btn btn-sm btn-close-sum">✕</button>
              </div>
              ${options.map((opt, idx) => `
                <div class="ai-suggestion-option" data-opt-idx="${idx}">
                  <div class="ai-suggestion-mode">${esc(opt.title)}</div>
                  <div class="ai-suggestion-text">${esc(opt.text)}</div>
                </div>
              `).join('')}
            </div>
          `;
          drawer.querySelector('.btn-close-sum')?.addEventListener('click', () => {
            drawer.style.display = 'none';
          });
          drawer.querySelectorAll('.ai-suggestion-option').forEach(el => {
            el.addEventListener('click', () => {
              const chosen = options[Number(el.getAttribute('data-opt-idx'))];
              if (chosen) {
                sec.content = chosen.text;
                renderDynamicSectionsEditor();
                onLeftFormMutated(true);
                showToast('Inserted summary template!');
              }
            });
          });
          return;
        }

        if (btn.classList.contains('btn-dyn-enhance-bullet')) {
          const sIdx = Number(btn.getAttribute('data-sec-idx'));
          const itemAttr = btn.getAttribute('data-item-idx');
          const bIdx = Number(btn.getAttribute('data-bullet-idx'));
          const sec = r.sections?.[sIdx];
          if (!sec) return;

          const arr = (itemAttr !== null && itemAttr !== '') ? sec.items?.[Number(itemAttr)]?.bullets : sec.bullets;
          if (!Array.isArray(arr)) return;
          const currentBullet = arr[bIdx] || '';
          const idPrefix = `${sIdx}-${itemAttr !== null && itemAttr !== '' ? itemAttr : 'sec'}`;
          const drawer = document.getElementById(`ai-drawer-${idPrefix}-${bIdx}`);
          if (!drawer) return;

          const jdRes = window.ATSEngine.analyzeJobDescription(appState.jdText, r);
          drawer.style.display = 'block';
          drawer.innerHTML = `<div style="font-size: 12px; color: var(--text-secondary);">✨ Generating variations...</div>`;

          const result = await window.AIAssistant.enhanceBullet(currentBullet, r, jdRes.missing || []);
          drawer.innerHTML = `
            <div class="ai-drawer-header">
              <span>✨ ${esc(result.source)} — Click to replace bullet:</span>
              <button type="button" class="btn btn-sm btn-close-inline-ai">✕</button>
            </div>
            ${result.suggestions.map((sug, sugIdx) => `
              <div class="ai-suggestion-option" data-sug-idx="${sugIdx}">
                <div class="ai-suggestion-mode">${esc(sug.mode)}</div>
                <div class="ai-suggestion-text">${esc(sug.text)}</div>
              </div>
            `).join('')}
          `;
          drawer.querySelector('.btn-close-inline-ai')?.addEventListener('click', () => {
            drawer.style.display = 'none';
          });
          drawer.querySelectorAll('.ai-suggestion-option').forEach(optEl => {
            optEl.addEventListener('click', () => {
              const chosen = result.suggestions[Number(optEl.getAttribute('data-sug-idx'))];
              if (chosen) {
                arr[bIdx] = chosen.text;
                renderDynamicSectionsEditor();
                onLeftFormMutated(true);
                showToast(`Applied "${chosen.mode}"!`);
              }
            });
          });
        }
      });
    }

    // 7. Two-Way Direct On-Paper Canvas Editing (#resumeSheet)
    const sheet = document.getElementById('resumeSheet');
    if (sheet) {
      // Strip rich HTML formatting when pasting onto the resume sheet
      sheet.addEventListener('paste', e => {
        const el = e.target.closest('[contenteditable="true"]');
        if (!el) return;
        e.preventDefault();
        const plainText = (e.clipboardData || window.clipboardData).getData('text/plain');
        document.execCommand('insertText', false, plainText);
      });

      // Smart Enter & Backspace inside on-paper bullets and single-line headings
      sheet.addEventListener('keydown', e => {
        const el = e.target.closest('[contenteditable="true"]');
        if (!el) return;
        const kind = el.getAttribute('data-edit-kind');
        const r = getActiveResume();
        if (!r) return;

        // Pressing Enter inside a bullet point creates a new bullet point right below it!
        if (e.key === 'Enter' && !e.shiftKey && (kind === 'item-bullet' || kind === 'sec-bullet')) {
          e.preventDefault();
          const sIdx = Number(el.getAttribute('data-sec-idx'));
          const bIdx = Number(el.getAttribute('data-bullet-idx'));
          const sec = r.sections?.[sIdx];
          if (!sec) return;

          if (kind === 'item-bullet') {
            const iIdx = Number(el.getAttribute('data-item-idx'));
            const arr = sec.items?.[iIdx]?.bullets;
            if (Array.isArray(arr)) {
              arr.splice(bIdx + 1, 0, '');
              renderDynamicSectionsEditor();
              onLeftFormMutated(true);
              requestAnimationFrame(() => {
                const nextLi = sheet.querySelector(`[data-edit-kind="item-bullet"][data-sec-idx="${sIdx}"][data-item-idx="${iIdx}"][data-bullet-idx="${bIdx + 1}"]`);
                nextLi?.focus();
              });
            }
          } else {
            const arr = sec.bullets;
            if (Array.isArray(arr)) {
              arr.splice(bIdx + 1, 0, '');
              renderDynamicSectionsEditor();
              onLeftFormMutated(true);
              requestAnimationFrame(() => {
                const nextLi = sheet.querySelector(`[data-edit-kind="sec-bullet"][data-sec-idx="${sIdx}"][data-bullet-idx="${bIdx + 1}"]`);
                nextLi?.focus();
              });
            }
          }
          return;
        }

        // Pressing Backspace inside an empty bullet point removes it and focuses the previous bullet
        if (e.key === 'Backspace' && (kind === 'item-bullet' || kind === 'sec-bullet') && el.innerText.trim() === '') {
          const sIdx = Number(el.getAttribute('data-sec-idx'));
          const bIdx = Number(el.getAttribute('data-bullet-idx'));
          const sec = r.sections?.[sIdx];
          if (!sec) return;

          if (kind === 'item-bullet') {
            const iIdx = Number(el.getAttribute('data-item-idx'));
            const arr = sec.items?.[iIdx]?.bullets;
            if (Array.isArray(arr) && arr.length > 1) {
              e.preventDefault();
              arr.splice(bIdx, 1);
              renderDynamicSectionsEditor();
              onLeftFormMutated(true);
              requestAnimationFrame(() => {
                const prevIdx = Math.max(0, bIdx - 1);
                const prevLi = sheet.querySelector(`[data-edit-kind="item-bullet"][data-sec-idx="${sIdx}"][data-item-idx="${iIdx}"][data-bullet-idx="${prevIdx}"]`);
                prevLi?.focus();
              });
            }
          } else {
            const arr = sec.bullets;
            if (Array.isArray(arr) && arr.length > 1) {
              e.preventDefault();
              arr.splice(bIdx, 1);
              renderDynamicSectionsEditor();
              onLeftFormMutated(true);
              requestAnimationFrame(() => {
                const prevIdx = Math.max(0, bIdx - 1);
                const prevLi = sheet.querySelector(`[data-edit-kind="sec-bullet"][data-sec-idx="${sIdx}"][data-bullet-idx="${prevIdx}"]`);
                prevLi?.focus();
              });
            }
          }
          return;
        }

        // Prevent multiline Enter in single-line headings/fields
        if (e.key === 'Enter' && (kind === 'sec-title' || kind === 'personal' || kind === 'item-field')) {
          e.preventDefault();
          el.blur();
        }
      });

      sheet.addEventListener('input', e => {
        const el = e.target.closest('[contenteditable="true"]');
        if (!el) return;
        const r = getActiveResume();
        if (!r) return;

        const kind = el.getAttribute('data-edit-kind');
        const text = el.innerText;

        // Dynamically toggle .r-screen-only-placeholder on the element & its parent section/entry
        if (hasNonEmptyString(text)) {
          el.classList.remove('r-screen-only-placeholder');
          el.closest('.r-entry')?.classList.remove('r-screen-only-placeholder');
          el.closest('.r-section')?.classList.remove('r-screen-only-placeholder');
          el.closest('.r-skill-row')?.classList.remove('r-screen-only-placeholder');
          el.closest('.r-contact-item')?.classList.remove('r-screen-only-placeholder');
        }

        if (kind === 'personal') {
          const key = el.getAttribute('data-key');
          r.personal[key] = text;
          renderPersonalEditor();
        } else if (kind === 'custom-link') {
          const idx = Number(el.getAttribute('data-link-idx'));
          if (r.personal?.customLinks?.[idx]) {
            r.personal.customLinks[idx].value = text;
            renderCustomLinksEditor();
          }
        } else if (kind === 'sec-title') {
          const sIdx = Number(el.getAttribute('data-sec-idx'));
          if (r.sections?.[sIdx]) {
            r.sections[sIdx].title = text;
            const leftInp = document.querySelector(`.dyn-sec-heading-input[data-sec-idx="${sIdx}"]`);
            if (leftInp && document.activeElement !== leftInp) leftInp.value = text;
          }
        } else if (kind === 'sec-text') {
          const sIdx = Number(el.getAttribute('data-sec-idx'));
          if (r.sections?.[sIdx]) {
            r.sections[sIdx].content = text;
            const leftTa = document.querySelector(`.dyn-sec-text[data-sec-idx="${sIdx}"]`);
            if (leftTa && document.activeElement !== leftTa) leftTa.value = text;
          }
        } else if (kind === 'sec-bullet') {
          const sIdx = Number(el.getAttribute('data-sec-idx'));
          const bIdx = Number(el.getAttribute('data-bullet-idx'));
          if (r.sections?.[sIdx]?.bullets) {
            r.sections[sIdx].bullets[bIdx] = text;
            const leftTa = document.querySelector(`.dyn-bullet-input[data-sec-idx="${sIdx}"][data-bullet-idx="${bIdx}"]`);
            if (leftTa && document.activeElement !== leftTa) leftTa.value = text;
          }
        } else if (kind === 'item-field') {
          const sIdx = Number(el.getAttribute('data-sec-idx'));
          const iIdx = Number(el.getAttribute('data-item-idx'));
          const key = el.getAttribute('data-key');
          if (r.sections?.[sIdx]?.items?.[iIdx]) {
            r.sections[sIdx].items[iIdx][key] = text;
            const leftInp = document.querySelector(`.dyn-item-field[data-sec-idx="${sIdx}"][data-item-idx="${iIdx}"][data-key="${key}"]`);
            if (leftInp && document.activeElement !== leftInp) leftInp.value = text;
          }
        } else if (kind === 'item-bullet') {
          const sIdx = Number(el.getAttribute('data-sec-idx'));
          const iIdx = Number(el.getAttribute('data-item-idx'));
          const bIdx = Number(el.getAttribute('data-bullet-idx'));
          if (r.sections?.[sIdx]?.items?.[iIdx]?.bullets) {
            r.sections[sIdx].items[iIdx].bullets[bIdx] = text;
            const leftTa = document.querySelector(`.dyn-bullet-input[data-sec-idx="${sIdx}"][data-item-idx="${iIdx}"][data-bullet-idx="${bIdx}"]`);
            if (leftTa && document.activeElement !== leftTa) leftTa.value = text;
          }
        }

        recordHistoryDebounced();
        saveState();
        renderATSDashboard();
        requestAnimationFrame(checkPageHeightStatus);
      });

      // Re-sync clean separator visibility when focus leaves the resume sheet
      sheet.addEventListener('focusout', e => {
        setTimeout(() => {
          if (!sheet.contains(document.activeElement)) {
            renderResumePreview();
          }
        }, 60);
      });

      sheet.addEventListener('click', e => {
        const btn = e.target.closest('[data-canvas-action]');
        if (!btn) return;
        e.stopPropagation();
        const action = btn.getAttribute('data-canvas-action');
        const sIdx = Number(btn.getAttribute('data-sec-idx'));
        const r = getActiveResume();
        if (!r || !r.sections?.[sIdx]) return;

        const sec = r.sections[sIdx];
        if (action === 'delete-sec') {
          r.sections.splice(sIdx, 1);
          renderDynamicSectionsEditor();
          onLeftFormMutated(true);
          showToast(`Deleted "${sec.title}" (Ctrl+Z to undo)`);
        } else if (action === 'move-up' && sIdx > 0) {
          const tmp = r.sections[sIdx];
          r.sections[sIdx] = r.sections[sIdx - 1];
          r.sections[sIdx - 1] = tmp;
          renderDynamicSectionsEditor();
          onLeftFormMutated(true);
        } else if (action === 'move-down' && sIdx < r.sections.length - 1) {
          const tmp = r.sections[sIdx];
          r.sections[sIdx] = r.sections[sIdx + 1];
          r.sections[sIdx + 1] = tmp;
          renderDynamicSectionsEditor();
          onLeftFormMutated(true);
        } else if (action === 'add-item') {
          if (sec.type === 'bullets') {
            sec.bullets = sec.bullets || [];
            sec.bullets.push('');
          } else {
            const bp = window.RESUCRAFT_DATA.sectionBlueprints[sec.type];
            if (bp) {
              sec.items = sec.items || [];
              sec.items.push(bp.createDefaultItem());
            }
          }
          renderDynamicSectionsEditor();
          onLeftFormMutated(true);
          showToast(`Added item to "${sec.title}"`);
        }
      });
    }

    // 8. Design Controls Listeners
    document.getElementById('templateGridContainer')?.addEventListener('click', e => {
      const card = e.target.closest('.template-card');
      if (!card) return;
      const tplId = card.getAttribute('data-template-id');
      const r = getActiveResume();
      if (r && tplId) {
        r.settings.template = tplId;
        renderDesignControls();
        onLeftFormMutated(true);
        showToast(`Switched template to "${card.querySelector('.template-name')?.textContent}"`);
      }
    });

    document.getElementById('colorSwatchContainer')?.addEventListener('click', e => {
      const sw = e.target.closest('.color-swatch');
      if (!sw) return;
      const hex = sw.getAttribute('data-color');
      const r = getActiveResume();
      if (r && hex) {
        r.settings.accentColor = hex;
        renderDesignControls();
        onLeftFormMutated(true);
      }
    });

    document.getElementById('inpCustomColor')?.addEventListener('input', e => {
      const r = getActiveResume();
      if (r) {
        r.settings.accentColor = e.target.value;
        onLeftFormMutated(false);
      }
    });

    document.getElementById('selFontFamily')?.addEventListener('change', e => {
      const r = getActiveResume();
      if (r) {
        r.settings.fontFamily = e.target.value;
        onLeftFormMutated(true);
      }
    });

    document.getElementById('selFontSize')?.addEventListener('change', e => {
      const r = getActiveResume();
      if (r) {
        r.settings.fontSize = e.target.value;
        onLeftFormMutated(true);
      }
    });

    document.getElementById('rngLineHeight')?.addEventListener('input', e => {
      const r = getActiveResume();
      if (r) {
        r.settings.lineHeight = e.target.value;
        const lbl = document.getElementById('lblLineHeightVal');
        if (lbl) lbl.textContent = e.target.value;
        onLeftFormMutated(false);
      }
    });

    document.getElementById('rngSectionSpacing')?.addEventListener('input', e => {
      const r = getActiveResume();
      if (r) {
        r.settings.sectionSpacing = e.target.value;
        const lbl = document.getElementById('lblSectionSpacingVal');
        if (lbl) lbl.textContent = e.target.value + 'px';
        onLeftFormMutated(false);
      }
    });

    document.getElementById('rngPageMargin')?.addEventListener('input', e => {
      const r = getActiveResume();
      if (r) {
        r.settings.pageMargin = e.target.value;
        const lbl = document.getElementById('lblPageMarginVal');
        if (lbl) lbl.textContent = e.target.value + 'mm';
        onLeftFormMutated(false);
      }
    });

    document.getElementById('selPaperSize')?.addEventListener('change', e => {
      const r = getActiveResume();
      if (r) {
        r.settings.paperSize = e.target.value;
        onLeftFormMutated(true);
      }
    });

    document.getElementById('selHeaderAlign')?.addEventListener('change', e => {
      const r = getActiveResume();
      if (r) {
        r.settings.headerAlign = e.target.value;
        onLeftFormMutated(true);
      }
    });

    document.getElementById('chkShowIcons')?.addEventListener('change', e => {
      const r = getActiveResume();
      if (r) {
        r.settings.showIcons = e.target.checked;
        onLeftFormMutated(true);
      }
    });

    document.getElementById('chkUnderlineLinks')?.addEventListener('change', e => {
      const r = getActiveResume();
      if (r) {
        r.settings.underlineLinks = e.target.checked;
        onLeftFormMutated(true);
      }
    });

    document.getElementById('chkShowPlaceholders')?.addEventListener('change', e => {
      const r = getActiveResume();
      if (r) {
        r.settings.showEmptyPlaceholders = e.target.checked;
        onLeftFormMutated(false);
      }
    });

    // 9. ATS Analyzer & Job Description Matcher
    document.getElementById('inpJobDescription')?.addEventListener('input', e => {
      appState.jdText = e.target.value;
      saveState();
      renderATSDashboard();
    });

    document.getElementById('btnClearJD')?.addEventListener('click', () => {
      appState.jdText = '';
      const jdInput = document.getElementById('inpJobDescription');
      if (jdInput) jdInput.value = '';
      saveState();
      renderATSDashboard();
    });

    document.getElementById('jdMissingPills')?.addEventListener('click', e => {
      const btn = e.target.closest('.btn-inject-kw');
      if (!btn) return;
      const kw = btn.getAttribute('data-kw');
      const r = getActiveResume();
      if (!r || !kw) return;

      let skillSec = (r.sections || []).find(s => s.type === 'skills');
      if (!skillSec) {
        skillSec = {
          id: 'sec-skills-' + Date.now(),
          type: 'skills',
          title: 'Skills',
          visible: true,
          items: [{ id: 'item-' + Date.now(), category: 'Core Skills', skillsText: kw }]
        };
        r.sections.push(skillSec);
      } else {
        skillSec.items = skillSec.items || [];
        if (skillSec.items.length === 0) {
          skillSec.items.push({ id: 'item-' + Date.now(), category: 'Core Skills', skillsText: kw });
        } else {
          const cur = (skillSec.items[0].skillsText || '').trim();
          skillSec.items[0].skillsText = cur ? `${cur}, ${kw}` : kw;
        }
      }
      renderDynamicSectionsEditor();
      onLeftFormMutated(true);
      showToast(`Added "${kw}" to your Skills section!`);
    });

    // 10. AI Studio Tab
    document.getElementById('btnRunStudioEnhance')?.addEventListener('click', async () => {
      const inp = document.getElementById('inpStudioBullet');
      const out = document.getElementById('studioResultsContainer');
      const r = getActiveResume();
      if (!inp || !out || !r) return;

      const raw = inp.value.trim();
      const jdRes = window.ATSEngine.analyzeJobDescription(appState.jdText, r);
      out.innerHTML = `<div style="font-size: 12px; color: var(--text-secondary);">✨ Transforming bullet...</div>`;
      const res = await window.AIAssistant.enhanceBullet(raw, r, jdRes.missing || []);

      out.innerHTML = `
        <div class="ai-suggestions-drawer">
          <div class="ai-drawer-header">
            <span>✨ ${esc(res.source)} — Click any variation to copy:</span>
          </div>
          ${res.suggestions.map(s => `
            <div class="ai-suggestion-option studio-copy-opt" data-text="${esc(s.text)}">
              <div class="ai-suggestion-mode">${esc(s.mode)}</div>
              <div class="ai-suggestion-text">${esc(s.text)}</div>
            </div>
          `).join('')}
        </div>
      `;

      out.querySelectorAll('.studio-copy-opt').forEach(el => {
        el.addEventListener('click', () => {
          const txt = el.getAttribute('data-text');
          navigator.clipboard?.writeText(txt);
          showToast('Copied enhanced bullet to clipboard!');
        });
      });
    });

    document.getElementById('actionVerbsDictionaryContainer')?.addEventListener('click', e => {
      const btn = e.target.closest('.btn-copy-verb');
      if (!btn) return;
      const verb = btn.getAttribute('data-verb');
      if (verb) {
        navigator.clipboard?.writeText(verb);
        showToast(`Copied "${verb}" to clipboard!`);
      }
    });

    // 11. Zoom, Export PDF, JSON, Theme, and Modals
    document.getElementById('btnZoomIn')?.addEventListener('click', () => applyZoom(appState.zoom + 0.08));
    document.getElementById('btnZoomOut')?.addEventListener('click', () => applyZoom(appState.zoom - 0.08));
    document.getElementById('btnZoomFit')?.addEventListener('click', fitZoomToViewport);

    document.getElementById('chkPageBreakGuide')?.addEventListener('change', e => {
      const guide = document.getElementById('pageBreakIndicator');
      if (guide) guide.style.display = e.target.checked ? 'flex' : 'none';
    });

    document.getElementById('btnExportPDF')?.addEventListener('click', () => {
      window.print();
    });

    document.getElementById('btnExportJSON')?.addEventListener('click', () => {
      const prof = getActiveProfile();
      if (!prof) return;
      const blob = new Blob([JSON.stringify(prof.resume, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const safeName = (prof.resume?.personal?.fullName || 'resume').toLowerCase().replace(/[^a-z0-9]+/g, '-');
      a.href = url;
      a.download = `${safeName}-resucraft.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Exported resume JSON!');
    });

    document.getElementById('btnImportJSON')?.addEventListener('click', () => {
      document.getElementById('jsonFileInput')?.click();
    });

    document.getElementById('jsonFileInput')?.addEventListener('change', e => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = evt => {
        try {
          const parsed = JSON.parse(evt.target.result);
          if (parsed && parsed.personal) {
            const prof = getActiveProfile();
            prof.resume = parsed;
            recordHistoryImmediate();
            saveState();
            renderAll();
            showToast('Imported resume JSON successfully!');
          } else {
            showToast('Invalid resume JSON file format.');
          }
        } catch (err) {
          showToast('Error parsing JSON file.');
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    });

    document.getElementById('btnThemeToggle')?.addEventListener('click', () => {
      document.body.classList.toggle('theme-light');
      const isLight = document.body.classList.contains('theme-light');
      localStorage.setItem(THEME_KEY, isLight ? 'light' : 'dark');
    });

    document.getElementById('btnOpenAtsPlainText')?.addEventListener('click', () => {
      const r = getActiveResume();
      const out = document.getElementById('atsPlainTextOutput');
      if (r && out) {
        out.value = window.ATSEngine.getResumePlainText(r) || '(Resume is currently blank — add your details to preview the ATS parse)';
      }
      document.getElementById('modalAtsPlain')?.classList.add('open');
    });

    document.getElementById('btnCopyAtsPlain')?.addEventListener('click', () => {
      const out = document.getElementById('atsPlainTextOutput');
      if (out) {
        navigator.clipboard?.writeText(out.value);
        showToast('Copied plain-text resume to clipboard!');
      }
    });

    document.getElementById('btnOpenAISettings')?.addEventListener('click', () => {
      const cfg = window.AIAssistant.getConfig();
      const sel = document.getElementById('selAIProvider');
      const keyInp = document.getElementById('inpAIApiKey');
      const modInp = document.getElementById('inpAIModel');
      const sec = document.getElementById('aiApiKeySection');
      if (sel) sel.value = cfg.provider || 'local';
      if (keyInp) keyInp.value = cfg.apiKey || '';
      if (modInp) modInp.value = cfg.model || (cfg.provider === 'openai' ? 'gpt-4o-mini' : 'gemini-2.5-flash');
      if (sec) sec.style.display = cfg.provider === 'local' ? 'none' : 'block';
      document.getElementById('modalAISettings')?.classList.add('open');
    });

    document.getElementById('selAIProvider')?.addEventListener('change', e => {
      const provider = e.target.value;
      const sec = document.getElementById('aiApiKeySection');
      const modInp = document.getElementById('inpAIModel');
      if (sec) sec.style.display = provider === 'local' ? 'none' : 'block';
      if (modInp) {
        modInp.value = provider === 'openai' ? 'gpt-4o-mini' : 'gemini-2.5-flash';
      }
    });

    document.getElementById('btnSaveAISettings')?.addEventListener('click', () => {
      const provider = document.getElementById('selAIProvider')?.value || 'local';
      const apiKey = document.getElementById('inpAIApiKey')?.value.trim() || '';
      const model = document.getElementById('inpAIModel')?.value.trim() || 'gemini-2.5-flash';
      window.AIAssistant.saveConfig({ provider, apiKey, model });
      updateAIProviderBadge();
      document.getElementById('modalAISettings')?.classList.remove('open');
      showToast('Saved AI Engine settings!');
    });

    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-close-modal');
        document.getElementById(id)?.classList.remove('open');
      });
    });

    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      backdrop.addEventListener('click', e => {
        if (e.target === backdrop) backdrop.classList.remove('open');
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme === 'light') {
      document.body.classList.add('theme-light');
    }
    loadState();
    renderActionVerbDictionary();
    renderAll();
    initEventListeners();
    setTimeout(fitZoomToViewport, 60);
    window.addEventListener('resize', fitZoomToViewport);
  });
})();
