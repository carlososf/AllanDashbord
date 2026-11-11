// ============================================================
// Projetos Allan Santos — Portal de Governança & PMO
// app.js — Motor da aplicação, estado limpo, RBAC, XSS, persistência
//
// Base: ZERO projetos mockados. Infraestrutura pronta pra equipe
// alimentar manualmente. Multi-cliente (XP, Santander, Vivo, Outro).
// ============================================================

'use strict';

// ========================
// CONSTANTES & STORAGE
// ========================
const STORAGE_KEY_USERS = 'as_gov_users_v3';
const STORAGE_KEY_PROJECTS = 'as_gov_projects_v3';
const STORAGE_KEY_NOTIFS = 'as_gov_notifications_v3';
const STORAGE_KEY_SESSION = 'as_gov_session_v3';
const MANAGER_KEY = 'GOV2026'; // Chave corporativa pra cadastro de gerente

// ========================
// USUÁRIO PADRÃO (só o Allan — equipe se cadastra ou o gerente cria)
// ========================
const DEFAULT_USERS = [
  {
    id: 'usr-001',
    name: 'Allan Santos',
    email: 'allan.santos@empresa.com',
    username: 'AllanSantos',
    password: '12345',
    role: 'Gerente'
  }
];

// ========================
// ESTADO GLOBAL DA APLICAÇÃO
// ========================
const AppState = {
  users: [],
  projects: [],     // começa vazio — preenchido pela equipe
  notifications: [],
  session: null,     // { user: {...} }
  filters: {
    client: 'all',
    program: '',
    module: '',
    responsible: '',
    health: ''
  },
  drawerProjectId: null,
  drawerTab: 'roadmap'
};

// ========================
// UTILITÁRIOS
// ========================

// Limpa caracteres maliciosos antes de jogar na tabela, drawer, modal ou qualquer innerHTML
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Formata data ISO (YYYY-MM-DD) pra exibição brasileira (DD/MM/YYYY)
function formatDateBR(dateStr) {
  if (!dateStr) return '—';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return parts[2] + '/' + parts[1] + '/' + parts[0];
}

// Gera ID único com prefixo
function generateId(prefix) {
  return prefix + '-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
}

// Retorna timestamp legível em PT-BR
function nowTimestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear() +
    ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
}

// ========================
// TOAST (FEEDBACK VISUAL)
// ========================
function showToast(message, type) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast' + (type ? ' ' + type : '');
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => { toast.remove(); }, 3500);
}

// ========================
// PERSISTÊNCIA (LOCALSTORAGE)
// ========================

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(AppState.users));
    localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(AppState.projects));
    localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(AppState.notifications));
    if (AppState.session) {
      localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(AppState.session));
    }
  } catch (e) {
    // Se o localStorage tá cheio ou bloqueado, segue a vida — dados ficam só na memória
    console.warn('[saveState] Falha ao persistir:', e);
  }
}

function loadState() {
  try {
    const users = localStorage.getItem(STORAGE_KEY_USERS);
    const projects = localStorage.getItem(STORAGE_KEY_PROJECTS);
    const notifs = localStorage.getItem(STORAGE_KEY_NOTIFS);
    const session = localStorage.getItem(STORAGE_KEY_SESSION);

    AppState.users = users ? JSON.parse(users) : [...DEFAULT_USERS];
    AppState.projects = projects ? JSON.parse(projects) : [];
    AppState.notifications = notifs ? JSON.parse(notifs) : [];
    AppState.session = session ? JSON.parse(session) : null;
  } catch (e) {
    console.warn('[loadState] Falha ao carregar — resetando estado:', e);
    AppState.users = [...DEFAULT_USERS];
    AppState.projects = [];
    AppState.notifications = [];
    AppState.session = null;
  }
}

// ========================
// AUTENTICAÇÃO
// ========================

function handleLogin(e) {
  e.preventDefault();
  const credential = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  const errorEl = document.getElementById('login-error');

  // Busca por username ou email (case-insensitive)
  const user = AppState.users.find(u =>
    u.username.toLowerCase() === credential.toLowerCase() ||
    u.email.toLowerCase() === credential.toLowerCase()
  );

  if (!user || user.password !== password) {
    errorEl.textContent = 'Usuário ou senha inválidos.';
    errorEl.classList.remove('hidden');
    return;
  }

  AppState.session = {
    user: { ...user },
    canSimulate: user.role === 'Gerente'
  };
  saveState();
  showApp();
  showToast('Bem-vindo, ' + user.name + '!', 'success');
}

function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('register-name').value.trim();
  const email = document.getElementById('register-email').value.trim();
  const username = document.getElementById('register-username').value.trim();
  const password = document.getElementById('register-password').value;
  const role = document.getElementById('register-role').value;
  const managerKey = document.getElementById('register-manager-key').value.trim();
  const errorEl = document.getElementById('register-error');

  // Validação de duplicidade
  if (AppState.users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
    errorEl.textContent = 'Este usuário já existe.';
    errorEl.classList.remove('hidden');
    return;
  }
  if (AppState.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    errorEl.textContent = 'Este e-mail já está cadastrado.';
    errorEl.classList.remove('hidden');
    return;
  }

  // Trava de segurança: pra criar conta Gerente, precisa da chave corporativa
  if (role === 'Gerente' && managerKey !== MANAGER_KEY) {
    errorEl.textContent = 'Chave de gerente inválida.';
    errorEl.classList.remove('hidden');
    return;
  }

  const newUser = {
    id: generateId('usr'),
    name, email, username, password, role
  };

  AppState.users.push(newUser);
  AppState.session = {
    user: { ...newUser },
    canSimulate: role === 'Gerente'
  };
  saveState();

  addNotification('new_user', name + ' (' + role + ') criou uma conta no portal.', null, email);

  showApp();
  showToast('Conta criada! Bem-vindo, ' + name + '.', 'success');
}

function toggleRegisterForm() {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const toggleText = document.getElementById('login-toggle-text');
  const toggleBtn = document.getElementById('login-toggle-btn');

  if (registerForm.classList.contains('hidden')) {
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
    toggleText.textContent = 'Já tem conta?';
    toggleBtn.textContent = 'Fazer login';
  } else {
    registerForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
    toggleText.textContent = 'Não tem conta?';
    toggleBtn.textContent = 'Cadastre-se';
  }
  // Limpa erros ao trocar de formulário
  document.getElementById('login-error').classList.add('hidden');
  document.getElementById('register-error').classList.add('hidden');
}

function toggleManagerKeyField() {
  const role = document.getElementById('register-role').value;
  const group = document.getElementById('register-manager-key-group');
  if (role === 'Gerente') {
    group.classList.remove('hidden');
  } else {
    group.classList.add('hidden');
  }
}

function logout() {
  AppState.session = null;
  localStorage.removeItem(STORAGE_KEY_SESSION);
  closeDetailDrawer();
  closeModal('modal-new-project');
  closeModal('modal-update-status');
  closeModal('modal-new-ritm');
  document.getElementById('popover-notifications')?.classList.remove('open');
  document.getElementById('homologation-bar')?.classList.add('hidden');
  document.getElementById('app-shell').classList.add('hidden');
  document.getElementById('login-screen').classList.remove('hidden');
  // Limpa formulários
  document.getElementById('login-form').reset();
  document.getElementById('login-error').classList.add('hidden');
}

// ========================
// RENDERIZAÇÃO PRINCIPAL
// ========================

function showApp() {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('app-shell').classList.remove('hidden');

  const user = AppState.session?.user;
  if (!user) return;

  // Header
  document.getElementById('header-username').textContent = user.name;
  document.getElementById('header-role').textContent = user.role;

  // Exibe view correta baseado no perfil
  if (user.role === 'Gerente') {
    document.getElementById('view-gerente').classList.remove('hidden');
    document.getElementById('view-colaborador').classList.add('hidden');
    renderManagerView();
  } else {
    document.getElementById('view-gerente').classList.add('hidden');
    document.getElementById('view-colaborador').classList.remove('hidden');
    renderCollaboratorView();
  }

  // Barra de homologação só aparece se quem logou for Gerente autenticado
  const homoBar = document.getElementById('homologation-bar');
  if (homoBar) {
    if (AppState.session?.canSimulate === true) {
      homoBar.classList.remove('hidden');
      populateDebugSwitchUser();
    } else {
      homoBar.classList.add('hidden');
    }
  }

  // Componentes compartilhados
  renderNotifications();
  initDomGuard();
}

// ========================
// BADGES & HELPERS VISUAIS
// ========================

// Usa as logos .webp reais da pasta como padrão; se alguma faltar ou falhar, tenta o fallback .png e por fim exibe ponto colorido limpo
function handleClientLogoError(img) {
  const fallbackSrc = img.getAttribute('data-fallback-src');
  if (!img.dataset.triedFallback && fallbackSrc) {
    img.dataset.triedFallback = '1';
    img.src = fallbackSrc;
    return;
  }
  const dotClass = img.getAttribute('data-client-class') || 'outro';
  const dot = document.createElement('span');
  dot.className = 'client-dot ' + dotClass;
  img.replaceWith(dot);
}

// Renderiza badge de cliente com mini-logo (.webp principal) e tratamento de erro
function getClientBadgeHtml(client, clientCustom) {
  const safeClientName = escapeHtml(client === 'Outro' ? (clientCustom || 'Outro') : client);
  const logos = { 'XP': 'logoxp.webp', 'Santander': 'logosantander.webp', 'Vivo': 'logovivo.webp' };
  const pngFallbacks = { 'XP': 'xp.png', 'Santander': 'santander.png', 'Vivo': 'vivo.png' };
  const dotClasses = { 'XP': 'xp', 'Santander': 'santander', 'Vivo': 'vivo' };
  const logo = logos[client];
  const fallback = pngFallbacks[client] || '';
  const dot = dotClasses[client] || 'outro';

  if (logo) {
    return '<span class="badge-client">' +
      '<img src="' + escapeHtml(logo) + '" alt="" ' +
      'data-fallback-src="' + escapeHtml(fallback) + '" ' +
      'data-client-class="' + escapeHtml(dot) + '" ' +
      'onerror="handleClientLogoError(this)">' +
      '<span>' + safeClientName + '</span></span>';
  }
  return '<span class="badge-client"><span class="client-dot ' + escapeHtml(dot) + '"></span><span>' + safeClientName + '</span></span>';
}

// Semáforo RAG
function getHealthBadgeHtml(health) {
  const map = {
    green: '<span class="rag-badge rag-green">No Prazo</span>',
    yellow: '<span class="rag-badge rag-yellow">Em Atenção</span>',
    red: '<span class="rag-badge rag-red">Crítico</span>'
  };
  return map[health] || '<span class="rag-badge" style="background:#F1F5F9;color:#64748B;border:1px solid #CBD5E1">—</span>';
}

// Status badge
function getStatusBadgeHtml(status) {
  const map = {
    'A Iniciar': '<span class="status-badge status-a-iniciar">A Iniciar</span>',
    'Em Andamento': '<span class="status-badge status-em-andamento">Em Andamento</span>',
    'Em Homologação': '<span class="status-badge status-em-homologacao">Em Homologação</span>',
    'Concluído': '<span class="status-badge status-concluido">Concluído</span>'
  };
  return map[status] || '<span class="status-badge">' + escapeHtml(status) + '</span>';
}

// Severidade do chamado Hypercare
function getSeverityBadgeHtml(severity) {
  const map = {
    'Alta P2': '<span class="badge-severity badge-p2">Alta P2</span>',
    'Média P3': '<span class="badge-severity badge-p3">Média P3</span>',
    'Baixa P4': '<span class="badge-severity badge-p4">Baixa P4</span>',
    'Melhoria P5': '<span class="badge-severity badge-p5">Melhoria P5</span>'
  };
  return map[severity] || '<span class="badge-severity">' + escapeHtml(severity) + '</span>';
}

// Classe CSS da barra de progresso conforme saúde
function getProgressFillClass(health) {
  if (health === 'red') return 'danger';
  if (health === 'yellow') return 'warning';
  return '';
}

// ========================
// VISÃO DO GERENTE — PAINEL COMPLETO
// ========================

function renderManagerView() {
  if (!checkAccessPermission('Gerente')) return;
  populateFilterOptions();
  renderKPIs();
  renderProjectTable();
}

// ========================
// FILTROS DINÂMICOS
// ========================

function populateFilterOptions() {
  const projects = AppState.projects;

  // Programas únicos
  const programs = [...new Set(projects.map(p => p.program).filter(Boolean))].sort();
  const progSelect = document.getElementById('filter-program');
  if (progSelect) {
    const currentVal = progSelect.value;
    progSelect.innerHTML = '<option value="">Todos</option>' +
      programs.map(p => '<option value="' + escapeHtml(p) + '">' + escapeHtml(p) + '</option>').join('');
    progSelect.value = currentVal;
  }

  // Módulos únicos
  const modules = [...new Set(projects.map(p => p.module).filter(Boolean))].sort();
  const modSelect = document.getElementById('filter-module');
  if (modSelect) {
    const currentVal = modSelect.value;
    modSelect.innerHTML = '<option value="">Todos</option>' +
      modules.map(m => '<option value="' + escapeHtml(m) + '">' + escapeHtml(m) + '</option>').join('');
    modSelect.value = currentVal;
  }

  // Responsáveis únicos
  const responsibles = [...new Set(projects.map(p => p.responsibleName).filter(Boolean))].sort();
  const respSelect = document.getElementById('filter-responsible');
  if (respSelect) {
    const currentVal = respSelect.value;
    respSelect.innerHTML = '<option value="">Todos</option>' +
      responsibles.map(r => '<option value="' + escapeHtml(r) + '">' + escapeHtml(r) + '</option>').join('');
    respSelect.value = currentVal;
  }

  // Datalists pro modal de novo projeto (sugestões inteligentes)
  const dlProgs = document.getElementById('dl-programs');
  if (dlProgs) {
    dlProgs.innerHTML = programs.map(p => '<option value="' + escapeHtml(p) + '">').join('');
  }
  const dlMods = document.getElementById('dl-modules');
  if (dlMods) {
    dlMods.innerHTML = modules.map(m => '<option value="' + escapeHtml(m) + '">').join('');
  }
}

function setFilterClient(client) {
  AppState.filters.client = client;

  // Atualiza visual dos botões de cliente
  const buttons = document.querySelectorAll('#client-filter-buttons .client-filter-btn');
  buttons.forEach(btn => {
    const btnClient = btn.getAttribute('onclick')?.match(/setFilterClient\('(.+?)'\)/)?.[1];
    if (btnClient === client) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  applyFilters();
}

function applyFilters() {
  AppState.filters.program = document.getElementById('filter-program')?.value || '';
  AppState.filters.module = document.getElementById('filter-module')?.value || '';
  AppState.filters.responsible = document.getElementById('filter-responsible')?.value || '';
  AppState.filters.health = document.getElementById('filter-health')?.value || '';

  renderKPIs();
  renderProjectTable();
}

function clearFilters() {
  AppState.filters = { client: 'all', program: '', module: '', responsible: '', health: '' };

  // Reset visual
  const selects = ['filter-program', 'filter-module', 'filter-responsible', 'filter-health'];
  selects.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  setFilterClient('all');
}

// Retorna projetos filtrados conforme seleção ativa
function getFilteredProjects() {
  let filtered = AppState.projects;
  const f = AppState.filters;

  if (f.client !== 'all') {
    filtered = filtered.filter(p => p.client === f.client);
  }
  if (f.program) {
    filtered = filtered.filter(p => p.program === f.program);
  }
  if (f.module) {
    filtered = filtered.filter(p => p.module === f.module);
  }
  if (f.responsible) {
    filtered = filtered.filter(p => p.responsibleName === f.responsible);
  }
  if (f.health) {
    filtered = filtered.filter(p => p.health === f.health);
  }

  return filtered;
}

// ========================
// KPI CARDS (CALCULADOS AUTOMATICAMENTE)
// ========================

function renderKPIs() {
  if (!checkAccessPermission('Gerente')) return;
  const projects = getFilteredProjects();
  const total = projects.length;

  // Se não tem nenhum projeto, zera tudo
  const avg = total > 0
    ? Math.round(projects.reduce((sum, p) => sum + (Number(p.progress) || 0), 0) / total)
    : 0;
  const green = projects.filter(p => p.health === 'green').length;
  const yellow = projects.filter(p => p.health === 'yellow').length;
  const red = projects.filter(p => p.health === 'red').length;

  const reprogrammed = projects.filter(p => p.baselineEnd && p.newEnd && p.baselineEnd !== p.newEnd).length;
  const activeRitms = projects.reduce((sum, p) => sum + (p.ritms || []).filter(r => r.status !== 'Concluído').length, 0);

  const pctOf = (n) => total > 0 ? Math.round((n / total) * 100) + '%' : '0%';

  const el = (id) => document.getElementById(id);
  if (el('kpi-total')) el('kpi-total').textContent = total;
  if (el('kpi-avg')) el('kpi-avg').textContent = 'Média: ' + avg + '%';
  if (el('kpi-green')) el('kpi-green').textContent = green;
  if (el('kpi-green-pct')) el('kpi-green-pct').textContent = pctOf(green) + ' do total';
  if (el('kpi-yellow')) el('kpi-yellow').textContent = yellow;
  if (el('kpi-yellow-pct')) el('kpi-yellow-pct').textContent = pctOf(yellow) + (reprogrammed > 0 ? ' • ' + reprogrammed + ' reprogramado(s)' : ' do total');
  if (el('kpi-red')) el('kpi-red').textContent = red;
  if (el('kpi-red-pct')) el('kpi-red-pct').textContent = pctOf(red) + (activeRitms > 0 ? ' • ' + activeRitms + ' chamado(s) aberto(s)' : ' do total');
}

// ========================
// TABELA PRINCIPAL DO GERENTE
// ========================

function renderProjectTable() {
  if (!checkAccessPermission('Gerente')) return;
  const tbody = document.getElementById('tbody-principal');
  const countEl = document.getElementById('table-count');
  if (!tbody) return;

  const projects = getFilteredProjects();

  if (countEl) {
    countEl.textContent = projects.length + (projects.length === 1 ? ' registro' : ' registros');
  }

  // Empty state: nenhuma frente cadastrada ou encontrada nos filtros
  if (projects.length === 0) {
    const isFiltered = AppState.projects.length > 0;
    tbody.innerHTML = '<tr><td colspan="8">' +
      '<div class="empty-state">' +
      '<svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' +
      '<rect x="3" y="3" width="18" height="18" rx="2"/>' +
      '<path d="M3 9h18M9 21V9"/>' +
      '</svg>' +
      '<div class="empty-state-title">' +
      (isFiltered ? 'Nenhum resultado para os filtros selecionados' : 'Nenhuma frente ou projeto cadastrado') +
      '</div>' +
      '<div class="empty-state-text">' +
      (isFiltered
        ? 'Tente ajustar os filtros acima ou limpar a seleção para ver todos os registros.'
        : 'A base está limpa e pronta para uso. Cadastre a primeira frente de trabalho para começar o acompanhamento.') +
      '</div>' +
      (isFiltered
        ? '<button class="btn-secondary" onclick="clearFilters()">Limpar Filtros</button>'
        : '<button class="btn-primary" onclick="openNewProjectModal()">+ Cadastrar Primeira Frente</button>') +
      '</div>' +
      '</td></tr>';
    return;
  }

  tbody.innerHTML = projects.map(p => {
    const clientBadge = getClientBadgeHtml(p.client, p.clientCustom);
    const healthBadge = getHealthBadgeHtml(p.health);
    const statusBadge = getStatusBadgeHtml(p.status);
    const fillClass = getProgressFillClass(p.health);

    // Variação de prazo: destaca se houve reprogramação
    const hasVariance = p.baselineEnd && p.newEnd && p.baselineEnd !== p.newEnd;
    const newEndHtml = hasVariance
      ? '<span class="variance-tag">' + escapeHtml(formatDateBR(p.newEnd)) + ' <span class="variance-delta">\u0394</span></span>'
      : (p.newEnd ? '<span style="color:#334155">' + escapeHtml(formatDateBR(p.newEnd)) + '</span>' : '<span style="color:#94A3B8">—</span>');

    // Conta RITMs vinculados (pra exibir no semáforo)
    const ritmCount = (p.ritms && p.ritms.length) || 0;
    const ritmBadge = ritmCount > 0
      ? '<span class="ritm-count-badge">' + Number(ritmCount) + ' RITM' + (ritmCount > 1 ? 's' : '') + '</span>'
      : '';

    return '<tr>' +
      '<td>' +
        '<div style="display:flex;flex-direction:column;gap:2px">' +
          clientBadge +
          '<span style="font-size:12px;font-weight:600;color:#0F172A;line-height:1.3">' + escapeHtml(p.program) + '</span>' +
        '</div>' +
      '</td>' +
      '<td>' +
        '<div style="display:flex;flex-direction:column;gap:2px">' +
          '<span style="font-size:12px;font-weight:700;color:#0F172A;line-height:1.3" title="' + escapeHtml(p.title) + '">' + escapeHtml(p.title) + '</span>' +
          '<span style="font-size:10px;color:#64748B;font-weight:600">' + escapeHtml(p.module) + '</span>' +
        '</div>' +
      '</td>' +
      '<td>' +
        '<div style="display:flex;flex-direction:column;gap:1px">' +
          '<span style="font-size:12px;font-weight:600;color:#0F172A">' + escapeHtml(p.responsibleName) + '</span>' +
          '<span style="font-size:10px;color:#64748B">' + escapeHtml(p.squad) + '</span>' +
        '</div>' +
      '</td>' +
      '<td class="font-mono tabular-nums" style="white-space:nowrap;color:#64748B">' + escapeHtml(formatDateBR(p.baselineEnd)) + '</td>' +
      '<td style="white-space:nowrap">' + newEndHtml + '</td>' +
      '<td>' +
        '<div style="display:flex;flex-direction:column;gap:4px;min-width:120px">' +
          statusBadge +
          '<div style="display:flex;align-items:center;gap:6px">' +
            '<div class="progress-bar-track" style="flex:1">' +
              '<div class="progress-bar-fill ' + escapeHtml(fillClass) + '" style="width:' + Number(p.progress) + '%"></div>' +
            '</div>' +
            '<span class="font-mono tabular-nums" style="font-size:11px;font-weight:700;color:#0F172A;min-width:30px;text-align:right">' + Number(p.progress) + '%</span>' +
          '</div>' +
        '</div>' +
      '</td>' +
      '<td style="white-space:nowrap;text-align:center">' + healthBadge + ritmBadge + '</td>' +
      '<td class="text-right" style="white-space:nowrap">' +
        '<button class="btn-secondary btn-sm" onclick="openDetailDrawer(\'' + escapeHtml(p.id) + '\')" title="Abrir detalhes da frente">Abrir Detalhes</button>' +
      '</td>' +
    '</tr>';
  }).join('');
}

// ========================
// VISÃO DO COLABORADOR
// ========================

function renderCollaboratorView() {
  const container = document.getElementById('colab-cards-container');
  const welcomeEl = document.getElementById('colab-welcome');
  if (!container) return;

  const user = AppState.session?.user;
  if (!user) return;

  if (welcomeEl) {
    welcomeEl.textContent = 'Meus Projetos — ' + user.name;
  }

  // Trava de segurança: colaborador só vê frentes onde ele é o responsável
  const myProjects = AppState.projects.filter(p =>
    p.responsibleEmail?.toLowerCase() === user.email?.toLowerCase()
  );

  // Empty state personalizado pro colaborador
  if (myProjects.length === 0) {
    container.innerHTML =
      '<div class="empty-state" style="grid-column:1/-1">' +
        '<svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' +
          '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>' +
          '<polyline points="14 2 14 8 20 8"/>' +
          '<line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>' +
        '</svg>' +
        '<div class="empty-state-title">Você ainda não possui frentes atribuídas</div>' +
        '<div class="empty-state-text">Cadastre um novo projeto ou aguarde a atribuição pelo gerente.</div>' +
        '<button class="btn-primary" onclick="openNewProjectModal()">+ Cadastrar Minha Primeira Frente</button>' +
      '</div>';
    return;
  }

  container.innerHTML = myProjects.map(p => {
    const clientBadge = getClientBadgeHtml(p.client, p.clientCustom);
    const healthBadge = getHealthBadgeHtml(p.health);
    const fillClass = getProgressFillClass(p.health);
    const ritmCount = (p.ritms && p.ritms.length) || 0;

    return '<div class="colab-project-card">' +
      '<div>' +
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px">' +
          clientBadge +
          healthBadge +
        '</div>' +
        '<h3 style="font-size:14px;font-weight:700;color:#0F172A;line-height:1.3;margin-bottom:4px">' + escapeHtml(p.title) + '</h3>' +
        '<p style="font-size:11px;color:#64748B;margin-bottom:12px">' +
          escapeHtml(p.program) + ' &bull; ' + escapeHtml(p.module) + ' &bull; ' + escapeHtml(p.squad) +
        '</p>' +
        '<div style="margin-bottom:8px">' +
          '<div style="display:flex;justify-content:space-between;font-size:11px;font-weight:600;color:#334155;margin-bottom:4px">' +
            '<span>Progresso</span>' +
            '<span class="font-mono tabular-nums" style="font-weight:700;color:#1D4ED8">' + Number(p.progress) + '%</span>' +
          '</div>' +
          '<div class="progress-bar-track">' +
            '<div class="progress-bar-fill ' + escapeHtml(fillClass) + '" style="width:' + Number(p.progress) + '%"></div>' +
          '</div>' +
        '</div>' +
        '<p class="font-mono tabular-nums" style="font-size:11px;color:#64748B">' +
          'Prazo: <span style="font-weight:700;color:#0F172A">' +
          escapeHtml(formatDateBR(p.newEnd || p.baselineEnd)) + '</span>' +
          (ritmCount > 0 ? ' &bull; <span style="color:#C2410C;font-weight:600">' + Number(ritmCount) + ' chamado' + (ritmCount > 1 ? 's' : '') + '</span>' : '') +
        '</p>' +
        (p.weeklyNotes ? '<div style="margin-top:8px;padding:8px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:6px;font-size:11px;color:#64748B;font-style:italic">&quot;' + escapeHtml(p.weeklyNotes) + '&quot;</div>' : '') +
      '</div>' +
      '<div style="padding-top:12px;border-top:1px solid #E2E8F0;margin-top:12px;display:flex;align-items:center;justify-content:space-between;gap:8px">' +
        '<button class="btn-secondary btn-sm" onclick="openDetailDrawer(\'' + escapeHtml(p.id) + '\')">Detalhes</button>' +
        '<button class="btn-primary btn-sm" onclick="openUpdateStatusModal(\'' + escapeHtml(p.id) + '\')">Atualizar Status</button>' +
      '</div>' +
    '</div>';
  }).join('');
}

// ========================
// DRAWER DE DETALHAMENTO (DRILL-DOWN)
// ========================

function openDetailDrawer(projectId) {
  const project = AppState.projects.find(p => p.id === projectId);
  if (!project) { showToast('Projeto não encontrado.', 'error'); return; }

  // Anti-IDOR: colaborador só abre detalhe de projeto dele ou se for gerente
  const user = AppState.session?.user;
  if (user?.role !== 'Gerente' && project.responsibleEmail?.toLowerCase() !== user?.email?.toLowerCase()) {
    showToast('Você não tem permissão para acessar este projeto.', 'error');
    return;
  }

  AppState.drawerProjectId = projectId;
  AppState.drawerTab = 'roadmap';

  // Preenche header do drawer
  document.getElementById('drawer-project-id').textContent = project.id;
  document.getElementById('drawer-project-title').textContent = project.title;
  document.getElementById('drawer-project-meta').textContent =
    'Resp: ' + project.responsibleName + ' | Squad: ' + project.squad +
    ' | Prazo: ' + formatDateBR(project.newEnd || project.baselineEnd);
  document.getElementById('drawer-client-badge').innerHTML = getClientBadgeHtml(project.client, project.clientCustom);

  // Progresso e saúde
  const pBar = document.getElementById('drawer-progress-bar');
  const pVal = document.getElementById('drawer-progress-val');
  const hBadge = document.getElementById('drawer-health-badge');
  const sInfo = document.getElementById('drawer-status-info');
  if (pBar) {
    pBar.style.width = Number(project.progress) + '%';
    pBar.className = 'progress-bar-fill ' + getProgressFillClass(project.health);
  }
  if (pVal) pVal.textContent = Number(project.progress) + '%';
  if (hBadge) hBadge.innerHTML = getHealthBadgeHtml(project.health);
  if (sInfo) sInfo.innerHTML = getStatusBadgeHtml(project.status) +
    '<span style="margin-left:8px;font-size:11px;color:#64748B">Módulo: ' + escapeHtml(project.module) + ' | Programa: ' + escapeHtml(project.program) + '</span>';

  // Aba Roadmap
  renderDrawerRoadmap(project);

  // Aba Hypercare
  renderDrawerHypercare(project);

  // Botão excluir: só gerente ou autor
  const deleteBtn = document.getElementById('drawer-delete-btn');
  if (deleteBtn) {
    if (user?.role === 'Gerente' || project.responsibleEmail?.toLowerCase() === user?.email?.toLowerCase()) {
      deleteBtn.classList.remove('hidden');
    } else {
      deleteBtn.classList.add('hidden');
    }
  }

  // Tab ativa
  switchDrawerTab('roadmap');

  // Abre o drawer
  document.getElementById('drawer-overlay').classList.add('open');
  document.getElementById('drawer-panel').classList.add('open');
}

function closeDetailDrawer() {
  document.getElementById('drawer-overlay').classList.remove('open');
  document.getElementById('drawer-panel').classList.remove('open');
  AppState.drawerProjectId = null;
}

function switchDrawerTab(tab) {
  AppState.drawerTab = tab;
  const tabs = { roadmap: 'panel-roadmap', hypercare: 'panel-hypercare' };
  const btns = { roadmap: 'tab-roadmap', hypercare: 'tab-hypercare' };

  Object.keys(tabs).forEach(t => {
    const panel = document.getElementById(tabs[t]);
    const btn = document.getElementById(btns[t]);
    if (t === tab) {
      panel?.classList.add('active');
      btn?.classList.add('active');
    } else {
      panel?.classList.remove('active');
      btn?.classList.remove('active');
    }
  });
}

function renderDrawerRoadmap(project) {
  // Descrição / Escopo
  const descEl = document.getElementById('drawer-description');
  if (descEl) descEl.textContent = project.description || 'Sem descrição registrada.';

  // Pré-requisitos & Impacto
  const prEl = document.getElementById('drawer-prereqs-impact');
  if (prEl) {
    prEl.innerHTML =
      '<p><strong>Pré-requisitos:</strong> ' + escapeHtml(project.prereqs || 'Não informados.') + '</p>' +
      '<p><strong>Impacto caso não concluída:</strong> ' + escapeHtml(project.impact || 'Não informado.') + '</p>';
  }

  // Notas da semana
  const notesEl = document.getElementById('drawer-weekly-notes');
  if (notesEl) notesEl.textContent = project.weeklyNotes || 'Sem notas registradas nesta semana.';

  // Sub-entregas
  const subEl = document.getElementById('drawer-subitems');
  if (subEl) {
    const items = project.subitems && project.subitems.length > 0 ? project.subitems : [];
    if (items.length === 0) {
      subEl.innerHTML = '<div class="detail-block" style="color:#94A3B8;font-style:italic">Nenhuma sub-entrega cadastrada.</div>';
    } else {
      subEl.innerHTML = items.map((item, idx) =>
        '<div style="display:flex;align-items:center;gap:8px;padding:6px 8px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:4px;margin-bottom:4px;font-size:12px;color:#334155">' +
          '<span style="width:20px;height:20px;border-radius:50%;background:#EFF6FF;color:#1D4ED8;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0">' + Number(idx + 1) + '</span>' +
          '<span>' + escapeHtml(item) + '</span>' +
        '</div>'
      ).join('');
    }
  }

  // Comentários
  renderDrawerComments(project);
}

function renderDrawerComments(project) {
  const listEl = document.getElementById('drawer-comments-list');
  if (!listEl) return;

  const comments = project.comments || [];
  if (comments.length === 0) {
    listEl.innerHTML = '<div style="padding:12px;font-size:12px;color:#94A3B8;font-style:italic">Nenhum comentário registrado.</div>';
    return;
  }

  listEl.innerHTML = comments.map(c =>
    '<div class="comment-item">' +
      '<span class="comment-author">' + escapeHtml(c.author) + '</span>' +
      '<span class="comment-time">' + escapeHtml(c.timestamp) + '</span>' +
      '<div class="comment-text">' + escapeHtml(c.text) + '</div>' +
    '</div>'
  ).join('');
}

function renderDrawerHypercare(project) {
  const tbody = document.getElementById('drawer-ritms-tbody');
  if (!tbody) return;

  const ritms = project.ritms || [];
  if (ritms.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="padding:24px;text-align:center;font-size:12px;color:#94A3B8;font-style:italic">' +
      'Nenhum chamado vinculado a esta frente. Clique em "+ Novo Chamado" para registrar.' +
      '</td></tr>';
    return;
  }

  const statuses = ['Em análise', 'Concluído', 'Chamado SAP', 'Pendente'];

  tbody.innerHTML = ritms.map(r => {
    const sevBadge = getSeverityBadgeHtml(r.severity);
    const optionsHtml = statuses.map(s =>
      '<option value="' + escapeHtml(s) + '"' + (r.status === s ? ' selected' : '') + '>' + escapeHtml(s) + '</option>'
    ).join('');

    return '<tr>' +
      '<td class="font-mono tabular-nums" style="font-weight:700;white-space:nowrap">' + escapeHtml(r.id) + '</td>' +
      '<td style="max-width:200px">' + escapeHtml(r.description) + '</td>' +
      '<td style="white-space:nowrap">' + sevBadge + '</td>' +
      '<td style="white-space:nowrap;font-weight:600;color:#334155">' + escapeHtml(r.squad) + '</td>' +
      '<td style="white-space:nowrap">' +
        '<select class="ritm-status-select" data-project-id="' + escapeHtml(project.id) + '" data-ritm-id="' + escapeHtml(r.id) + '" onchange="updateRitmStatus(this.dataset.projectId, this.dataset.ritmId, this.value)" title="Alterar status do chamado">' +
          optionsHtml +
        '</select>' +
      '</td>' +
    '</tr>';
  }).join('');
}

// Atualiza o status de um chamado Hypercare dentro do drawer
function updateRitmStatus(projectId, ritmId, newStatus) {
  const user = AppState.session?.user;
  if (!user) return;

  const project = AppState.projects.find(p => p.id === projectId);
  if (!project) return;

  // Validação de autoria: só o dono da frente ou gerente pode atualizar defeitos
  if (user.role !== 'Gerente' && project.responsibleEmail?.toLowerCase() !== user.email?.toLowerCase()) {
    showToast('Sem permissão para atualizar este chamado.', 'error');
    renderDrawerHypercare(project);
    return;
  }

  const ritm = (project.ritms || []).find(r => r.id === ritmId);
  if (!ritm) return;

  ritm.status = newStatus;
  saveState();

  addNotification('ritm_status',
    user.name + ' alterou o chamado ' + ritm.id + ' (' + project.title + ') para ' + newStatus + '.',
    project.id,
    project.responsibleEmail
  );

  renderDrawerHypercare(project);
  if (user.role === 'Gerente') {
    renderManagerView();
  } else {
    renderCollaboratorView();
  }
  showToast('Chamado ' + ritm.id + ' atualizado para ' + newStatus + '.', 'success');
}

// ========================
// COMENTÁRIOS
// ========================

function addComment() {
  const input = document.getElementById('drawer-comment-input');
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;

  const project = AppState.projects.find(p => p.id === AppState.drawerProjectId);
  if (!project) return;

  // Validação de autoria: só o responsável ou gerente pode comentar
  const user = AppState.session?.user;
  if (user?.role !== 'Gerente' && project.responsibleEmail?.toLowerCase() !== user?.email?.toLowerCase()) {
    showToast('Sem permissão para comentar neste projeto.', 'error');
    return;
  }

  if (!project.comments) project.comments = [];
  project.comments.push({
    author: user.name,
    text: text,
    timestamp: nowTimestamp()
  });

  input.value = '';
  saveState();
  renderDrawerComments(project);

  addNotification('comment', user.name + ' comentou em ' + project.id + ': "' + text.substring(0, 60) + '"', project.id, project.responsibleEmail);
}

// ========================
// MODAL: NOVA FRENTE / PROJETO
// ========================

function toggleCustomClientField() {
  const client = document.getElementById('new-proj-client').value;
  const group = document.getElementById('new-proj-client-custom-group');
  if (client === 'Outro') {
    group.classList.remove('hidden');
  } else {
    group.classList.add('hidden');
  }
}

function openNewProjectModal() {
  const user = AppState.session?.user;
  if (!user) return;

  const form = document.querySelector('#modal-new-project form');
  if (form) form.reset();
  const progVal = document.getElementById('new-proj-progress-val');
  if (progVal) progVal.textContent = '0%';
  toggleCustomClientField();

  // Se for colaborador, pre-preenche nome e email do responsável
  if (user.role === 'Colaborador') {
    const nameEl = document.getElementById('new-proj-responsible-name');
    const emailEl = document.getElementById('new-proj-responsible-email');
    if (nameEl) nameEl.value = user.name;
    if (emailEl) emailEl.value = user.email;
  }

  // Atualiza datalists com valores existentes
  populateFilterOptions();

  document.getElementById('modal-new-project').classList.add('open');
}

function handleSaveNewProject(e) {
  e.preventDefault();

  const user = AppState.session?.user;
  if (!user) return;

  const client = document.getElementById('new-proj-client').value;
  const clientCustom = document.getElementById('new-proj-client-custom').value.trim();
  const program = document.getElementById('new-proj-program').value.trim();
  const module = document.getElementById('new-proj-module').value.trim();
  const title = document.getElementById('new-proj-title').value.trim();
  const responsibleName = document.getElementById('new-proj-responsible-name').value.trim();
  const responsibleEmail = document.getElementById('new-proj-responsible-email').value.trim();
  const squad = document.getElementById('new-proj-squad').value.trim();
  const baselineEnd = document.getElementById('new-proj-baseline-end').value;
  const status = document.getElementById('new-proj-status').value;
  const health = document.getElementById('new-proj-health').value;
  const progress = Number(document.getElementById('new-proj-progress').value) || 0;
  const description = document.getElementById('new-proj-description').value.trim();
  const prereqs = document.getElementById('new-proj-prereqs')?.value.trim() || '';
  const impact = document.getElementById('new-proj-impact')?.value.trim() || '';

  if (client === 'Outro' && !clientCustom) {
    showToast('Informe o nome do cliente.', 'error');
    return;
  }

  const newProject = {
    id: generateId('FRN'),
    client,
    clientCustom: client === 'Outro' ? clientCustom : '',
    program,
    module,
    title,
    responsibleName,
    responsibleEmail,
    squad,
    baselineEnd,
    newEnd: '',
    status,
    progress,
    health,
    description,
    prereqs,
    impact,
    weeklyNotes: '',
    subitems: [],
    comments: [],
    ritms: [],
    createdAt: new Date().toISOString().split('T')[0],
    createdBy: user.username || 'sistema'
  };

  AppState.projects.push(newProject);
  saveState();

  closeModal('modal-new-project');
  e.target.reset();
  document.getElementById('new-proj-progress-val').textContent = '0%';
  document.getElementById('new-proj-client-custom-group').classList.add('hidden');

  // Notifica gerência e responsável
  addNotification('new_project',
    user.name + ' cadastrou a frente "' + title + '" (' + program + ' / ' + module + ').',
    newProject.id,
    newProject.responsibleEmail
  );

  // Re-renderiza a view ativa
  if (user.role === 'Gerente') {
    renderManagerView();
  } else {
    renderCollaboratorView();
  }

  showToast('Frente "' + title + '" cadastrada com sucesso!', 'success');
}

// ========================
// MODAL: ATUALIZAR STATUS
// ========================

function openUpdateStatusModal(projectId) {
  const project = AppState.projects.find(p => p.id === projectId);
  if (!project) return;

  // Anti-IDOR: colaborador só atualiza o que é dele
  const user = AppState.session?.user;
  if (user?.role !== 'Gerente' && project.responsibleEmail?.toLowerCase() !== user?.email?.toLowerCase()) {
    showToast('Sem permissão para atualizar este projeto.', 'error');
    return;
  }

  document.getElementById('update-project-id').value = project.id;
  document.getElementById('update-project-label').textContent = project.id + ' — ' + project.title;
  document.getElementById('update-status').value = project.status;
  document.getElementById('update-health').value = project.health;
  document.getElementById('update-progress').value = project.progress;
  document.getElementById('update-progress-val').textContent = project.progress + '%';
  document.getElementById('update-new-end').value = project.newEnd || '';
  document.getElementById('update-deadline-msg').value = '';
  document.getElementById('update-weekly-notes').value = project.weeklyNotes || '';

  document.getElementById('modal-update-status').classList.add('open');
}

function openUpdateFromDrawer() {
  if (AppState.drawerProjectId) {
    openUpdateStatusModal(AppState.drawerProjectId);
  }
}

function handleSaveUpdateStatus(e) {
  e.preventDefault();

  const projectId = document.getElementById('update-project-id').value;
  const project = AppState.projects.find(p => p.id === projectId);
  if (!project) return;

  // Validação de autoria novamente
  const user = AppState.session?.user;
  if (user?.role !== 'Gerente' && project.responsibleEmail?.toLowerCase() !== user?.email?.toLowerCase()) {
    showToast('Sem permissão.', 'error');
    return;
  }

  const oldProgress = project.progress;
  const oldNewEnd = project.newEnd || '';
  const newStatus = document.getElementById('update-status').value;
  const newHealth = document.getElementById('update-health').value;
  const newProgress = Number(document.getElementById('update-progress').value) || 0;
  const newEnd = document.getElementById('update-new-end').value;
  const deadlineMsg = document.getElementById('update-deadline-msg').value.trim();
  const weeklyNotes = document.getElementById('update-weekly-notes').value.trim();

  // Monta resumo das mudanças pra notificação
  const changes = [];
  if (project.status !== newStatus) changes.push('Status: ' + newStatus);
  if (project.health !== newHealth) changes.push('Saúde: ' + newHealth.toUpperCase());
  if (oldProgress !== newProgress) changes.push('Progresso: ' + oldProgress + '% → ' + newProgress + '%');
  if (newEnd !== oldNewEnd) changes.push(newEnd ? ('Nova data: ' + formatDateBR(newEnd)) : 'Reprogramação removida');

  // Aplica as mudanças
  project.status = newStatus;
  project.health = newHealth;
  project.progress = newProgress;
  project.newEnd = newEnd;
  project.weeklyNotes = weeklyNotes;

  // Se houve mudança de prazo com mensagem, registra como comentário automático
  if (deadlineMsg && newEnd) {
    if (!project.comments) project.comments = [];
    project.comments.push({
      author: user?.name || 'Sistema',
      text: '[Mudança de prazo] Nova data: ' + formatDateBR(newEnd) + ' — ' + deadlineMsg,
      timestamp: nowTimestamp()
    });
  }

  saveState();
  closeModal('modal-update-status');

  // Notifica
  if (changes.length > 0) {
    addNotification('status_change',
      (user?.name || 'Alguém') + ' atualizou ' + project.id + ': ' + changes.join(' | '),
      project.id,
      project.responsibleEmail
    );
  }

  // Re-renderiza
  if (user?.role === 'Gerente') {
    renderManagerView();
  } else {
    renderCollaboratorView();
  }

  // Se o drawer tava aberto nesse projeto, atualiza ele também
  if (AppState.drawerProjectId === projectId) {
    openDetailDrawer(projectId);
  }

  showToast('Status de "' + project.title + '" atualizado!', 'success');
}

// ========================
// MODAL: NOVO CHAMADO (RITM / HYPERCARE)
// ========================

function openNewRitmModal(projectId) {
  // Se chamado do drawer, usa o projeto do drawer
  const pId = projectId || AppState.drawerProjectId;
  if (!pId) { showToast('Selecione um projeto primeiro.', 'error'); return; }

  const project = AppState.projects.find(p => p.id === pId);
  const user = AppState.session?.user;
  if (!project || !user) return;

  // Trava de autoria: só o dono da frente ou gerente pode registrar defeitos
  if (user.role !== 'Gerente' && project.responsibleEmail?.toLowerCase() !== user.email?.toLowerCase()) {
    showToast('Sem permissão para registrar chamados nesta frente.', 'error');
    return;
  }

  const form = document.querySelector('#modal-new-ritm form');
  if (form) form.reset();

  document.getElementById('new-ritm-project-id').value = pId;
  document.getElementById('modal-new-ritm').classList.add('open');
}

function handleSaveNewRitm(e) {
  e.preventDefault();

  const projectId = document.getElementById('new-ritm-project-id').value;
  const project = AppState.projects.find(p => p.id === projectId);
  const user = AppState.session?.user;
  if (!project || !user) return;

  // Trava de autoria novamente antes de gravar
  if (user.role !== 'Gerente' && project.responsibleEmail?.toLowerCase() !== user.email?.toLowerCase()) {
    showToast('Sem permissão para registrar chamados nesta frente.', 'error');
    return;
  }

  const code = document.getElementById('new-ritm-code').value.trim();
  const description = document.getElementById('new-ritm-description').value.trim();
  const severity = document.getElementById('new-ritm-severity').value;
  const status = document.getElementById('new-ritm-status').value;
  const squad = document.getElementById('new-ritm-squad').value.trim();

  const newRitm = {
    id: code || generateId('RITM'),
    description,
    severity,
    squad,
    status,
    identifiedAt: new Date().toISOString().split('T')[0],
    createdBy: user.username || 'sistema'
  };

  if (!project.ritms) project.ritms = [];
  project.ritms.push(newRitm);
  saveState();

  closeModal('modal-new-ritm');
  e.target.reset();

  addNotification('new_ritm',
    user.name + ' registrou chamado ' + newRitm.id + ' em ' + project.id + ' (' + severity + ').',
    project.id,
    project.responsibleEmail
  );

  // Atualiza drawer se estiver aberto
  if (AppState.drawerProjectId === projectId) {
    renderDrawerHypercare(project);
  }

  // Re-renderiza view principal
  if (user.role === 'Gerente') {
    renderManagerView();
  } else {
    renderCollaboratorView();
  }

  showToast('Chamado ' + newRitm.id + ' registrado!', 'success');
}

// ========================
// EXCLUIR PROJETO
// ========================

function deleteProject() {
  const projectId = AppState.drawerProjectId;
  if (!projectId) return;

  const project = AppState.projects.find(p => p.id === projectId);
  if (!project) return;

  // Só gerente ou autor pode excluir
  const user = AppState.session?.user;
  if (user?.role !== 'Gerente' && project.responsibleEmail?.toLowerCase() !== user?.email?.toLowerCase()) {
    showToast('Sem permissão para excluir.', 'error');
    return;
  }

  if (!confirm('Tem certeza que deseja excluir a frente "' + project.title + '"? Esta ação não pode ser desfeita.')) {
    return;
  }

  AppState.projects = AppState.projects.filter(p => p.id !== projectId);
  saveState();

  closeDetailDrawer();

  addNotification('delete', (user?.name || 'Alguém') + ' excluiu a frente "' + project.title + '".', null, project.responsibleEmail);

  if (user?.role === 'Gerente') {
    renderManagerView();
  } else {
    renderCollaboratorView();
  }

  showToast('Frente "' + project.title + '" excluída.', '');
}

// ========================
// MODAIS — UTILITÁRIO
// ========================

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('open');
}

// ========================
// NOTIFICAÇÕES
// ========================

function addNotification(type, message, projectId, targetEmail) {
  let resolvedEmail = targetEmail || null;
  if (!resolvedEmail && projectId) {
    const p = AppState.projects.find(item => item.id === projectId);
    if (p) resolvedEmail = p.responsibleEmail || null;
  }

  AppState.notifications.unshift({
    id: generateId('notif'),
    type,
    message,
    projectId: projectId || null,
    targetEmail: resolvedEmail,
    timestamp: nowTimestamp(),
    read: false
  });

  // Mantém no máximo 50 notificações pra não inflar o localStorage
  if (AppState.notifications.length > 50) {
    AppState.notifications = AppState.notifications.slice(0, 50);
  }

  saveState();
  renderNotifications();
}

function getVisibleNotifications() {
  const user = AppState.session?.user;
  if (!user) return [];
  // Gerente vê tudo; colaborador vê apenas notificações ligadas às suas frentes ou à própria conta
  if (user.role === 'Gerente') return AppState.notifications;

  const myEmail = (user.email || '').toLowerCase();
  const myProjectIds = new Set(
    AppState.projects
      .filter(p => (p.responsibleEmail || '').toLowerCase() === myEmail)
      .map(p => p.id)
  );

  return AppState.notifications.filter(n =>
    (n.targetEmail && n.targetEmail.toLowerCase() === myEmail) ||
    (n.projectId && myProjectIds.has(n.projectId))
  );
}

function toggleNotifications() {
  const popover = document.getElementById('popover-notifications');
  if (!popover) return;
  popover.classList.toggle('open');
}

function renderNotifications() {
  const listEl = document.getElementById('notif-list');
  const badgeEl = document.getElementById('notif-badge');
  if (!listEl) return;

  const visible = getVisibleNotifications();
  const unreadCount = visible.filter(n => !n.read).length;

  if (badgeEl) {
    badgeEl.textContent = unreadCount;
    if (unreadCount > 0) {
      badgeEl.classList.remove('hidden');
    } else {
      badgeEl.classList.add('hidden');
    }
  }

  if (visible.length === 0) {
    listEl.innerHTML = '<div class="notif-empty">Nenhuma notificação por aqui.</div>';
    return;
  }

  listEl.innerHTML = visible.slice(0, 30).map(n =>
    '<div class="notif-item' + (n.read ? '' : ' unread') + '">' +
      '<div>' + escapeHtml(n.message) + '</div>' +
      '<div class="notif-item-time">' + escapeHtml(n.timestamp) + '</div>' +
    '</div>'
  ).join('');
}

function markAllRead() {
  const visibleIds = new Set(getVisibleNotifications().map(n => n.id));
  AppState.notifications.forEach(n => {
    if (visibleIds.has(n.id)) n.read = true;
  });
  saveState();
  renderNotifications();
  showToast('Todas as notificações foram marcadas como lidas.', 'success');
}

// ========================
// SEGURANÇA: RBAC + DOM GUARD
// ========================

// Trava de segurança: colaborador não passa daqui nem mexendo no inspecionar elemento
function checkAccessPermission(requiredRole) {
  const user = AppState.session?.user;
  if (!user) return false;
  if (requiredRole === 'Gerente' && user.role !== 'Gerente') {
    return false;
  }
  return true;
}

// Vigia manipulação de DOM: se alguém tentar forçar visão de gerente ou barra de homologação, fecha e limpa na hora
let domGuardObserver = null;
function initDomGuard() {
  if (domGuardObserver) return;
  const gerenteView = document.getElementById('view-gerente');
  const homoBar = document.getElementById('homologation-bar');
  if (!gerenteView) return;

  domGuardObserver = new MutationObserver(() => {
    const user = AppState.session?.user;
    if (user && user.role !== 'Gerente') {
      if (!gerenteView.classList.contains('hidden') || gerenteView.style.display === 'block') {
        gerenteView.classList.add('hidden');
        gerenteView.style.display = '';
        const tbody = document.getElementById('tbody-principal');
        if (tbody) tbody.innerHTML = '';
        console.warn('[DomGuard] Tentativa de acesso não autorizado ao painel de gerente bloqueada.');
      }
    }
    if (homoBar && AppState.session?.canSimulate !== true) {
      if (!homoBar.classList.contains('hidden') || homoBar.style.display === 'flex' || homoBar.style.display === 'block') {
        homoBar.classList.add('hidden');
        homoBar.style.display = '';
      }
    }
  });

  domGuardObserver.observe(gerenteView, { attributes: true, attributeFilter: ['class', 'style'] });
  if (homoBar) {
    domGuardObserver.observe(homoBar, { attributes: true, attributeFilter: ['class', 'style'] });
  }
}

// ========================
// BARRA DE HOMOLOGAÇÃO (DEBUG — TROCA DE USUÁRIO)
// ========================

function populateDebugSwitchUser() {
  const select = document.getElementById('debug-switch-user');
  if (!select) return;

  select.innerHTML = AppState.users.map(u =>
    '<option value="' + escapeHtml(u.id) + '"' +
    (AppState.session?.user?.id === u.id ? ' selected' : '') +
    '>' + escapeHtml(u.name) + ' (' + escapeHtml(u.role) + ')</option>'
  ).join('');
}

function switchDebugUser() {
  // Só permite simular se a sessão original autenticada for de Gerente
  if (AppState.session?.canSimulate !== true) {
    showToast('Simulação disponível apenas para gerentes autenticados.', 'error');
    return;
  }

  const select = document.getElementById('debug-switch-user');
  if (!select) return;

  const userId = select.value;
  const user = AppState.users.find(u => u.id === userId);
  if (!user) return;

  AppState.session = {
    user: { ...user },
    canSimulate: true
  };
  saveState();
  showApp();
  showToast('Simulando como: ' + user.name + ' (' + user.role + ')', 'success');
}

// ========================
// INICIALIZAÇÃO
// ========================

function initApp() {
  // Garante fallback caso alguma logo estática tenha falhado antes do app.js carregar
  document.querySelectorAll('#client-filter-buttons img').forEach(img => {
    if (img.complete && img.naturalWidth === 0) handleClientLogoError(img);
  });

  loadState();

  // Se tem sessão salva e o usuário ainda existe, vai direto pro app
  if (AppState.session?.user) {
    const userStillExists = AppState.users.some(u => u.id === AppState.session.user.id);
    if (userStillExists) {
      // Recarrega dados atualizados do usuário (caso tenha sido editado)
      const freshUser = AppState.users.find(u => u.id === AppState.session.user.id);
      const canSim = AppState.session.canSimulate === true || freshUser.role === 'Gerente';
      AppState.session = { user: { ...freshUser }, canSimulate: canSim };
      showApp();
      return;
    }
    // Se o usuário sumiu do localStorage, desloga
    AppState.session = null;
    localStorage.removeItem(STORAGE_KEY_SESSION);
  }

  // Sem sessão: mostra login
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('app-shell').classList.add('hidden');
}

// Fecha popover de notificações ao clicar fora
document.addEventListener('click', (e) => {
  const popover = document.getElementById('popover-notifications');
  const btn = document.getElementById('btn-toggle-notifs');
  if (popover && popover.classList.contains('open') && !popover.contains(e.target) && !(btn && btn.contains(e.target))) {
    popover.classList.remove('open');
  }
});

// Fecha drawer com ESC
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeDetailDrawer();
    closeModal('modal-new-project');
    closeModal('modal-update-status');
    closeModal('modal-new-ritm');
    const popover = document.getElementById('popover-notifications');
    if (popover) popover.classList.remove('open');
  }
});

// Boot
document.addEventListener('DOMContentLoaded', initApp);
