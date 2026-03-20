function openShortcuts() {
    document.getElementById('shortcutsOverlay').classList.add('active');
}

function closeShortcuts() {
    document.getElementById('shortcutsOverlay').classList.remove('active');
}

function isTyping() {
    const tag = document.activeElement?.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

function anyModalOpen() {
    return [...document.querySelectorAll('.modal.active')].length > 0
        || document.getElementById('shortcutsOverlay')?.classList.contains('active');
}

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        const openModal = document.querySelector('.modal.active');
        if (openModal) { openModal.classList.remove('active'); return; }
        if (document.getElementById('shortcutsOverlay')?.classList.contains('active')) {
            closeShortcuts(); return;
        }
    }

    if (isTyping()) return;

    switch (e.key) {
        case '?':
            anyModalOpen() ? null : openShortcuts();
            break;
        case 'b':
        case 'B':
            if (!anyModalOpen()) openBookmarkModal(null);
            break;
        case 'c':
        case 'C':
            if (!anyModalOpen()) openClassModal(null);
            break;
        case 'e':
        case 'E':
            if (!anyModalOpen()) {
                if (!window.selectedDate) { alert('Select a date on the calendar first'); return; }
                document.getElementById('eventTitle').focus();
            }
            break;
        case 'ArrowLeft':
            if (!anyModalOpen()) previousMonth();
            break;
        case 'ArrowRight':
            if (!anyModalOpen()) nextMonth();
            break;
    }
});