const STORAGE_KEY = 'personalDashboard';
const DEFAULT_COLORS = {
    'bg-primary':     '#fdf6e3',
    'bg-secondary':   '#fdf6e3',
    'card-bg':        '#00712a',
    'accent':         '#f26522',
    'text-primary':   '#ffc80b',
    'text-secondary': '#ffc80b',
    'success':        '#005599',
    'warning':        '#005599',
    'danger':         '#ff9b90'
};

let currentDate = new Date();
let editingBookmarkIndex = null;
let editingClassIndex = null;
let selectedDate = null;
let currentClassForAssignment = null;

function loadData() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            if (!parsed.colors)   parsed.colors   = { ...DEFAULT_COLORS };
            if (!parsed.settings) parsed.settings = { font: 'system', textSize: 'medium' };
            return parsed;
        } catch {
            return freshData();
        }
    }
    return freshData();
}

function freshData() {
    return { bookmarks: [], classes: [], events: {}, colors: { ...DEFAULT_COLORS }, settings: { font: 'system', textSize: 'medium' } };
}

function saveData(data) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
        alert('Failed to save. Check browser storage permissions.');
    }
}

function getData() { return loadData(); }

function applyTheme(colors) {
    const { 'bg-primary': bg1, 'bg-secondary': bg2, 'card-bg': card,
            accent, 'text-primary': tp, 'text-secondary': ts,
            success, warning, danger } = colors;
    const accentLight = lighten(accent, 20);
    const border = darken(card, 15);

    const css = `
        body { background: linear-gradient(135deg,${bg1} 0%,${bg2} 100%); color:${tp}; }
        h1,.item-title { color:${tp}; }
        .card h2 { color:${accent}; }
        button { background:${accent}; color:#fff; }
        button:hover { background:${accentLight}; }
        button.secondary { background:${card}; color:${tp}; border-color:${border}; }
        button.secondary:hover { background:${border}; }
        button.danger { background:${danger}; }
        .card { background:${card}; border-color:${border}; color:${tp}; }
        input,textarea,select { background:rgba(255,255,255,.05); color:${tp}; border-color:${border}; }
        input::placeholder,textarea::placeholder { color:${ts}; }
        input:focus,textarea:focus,select:focus { border-color:${accent}; background:rgba(59,130,246,.1); }
        .bookmark-item,.class-item,.event-item,.assignment-item { background:rgba(255,255,255,.05); border-color:${border}; color:${tp}; }
        .bookmark-item a,.class-item a { color:${accentLight}; }
        .item-details { color:${ts}; }
        .item-details a { color:${accentLight}; }
        .empty-state { color:${ts}; }
        .modal { background:rgba(0,0,0,.7); }
        .modal-content,.shortcuts-box { background:${card}; border-color:${border}; color:${tp}; }
        .modal-header { border-bottom-color:${border}; color:${tp}; }
        .modal-header h3,.shortcuts-table td { color:${tp}; }
        .close-btn { color:${ts}; }
        .form-group label { color:${ts}; }
        .calendar-day { border-color:${border}; color:${tp}; background:rgba(255,255,255,.02); }
        .calendar-day:hover { background:rgba(59,130,246,.2); border-color:${accent}; }
        .calendar-day.has-event { background:rgba(59,130,246,.3); border-color:${accent}; }
        .calendar-day-label { color:${ts}; }
        .calendar-day.other-month { color:${ts}; opacity:.5; }
        .event-form,.assignment-list { border-top-color:${border}; }
        .assignment-list { color:${tp}; }
        .assignment-badge.homework { background:${accent}; color:#fff; }
        .assignment-badge.test { background:${warning}; color:#fff; }
        kbd { border-color:${border}; color:${tp}; background:rgba(255,255,255,.05); }
        header { color:${tp}; }
    `;

    const el = document.getElementById('dynamicTheme');
    el.textContent = css;
}

function lighten(hex, pct) { return adjustColor(hex, pct); }
function darken(hex, pct)  { return adjustColor(hex, -pct); }

function adjustColor(hex, pct) {
    let n = parseInt(hex.slice(1), 16);
    let r = Math.min(255, Math.max(0, (n >> 16) + pct * 2.55 | 0));
    let g = Math.min(255, Math.max(0, ((n >> 8) & 0xff) + pct * 2.55 | 0));
    let b = Math.min(255, Math.max(0, (n & 0xff) + pct * 2.55 | 0));
    return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

function initializeTheme() {
    const el = document.createElement('style');
    el.id = 'dynamicTheme';
    document.head.appendChild(el);

    const fontEl = document.createElement('style');
    fontEl.id = 'dynamicFont';
    document.head.appendChild(fontEl);

    const data = getData();
    applyTheme(data.colors);
    applyFontSettings(data.settings);
    renderColorInputs();
    renderFontSettings();
}

function applyFontSettings(settings) {
    const stacks = {
        system:   '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        serif:    'Georgia, "Times New Roman", serif',
        mono:     '"Courier New", monospace',
        'sans-alt':'Trebuchet MS, Lucida Grande, sans-serif'
    };
    const sizes = { small: '14px', medium: '16px', large: '18px' };
    const stack = stacks[settings.font] || stacks.system;
    const size  = sizes[settings.textSize] || '16px';

    document.getElementById('dynamicFont').textContent = `
        body,button,input,textarea,select,.item-title,.calendar-day-label { font-family:${stack} !important; font-size:${size}; font-weight:300; }
        h1,h2,h3,h4,strong,b { font-weight:400; }
        h1 { font-size:calc(${size} * 1.75); }
        h2 { font-size:calc(${size} * 1.25); }
        h3 { font-size:calc(${size} * 1.1); }
    `;
}

function renderColorInputs() {
    const data = getData();
    document.getElementById('colorInputs').innerHTML = Object.entries(data.colors).map(([k, v]) => `
        <div class="color-input">
            <label>${k.replace(/-/g,' ')}</label>
            <div class="color-picker-wrapper">
                <input type="color" value="${v}" id="color-${k}">
                <span style="font-size:.75rem;opacity:.7">${v}</span>
            </div>
        </div>
    `).join('');
}

function renderFontSettings() {
    const data = getData();
    document.getElementById('fontFamily').value = data.settings?.font || 'system';
    document.getElementById('textSize').value   = data.settings?.textSize || 'medium';
}

function updateFont() {
    applyFontSettings({
        font:     document.getElementById('fontFamily').value,
        textSize: document.getElementById('textSize').value
    });
}

function saveTheme() {
    const data = getData();
    Object.keys(data.colors).forEach(k => {
        const el = document.getElementById(`color-${k}`);
        if (el) data.colors[k] = el.value;
    });
    data.settings = {
        font:     document.getElementById('fontFamily').value,
        textSize: document.getElementById('textSize').value
    };
    saveData(data);
    applyTheme(data.colors);
    applyFontSettings(data.settings);
    closeModal('settingsModal');
}

function resetTheme() {
    const data = getData();
    data.colors   = { ...DEFAULT_COLORS };
    data.settings = { font: 'system', textSize: 'medium' };
    saveData(data);
    applyTheme(data.colors);
    applyFontSettings(data.settings);
    renderColorInputs();
    renderFontSettings();
}

function renderBookmarks() {
    const data = getData();
    const container = document.getElementById('bookmarksList');
    if (!data.bookmarks.length) {
        container.innerHTML = '<div class="empty-state">No bookmarks yet</div>';
        return;
    }
    container.innerHTML = data.bookmarks.map((b, i) => `
        <div class="bookmark-item" data-index="${i}">
            <span class="drag-handle" title="Drag to reorder">⠿</span>
            <div class="item-content">
                <div class="item-title"><a href="${b.url}" target="_blank">${b.title}</a></div>
                <div class="item-details">${b.url}</div>
            </div>
            <div class="item-actions">
                <button onclick="openBookmarkModal(${i})">Edit</button>
                <button class="danger" onclick="deleteBookmark(${i})">Delete</button>
            </div>
        </div>
    `).join('');
    initDragDrop('bookmarksList', 'bookmarks', renderBookmarks);
}

function openBookmarkModal(idx) {
    editingBookmarkIndex = idx;
    const data = getData();
    document.getElementById('bookmarkTitle').value = idx !== null ? data.bookmarks[idx].title : '';
    document.getElementById('bookmarkUrl').value   = idx !== null ? data.bookmarks[idx].url   : '';
    document.getElementById('bookmarkModal').classList.add('active');
}

function saveBookmark() {
    const title = document.getElementById('bookmarkTitle').value.trim();
    let url     = document.getElementById('bookmarkUrl').value.trim();
    if (!title || !url) { alert('Please fill in all fields'); return; }
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    const data = getData();
    if (editingBookmarkIndex !== null) {
        data.bookmarks[editingBookmarkIndex] = { title, url };
    } else {
        data.bookmarks.push({ title, url });
    }
    saveData(data);
    renderBookmarks();
    closeModal('bookmarkModal');
}

function deleteBookmark(idx) {
    if (!confirm('Delete this bookmark?')) return;
    const data = getData();
    data.bookmarks.splice(idx, 1);
    saveData(data);
    renderBookmarks();
}

function renderClasses() {
    const data = getData();
    const container = document.getElementById('classesList');
    if (!data.classes.length) {
        container.innerHTML = '<div class="empty-state">No classes yet</div>';
        return;
    }
    container.innerHTML = data.classes.map((c, i) => {
        const hw    = (c.assignments || []).filter(a => a.type === 'homework').length;
        const tests = (c.assignments || []).filter(a => a.type === 'test').length;
        return `
            <div class="class-item" data-index="${i}">
                <span class="drag-handle" title="Drag to reorder">⠿</span>
                <div class="item-content">
                    <div class="item-title">${c.name}</div>
                    ${c.time  ? `<div class="item-details">Time: ${c.time}</div>` : ''}
                    ${c.link  ? `<div class="item-details"><a href="${c.link}" target="_blank">Class Link</a></div>` : ''}
                    ${c.notes ? `<div class="item-details">Notes: ${c.notes}</div>` : ''}
                    ${(c.assignments||[]).length ? `<div class="assignment-list">
                        ${hw    ? `<div>HW: ${hw}</div>`       : ''}
                        ${tests ? `<div>Tests: ${tests}</div>` : ''}
                    </div>` : ''}
                </div>
                <div class="item-actions">
                    <button onclick="openClassModal(${i})">Edit</button>
                    <button onclick="openAssignmentModal(${i})">Add</button>
                    <button class="danger" onclick="deleteClass(${i})">Delete</button>
                </div>
            </div>
        `;
    }).join('');
    initDragDrop('classesList', 'classes', () => { renderClasses(); renderAssignmentChart(); });
}

function openClassModal(idx) {
    editingClassIndex = idx;
    const data = getData();
    const c = idx !== null ? data.classes[idx] : {};
    document.getElementById('className').value  = c.name  || '';
    document.getElementById('classTime').value  = c.time  || '';
    document.getElementById('classLink').value  = c.link  || '';
    document.getElementById('classNotes').value = c.notes || '';
    document.getElementById('classModal').classList.add('active');
}

function saveClass() {
    const name = document.getElementById('className').value.trim();
    if (!name) { alert('Please enter a class name'); return; }
    const classData = {
        name,
        time:  document.getElementById('classTime').value.trim(),
        link:  document.getElementById('classLink').value.trim(),
        notes: document.getElementById('classNotes').value.trim(),
        assignments: []
    };
    const data = getData();
    if (editingClassIndex !== null) {
        classData.assignments = data.classes[editingClassIndex].assignments || [];
        data.classes[editingClassIndex] = classData;
    } else {
        data.classes.push(classData);
    }
    saveData(data);
    renderClasses();
    renderAssignmentChart();
    closeModal('classModal');
}

function deleteClass(idx) {
    if (!confirm('Delete this class?')) return;
    const data = getData();
    data.classes.splice(idx, 1);
    saveData(data);
    renderClasses();
    renderAssignmentChart();
}

function openAssignmentModal(idx) {
    currentClassForAssignment = idx;
    document.getElementById('assignmentType').value    = 'homework';
    document.getElementById('assignmentTitle').value   = '';
    document.getElementById('assignmentDue').value     = '';
    document.getElementById('assignmentDetails').value = '';
    document.getElementById('assignmentModal').classList.add('active');
}

function saveAssignment() {
    const type  = document.getElementById('assignmentType').value;
    const title = document.getElementById('assignmentTitle').value.trim();
    const due   = document.getElementById('assignmentDue').value;
    const details = document.getElementById('assignmentDetails').value.trim();
    if (!title || !due) { alert('Please fill in title and due date'); return; }
    const data = getData();
    if (!data.classes[currentClassForAssignment].assignments)
        data.classes[currentClassForAssignment].assignments = [];
    data.classes[currentClassForAssignment].assignments.push({ type, title, due, details });
    saveData(data);
    renderClasses();
    renderAssignmentChart();
    closeModal('assignmentModal');
}

function renderCalendar() {
    const yr = currentDate.getFullYear(), mo = currentDate.getMonth();
    document.getElementById('monthYear').textContent =
        new Date(yr, mo).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const firstDay      = new Date(yr, mo, 1).getDay();
    const daysInMonth   = new Date(yr, mo + 1, 0).getDate();
    const daysInPrev    = new Date(yr, mo, 0).getDate();
    const data          = getData();
    const grid          = document.getElementById('calendarGrid');
    const labels        = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

    grid.innerHTML = labels.map(d => `<div class="calendar-day-label">${d}</div>`).join('');

    for (let i = firstDay - 1; i >= 0; i--)
        grid.innerHTML += `<div class="calendar-day other-month">${daysInPrev - i}</div>`;

    for (let d = 1; d <= daysInMonth; d++) {
        const ds = `${yr}-${String(mo+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const sel = selectedDate === ds;
        grid.innerHTML += `<div class="calendar-day ${data.events[ds] ? 'has-event' : ''}"
            onclick="selectDate('${ds}')" style="${sel ? 'opacity:.6' : ''}">${d}</div>`;
    }

    const remaining = 42 - daysInMonth - firstDay;
    for (let d = 1; d <= remaining; d++)
        grid.innerHTML += `<div class="calendar-day other-month">${d}</div>`;

    renderEvents();
}

function selectDate(ds) {
    selectedDate = ds;
    document.getElementById('eventTitle').focus();
    renderCalendar();
}

function addEvent() {
    if (!selectedDate) { alert('Please select a date'); return; }
    const title = document.getElementById('eventTitle').value.trim();
    const time  = document.getElementById('eventTime').value;
    const desc  = document.getElementById('eventDesc').value.trim();
    if (!title) { alert('Please enter an event title'); return; }
    const data = getData();
    data.events[selectedDate] = { title, time, desc };
    saveData(data);
    document.getElementById('eventTitle').value = '';
    document.getElementById('eventTime').value  = '';
    document.getElementById('eventDesc').value  = '';
    renderCalendar();
}

function renderEvents() {
    const data = getData();
    const mo = currentDate.getMonth() + 1, yr = currentDate.getFullYear();
    const evts = Object.entries(data.events)
        .filter(([d]) => { const [y,m] = d.split('-'); return +m === mo && +y === yr; })
        .sort();

    const container = document.getElementById('eventsList');
    if (!evts.length) {
        container.innerHTML = '<div class="empty-state">No events this month</div>';
        return;
    }
    container.innerHTML = '<div style="margin-top:1rem">Events:</div>' +
        evts.map(([date, ev]) => {
            const day = date.split('-')[2];
            return `<div class="event-item">
                <div class="item-content">
                    <div class="item-title">${ev.title}</div>
                    <div class="item-details">${+day}${ev.time ? ' at ' + ev.time : ''} — ${ev.desc || 'No description'}</div>
                </div>
                <div class="item-actions">
                    <button class="danger" onclick="deleteEvent('${date}')">Delete</button>
                </div>
            </div>`;
        }).join('');
}

function deleteEvent(ds) {
    if (!confirm('Delete this event?')) return;
    const data = getData();
    delete data.events[ds];
    saveData(data);
    renderCalendar();
}

function previousMonth() { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(); }
function nextMonth()     { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(); }

function openSettingsModal() {
    renderColorInputs();
    document.getElementById('settingsModal').classList.add('active');
}

function closeModal(id) { document.getElementById(id).classList.remove('active'); }

function exportData() {
    const blob = new Blob([JSON.stringify(getData(), null, 2)], { type: 'application/json' });
    const a    = Object.assign(document.createElement('a'), {
        href:     URL.createObjectURL(blob),
        download: `dashboard-backup-${new Date().toISOString().split('T')[0]}.json`
    });
    a.click();
    URL.revokeObjectURL(a.href);
}

function resetData() {
    if (confirm('WARNING: This will delete ALL data. Are you sure?')) {
        localStorage.removeItem(STORAGE_KEY);
        location.reload();
    }
}

document.addEventListener('click', e => {
    if (e.target.classList.contains('modal')) e.target.classList.remove('active');
});

window.addEventListener('load', () => {
    initializeTheme();
    renderBookmarks();
    renderClasses();
    renderCalendar();
    renderAssignmentChart();
});

window.addEventListener('resize', renderAssignmentChart);