# Deluge · Non-blocking delete observability dashboard

Modular front-end mockup for monitoring, log inspection, and management of
Deluge `deleteRecords()` executions that exceed 100 rows and are auto-batched.

Applications modeled in the mock data: **Sales Management**, **Car Rental**,
**Real Estate Management**, **Retail ERP**.

## Run

Open `index.html` directly in a browser, or serve the folder:

```bash
python3 -m http.server 8080
# then open http://localhost:8080/
```

No build step. Vendor (Chart.js) is loaded from CDN.

## Project structure

```
deluge-delete-dashboard/
├── index.html              # Page shell, view containers, script order
├── css/
│   ├── theme.css           # CSS-var tokens for light / dark / night / custom
│   ├── base.css            # Reset, typography, layout helpers, links, toast
│   ├── components.css      # Buttons, inputs, pills, cards, metrics, tables, picker, timeline
│   └── views.css           # Quick-view + detailed-view specific layout
└── js/
    ├── data.js             # Mock executions, tail seed, failed records sample, distinct()
    ├── utils.js            # $ / $$, fmt, pct, pub-sub (on/emit), toast, debounce, escapeHtml
    ├── links.js            # Builds Zoho Creator edit-mode URLs (app, form, workflow, record, execution)
    ├── theme.js            # Theme switcher with localStorage + system-pref detection
    ├── searchPicker.js     # Reusable searchable combobox component
    ├── filters.js          # Reads filter UI, exposes filtered() and emits filters:changed
    ├── quickView.js        # KPI strip + execution card grid, listens for changes
    ├── detailView.js       # Header, metrics, queue strip, batch rail, log, audit, deps
    ├── liveTail.js         # Live event tail (pause / errors-only)
    └── app.js              # Bootstrap: tabs, refresh, bulk actions, CSV export
```

## Themes

Switch with the four-button group in the header (☀ ◐ ● ★).

| Theme   | When to use |
|---------|-------------|
| Light   | Default. Office / docs context. |
| Dark    | Soft dark, paper-feeling, daytime in dim rooms. |
| Night   | True-black, OLED-friendly, on-call at 3am. |
| Custom  | Brand override — edit the `[data-theme="custom"]` block in `css/theme.css`. |

Every visual decision goes through a CSS variable. To create a brand theme,
copy any of the existing blocks in `theme.css` and override only the tokens
you care about. The starter `[data-theme="custom"]` block already shows a
warm-sand + plum example.

The selected theme is persisted in `localStorage` under `deluge.delete.theme`,
and falls back to `prefers-color-scheme` on first visit.

## Filters

Six filter dropdowns + a free-text search:

- Application, Form, Workflow, Status, User — populated from `App.data.distinct(field)`.
- Time range — illustrative; mock data is single-day.
- Search box — matches across ID, app, form, workflow, user, function name, status.

Each filter input fires a `filters:changed` event. `quickView` re-renders KPIs
+ card grid in response. The "Clear" button resets all filters.

## Status chip row

Above the Active &amp; recent executions grid, a row of single-select chips
(All, Running, Queued, Suspended, Completed, Failed) lets you scope the grid
by status with one click. Counts on each chip reflect the current
non-status filters (so the count stays consistent with your app/form/user
selection). Clicking the active chip clears the status filter. Chips with
zero matches are dimmed and disabled. The chip selection is wired through
`App.filters.setStatus()` so it stays in sync with the main status dropdown.

## Live tail deep-links

Every reference inside a tail line is clickable:

| Pattern        | Click destination                                   |
|----------------|-----------------------------------------------------|
| `EXEC-XXXXX`   | Detailed view, that execution loaded                |
| `B-NNNN`       | Detailed view, that execution + that batch selected |
| `#NNNN`        | Detailed view of the execution from the same line   |

The linkifier (`liveTail.js → linkify`) reads the EXEC ID once per line
and uses it as context for any batch / record refs that follow. Click handling
is delegated through a single listener on the tail container.

## Refresh

The circular-arrow button (top-right) perturbs `Running` executions —
incrementing `deleted`, occasionally bumping `failed`, recomputing `doneB`.
It then emits `data:refreshed`, which:

- Re-renders the quick view KPIs and grid
- Re-renders the live tail with new timestamps
- Reloads the currently selected execution in the detailed view

## Searchable execution picker

The detailed view's execution selector is a custom combobox (`SearchPicker`).
Type to filter by ID, app, form, workflow, user, or status. ↑/↓ to navigate,
Enter to select, Esc to close.

## Edit-mode links

`App.links` builds Zoho Creator URLs:

```
app(name)                     → https://creator.zoho.com/system-scheduler/{app}/
form(app, form)               → …/{app}/form-perma/{form}/
workflow(app, wf)             → …/{app}/workflow/{wf}/
record(app, form, id)         → …/{app}/form-perma/{form}/{id}/edit
execution(id)                 → …/console/delete-executions/{id}
functionCode(app, fn, line)   → …/{app}/script-perma/{fn}#L{line}
```

Record IDs, app, form, workflow, function, and execution IDs are all rendered
as anchor tags via `App.links.tag(href, label)`. They open in a new tab.

## Replacing the mock data

Swap `js/data.js` with a module that fetches from your API and returns the
same shape:

```js
{
  TENANT: '<tenant-slug>',
  executions: [...],
  tailSeed: [...],
  failedRecordsSample: [...],
  distinct(field), findById(id)
}
```

Everything else is data-driven and will pick up automatically.

## Cross-module events

| Event              | Emitted by      | Listened by            |
|--------------------|-----------------|------------------------|
| `theme:changed`    | `theme.js`      | `quickView`, `detailView` |
| `filters:changed`  | `filters.js`    | `quickView`            |
| `data:refreshed`   | `app.js` (refresh) | `quickView`, `detailView`, `liveTail` |
| `exec:open`        | `quickView` (card click) | `detailView` |
| `exec:loaded`      | `detailView`    | (extension point) |

## Reference

- Help doc: https://www.zoho.com/deluge/help/data-access/delete-records.html
- Behaviour modeled: deleteRecords() over 100 rows is moved to a non-blocking
  queue and processed in adaptive batches.
