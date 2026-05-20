/* ==========================================================================
   DELUGE PIPELINE — Shared Utilities
   ========================================================================== */

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c]));
}

function escapeAttr(s) { return escapeHtml(s); }

function relativeTime(dateStr) {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function triggerIcon(type) {
  const map = { webhook: '⌁', scheduled: '⏱', record: '◎', event: '⚡', queue: '⇥', manual: '▷' };
  return map[type] || '?';
}

function triggerLabel(type) {
  const map = { webhook: 'Webhook', scheduled: 'Scheduled', record: 'Record Change', event: 'Event-Based', queue: 'Message Queue', manual: 'Manual / API' };
  return map[type] || type;
}

function statusDotClass(status) {
  const map = { active: 'success', paused: 'warn', draft: 'idle', error: 'error' };
  return map[status] || 'idle';
}

const THEME_OPTIONS = [
  { value: 'light',       label: 'Light',         icon: '<svg class="icon-svg icon-svg-sm" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="4" y1="12" x2="2" y2="12"/><line x1="22" y1="12" x2="20" y2="12"/><line x1="5" y1="5" x2="6.5" y2="6.5"/><line x1="17.5" y1="17.5" x2="19" y2="19"/><line x1="5" y1="19" x2="6.5" y2="17.5"/><line x1="17.5" y1="6.5" x2="19" y2="5"/></svg>' },
  { value: 'dark',        label: 'Dark',          icon: '<svg class="icon-svg icon-svg-sm" viewBox="0 0 24 24"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>' },
  { value: 'night',       label: 'Night',         icon: '<svg class="icon-svg icon-svg-sm" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="2" fill="currentColor"/><path d="M12 3v1M12 20v1M3 12h1M20 12h1"/></svg>', separator: true },
  { value: 'vscode-dark', label: 'VS Code Dark',  icon: '<svg class="icon-svg icon-svg-sm" viewBox="0 0 24 24"><path d="M16 18l6-6-6-6M8 6l-6 6 6 6"/></svg>' },
  { value: 'homebrew',    label: 'Homebrew',      icon: '<svg class="icon-svg icon-svg-sm" viewBox="0 0 24 24"><path d="M6 8h10v10a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3V8z"/><path d="M16 11h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2"/><line x1="9" y1="4" x2="9" y2="6"/><line x1="13" y1="3" x2="13" y2="6"/></svg>' },
  { value: 'mercury',     label: 'Mercury',       icon: '<svg class="icon-svg icon-svg-sm" viewBox="0 0 24 24"><circle cx="12" cy="9" r="5"/><line x1="12" y1="14" x2="12" y2="21"/><line x1="9" y1="18" x2="15" y2="18"/><path d="M7 4a5 5 0 0 0 10 0"/></svg>' },
  { value: 'solarized',   label: 'Solarized',     icon: '<svg class="icon-svg icon-svg-sm" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/><line x1="5" y1="5" x2="7" y2="7"/><line x1="17" y1="17" x2="19" y2="19"/><line x1="5" y1="19" x2="7" y2="17"/><line x1="17" y1="7" x2="19" y2="5"/></svg>' },
  { value: 'material',    label: 'Material',      icon: '<svg class="icon-svg icon-svg-sm" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5z"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>' },
];

function buildThemeDropdownHTML() {
  const items = THEME_OPTIONS.map(o => `
    ${o.separator ? '<div class="theme-dropdown-separator"></div>' : ''}
    <div class="theme-dropdown-item" data-value="${o.value}">
      <span class="theme-dropdown-icon">${o.icon}</span>
      <span>${o.label}</span>
    </div>
  `).join('');
  return `
    <button class="theme-dropdown-trigger" type="button">
      <span class="theme-dropdown-icon" data-current-icon></span>
      <span class="theme-dropdown-label" data-current-label></span>
      <svg class="icon-svg icon-svg-sm theme-dropdown-caret" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
    </button>
    <div class="theme-dropdown-menu">${items}</div>
  `;
}

function initThemeSwitcher() {
  const saved = localStorage.getItem('deluge_theme') || 'dark';
  document.body.setAttribute('data-theme', saved);

  const picker = document.getElementById('themePicker');
  if (!picker) return;

  // Always upgrade to custom dropdown (clear legacy markup)
  picker.className = 'theme-dropdown';
  picker.innerHTML = buildThemeDropdownHTML();

  const trigger = picker.querySelector('.theme-dropdown-trigger');
  const menu = picker.querySelector('.theme-dropdown-menu');
  const labelEl = picker.querySelector('[data-current-label]');
  const iconEl = picker.querySelector('[data-current-icon]');

  function applyTheme(value) {
    const item = menu.querySelector(`.theme-dropdown-item[data-value="${value}"]`);
    if (!item) return;
    menu.querySelectorAll('.theme-dropdown-item').forEach(i => i.classList.remove('selected'));
    item.classList.add('selected');
    picker.dataset.value = value;
    labelEl.textContent = item.querySelector('span:last-child').textContent;
    iconEl.innerHTML = item.querySelector('.theme-dropdown-icon').innerHTML;
    document.body.setAttribute('data-theme', value);
    localStorage.setItem('deluge_theme', value);
    // Fire a custom event so pages can react (e.g., re-mount Monaco)
    document.dispatchEvent(new CustomEvent('themechange', { detail: { theme: value } }));
  }

  applyTheme(saved);

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    picker.classList.toggle('open');
  });
  menu.addEventListener('click', (e) => {
    const item = e.target.closest('.theme-dropdown-item');
    if (!item) return;
    applyTheme(item.dataset.value);
    picker.classList.remove('open');
  });
  document.addEventListener('click', (e) => {
    if (!picker.contains(e.target)) picker.classList.remove('open');
  });
}

// ============== UI DENSITY DROPDOWN ==============
// Renders into a container with id="densityToggle" — reuses .theme-dropdown styles.
const DENSITY_OPTIONS = [
  { value: 'ultra',    label: 'Ultra Compact', icon: '<svg class="icon-svg icon-svg-sm" viewBox="0 0 24 24"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="4" y1="18" x2="20" y2="18"/></svg>' },
  { value: 'tight',    label: 'Small Compact', icon: '<svg class="icon-svg icon-svg-sm" viewBox="0 0 24 24"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="10" x2="20" y2="10"/><line x1="4" y1="14" x2="20" y2="14"/><line x1="4" y1="17" x2="20" y2="17"/></svg>' },
  { value: 'compact',  label: 'Compact',       icon: '<svg class="icon-svg icon-svg-sm" viewBox="0 0 24 24"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></svg>' },
  { value: 'cozy',     label: 'Cozy',          icon: '<svg class="icon-svg icon-svg-sm" viewBox="0 0 24 24"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>' },
  { value: 'spacious', label: 'Spacious',      icon: '<svg class="icon-svg icon-svg-sm" viewBox="0 0 24 24"><line x1="4" y1="5" x2="20" y2="5"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="19" x2="20" y2="19"/></svg>' },
];

function initDensityToggle() {
  const host = document.getElementById('densityToggle');
  if (!host) return;
  _renderGenericDropdown({
    host,
    options: DENSITY_OPTIONS,
    storageKey: 'deluge_density',
    defaultValue: 'cozy',
    eventName: 'densitychange',
    apply: (v) => { document.body.dataset.density = v; },
  });
}

// ============== FONT FAMILY DROPDOWN ==============
// Sets the --font-ui CSS variable on :root. Body font-family already reads it.
const FONT_OPTIONS = [
  { value: 'puvi',         label: 'Zoho Puvi',      stack: "'Zoho Puvi', 'Puvi', system-ui, -apple-system, sans-serif",
    icon: '<svg class="icon-svg icon-svg-sm" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M8 9h8M8 15h8M12 9v6"/></svg>' },
  { value: 'mono',         label: 'JetBrains Mono', stack: "'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace",
    icon: '<svg class="icon-svg icon-svg-sm" viewBox="0 0 24 24"><path d="M8 4v16M16 4v16M4 8h16M4 16h16"/></svg>' },
  { value: 'monaco',       label: 'Monaco',         stack: "Monaco, Menlo, 'Courier New', monospace",
    icon: '<svg class="icon-svg icon-svg-sm" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="1"/><path d="M7 9l-2 3 2 3M17 9l2 3-2 3M13 8l-2 8"/></svg>' },
  { value: 'sf-mono',      label: 'SF Mono',        stack: "ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
    icon: '<svg class="icon-svg icon-svg-sm" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 9l-2 3 2 3M15 9l2 3-2 3"/></svg>' },
  { value: 'fira',         label: 'Fira Code',      stack: "'Fira Code', 'JetBrains Mono', ui-monospace, monospace",
    icon: '<svg class="icon-svg icon-svg-sm" viewBox="0 0 24 24"><path d="M5 4h14M5 4v16M5 12h9"/></svg>' },
  { value: 'inter',        label: 'Inter (Sans)',   stack: "Inter, system-ui, -apple-system, 'Segoe UI', sans-serif", separator: true,
    icon: '<svg class="icon-svg icon-svg-sm" viewBox="0 0 24 24"><path d="M6 4v16M6 4h6a4 4 0 0 1 0 8H6M6 12h7a4 4 0 0 1 0 8H6"/></svg>' },
  { value: 'system',       label: 'System UI',      stack: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    icon: '<svg class="icon-svg icon-svg-sm" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/></svg>' },
  { value: 'serif',        label: 'Serif',          stack: "Georgia, 'Times New Roman', Cambria, serif",
    icon: '<svg class="icon-svg icon-svg-sm" viewBox="0 0 24 24"><path d="M4 4h16M12 4v16M8 20h8"/></svg>' },
];

function initFontFamilyPicker() {
  const host = document.getElementById('fontPicker');
  if (!host) return;
  _renderGenericDropdown({
    host,
    options: FONT_OPTIONS,
    storageKey: 'deluge_font',
    defaultValue: 'mono',
    eventName: 'fontchange',
    apply: (v) => {
      const opt = FONT_OPTIONS.find(o => o.value === v);
      if (opt) document.documentElement.style.setProperty('--font-ui', opt.stack);
    },
  });
}

// Generic dropdown builder reusing .theme-dropdown styles.
function _renderGenericDropdown({ host, options, storageKey, defaultValue, eventName, apply }) {
  host.className = 'theme-dropdown';
  const items = options.map(o => `
    ${o.separator ? '<div class="theme-dropdown-separator"></div>' : ''}
    <div class="theme-dropdown-item" data-value="${o.value}">
      <span class="theme-dropdown-icon">${o.icon || ''}</span>
      <span>${o.label}</span>
    </div>
  `).join('');
  host.innerHTML = `
    <button class="theme-dropdown-trigger" type="button">
      <span class="theme-dropdown-icon" data-current-icon></span>
      <span class="theme-dropdown-label" data-current-label></span>
      <svg class="icon-svg icon-svg-sm theme-dropdown-caret" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
    </button>
    <div class="theme-dropdown-menu">${items}</div>
  `;
  const trigger = host.querySelector('.theme-dropdown-trigger');
  const menu = host.querySelector('.theme-dropdown-menu');
  const labelEl = host.querySelector('[data-current-label]');
  const iconEl = host.querySelector('[data-current-icon]');

  function set(value, persist = true) {
    const item = menu.querySelector(`.theme-dropdown-item[data-value="${value}"]`);
    if (!item) return;
    menu.querySelectorAll('.theme-dropdown-item').forEach(i => i.classList.remove('selected'));
    item.classList.add('selected');
    host.dataset.value = value;
    labelEl.textContent = item.querySelector('span:last-child').textContent;
    iconEl.innerHTML = item.querySelector('.theme-dropdown-icon').innerHTML;
    apply(value);
    if (persist) localStorage.setItem(storageKey, value);
    document.dispatchEvent(new CustomEvent(eventName, { detail: { value } }));
  }

  const saved = localStorage.getItem(storageKey) || defaultValue;
  set(saved, false);

  trigger.addEventListener('click', (e) => { e.stopPropagation(); host.classList.toggle('open'); });
  menu.addEventListener('click', (e) => {
    const item = e.target.closest('.theme-dropdown-item');
    if (!item) return;
    set(item.dataset.value);
    host.classList.remove('open');
  });
  document.addEventListener('click', (e) => { if (!host.contains(e.target)) host.classList.remove('open'); });
}

// Apply persisted density + font immediately so the page paints in the right size on first frame.
(function applyEarlyPrefs() {
  try {
    const d = localStorage.getItem('deluge_density');
    const f = localStorage.getItem('deluge_font');
    document.addEventListener('DOMContentLoaded', () => {
      document.body.dataset.density = d || 'cozy';
      if (f) {
        const opt = FONT_OPTIONS.find(o => o.value === f);
        if (opt) document.documentElement.style.setProperty('--font-ui', opt.stack);
      }
    });
  } catch (_) {}
})();
