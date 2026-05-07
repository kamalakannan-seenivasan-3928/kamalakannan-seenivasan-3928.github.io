/* Theme switcher. Persists to localStorage and falls back to system preference. */
window.App = window.App || {};

App.theme = (function () {
  const KEY = 'deluge.delete.theme';
  const VALID = ['light', 'dark', 'night', 'custom'];

  function get() {
    return document.documentElement.getAttribute('data-theme') || 'light';
  }

  function set(name, opts) {
    if (!VALID.includes(name)) name = 'light';
    document.documentElement.setAttribute('data-theme', name);
    try { localStorage.setItem(KEY, name); } catch (e) { /* ignore */ }

    // Update active button state
    App.util.$$('.theme-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.themeSet === name);
    });

    App.util.emit('theme:changed', name);

    if (opts && opts.toast !== false) {
      App.util.toast(`Theme: ${name}`);
    }
  }

  function init() {
    let saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) { /* ignore */ }
    const sysDark = window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches;
    const initial = saved || (sysDark ? 'dark' : 'light');
    set(initial, { toast: false });

    App.util.$$('.theme-btn').forEach(b => {
      b.addEventListener('click', () => set(b.dataset.themeSet));
    });
  }

  return { init, set, get };
})();
