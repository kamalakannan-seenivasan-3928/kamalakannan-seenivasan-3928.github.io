/* Application bootstrap: tabs, refresh, view switching. Wires everything together. */
window.App = window.App || {};

App.app = (function () {

  function setView(name) {
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.view === name));
    document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + name));
    if (name === 'detail') App.detailView.init();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function bindTabs() {
    document.querySelectorAll('.tab').forEach(t => {
      t.addEventListener('click', () => setView(t.dataset.view));
    });
    document.querySelectorAll('[data-view-jump]').forEach(b => {
      b.addEventListener('click', () => setView(b.dataset.viewJump));
    });
  }

  function refreshData() {
    // Mock refresh — perturb numbers slightly to feel "live"
    App.data.executions.forEach(e => {
      if (e.status === 'Running') {
        const inc = Math.min(e.planned - e.deleted - e.failed, Math.floor(Math.random() * 80) + 20);
        e.deleted = Math.min(e.planned, e.deleted + inc);
        if (Math.random() < 0.15) e.failed += Math.floor(Math.random() * 3);
        e.doneB = Math.min(e.batches, Math.floor((e.deleted / e.planned) * e.batches));
      }
    });
    App.util.emit('data:refreshed', { at: new Date() });
    setLastRefreshed(new Date());
    App.util.toast('Data refreshed');
  }

  function setLastRefreshed(d) {
    const el = document.getElementById('lastRefreshed');
    if (!el) return;
    const t = d || new Date();
    el.textContent = t.toLocaleTimeString();
  }

  function bindRefresh() {
    const btn = document.getElementById('btnRefresh');
    btn.addEventListener('click', () => {
      btn.classList.add('spin');
      setTimeout(() => {
        refreshData();
        btn.classList.remove('spin');
      }, 600);
    });
  }

  function bindBulkActions() {
    const bulk = document.getElementById('btnBulkSuspend');
    if (bulk) bulk.addEventListener('click', () => {
      const filtered = App.filters.filtered(App.data.executions).filter(e => e.status === 'Running');
      App.util.toast(`Bulk-suspend queued for ${filtered.length} running execution${filtered.length === 1 ? '' : 's'}`);
    });
    const exp = document.getElementById('btnExportCsv');
    if (exp) exp.addEventListener('click', () => {
      const rows = App.filters.filtered(App.data.executions);
      const csv = ['id,app,form,workflow,user,ip,when,planned,deleted,failed,status']
        .concat(rows.map(e => [e.id, e.app, e.form, e.wf, e.user, e.ip, e.when, e.planned, e.deleted, e.failed, e.status].join(',')))
        .join('\n');
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
      const a = document.createElement('a');
      a.href = url; a.download = 'delete-executions.csv';
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    });
  }

  function init() {
    App.theme.init();
    App.filters.init();
    App.quickView.init();
    App.detailView.init();   // eager — binds exec:open listener up front
    App.liveTail.init();
    bindTabs();
    bindRefresh();
    bindBulkActions();
    setLastRefreshed();
  }

  document.addEventListener('DOMContentLoaded', init);

  return { setView, refreshData };
})();
