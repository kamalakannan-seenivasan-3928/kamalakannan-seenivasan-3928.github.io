/* Builds Zoho Creator edit-mode URLs for apps, forms, workflows, records, executions. */
window.App = window.App || {};

App.links = (function () {
  const T = App.data.TENANT;
  const base = 'https://creator.zoho.com';
  const slug = (s) => String(s).toLowerCase().replace(/\s+/g, '-');

  function app(name)              { return `${base}/${T}/${slug(name)}/`; }
  function form(appName, formName){ return `${base}/${T}/${slug(appName)}/form-perma/${slug(formName)}/`; }
  function workflow(appName, wf)  { return `${base}/${T}/${slug(appName)}/workflow/${encodeURIComponent(wf)}/`; }
  function record(appName, formName, id) {
    return `${base}/${T}/${slug(appName)}/form-perma/${slug(formName)}/${id}/edit`;
  }
  function execution(id)          { return `${base}/console/delete-executions/${id}`; }
  function functionCode(appName, fnName, line) {
    return `${base}/${T}/${slug(appName)}/script-perma/${encodeURIComponent(fnName)}#L${line || 1}`;
  }

  // Renders an <a class="link"> for any of the above.
  function tag(href, label, opts) {
    const o = opts || {};
    const cls = ['link'].concat(o.mono ? ['link-mono'] : []).join(' ');
    return `<a class="${cls}" href="${href}" target="_blank" rel="noopener" title="${o.title || 'Open in editor'}">${App.util.escapeHtml(label)}</a>`;
  }

  return { app, form, workflow, record, execution, functionCode, tag };
})();
