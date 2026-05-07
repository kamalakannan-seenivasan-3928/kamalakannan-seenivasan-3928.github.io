/* Detailed view: header, metrics, queue strip, batch rail, batch log, audit, dependencies. */
window.App = window.App || {};

App.detailView = (function () {
  const C = {
    done:    'var(--ok-mid)',
    run:     'var(--info-mid)',
    queue:   'var(--muted)',
    partial: 'var(--warn-mid)',
    fail:    'var(--err-mid)',
    suspend: 'var(--susp-mid)'
  };

  let picker = null;
  let currentExec = null;
  let currentBatchIdx = 0;
  let thruChart = null;
  let inited = false;

  function buildPicker() {
    picker = App.SearchPicker('#execPicker', {
      placeholder: 'Search execution by ID, app, form, user…',
      items: itemsForPicker(),
      match: (it, q) => {
        const blob = `${it.id} ${it.label} ${it.meta}`.toLowerCase();
        return blob.includes(q.toLowerCase());
      },
      renderItem: (it) => `
        <div class="pi-id">${App.util.escapeHtml(it.id)}</div>
        <div class="pi-meta">${App.util.escapeHtml(it.meta)}</div>
      `,
      onChange: (it) => {
        const e = App.data.findById(it.id);
        if (e) load(e);
      }
    });
  }

  function itemsForPicker() {
    return App.data.executions.map(e => ({
      id: e.id,
      label: `${e.id} · ${e.app}/${e.form}`,
      meta: `${e.wf} · ${e.user.split('@')[0]} · ${e.status} · ${App.util.fmt(e.deleted)}/${App.util.fmt(e.planned)}`
    }));
  }

  function load(e) {
    currentExec = e;
    currentBatchIdx = Math.min(e.doneB, e.batches - 1);
    if (currentBatchIdx < 0) currentBatchIdx = 0;

    if (picker) picker.setValue(e.id);

    // Header
    const idEl = document.getElementById('dId');
    idEl.textContent = e.id;
    idEl.href = App.links.execution(e.id);

    const meta = document.getElementById('dMeta');
    meta.innerHTML = [
      App.links.tag(App.links.app(e.app), e.app),
      '·',
      App.links.tag(App.links.form(e.app, e.form), e.form),
      '·',
      App.links.tag(App.links.workflow(e.app, e.wf), e.wf),
      `— started ${App.util.escapeHtml(e.when)} IST · by ${App.util.escapeHtml(e.user)} (${App.util.escapeHtml(e.ip)})`
    ].join(' ');

    document.getElementById('dFunc').textContent = e.func;
    document.getElementById('dLine').textContent = e.line;

    const lnkCode = document.getElementById('lnkOpenCode');
    if (lnkCode) lnkCode.href = App.links.functionCode(e.app, e.func, e.line);

    const lnkForm = document.getElementById('lnkOpenForm');
    if (lnkForm) lnkForm.href = App.links.form(e.app, e.form);

    // Status pill
    const ds = document.getElementById('dStatus');
    ds.className = 'pill stat-' + e.status.toLowerCase();
    ds.textContent = e.status;

    renderMetrics(e);
    renderStrip(e);
    renderRail(e);
    renderThruChart(e);
    renderAudit(e);
    renderDeps(e);
    selectBatch(currentBatchIdx);

    App.util.emit('exec:loaded', e);
  }

  function renderMetrics(e) {
    const pending = Math.max(0, e.planned - e.deleted - e.failed);
    const tput = e.status === 'Running' ? 112 : (e.status === 'Completed' ? 0 : 0);
    document.getElementById('dMetrics').innerHTML = `
      <div class="metric"><div class="label">Planned</div><div class="value">${App.util.fmt(e.planned)}</div></div>
      <div class="metric"><div class="label">Deleted</div><div class="value">${App.util.fmt(e.deleted)}</div></div>
      <div class="metric"><div class="label">Failed</div><div class="value" style="color:var(--err);">${App.util.fmt(e.failed)}</div></div>
      <div class="metric"><div class="label">Pending</div><div class="value">${App.util.fmt(pending)}</div></div>
      <div class="metric"><div class="label">Batch size</div><div class="value">200 <span style="font-size:11px;color:var(--muted);">adaptive</span></div></div>
      <div class="metric"><div class="label">Throughput</div><div class="value">${tput} <span style="font-size:11px;color:var(--muted);">rec/s</span></div></div>
    `;
    document.getElementById('batchTotal').textContent = e.batches;
  }

  function renderStrip(e) {
    const total = Math.min(e.batches, 80);
    const strip = document.getElementById('batchStrip');
    strip.innerHTML = Array.from({ length: total }, (_, i) =>
      `<span title="B-${pad(i + 1)}" style="background:${cellColor(e, i)};"></span>`
    ).join('');
    strip.querySelectorAll('span').forEach((sp, i) =>
      sp.addEventListener('click', () => selectBatch(i))
    );
  }

  function renderRail(e) {
    const total = Math.min(e.batches, 60);
    const filterMode = (document.getElementById('batchFilter') || {}).value || 'all';
    const items = [];
    for (let i = 0; i < total; i++) {
      const st = batchState(e, i);
      if (filterMode !== 'all' && st !== filterMode) continue;
      const id = 'B-' + pad(i + 1);
      const start = (i * 200) + 1, end = (i + 1) * 200;
      items.push(`<div class="batch-row" data-i="${i}">
        <span class="dot" style="background:${cellColor(e, i)};"></span>
        <span class="b-id">${id}</span>
        <span class="b-meta">${App.util.fmt(start)}–${App.util.fmt(end)}</span>
        <span class="b-status">${st}</span>
      </div>`);
    }
    const rail = document.getElementById('batchRail');
    rail.innerHTML = items.join('') || '<div class="sub" style="padding:14px;text-align:center;">No batches match.</div>';
    rail.querySelectorAll('.batch-row').forEach(r => {
      r.addEventListener('click', () => selectBatch(parseInt(r.dataset.i, 10)));
    });
  }

  function selectBatch(i) {
    currentBatchIdx = i;
    const id = 'B-' + pad(i + 1);
    document.getElementById('bId').textContent = id;

    document.querySelectorAll('#batchStrip span').forEach((s, idx) => s.classList.toggle('sel', idx === i));
    document.querySelectorAll('#batchRail .batch-row').forEach((r) => r.classList.toggle('sel', parseInt(r.dataset.i, 10) === i));

    renderBatchDetail(currentExec, i);
  }

  function renderBatchDetail(e, i) {
    const start = (i * 200) + 1, end = (i + 1) * 200;
    document.getElementById('bMeta').innerHTML = `
      <div class="metric"><div class="label">Range</div><div class="value mono" style="font-size:14px;">${App.util.fmt(start)} → ${App.util.fmt(end)}</div></div>
      <div class="metric"><div class="label">Worker / shard</div><div class="value mono" style="font-size:14px;">w-eu-0${(i % 6) + 1}</div></div>
      <div class="metric"><div class="label">Duration</div><div class="value" style="font-size:14px;">${(1.4 + (i % 8) * 0.1).toFixed(2)}s</div></div>
    `;

    const isPartial = (i % 13 === 0 && e.failed);
    const status = batchState(e, i);

    document.getElementById('bLog').textContent = buildLog(e.id, 'B-' + pad(i + 1), start, end, isPartial, status);

    const tbody = document.querySelector('#bFailTbl tbody');
    if (isPartial || status === 'failed') {
      const rows = App.data.failedRecordsSample.map(r => {
        const recHref = App.links.record(e.app, e.form, r.id);
        return `<tr>
          <td>${App.links.tag(recHref, '#' + r.id, { mono:true, title:'Open record'})}</td>
          <td>${App.util.escapeHtml(r.reason)}</td>
          <td><span class="pill stat-${r.cat === 'guard' ? 'failed' : r.cat === 'retry' ? 'partial' : 'suspended'}">${App.util.escapeHtml(r.cat)}</span></td>
          <td><button class="btn-quiet" style="font-size:11px;">${App.util.escapeHtml(r.action)}</button></td>
        </tr>`;
      }).join('');
      tbody.innerHTML = rows;
      document.getElementById('bFailCount').textContent = App.data.failedRecordsSample.length;
    } else {
      tbody.innerHTML = `<tr><td colspan="4" class="sub" style="text-align:center;padding:16px;">No failures in this batch.</td></tr>`;
      document.getElementById('bFailCount').textContent = 0;
    }
  }

  function buildLog(execId, batchId, start, end, isPartial, status) {
    const t0 = '02:21:14';
    if (status === 'queued') {
      return `[queued]  ${batchId} waiting in execution queue (group ${execId})`;
    }
    if (status === 'running') {
      return `${t0}.022  INFO   ${batchId} picked from queue (group ${execId})\n${t0}.118  INFO   acquired delete lock (records ${start}..${end})\n${t0}.420  INFO   …processing…`;
    }
    if (status === 'suspended') {
      return `${t0}.022  INFO   ${batchId} picked from queue (group ${execId})\n${t0}.802  WARN   batch SUSPENDED by admin · awaiting resume`;
    }
    if (status === 'failed') {
      return `${t0}.022  INFO   ${batchId} picked from queue (group ${execId})\n${t0}.802  ERROR  bulk delete failed · 80 records → dead-letter\n${t0}.820  ERROR  ${batchId} aborted · status=FAILED`;
    }
    if (isPartial) {
      return `${t0}.022  INFO   ${batchId} picked from queue (group ${execId})
${t0}.041  INFO   adaptive_batch_size=200 · shard=eu-cluster-2
${t0}.118  INFO   acquired delete lock on Leads (records ${start}..${end})
${t0}.402  WARN   record 5,318 — referenced by Deal#48211, deferred
${t0}.610  ERROR  record 5,344 — workflow guard rejected (validation: email_required)
${t0}.612  ERROR  record 5,345 — workflow guard rejected (validation: email_required)
${t0}.788  ERROR  record 5,371 — db conflict, will retry next cycle
${t0}.802  INFO   committed 196/200, 4 deferred to dead-letter
${t0}.812  INFO   ${batchId} done in 1.79s · status=PARTIAL`;
    }
    return `${t0}.022  INFO   ${batchId} picked from queue (group ${execId})
${t0}.041  INFO   adaptive_batch_size=200 · shard=eu-cluster-2
${t0}.118  INFO   acquired delete lock (records ${start}..${end})
${t0}.802  INFO   committed 200/200
${t0}.812  INFO   ${batchId} done in 1.62s · status=OK`;
  }

  function renderThruChart(e) {
    const ctx = document.getElementById('cThru');
    if (!ctx || !window.Chart) return;
    if (thruChart) thruChart.destroy();

    const labels = Array.from({ length: 30 }, (_, i) => `${i}m`);
    const seed = e.id.charCodeAt(5) % 7;
    const rps = labels.map((_, i) => Math.round(80 + 60 * Math.sin((i + seed) / 4) + ((i * 13 + seed * 7) % 20)));
    const bs  = labels.map((_, i) => i < 5 ? 250 : i < 12 ? 200 : i < 22 ? 220 : 200);

    thruChart = new Chart(ctx, {
      data: {
        labels,
        datasets: [
          { type: 'line', label: 'records/sec', data: rps, borderColor: '#378ADD', backgroundColor: 'rgba(55,138,221,0.12)', fill: true, tension: 0.35, pointRadius: 0, borderWidth: 2, yAxisID: 'y' },
          { type: 'line', label: 'batch size',  data: bs,  borderColor: '#EF9F27', borderDash: [4, 3], pointRadius: 0, borderWidth: 2, yAxisID: 'y1' }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'top', labels: { font: { size: 11 }, boxWidth: 10, boxHeight: 10 } } },
        scales: {
          x:  { ticks: { font: { size: 10 }, maxTicksLimit: 6 }, grid: { display: false } },
          y:  { position: 'left',  ticks: { font: { size: 10 } }, grid: { color: 'rgba(127,127,127,0.15)' }, title: { display: true, text: 'rec/s', font: { size: 10 }, color: '#888' } },
          y1: { position: 'right', ticks: { font: { size: 10 } }, grid: { display: false }, title: { display: true, text: 'batch', font: { size: 10 }, color: '#888' } }
        }
      }
    });
  }

  function renderAudit(e) {
    const tl = document.getElementById('auditTl');
    const items = [
      { c: 'ok',   t: `Execution submitted · ${e.when}:08`, m: `${App.util.escapeHtml(e.user)} · IP ${App.util.escapeHtml(e.ip)} · planned ${App.util.fmt(e.planned)}` },
      { c: '',     t: `First batch picked · ${e.when}:09`,  m: 'Batch size adapted to 200 from 250 (queue depth high)' },
      { c: 'warn', t: 'Batch B-0014 partial · 02:18:42',     m: '3 validation guards triggered on Leads.email' },
      { c: 'warn', t: 'Batch B-0027 partial · 02:21:15',     m: '4 records deferred · current' },
      { c: '',     t: `${Math.max(0, e.batches - e.doneB)} batches remaining`, m: `ETA 02:34, queue position 1` }
    ];
    tl.innerHTML = items.map(it =>
      `<div class="tl-item ${it.c}"><div class="tl-title">${it.t}</div><div class="tl-meta">${it.m}</div></div>`
    ).join('');
  }

  function renderDeps(e) {
    const formLink = App.links.tag(App.links.form(e.app, e.form), `${e.app} · ${e.form}`);
    const wfLink   = App.links.tag(App.links.workflow(e.app, e.wf), `Workflow “${e.wf}”`);
    const tbl = document.getElementById('depTbl');
    tbl.innerHTML = `
      <tr><td>Form</td><td>${formLink}</td></tr>
      <tr><td>Triggered by</td><td>${wfLink}, schedule</td></tr>
      <!-- <tr><td>Cascade off</td><td>Deals (lookup), Notes</td></tr>
      <tr><td>Subforms touched</td><td>Lead_Activities</td></tr>
      <tr><td>Search index</td><td>async re-sync queued</td></tr>
      <tr><td>Webhooks fired</td><td>${App.util.fmt(Math.floor(e.deleted / 100))} (lead.deleted)</td></tr> -->
      <tr><td>Recovery window</td><td>restorable for 30 days</td></tr>
    `;
  }

  function batchState(e, i) {
    if (e.status === 'Suspended' && i > Math.floor(Math.min(e.batches, 80) * 0.35)) return 'suspended';
    if (i < e.doneB) return (i % 13 === 0 && e.failed) ? 'partial' : 'ok';
    if (i === e.doneB && e.status === 'Running') return 'running';
    if (e.status === 'Failed' && i === e.doneB) return 'failed';
    return 'queued';
  }
  function cellColor(e, i) {
    const s = batchState(e, i);
    return s === 'ok' ? C.done : s === 'partial' ? C.partial : s === 'failed' ? C.fail
         : s === 'running' ? C.run : s === 'suspended' ? C.suspend : C.queue;
  }
  function pad(n) { return String(n).padStart(4, '0'); }

  function bind() {
    document.getElementById('btnPrevExec').addEventListener('click', () => step(-1));
    document.getElementById('btnNextExec').addEventListener('click', () => step(+1));
    document.getElementById('batchFilter').addEventListener('change', () => renderRail(currentExec));

    document.getElementById('btnSuspendExec').addEventListener('click', () => {
      App.util.toast(`Suspended ${currentExec.id}`);
    });
    document.getElementById('btnSuspendGroup').addEventListener('click', () => {
      App.util.toast(`Suspended next group of ${currentExec.id}`);
    });
    document.getElementById('btnRetryFailed').addEventListener('click', () => {
      App.util.toast(`Retry queued for failed batches in ${currentExec.id}`);
    });
  }

  function step(dir) {
    const list = App.data.executions;
    const idx = list.indexOf(currentExec);
    const next = list[(idx + dir + list.length) % list.length];
    load(next);
  }

  function init() {
    if (inited) return;
    buildPicker();
    bind();

    App.util.on('exec:open', (id) => {
      const e = App.data.findById(id);
      if (e) { App.app.setView('detail'); load(e); }
    });
    App.util.on('data:refreshed', () => {
      if (currentExec) {
        const fresh = App.data.findById(currentExec.id);
        if (fresh) load(fresh);
      }
    });
    App.util.on('theme:changed', () => {
      if (currentExec) renderThruChart(currentExec);
    });

    // Default load
    load(App.data.executions[0]);
    inited = true;
  }

  // Deep-link entry point used by the live tail and elsewhere.
  // Loads the named execution and optionally selects a specific batch.
  function focus(execId, batchIdx) {
    const e = App.data.findById(execId);
    if (!e) return;
    if (typeof App.app !== 'undefined' && App.app.setView) App.app.setView('detail');
    load(e);
    if (typeof batchIdx === 'number' && batchIdx >= 0 && batchIdx < e.batches) {
      selectBatch(batchIdx);
    }
  }

  return { init, load, focus, selectBatch };
})();
