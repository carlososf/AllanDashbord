// ============================================================
// gantt.js — Gráfico de Gantt, Linha de Corte, Zoom & Tooltip
// Projetos Allan Santos — Portal de Governança & PMO
// ============================================================

'use strict';

function getGanttBarClass(status) {
  return STATUS_UI_MAP[status]?.barClass || 'bar-nao-iniciado';
}

function setGanttZoom(zoom) {
  AppState.ganttZoom = zoom;
  document.querySelectorAll('#gantt-zoom-group .zoom-btn').forEach(btn => {
    const z = btn.getAttribute('onclick')?.match(/setGanttZoom\('(.+?)'\)/)?.[1];
    btn.classList.toggle('active', z === zoom);
  });
  renderGanttTab();
}

function renderGanttTab() {
  const scrollArea = document.getElementById('gantt-scroll-area');
  const emptyEl = document.getElementById('gantt-empty');
  if (!scrollArea) return;

  const acts = getFilteredActivities();
  const hasAnyInBase = getAccessibleActivities().length > 0;

  if (acts.length === 0) {
    scrollArea.innerHTML = '';
    scrollArea.classList.add('hidden');
    if (emptyEl) {
      emptyEl.innerHTML = buildEmptyStateHtml(hasAnyInBase);
      emptyEl.classList.remove('hidden');
    }
    return;
  }

  emptyEl?.classList.add('hidden');
  scrollArea.classList.remove('hidden');

  const dayW = ZOOM_DAY_WIDTH[AppState.ganttZoom] || 32;
  document.documentElement.style.setProperty('--gantt-day-w', dayW + 'px');

  // Descobre janela mínima e máxima de datas incluindo a Data de Referência (corte)
  const refDate = AppState.referenceDate || getTodayISO();
  let minISO = refDate;
  let maxISO = refDate;

  acts.forEach(a => {
    const s = a.startDate;
    const e = a.newEnd || a.endDate;
    if (s && s < minISO) minISO = s;
    if (e && e > maxISO) maxISO = e;
  });

  // Folga visual nas pontas do calendário
  const timelineStartISO = addDaysISO(minISO, -2);
  const timelineEndISO = addDaysISO(maxISO, 4);
  const totalSpanDays = diffDaysUTC(timelineStartISO, timelineEndISO) + 1;

  // Trava pra evitar travar o navegador caso alguém cadastre datas muito distantes
  const clampedDays = Math.min(Math.max(totalSpanDays, 14), 365);
  const startMs = parseISODateUTC(timelineStartISO);

  // Monta array de dias e agrupamento por meses
  const days = [];
  const months = [];
  let currentMonthLabel = '';

  for (let i = 0; i < clampedDays; i++) {
    const ms = startMs + i * 86400000;
    const iso = utcMsToISO(ms);
    const dow = new Date(ms).getUTCDay();
    const isWeekend = (dow === 0 || dow === 6);
    const mLabel = formatMonthYearBR(ms);

    if (mLabel !== currentMonthLabel) {
      months.push({ label: mLabel, count: 1 });
      currentMonthLabel = mLabel;
    } else {
      months[months.length - 1].count++;
    }

    days.push({
      iso,
      ms,
      dayNum: String(new Date(ms).getUTCDate()).padStart(2, '0'),
      isWeekend,
      isRef: iso === refDate
    });
  }

  const timelineWidthPx = clampedDays * dayW;
  const refOffsetDays = diffDaysUTC(timelineStartISO, refDate);
  const refLineLeftPx = (refOffsetDays >= 0 && refOffsetDays < clampedDays)
    ? (refOffsetDays * dayW + Math.floor(dayW / 2))
    : null;

  const monthsHtml = months.map(m =>
    '<div class="gantt-month-cell" style="width:' + (m.count * dayW) + 'px;">' + escapeHtml(m.label) + '</div>'
  ).join('');

  const daysHtml = days.map(d => {
    const cls = 'gantt-day-cell' + (d.isWeekend ? ' weekend' : '') + (d.isRef ? ' ref-day' : '');
    const label = AppState.ganttZoom === 'compact' ? d.dayNum : (d.dayNum + (AppState.ganttZoom === 'expanded' ? '/' + String(new Date(d.ms).getUTCMonth() + 1).padStart(2, '0') : ''));
    return '<div class="' + cls + '" title="' + escapeHtml(formatDateBR(d.iso)) + '">' + escapeHtml(label) + '</div>';
  }).join('');

  const bgColsHtml = days.map(d =>
    '<div class="gantt-bg-col' + (d.isWeekend ? ' weekend' : '') + '"></div>'
  ).join('');

  // Monta linhas sincronizadas com a árvore WBS de 3 níveis
  AppState.ganttBarMeta = {};
  const tree = buildWbsTree(acts);
  const rowsHtml = [];

  const registerTooltip = (key, meta) => {
    AppState.ganttBarMeta[key] = meta;
  };

  const formatSummaryLine = (counts) => {
    const parts = [];
    STATUS_ORDER.forEach(st => {
      if (counts[st] > 0) parts.push(st + ': ' + counts[st]);
    });
    return parts.join(' | ');
  };

  const buildBarHtml = (barKey, startStr, endStr, status, progress, label, extraClass, onClickAttr) => {
    if (!startStr || !endStr) return '';
    const offset = diffDaysUTC(timelineStartISO, startStr);
    const span = Math.max(diffDaysUTC(startStr, endStr) + 1, 1);
    if (offset >= clampedDays || (offset + span) <= 0) return '';

    const visibleStart = Math.max(offset, 0);
    const visibleEnd = Math.min(offset + span, clampedDays);
    const leftPx = visibleStart * dayW + 2;
    const widthPx = Math.max((visibleEnd - visibleStart) * dayW - 4, 10);
    const barCls = 'gantt-bar ' + getGanttBarClass(status) + (extraClass ? ' ' + extraClass : '');

    return '<div class="' + barCls + '" data-bar-key="' + escapeHtml(barKey) + '" style="left:' + leftPx + 'px;width:' + widthPx + 'px;" ' + onClickAttr + '>' +
      '<span class="gantt-bar-label">' + escapeHtml(label) + '</span>' +
    '</div>';
  };

  tree.forEach(sys => {
    const sysCollapsed = AppState.collapsedSystems.has(sys.key);
    const s = sys.summary;
    const sysBarKey = 'sys-' + sys.key;
    const sysResps = [...new Set(sys.allMicros.map(x => x.responsibleName))].join(', ');
    const dotClass = CLIENT_LOGOS[sys.client]?.dotClass || 'outro';

    registerTooltip(sysBarKey, {
      title: '[' + sys.clientLabel + '] ' + sys.system,
      period: formatDateBR(s.minStart) + ' — ' + formatDateBR(s.maxEnd) + ' (' + s.duration + ' dias)',
      responsible: sysResps || '—',
      summary: formatSummaryLine(s.counts),
      notes: 'Progresso consolidado: ' + s.progress + '% (' + sys.allMicros.length + ' microatividades)'
    });

    rowsHtml.push(
      '<div class="gantt-row l1">' +
        '<div class="gantt-tree-cell">' +
          '<button type="button" class="wbs-toggle-btn" data-sys-key="' + escapeHtml(sys.key) + '" onclick="toggleSystemNode(this.dataset.sysKey)">' + (sysCollapsed ? '&#9654;' : '&#9660;') + '</button>' +
          '<span class="client-dot ' + escapeHtml(dotClass) + '"></span>' +
          '<span class="gantt-tree-title" title="' + escapeHtml(sys.system) + '">' + escapeHtml(sys.system) + '</span>' +
          '<span class="wbs-count-pill">' + Number(sys.allMicros.length) + '</span>' +
        '</div>' +
        '<div class="gantt-track" style="width:' + timelineWidthPx + 'px;">' +
          buildBarHtml(sysBarKey, s.minStart, s.maxEnd, s.status, s.progress, sys.system + ' (' + s.progress + '%)', 'group-l1', 'data-sys-key="' + escapeHtml(sys.key) + '" onclick="toggleSystemNode(this.dataset.sysKey)"') +
        '</div>' +
      '</div>'
    );

    if (sysCollapsed) return;

    sys.macros.forEach(mac => {
      const macCollapsed = AppState.collapsedMacros.has(mac.key);
      const m = mac.summary;
      const macBarKey = 'mac-' + mac.key;
      const macResps = [...new Set(mac.micros.map(x => x.responsibleName))].join(', ');

      registerTooltip(macBarKey, {
        title: mac.macro,
        period: formatDateBR(m.minStart) + ' — ' + formatDateBR(m.maxEnd) + ' (' + m.duration + ' dias)',
        responsible: macResps || '—',
        summary: formatSummaryLine(m.counts),
        notes: 'Sistema: ' + sys.system + ' | Progresso: ' + m.progress + '%'
      });

      rowsHtml.push(
        '<div class="gantt-row l2">' +
          '<div class="gantt-tree-cell">' +
            '<button type="button" class="wbs-toggle-btn" data-mac-key="' + escapeHtml(mac.key) + '" onclick="toggleMacroNode(this.dataset.macKey)">' + (macCollapsed ? '&#9654;' : '&#9660;') + '</button>' +
            '<span class="gantt-tree-title" title="' + escapeHtml(mac.macro) + '">' + escapeHtml(mac.macro) + '</span>' +
            '<span class="wbs-count-pill">' + Number(mac.micros.length) + '</span>' +
          '</div>' +
          '<div class="gantt-track" style="width:' + timelineWidthPx + 'px;">' +
            buildBarHtml(macBarKey, m.minStart, m.maxEnd, m.status, m.progress, m.progress + '%', 'group-l2', 'data-mac-key="' + escapeHtml(mac.key) + '" onclick="toggleMacroNode(this.dataset.macKey)"') +
          '</div>' +
        '</div>'
      );

      if (macCollapsed) return;

      mac.micros.forEach(act => {
        const effEnd = act.newEnd || act.endDate;
        const dur = (act.startDate && effEnd) ? Math.max(diffDaysUTC(act.startDate, effEnd) + 1, 1) : 1;
        const prog = act.status === 'Concluído' ? 100 : (Number(act.progress) || 0);
        const microKey = 'mic-' + act.id;

        registerTooltip(microKey, {
          title: act.code + ' — ' + act.title,
          period: formatDateBR(act.startDate) + ' — ' + formatDateBR(effEnd) + ' (' + dur + ' dias)',
          responsible: act.responsibleName + (act.area ? ' (' + act.area + ')' : ''),
          summary: act.status + ': 1 (' + prog + '% concluído)',
          notes: act.notes || (act.newEnd && act.newEnd !== act.endDate ? 'Reprogramado (Base: ' + formatDateBR(act.endDate) + ')' : '')
        });

        rowsHtml.push(
          '<div class="gantt-row l3">' +
            '<div class="gantt-tree-cell">' +
              '<span class="wbs-id-pill">' + escapeHtml(act.code) + '</span>' +
              '<span class="gantt-tree-title" title="' + escapeHtml(act.title) + '">' + escapeHtml(act.title) + '</span>' +
            '</div>' +
            '<div class="gantt-track" style="width:' + timelineWidthPx + 'px;">' +
              buildBarHtml(microKey, act.startDate, effEnd, act.status, prog, act.code + ' • ' + prog + '%', '', 'data-act-id="' + escapeHtml(act.id) + '" onclick="openEditActivityModal(this.dataset.actId)"') +
            '</div>' +
          '</div>'
        );
      });
    });
  });

  // Linha vermelha contínua na data de referência selecionada no topo
  const refLineHtml = (refLineLeftPx !== null)
    ? '<div class="gantt-ref-line" style="left:calc(var(--gantt-tree-w) + ' + refLineLeftPx + 'px);" title="Data de referência: ' + escapeHtml(formatDateBR(refDate)) + '"></div>'
    : '';

  scrollArea.innerHTML =
    '<div class="gantt-canvas">' +
      '<div class="gantt-header">' +
        '<div class="gantt-header-left">' +
          '<span>Estrutura</span>' +
          '<span class="font-mono" style="font-size:10px;color:#DC2626;">Corte: ' + escapeHtml(formatDateBR(refDate)) + '</span>' +
        '</div>' +
        '<div class="gantt-header-timeline" style="width:' + timelineWidthPx + 'px;">' +
          '<div class="gantt-months-row">' + monthsHtml + '</div>' +
          '<div class="gantt-days-row">' + daysHtml + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="gantt-body">' +
        '<div class="gantt-bg-overlay" style="width:' + timelineWidthPx + 'px;">' + bgColsHtml + '</div>' +
        refLineHtml +
        rowsHtml.join('') +
      '</div>' +
    '</div>';
}

function showGanttTooltip(barEl, mouseEvent) {
  const key = barEl.getAttribute('data-bar-key');
  const meta = AppState.ganttBarMeta[key];
  const tooltip = document.getElementById('gantt-tooltip');
  if (!meta || !tooltip) return;

  tooltip.innerHTML =
    '<div class="gantt-tooltip-title">' + escapeHtml(meta.title) + '</div>' +
    '<div class="gantt-tooltip-row"><strong>Período:</strong> ' + escapeHtml(meta.period) + '</div>' +
    '<div class="gantt-tooltip-row"><strong>Responsável:</strong> ' + escapeHtml(meta.responsible) + '</div>' +
    (meta.notes ? '<div class="gantt-tooltip-row"><strong>Obs.:</strong> ' + escapeHtml(meta.notes) + '</div>' : '') +
    '<div class="gantt-tooltip-summary">' + escapeHtml(meta.summary) + '</div>';

  tooltip.classList.remove('hidden');
  positionGanttTooltip(mouseEvent);
}

function positionGanttTooltip(e) {
  const tooltip = document.getElementById('gantt-tooltip');
  if (!tooltip || tooltip.classList.contains('hidden')) return;

  const pad = 14;
  const w = tooltip.offsetWidth || 280;
  const h = tooltip.offsetHeight || 110;
  let left = e.clientX + pad;
  let top = e.clientY + pad;

  if (left + w > window.innerWidth - 10) left = Math.max(10, e.clientX - w - pad);
  if (top + h > window.innerHeight - 10) top = Math.max(10, e.clientY - h - pad);

  tooltip.style.left = left + 'px';
  tooltip.style.top = top + 'px';
}

function hideGanttTooltip() {
  document.getElementById('gantt-tooltip')?.classList.add('hidden');
}
