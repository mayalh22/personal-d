function initDragDrop(listId, dataKey, renderFn) {
    const list = document.getElementById(listId);
    let dragSrcIdx = null;

    list.addEventListener('dragstart', e => {
        const item = e.target.closest('[data-index]');
        if (!item) return;
        dragSrcIdx = parseInt(item.dataset.index);
        item.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    });

    list.addEventListener('dragend', e => {
        const item = e.target.closest('[data-index]');
        if (item) item.classList.remove('dragging');
        list.querySelectorAll('[data-index]').forEach(el => el.classList.remove('drag-over'));
    });

    list.addEventListener('dragover', e => {
        e.preventDefault();
        const item = e.target.closest('[data-index]');
        if (!item) return;
        list.querySelectorAll('[data-index]').forEach(el => el.classList.remove('drag-over'));
        item.classList.add('drag-over');
        e.dataTransfer.dropEffect = 'move';
    });

    list.addEventListener('drop', e => {
        e.preventDefault();
        const item = e.target.closest('[data-index]');
        if (!item) return;
        const dropIdx = parseInt(item.dataset.index);
        if (dragSrcIdx === null || dragSrcIdx === dropIdx) return;

        const data = getData();
        const arr = data[dataKey];
        const [moved] = arr.splice(dragSrcIdx, 1);
        arr.splice(dropIdx, 0, moved);
        saveData(data);
        renderFn();
        dragSrcIdx = null;
    });
}

function makeDraggable(el, index) {
    el.setAttribute('draggable', true);
    el.dataset.index = index;
}