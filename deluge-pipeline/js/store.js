/* ==========================================================================
   DELUGE PIPELINE — Shared Store (localStorage-backed)
   ========================================================================== */

const PipelineStore = (() => {
  const STORAGE_KEY = 'deluge_pipelines';
  const AUDIT_KEY = 'deluge_global_audit';

  function load() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch { return []; }
  }

  function save(pipelines) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pipelines));
  }

  function loadAudit() {
    try { return JSON.parse(localStorage.getItem(AUDIT_KEY)) || []; }
    catch { return []; }
  }

  function saveAudit(audit) {
    // Keep last 500 entries
    const trimmed = audit.slice(-500);
    localStorage.setItem(AUDIT_KEY, JSON.stringify(trimmed));
  }

  function getAll() { return load(); }

  function getById(id) { return load().find(p => p.id === id) || null; }

  function create(pipeline) {
    const list = load();
    pipeline.id = pipeline.id || 'pl_' + Math.random().toString(36).slice(2, 9);
    pipeline.createdAt = pipeline.createdAt || new Date().toISOString();
    pipeline.totalRuns = 0;
    pipeline.totalErrors = 0;
    pipeline.totalCredits = 0;
    pipeline.lastRun = null;
    pipeline.stageCount = pipeline.stages ? pipeline.stages.length : 0;
    list.push(pipeline);
    save(list);
    return pipeline;
  }

  function update(id, updates) {
    const list = load();
    const idx = list.findIndex(p => p.id === id);
    if (idx === -1) return null;
    Object.assign(list[idx], updates);
    save(list);
    return list[idx];
  }

  function remove(id) {
    const list = load().filter(p => p.id !== id);
    save(list);
    // Also remove related audit entries
    const audit = loadAudit().filter(a => a.pipelineId !== id);
    saveAudit(audit);
  }

  function addAuditEntry(entry) {
    const audit = loadAudit();
    entry.timestamp = entry.timestamp || new Date().toISOString();
    audit.push(entry);
    saveAudit(audit);
  }

  function getAudit(filters = {}) {
    let audit = loadAudit();
    if (filters.pipelineId) audit = audit.filter(a => a.pipelineId === filters.pipelineId);
    if (filters.status) audit = audit.filter(a => a.status === filters.status);
    if (filters.trigger) audit = audit.filter(a => a.trigger === filters.trigger);
    return audit.reverse(); // newest first
  }

  function getStats() {
    const list = load();
    return {
      total: list.length,
      active: list.filter(p => p.status === 'active').length,
      totalErrors: list.reduce((sum, p) => sum + (p.totalErrors || 0), 0),
      totalCredits: list.reduce((sum, p) => sum + (p.totalCredits || 0), 0),
    };
  }

  // Seed demo data if empty
  function seedIfEmpty() {
    if (load().length > 0) return;
    const demos = [
      {
        name: 'Order Fulfillment Flow',
        desc: 'Validate, charge, and notify for incoming orders',
        status: 'active',
        trigger: { type: 'webhook', method: 'POST', mode: 'one-time', endpoint: 'https://hook.deluge.io/pl_abc123' },
        stages: [],
        stageCount: 4,
        totalRuns: 47,
        totalErrors: 3,
        totalCredits: 412,
        lastRun: new Date(Date.now() - 1800000).toISOString(),
      },
      {
        name: 'Daily CRM Sync',
        desc: 'Sync contacts from external CRM every morning',
        status: 'active',
        trigger: { type: 'scheduled', recurrence: 'daily', time: '06:00', timezone: 'UTC' },
        stages: [],
        stageCount: 3,
        totalRuns: 120,
        totalErrors: 0,
        totalCredits: 1080,
        lastRun: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        name: 'Lead Score on Create',
        desc: 'Score new leads and route to sales reps',
        status: 'active',
        trigger: { type: 'record', module: 'Leads', action: 'on_create', watchFields: '' },
        stages: [],
        stageCount: 2,
        totalRuns: 89,
        totalErrors: 5,
        totalCredits: 356,
        lastRun: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        name: 'Inventory Alert',
        desc: 'Listen for low stock events and notify warehouse',
        status: 'paused',
        trigger: { type: 'event', eventName: 'inventory.low', channel: 'warehouse-alerts' },
        stages: [],
        stageCount: 2,
        totalRuns: 12,
        totalErrors: 1,
        totalCredits: 48,
        lastRun: new Date(Date.now() - 7200000).toISOString(),
      },
      {
        name: 'Order Stream Processor',
        desc: 'Consume Kafka order events for analytics',
        status: 'draft',
        trigger: { type: 'queue', system: 'kafka', topic: 'orders.placed', consumerGroup: 'analytics-cg' },
        stages: [],
        stageCount: 5,
        totalRuns: 0,
        totalErrors: 0,
        totalCredits: 0,
        lastRun: null,
      },
      {
        name: 'Manual Deploy Check',
        desc: 'On-demand sanity check before production deploy',
        status: 'active',
        trigger: { type: 'manual', curl: 'curl -X POST https://api.deluge.io/run/pl_xyz789 -H "Authorization: Bearer <token>"' },
        stages: [],
        stageCount: 3,
        totalRuns: 8,
        totalErrors: 2,
        totalCredits: 64,
        lastRun: new Date(Date.now() - 172800000).toISOString(),
      },
    ];
    demos.forEach(d => create(d));

    // Seed some global audit entries
    const auditEntries = [
      { pipelineId: load()[0].id, pipelineName: 'Order Fulfillment Flow', trigger: 'webhook', status: 'success', message: 'All 4 stages completed', stageCount: 4, duration: 2340, credits: 9 },
      { pipelineId: load()[0].id, pipelineName: 'Order Fulfillment Flow', trigger: 'webhook', status: 'error', message: 'Payment gateway 402 at Stage 3', stageCount: 4, duration: 1820, credits: 5 },
      { pipelineId: load()[1].id, pipelineName: 'Daily CRM Sync', trigger: 'scheduled', status: 'success', message: 'Synced 142 contacts', stageCount: 3, duration: 4500, credits: 12 },
      { pipelineId: load()[2].id, pipelineName: 'Lead Score on Create', trigger: 'record', status: 'success', message: 'Lead scored: 85/100', stageCount: 2, duration: 890, credits: 4 },
      { pipelineId: load()[3].id, pipelineName: 'Inventory Alert', trigger: 'event', status: 'error', message: 'Notification channel unavailable', stageCount: 2, duration: 320, credits: 2 },
      { pipelineId: load()[5].id, pipelineName: 'Manual Deploy Check', trigger: 'manual', status: 'success', message: 'All checks passed', stageCount: 3, duration: 1100, credits: 7 },
    ];
    auditEntries.forEach((e, i) => {
      e.timestamp = new Date(Date.now() - (auditEntries.length - i) * 3600000).toISOString();
      addAuditEntry(e);
    });
  }

  return { getAll, getById, create, update, remove, addAuditEntry, getAudit, getStats, seedIfEmpty };
})();
