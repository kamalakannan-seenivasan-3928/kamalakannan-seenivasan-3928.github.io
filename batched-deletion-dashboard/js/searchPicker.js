/* Lightweight searchable combobox. Mounted on a container with class .search-picker. */
window.App = window.App || {};

App.SearchPicker = function (mountSelector, options) {
  const root = (typeof mountSelector === 'string') ? document.querySelector(mountSelector) : mountSelector;
  if (!root) throw new Error('SearchPicker: mount not found ' + mountSelector);

  const placeholder = options.placeholder || root.dataset.placeholder || 'Search…';
  const renderItem  = options.renderItem  || ((it) => `<div class="pi-id">${App.util.escapeHtml(it.label)}</div>`);
  const matchFn     = options.match       || ((it, q) => it.label.toLowerCase().includes(q.toLowerCase()));
  const onChange    = options.onChange    || function () {};

  let items = options.items || [];
  let selectedId = null;
  let activeIdx = -1;

  root.innerHTML = `
    <input type="text" placeholder="${placeholder}" autocomplete="off" />
    <span class="picker-caret">▾</span>
    <div class="picker-list" role="listbox"></div>
  `;
  const input = root.querySelector('input');
  const list  = root.querySelector('.picker-list');

  function open()  { root.classList.add('open');  render(input.value); }
  function close() { root.classList.remove('open'); activeIdx = -1; }

  function render(query) {
    const q = (query || '').trim();
    const filtered = q ? items.filter(it => matchFn(it, q)) : items;
    if (!filtered.length) {
      list.innerHTML = '<div class="picker-empty">No matches</div>';
      return;
    }
    list.innerHTML = filtered.map((it, i) =>
      `<div class="picker-item ${i === activeIdx ? 'active' : ''}" data-id="${App.util.escapeHtml(it.id)}" data-i="${i}" role="option">${renderItem(it)}</div>`
    ).join('');
    list.querySelectorAll('.picker-item').forEach(el => {
      el.addEventListener('mousedown', (ev) => {
        ev.preventDefault();
        select(el.dataset.id);
      });
    });
  }

  function select(id) {
    const it = items.find(x => x.id === id);
    if (!it) return;
    selectedId = id;
    input.value = it.label;
    close();
    onChange(it);
  }

  input.addEventListener('focus', open);
  input.addEventListener('input', () => { activeIdx = -1; open(); });
  input.addEventListener('blur',  () => setTimeout(close, 100));

  input.addEventListener('keydown', (e) => {
    const visible = list.querySelectorAll('.picker-item');
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIdx = Math.min(visible.length - 1, activeIdx + 1);
      render(input.value);
      const el = list.querySelector('.picker-item.active');
      if (el) el.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIdx = Math.max(0, activeIdx - 1);
      render(input.value);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const el = list.querySelector('.picker-item.active') || list.querySelector('.picker-item');
      if (el) select(el.dataset.id);
    } else if (e.key === 'Escape') {
      close();
    }
  });

  return {
    setItems(arr)    { items = arr; render(input.value); },
    setValue(id)     {
      const it = items.find(x => x.id === id);
      if (it) { selectedId = id; input.value = it.label; }
    },
    getValue()       { return selectedId; },
    getSelected()    { return items.find(x => x.id === selectedId) || null; },
    focus()          { input.focus(); },
  };
};
