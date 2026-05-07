/* Live tail. Renders seed events; pause and "errors only" toggles.
 * Detects EXEC-XXXX, B-NNNN, and record (#NNNN / numeric) references in
 * each line and turns them into clickable links that jump to the detailed
 * view with the correct batch (and execution) selected.
 */
window.App = window.App || {};

App.liveTail = (function () {
  let paused = false;
  let errorsOnly = false;
  let events = [];

  // Patterns. Order matters in the sense that we extract the EXEC ID first
  // so subsequent batch / record links can carry it as their context.
  const RE_EXEC   = /EXEC-[A-Z0-9]+/g;
  const RE_BATCH  = /B-\d{4}/g;
  const RE_RECORD = /#\d{2,7}/g;

  function buildEvents() {
    // Seed events with timestamps walking backwards from "now"
    const out = [];
    let h = 2, m = 21, s = 16;
    App.data.tailSeed.forEach(([lvl, msg]) => {
      const ts = `0${h}:${pad(m)}:${pad(s)}.${pad(Math.floor(Math.random() * 999), 3)}`;
      out.push({ ts, lvl, msg });
      s = Math.max(0, s - (1 + Math.floor(Math.random() * 3)));
      if (s <= 0) { s = 59; m -= 1; }
      if (m <= 0) { m = 59; h -= 1; }
    });
    events = out;
  }

  function pad(n, len) { return String(n).padStart(len || 2, '0'); }

  /* ----- Linkify ----- */

  // Returns HTML (already-escaped where appropriate). Each ref becomes an
  // anchor with data attributes the click handler reads.
  function linkify(rawMsg) {
    const escaped = App.util.escapeHtml(rawMsg);

    // Determine the EXEC context for this line (if any). Run the regex on
    // the raw msg, then we still emit the link in the escaped string.
    const execMatch = rawMsg.match(/EXEC-[A-Z0-9]+/);
    const execId = execMatch ? execMatch[0] : null;

    let html = escaped;

    // Linkify EXEC-XXX
    html = html.replace(RE_EXEC, (id) =>
      `<a class="link link-mono tail-ref" href="#" data-tail-exec="${id}" title="Open execution in detailed view">${id}</a>`
    );

    // Linkify B-NNNN, attaching the line's exec context so the click handler
    // can deep-link straight to the right batch.
    html = html.replace(RE_BATCH, (b) => {
      if (!execId) return b;
      return `<a class="link link-mono tail-ref" href="#" data-tail-exec="${execId}" data-tail-batch="${b}" title="Open batch in detailed view">${b}</a>`;
    });

    // Linkify #NNNN — record number. We don't know which batch, so we just
    // navigate to the execution; detail view will land on the most recent
    // batch by default.
    html = html.replace(RE_RECORD, (r) => {
      if (!execId) return r;
      return `<a class="link link-mono tail-ref" href="#" data-tail-exec="${execId}" data-tail-record="${r}" title="Open record context in detailed view">${r}</a>`;
    });

    return html;
  }

  function render() {
    const tail = document.getElementById('tail');
    if (!tail) return;
    const filtered = errorsOnly ? events.filter(e => e.lvl === 'ERROR') : events;
    tail.innerHTML = filtered.map(e =>
      `<div class="row-line"><span class="ts">${e.ts}</span><span class="lvl lvl-${e.lvl}">${e.lvl}</span> ${linkify(e.msg)}</div>`
    ).join('');
  }

  /* ----- Click handler — single delegated listener for all tail refs ----- */
  function bindTailClicks() {
    const tail = document.getElementById('tail');
    if (!tail) return;
    tail.addEventListener('click', (ev) => {
      const a = ev.target.closest('a.tail-ref');
      if (!a) return;
      ev.preventDefault();

      const execId = a.dataset.tailExec;
      const batch  = a.dataset.tailBatch;   // e.g. "B-0027"
      const record = a.dataset.tailRecord;  // e.g. "#5318"

      if (!execId) return;

      let batchIdx;
      if (batch) {
        batchIdx = parseInt(batch.replace(/^B-0*/, ''), 10) - 1;
      }

      App.detailView.focus(execId, batchIdx);

      if (record) {
        App.util.toast(`Showing batch context for record ${record}`);
      }
    });
  }

  function bind() {
    document.getElementById('btnTailPause').addEventListener('click', (ev) => {
      paused = !paused;
      ev.currentTarget.textContent = paused ? 'Resume' : 'Pause';
      App.util.toast(paused ? 'Tail paused' : 'Tail resumed');
    });
    document.getElementById('btnTailErrors').addEventListener('click', (ev) => {
      errorsOnly = !errorsOnly;
      ev.currentTarget.textContent = errorsOnly ? 'Show all' : 'Errors only';
      render();
    });
    bindTailClicks();
  }

  function init() {
    buildEvents();
    bind();
    render();
    App.util.on('data:refreshed', () => {
      if (!paused) { buildEvents(); render(); }
    });
  }

  return { init, render };
})();
