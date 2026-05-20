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
