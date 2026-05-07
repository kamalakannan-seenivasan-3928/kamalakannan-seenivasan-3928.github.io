/* Mock data + tenant config. Replace with real API responses in production.
 *
 * Applications modeled here: Sales Management, Car Rental,
 * Real Estate Management, Retail ERP.
 */
window.App = window.App || {};

App.data = (function () {
  // Tenant — used to build edit-mode URLs
  const TENANT = 'system-scheduler';

  // Canonical status values — used everywhere (chips, dropdowns, filters)
  const STATUSES = ['Running', 'Queued', 'Suspended', 'Completed', 'Failed'];

  // Top-level executions. `doneB` and `failB` are derived from batches in real life.
  const executions = [
    /* ===== Sales Management ===== */
    { id:'EXEC-9F3A21B7', app:'Sales Management',     form:'Leads',    wf:'Nightly lead purge',  user:'system-scheduler@zohomail.com', ip:'10.41.7.22',  when:'02:14', planned:12400, deleted:11983, failed:42,  batches:62,  doneB:58, failB:1, status:'Running',   func:'sales.purge_old_leads()',           line:47 },
    { id:'EXEC-44A91D27', app:'Sales Management',     form:'Contacts', wf:'Dormant contacts',    user:'system-scheduler@zohomail.com', ip:'10.41.7.22', when:'00:48', planned:2120,  deleted:1880,  failed:240, batches:11,  doneB:9,  failB:2, status:'Failed',    func:'sales.purge_dormant_contacts()',    line:64 },
    { id:'EXEC-A2D801FC', app:'Sales Management',     form:'Deals',    wf:'Lost-deal cleanup',   user:'l.mueller@gmail.com',        ip:'192.168.4.21', when:'02:02', planned:1450,  deleted:990,   failed:0,   batches:8,   doneB:5,  failB:0, status:'Running',   func:'sales.purge_lost_deals()',          line:33 },

    /* ===== Car Rental ===== */
    { id:'EXEC-7C0DE114', app:'Car Rental',           form:'Bookings', wf:'Expired bookings',    user:'m.johansson@yahoo.com',      ip:'192.168.4.18', when:'01:55', planned:8200,  deleted:8200,  failed:0,   batches:41,  doneB:41, failB:0, status:'Completed', func:'rental.cleanup_expired_bookings()', line:18 },
    { id:'EXEC-58E102DA', app:'Car Rental',           form:'Vehicles', wf:'Vehicle decommission', user:'l.mueller@gmail.com',        ip:'192.168.4.21', when:'00:22', planned:980,   deleted:980,   failed:0,   batches:5,   doneB:5,  failB:0, status:'Completed', func:'rental.decommission_fleet()',       line:12 },
    { id:'EXEC-B40E5277', app:'Car Rental',           form:'Maintenance', wf:'Closed tickets',   user:'system-scheduler@zohomail.com', ip:'10.41.7.22',   when:'00:55', planned:430,   deleted:430,   failed:0,   batches:3,   doneB:3,  failB:0, status:'Completed', func:'rental.archive_maintenance()',      line:9  },

    /* ===== Real Estate Management ===== */
    { id:'EXEC-3B82AA4E', app:'Real Estate Management', form:'Leases',   wf:'Tenant offboarding', user:'s.dupont@outlook.com',      ip:'203.0.113.12', when:'01:40', planned:540,   deleted:340,   failed:18,  batches:3,   doneB:1,  failB:1, status:'Suspended', func:'realestate.purge_leases()',         line:92 },
    { id:'EXEC-61CF44A9', app:'Real Estate Management', form:'Listings', wf:'Expired listings',   user:'system-scheduler@zohomail.com', ip:'10.41.7.22',   when:'00:05', planned:6800,  deleted:6800,  failed:0,   batches:34,  doneB:34, failB:0, status:'Completed', func:'realestate.expire_listings()',      line:22 },
    { id:'EXEC-D7C18ABE', app:'Real Estate Management', form:'Tenants',  wf:'GDPR offboarding',   user:'a.rossi@yahoo.com',         ip:'10.41.6.4',    when:'23:18', planned:1820,  deleted:0,     failed:0,   batches:10,  doneB:0,  failB:0, status:'Queued',    func:'realestate.gdpr_purge_tenants()',   line:51 },

    /* ===== Retail ERP ===== */
    { id:'EXEC-12FE08C1', app:'Retail ERP',           form:'Orders',     wf:'Archive old orders', user:'system-scheduler@zohomail.com', ip:'10.41.7.22',   when:'01:12', planned:32000, deleted:0,     failed:0,   batches:160, doneB:0,  failB:0, status:'Queued',    func:'retail.archive_old_orders()',       line:31 },
    { id:'EXEC-7AB23E50', app:'Retail ERP',           form:'Returns',    wf:'Returns purge',      user:'a.rossi@yahoo.com',         ip:'10.41.6.4',    when:'23:51', planned:310,   deleted:310,   failed:0,   batches:2,   doneB:2,  failB:0, status:'Completed', func:'retail.purge_returns()',            line:8  },
    { id:'EXEC-9D110AAB', app:'Retail ERP',           form:'Inventory',  wf:'Inventory cleanup',  user:'system-scheduler@zohomail.com', ip:'10.41.7.22',   when:'23:30', planned:14500, deleted:9300,  failed:0,   batches:73,  doneB:46, failB:0, status:'Running',   func:'retail.cleanup_inventory()',        line:55 },
    { id:'EXEC-3F5A09EE', app:'Retail ERP',           form:'Suppliers',  wf:'Manual run',         user:'m.johansson@yahoo.com',      ip:'192.168.4.18', when:'22:44', planned:140,   deleted:140,   failed:0,   batches:1,   doneB:1,  failB:0, status:'Completed', func:'retail.archive_suppliers()',        line:14 },
  ];

  /* Live event tail seed.
   *
   * Lines reference EXEC-IDs and B-IDs that exist above so the live-tail
   * linkifier can deep-link straight into the detailed view + correct batch.
   */
  const tailSeed = [
    ['INFO',  'EXEC-9F3A21B7 batch B-0027 done · 1.79s · status=PARTIAL'],
    ['ERROR', 'EXEC-9F3A21B7 record #5371 — db conflict, retry next cycle · B-0027'],
    ['ERROR', 'EXEC-9F3A21B7 record #5344 — workflow guard rejected (validation: email_required) · B-0027'],
    ['WARN',  'EXEC-9F3A21B7 record #5318 — referenced by Deal#48211, deferred · B-0027'],
    ['INFO',  'EXEC-9F3A21B7 acquired delete lock on Leads (records 5201..5400) · B-0027'],
    ['INFO',  'EXEC-9D110AAB batch B-0046 done · 1.62s · status=OK'],
    ['INFO',  'EXEC-A2D801FC adaptive batch size 250 → 200 (queue depth high) · B-0006'],
    ['WARN',  'EXEC-3B82AA4E suspended by s.dupont@outlook.com'],
    ['INFO',  'EXEC-12FE08C1 enqueued · 32,000 records · 160 batches'],
    ['ERROR', 'EXEC-44A91D27 batch B-0010 failed · 80 records → dead-letter'],
  ];

  // Failed records sample for the selected batch detail panel
  const failedRecordsSample = [
    { id:'5318', reason:'Referenced by Deal #48211 (cascade off)',     cat:'deferred', action:'Force delete' },
    { id:'5344', reason:'Validation guard: email_required',            cat:'guard',    action:'Mark skip'    },
    { id:'5345', reason:'Validation guard: email_required',            cat:'guard',    action:'Mark skip'    },
    { id:'5371', reason:'Transient DB conflict (lock_wait_timeout)',   cat:'retry',    action:'Retry now'    },
  ];

  return {
    TENANT,
    STATUSES,
    executions,
    tailSeed,
    failedRecordsSample,

    // Distinct values, used to populate filter dropdowns
    distinct(field) {
      const seen = new Set();
      executions.forEach(e => seen.add(e[field]));
      return Array.from(seen).sort();
    },

    findById(id) {
      return executions.find(e => e.id === id);
    },
  };
})();
