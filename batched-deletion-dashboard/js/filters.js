/* Filter bar: populates dropdown options, listens to changes, exposes filtered() and current(). */
window.App = window.App || {};

App.filters = (function () {
  const state = { app:'', form:'', wf:'', status:'', user:'', time:'24h', q:'' };

  function populate() {
    const $$ = App.util.$$;
    function fill(field, opts) {
      const sel = document.querySelector(`[data-filter="${field}"]`);
      if (!sel) return;
      // Keep the first "All …" option, append distinct values
      const first = sel.querySelector('option');
      sel.innerHTML = '';
      if (first) sel.appendChild(first);
      opts.forEach(v => {
        const o = document.createElement('option');
        o.value = v; o.textContent = v;
        sel.appendChild(o);
      });
    }
    fill('app',  App.data.distinct('app'));
    fill('form', App.data.distinct('form'));
    fill('wf',   App.data.distinct('wf'));
    fill('user', App.data.distinct('user').map(u => u.split('@')[0]));
  }

  function bind() {
    document.querySelectorAll('[data-filter]').forEach(el => {
      const evt = (el.tagName === 'INPUT') ? 'input' : 'change';
      const handler = (e) => {
        state[el.dataset.filter] = el.value || '';
        App.util.emit('filters:changed', current());
      };
      el.addEventListener(evt, evt === 'input' ? App.util.debounce(handler, 180) : handler);
    });
    const clear = document.getElementById('btnClearFilters');
    if (clear) clear.addEventListener('click', reset);
  }

  function reset() {
    Object.keys(state).forEach(k => state[k] = (k === 'time') ? '24h' : '');
    document.querySelectorAll('[data-filter]').forEach(el => {
      el.value = (el.dataset.filter === 'time') ? '24h' : '';
    });
    App.util.emit('filters:changed', current());
    App.util.toast('Filters cleared');
  }

  function current() { return Object.assign({}, state); }

  function matches(e, s) {
    if (s.app    && e.app !== s.app) return false;
    if (s.form   && e.form !== s.form) return false;
    if (s.wf     && e.wf !== s.wf) return false;
    if (s.status && e.status !== s.status) return false;
    if (s.user   && !e.user.startsWith(s.user)) return false;
    if (s.q) {
      const q = s.q.toLowerCase();
      const blob = `${e.id} ${e.app} ${e.form} ${e.wf} ${e.user} ${e.func || ''} ${e.status}`.toLowerCase();
      if (!blob.includes(q)) return false;
    }
    // time filter is illustrative only — all mock executions fall in last 24h
    return true;
  }

  function filtered(executions) {
    return executions.filter(e => matches(e, state));
  }

  // Used by the status chip row so each chip shows a count consistent with
  // the other filters but unaffected by the currently-selected status.
  function filteredExceptStatus(executions) {
    const s = Object.assign({}, state, { status: '' });
    return executions.filter(e => matches(e, s));
  }

  function setStatus(value) {
    state.status = value || '';
    const sel = document.querySelector('[data-filter="status"]');
    if (sel) sel.value = state.status;
    App.util.emit('filters:changed', current());
  }

  function init() {
    populate();
    bind();
  }

  return { init, current, filtered, filteredExceptStatus, reset, setStatus };
})();
