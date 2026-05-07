/* Tiny utility helpers shared across modules. */
window.App = window.App || {};

App.util = (function () {

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.from((root || document).querySelectorAll(sel)); }

  function fmt(n) { return (n == null) ? '0' : Number(n).toLocaleString(); }

  function pct(num, den) {
    if (!den) return 0;
    return Math.round((num / den) * 100);
  }

  // Pub-sub for cross-module events ("filters:changed", "exec:selected", "data:refreshed")
  const listeners = {};
  function on(evt, fn) { (listeners[evt] = listeners[evt] || []).push(fn); }
  function emit(evt, payload) { (listeners[evt] || []).forEach(fn => { try { fn(payload); } catch (e) { console.error(e); } }); }

  // Toast
  let toastTimer;
  function toast(msg) {
    const el = $('#toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 1900);
  }

  function debounce(fn, ms) {
    let t;
    return function () {
      clearTimeout(t);
      const a = arguments, c = this;
      t = setTimeout(() => fn.apply(c, a), ms);
    };
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  return { $, $$, fmt, pct, on, emit, toast, debounce, escapeHtml };
})();
