const CLASS_PALETTE = [
    '#f26522','#005599','#00712a','#c0392b',
    '#8e44ad','#16a085','#d35400','#2c3e50'
];

function renderAssignmentChart() {
    const canvas = document.getElementById('assignmentChart');
    const legend = document.getElementById('chartLegend');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const data = getData();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming = [];
    (data.classes || []).forEach((cls, ci) => {
        (cls.assignments || []).forEach(a => {
            const due = new Date(a.due + 'T00:00:00');
            const daysOut = Math.round((due - today) / 86400000);
            if (daysOut >= 0 && daysOut <= 30) {
                upcoming.push({ classIdx: ci, className: cls.name, daysOut, type: a.type, title: a.title });
            }
        });
    });

    const W = canvas.offsetWidth || 400;
    canvas.width = W;

    if (upcoming.length === 0) {
        ctx.clearRect(0, 0, W, canvas.height);
        ctx.fillStyle = getComputedStyle(document.body).color || '#aaa';
        ctx.globalAlpha = 0.4;
        ctx.font = '13px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('No assignments due in the next 30 days', W / 2, canvas.height / 2);
        ctx.globalAlpha = 1;
        legend.innerHTML = '';
        return;
    }

    const PAD = { top: 20, right: 16, bottom: 28, left: 16 };
    const H = canvas.height;
    const chartW = W - PAD.left - PAD.right;
    const barH = Math.min(22, (H - PAD.top - PAD.bottom) / upcoming.length - 4);
    const needed = upcoming.length * (barH + 4) + PAD.top + PAD.bottom;
    canvas.height = Math.max(H, needed);

    ctx.clearRect(0, 0, W, canvas.height);

    const textColor = getComputedStyle(document.body).color || '#ccc';

    ctx.strokeStyle = textColor;
    ctx.globalAlpha = 0.15;
    for (let d = 0; d <= 30; d += 5) {
        const x = PAD.left + (d / 30) * chartW;
        ctx.beginPath();
        ctx.moveTo(x, PAD.top);
        ctx.lineTo(x, canvas.height - PAD.bottom);
        ctx.stroke();
    }
    ctx.globalAlpha = 1;

    ctx.fillStyle = textColor;
    ctx.globalAlpha = 0.5;
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    for (let d = 0; d <= 30; d += 5) {
        const x = PAD.left + (d / 30) * chartW;
        ctx.fillText(d === 0 ? 'today' : `+${d}d`, x, canvas.height - PAD.bottom + 12);
    }
    ctx.globalAlpha = 1;

    upcoming.sort((a, b) => a.daysOut - b.daysOut);

    const classColors = {};
    (data.classes || []).forEach((cls, i) => {
        classColors[cls.name] = CLASS_PALETTE[i % CLASS_PALETTE.length];
    });

    upcoming.forEach((a, i) => {
        const y = PAD.top + i * (barH + 4);
        const barW = Math.max(4, (a.daysOut / 30) * chartW);
        const color = classColors[a.className] || CLASS_PALETTE[0];

        ctx.fillStyle = color;
        ctx.globalAlpha = a.type === 'test' ? 1 : 0.65;
        roundRect(ctx, PAD.left, y, barW, barH, 3);
        ctx.fill();
        ctx.globalAlpha = 1;

        ctx.fillStyle = textColor;
        ctx.font = `${a.type === 'test' ? 'bold ' : ''}10px sans-serif`;
        ctx.textAlign = 'left';
        const label = `${a.title} (${a.daysOut}d)`;
        const labelX = PAD.left + barW + 5;
        if (labelX + 60 < W) {
            ctx.fillText(label, labelX, y + barH / 2 + 4);
        }
    });

    const seen = new Set();
    legend.innerHTML = '';
    upcoming.forEach(a => {
        if (seen.has(a.className)) return;
        seen.add(a.className);
        const color = classColors[a.className];
        const div = document.createElement('div');
        div.className = 'legend-item';
        div.innerHTML = `<span class="legend-dot" style="background:${color}"></span><span>${a.className}</span>`;
        legend.appendChild(div);
    });
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}