/* Quick view: KPI strip + execution card grid. Re-renders on filters:changed and data:refreshed. */
window.App = window.App || {};

App.quickView = (function () {
  const C = {
    done:    'var(--ok-mid)',
    run:     'var(--info-mid)',
    queue:   'var(--muted)',
    partial: 'var(--warn-mid)',
    fail:    'var(--err-mid)',
    suspend: 'var(--susp-mid)'
  };

  function renderKPIs(executions) {
    const total = executions.length;
    const recordsDeleted = executions.reduce((a, e) => a + e.deleted, 0);
    const running = executions.filter(e => e.status === 'Running').length;
    const queued  = executions.filter(e => e.status === 'Queued').length;
    const suspended = executions.filter(e => e.status === 'Suspended').length;
    const failedRecords = executions.reduce((a, e) => a + e.failed, 0);
    const totalPlanned = executions.reduce((a, e) => a + e.planned, 0);
    const errRate = totalPlanned ? ((failedRecords / totalPlanned) * 100).toFixed(3) : '0.000';

    const strip = document.getElementById('kpiStrip');
    if (!strip) return;
    strip.innerHTML = `
      <div class="metric"><div class="label">Executions</div><div class="value">${App.util.fmt(total)}</div><div class="delta up">▲ scoped to filters</div></div>
      <div class="metric"><div class="label">Records deleted</div><div class="value">${formatBig(recordsDeleted)}</div><div class="delta">across ${App.util.fmt(executions.reduce((a,e)=>a+e.batches,0))} batches</div></div>
      <div class="metric"><div class="label">Running / Queued</div><div class="value">${running} <span style="font-size:13px;color:var(--muted);">/ ${queued}</span></div><div class="delta">avg batch 1.8s</div></div>
      <div class="metric"><div class="label">Suspended</div><div class="value">${suspended}</div><div class="delta warn">${suspended ? 'resumable' : 'none'}</div></div>
      <div class="metric"><div class="label">Failed records</div><div class="value">${App.util.fmt(failedRecords)}</div><div class="delta down">${errRate}% rate</div></div>
    `;
  }

  function formatBig(n) {
    if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'k';
    return App.util.fmt(n);
  }

  function renderGrid(executions) {
    const grid = document.getElementById('quickGrid');
    const empty = document.getElementById('quickEmpty');
    const count = document.getElementById('quickCount');
    if (count) count.textContent = `· ${executions.length} match${executions.length === 1 ? '' : 'es'}`;

    if (!executions.length) {
      grid.innerHTML = '';
      empty.classList.remove('hidden');
      return;
    }
    empty.classList.add('hidden');

    grid.innerHTML = executions.map(buildCard).join('');

    grid.querySelectorAll('.qcard').forEach(c => {
      c.addEventListener('click', (ev) => {
        // Don't hijack clicks on inner links
        if (ev.target.closest('a.link')) return;
        App.util.emit('exec:open', c.dataset.id);
      });
    });
  }

  function buildCard(e) {
    const pct = App.util.pct(e.deleted, e.planned);
    const cells = 24;
    const doneCells = Math.floor((e.doneB / e.batches) * cells);
    const strip = Array.from({ length: cells }, (_, i) => {
      let c = C.queue;
      if (e.status === 'Suspended' && i > Math.floor(cells * 0.4)) c = C.suspend;
      else if (i < doneCells)                                       c = (i % 7 === 0 && e.failed) ? C.partial : C.done;
      else if (i === doneCells && e.status === 'Running')           c = C.run;
      else if (e.status === 'Failed' && i === doneCells)            c = C.fail;
      return `<span style="background:${c};"></span>`;
    }).join('');

    const progClass =
      e.status === 'Failed'    ? 'failed'    :
      e.status === 'Suspended' ? 'suspended' :
      (e.failed ? 'partial' : '');

    const cardClass = `qcard s-${e.status.toLowerCase()}`;
    const statClass = `pill stat-${e.status.toLowerCase()}`;

    const appLink  = App.links.tag(App.links.app(e.app),       e.app,  { title:'Open application'});
    const formLink = App.links.tag(App.links.form(e.app, e.form), e.form, { title:'Open form in editor'});
    const wfLink   = App.links.tag(App.links.workflow(e.app, e.wf), e.wf, { title:'Open workflow'});
    const idLink   = App.links.tag(App.links.execution(e.id), e.id, { mono:true, title:'Open execution'});

    return `<div class="${cardClass}" data-id="${e.id}">
      <div class="q-head">
        ${idLink}
        <span class="${statClass}">${e.status}</span>
      </div>
      <div class="q-title">${appLink} · ${formLink}</div>
      <div class="q-sub">${wfLink} · ${App.util.escapeHtml(e.user.split('@')[0])} · ${App.util.escapeHtml(e.when)}</div>
      <div class="q-stats">
        <span>${App.util.fmt(e.deleted)} / ${App.util.fmt(e.planned)} (${pct}%)</span>
        <span>${e.doneB}/${e.batches} batches${e.failed ? ` · <span class="err-count">${e.failed} failed</span>` : ''}</span>
      </div>
      <div class="progress ${progClass}"><span style="width:${pct}%;"></span></div>
      <div class="mini-strip">${strip}</div>
    </div>`;
  }

  function renderStatusChips() {
    const host = document.getElementById('statusChips');
    if (!host) return;
    const baseSet = App.filters.filteredExceptStatus(App.data.executions);
    const selected = App.filters.current().status || '';

    const counts = { '': baseSet.length };
    App.data.STATUSES.forEach(s => {
      counts[s] = baseSet.filter(e => e.status === s).length;
    });

    const chips = [{ key: '', label: 'All' }].concat(
      App.data.STATUSES.map(s => ({ key: s, label: s }))
    );

    host.innerHTML = chips.map(c => {
      const isActive = c.key === selected;
      const count = counts[c.key] || 0;
      const slug = c.key ? `s-${c.key.toLowerCase()}` : 's-all';
      const empty = (count === 0 && c.key !== '') ? 'empty' : '';
      return `<button
          type="button"
          class="chip ${slug} ${isActive ? 'active' : ''} ${empty}"
          data-chip-status="${App.util.escapeHtml(c.key)}"
          role="tab"
          aria-selected="${isActive}"
          ${empty && c.key !== selected ? 'disabled' : ''}>
        ${App.util.escapeHtml(c.label)}
        <span class="chip-count">${App.util.fmt(count)}</span>
      </button>`;
    }).join('');

    host.querySelectorAll('.chip').forEach(chip => {
      chip.addEventListener('click', () => {
        if (chip.hasAttribute('disabled')) return;
        const next = chip.dataset.chipStatus;
        // Single-select: clicking the active chip clears the filter.
        const currentlyActive = (next === selected);
        App.filters.setStatus(currentlyActive ? '' : next);
      });
    });
  }

  function rerender() {
    const filtered = App.filters.filtered(App.data.executions);
    renderStatusChips();
    renderKPIs(filtered);
    renderGrid(filtered);
  }

  function init() {
    rerender();
    App.util.on('filters:changed', rerender);
    App.util.on('data:refreshed', rerender);
    App.util.on('theme:changed', rerender); // re-evaluate inline css var colors
  }

  return { init, rerender };
})();
