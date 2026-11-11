// ============================================================
// Projetos Allan Santos — Portal de Governança & PMO
// app.js — Motor WBS 3 Níveis, Gantt Interativo, Hypercare & RBAC
//
// Base inicial com dados reais do programa PD Gente (Cliente: XP).
// Cadastro/edição 100% nativos na interface, sem Excel/CSV.
// ============================================================

'use strict';

// ========================
// CONSTANTES & LOCALSTORAGE
// ========================
const STORAGE_KEY_USERS = 'as_gov_users_v3';
const STORAGE_KEY_ACTIVITIES = 'gov_portal_xp_real_v1_acts';
const STORAGE_KEY_RITMS = 'gov_portal_xp_real_v1_ritms';
const STORAGE_KEY_EXEC_NOTES = 'gov_portal_xp_real_v1_notes';
const STORAGE_KEY_NOTIFS = 'gov_portal_xp_real_v1_notifs';
const STORAGE_KEY_SESSION = 'as_gov_session_v3';
const STORAGE_KEY_DEMO_SEED = 'gov_portal_xp_real_v1';
const MANAGER_KEY = 'GOV2026'; // Chave corporativa pra cadastro de perfil Gerente

const STATUS_ORDER = [
  'Concluído',
  'Em andamento',
  'Não iniciado',
  'Em atenção',
  'Atrasado',
  'Bloqueado'
];

const ZOOM_DAY_WIDTH = {
  compact: 20,
  normal: 32,
  expanded: 48
};

// Usuário base de gestão (demais colaboradores se cadastram na tela inicial)
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
  activities: [],     // Começa zerado — preenchido manualmente pela equipe
  ritms: [],          // Chamados Hypercare vinculados a Cliente/Módulo
  execNotes: [],      // Cobranças e validações executivas da gerência
  notifications: [],
  session: null,      // { user: {...}, canSimulate: boolean }
  activeTab: 'overview',
  referenceDate: '',  // YYYY-MM-DD (padrão hoje — guia a linha vermelha no Gantt)
  ganttZoom: 'normal',
  filters: {
    client: 'all',
    system: '',
    status: '',
    responsible: '',
    search: '',
    hideDone: false
  },
  collapsedSystems: new Set(),
  collapsedMacros: new Set(),
  ganttBarMeta: {}    // Mapa temporário pro tooltip flutuante sem risco de XSS em atributos HTML
};

// ========================
// UTILITÁRIOS DE SEGURANÇA & DATAS
// ========================

// Limpa caracteres maliciosos antes de jogar na árvore WBS, Gantt ou tabelas
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function generateId(prefix) {
  return prefix + '-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
}

// Retorna data local de hoje em YYYY-MM-DD sem susto de fuso
function getTodayISO() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}

// Converte YYYY-MM-DD pra timestamp UTC meio-dia (evita shift de timezone no Brasil UTC-3)
function parseISODateUTC(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return null;
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  if (!y || !m || !d) return null;
  return Date.UTC(y, m - 1, d);
}

function utcMsToISO(ms) {
  const d = new Date(ms);
  const pad = (n) => String(n).padStart(2, '0');
  return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate());
}

function diffDaysUTC(startStr, endStr) {
  const s = parseISODateUTC(startStr);
  const e = parseISODateUTC(endStr);
  if (s === null || e === null) return 0;
  return Math.round((e - s) / 86400000);
}

function addDaysISO(dateStr, days) {
  const ms = parseISODateUTC(dateStr);
  if (ms === null) return dateStr;
  return utcMsToISO(ms + days * 86400000);
}

function formatDateBR(dateStr) {
  if (!dateStr) return '—';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return parts[2] + '/' + parts[1] + '/' + parts[0];
}

function formatShortDayMonth(ms) {
  const d = new Date(ms);
  const pad = (n) => String(n).padStart(2, '0');
  return pad(d.getUTCDate()) + '/' + pad(d.getUTCMonth() + 1);
}

function formatMonthYearBR(ms) {
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const d = new Date(ms);
  return months[d.getUTCMonth()] + '/' + d.getUTCFullYear();
}

function nowTimestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear() +
    ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
}

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
// PERSISTÊNCIA
// ========================

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(AppState.users));
    localStorage.setItem(STORAGE_KEY_ACTIVITIES, JSON.stringify(AppState.activities));
    localStorage.setItem(STORAGE_KEY_RITMS, JSON.stringify(AppState.ritms));
    localStorage.setItem(STORAGE_KEY_EXEC_NOTES, JSON.stringify(AppState.execNotes));
    localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(AppState.notifications));
    if (AppState.session) {
      localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(AppState.session));
    }
  } catch (e) {
    console.warn('[saveState] Falha ao gravar no localStorage:', e);
  }
}

// ========================
// MASSA REAL INICIAL — PD GENTE (XP)
// ========================

function createTestSeedData() {
  const today = getTodayISO();
  const activities = [
    // Módulo 1: SAP Recruiting (3 itens)
    {
      id: 'xp-real-001',
      code: 'XP-001',
      client: 'XP',
      clientCustom: '',
      system: 'SAP Recruiting',
      macro: 'A - Convivência & Migração de Dados',
      title: 'Migração dos Currículos para o Blobstorage',
      responsibleName: 'Fabio Lima / Thiago Doria',
      responsibleEmail: 'fabio.lima@xp.com.br',
      area: 'People Analytics / Squad Change',
      startDate: '2026-11-09',
      endDate: '2026-11-13',
      newEnd: '',
      status: 'Em andamento',
      progress: 45,
      notes: 'Extração e carga histórica dos currículos do Greenhouse para Blobstorage.',
      createdBy: 'AllanSantos',
      createdAt: today
    },
    {
      id: 'xp-real-002',
      code: 'XP-002',
      client: 'XP',
      clientCustom: '',
      system: 'SAP Recruiting',
      macro: 'A - Convivência & Migração de Dados',
      title: 'Criação de De-Para dos campos (Greenhouse x SAP)',
      responsibleName: 'Fabio Lima',
      responsibleEmail: 'fabio.lima@xp.com.br',
      area: 'Squad SAP / People Analytics',
      startDate: '2026-11-06',
      endDate: '2026-11-12',
      newEnd: '',
      status: 'Em atenção',
      progress: 70,
      notes: 'Validação final dos campos críticos antes da virada do Piloto 2.',
      createdBy: 'AllanSantos',
      createdAt: today
    },
    {
      id: 'xp-real-003',
      code: 'XP-003',
      client: 'XP',
      clientCustom: '',
      system: 'SAP Recruiting',
      macro: 'B - Operação & Convivência R&S',
      title: 'Acompanhamento de Vagas e Indicadores (nos dois sistemas)',
      responsibleName: 'Luiza Angélica',
      responsibleEmail: 'luiza.angelica@xp.com.br',
      area: 'R&S',
      startDate: '2026-10-14',
      endDate: '2026-12-31',
      newEnd: '',
      status: 'Em andamento',
      progress: 35,
      notes: 'Governança rígida durante período de convivência Greenhouse e SAP Recruiting.',
      createdBy: 'AllanSantos',
      createdAt: today
    },
    // Módulo 2: Admissão Digital (3 itens)
    {
      id: 'xp-real-004',
      code: 'XP-004',
      client: 'XP',
      clientCustom: '',
      system: 'Admissão Digital',
      macro: 'A - Integração & Homologação',
      title: 'Homologação da solução GreenHouse > Genera',
      responsibleName: 'Sara Campos / Karina Andreto',
      responsibleEmail: 'karina.andreto@xp.com.br',
      area: 'Admissão / Epi-Use',
      startDate: '2026-10-20',
      endDate: '2026-10-26',
      newEnd: '2026-10-30',
      status: 'Concluído',
      progress: 100,
      notes: 'Warroom de validação da integração concluída com sucesso.',
      createdBy: 'AllanSantos',
      createdAt: today
    },
    {
      id: 'xp-real-005',
      code: 'XP-005',
      client: 'XP',
      clientCustom: '',
      system: 'Admissão Digital',
      macro: 'B - Legado & Decommission Vlow',
      title: 'Execução do robô do legado Vlow',
      responsibleName: 'Guilherme Magalhães / Karina Andreto',
      responsibleEmail: 'karina.andreto@xp.com.br',
      area: 'Run&Ops / Admissão',
      startDate: '2026-11-04',
      endDate: '2026-11-04',
      newEnd: '2026-11-06',
      status: 'Em atenção',
      progress: 80,
      notes: 'Reprogramado em +2 dias para saneamento das evidências de adesão.',
      createdBy: 'AllanSantos',
      createdAt: today
    },
    {
      id: 'xp-real-006',
      code: 'XP-006',
      client: 'XP',
      clientCustom: '',
      system: 'Admissão Digital',
      macro: 'B - Legado & Decommission Vlow',
      title: 'Cálculo da volumetria de documentos não integrados - Vlow',
      responsibleName: 'Rafael Oliveira / Ivo Hashimoto',
      responsibleEmail: 'rafael.oliveira@xp.com.br',
      area: 'Squad SAP',
      startDate: '2026-11-06',
      endDate: '2026-11-10',
      newEnd: '',
      status: 'Atrasado',
      progress: 65,
      notes: 'Aguardando fechamento da volumetria final junto à Squad SAP.',
      createdBy: 'AllanSantos',
      createdAt: today
    },
    // Módulo 3: Onboarding & Acessos (3 itens)
    {
      id: 'xp-real-007',
      code: 'XP-007',
      client: 'XP',
      clientCustom: '',
      system: 'Onboarding & Acessos',
      macro: 'A - Gestão de Acessos (Piloto 2)',
      title: 'Consolidar e disponibilizar a lista de usuários do Piloto 2',
      responsibleName: 'Beatriz Mancini',
      responsibleEmail: 'beatriz.mancini@xp.com.br',
      area: 'R&S',
      startDate: '2026-11-06',
      endDate: '2026-11-13',
      newEnd: '',
      status: 'Em andamento',
      progress: 60,
      notes: 'Base de recrutadores e líderes em validação para liberação de perfis.',
      createdBy: 'AllanSantos',
      createdAt: today
    },
    {
      id: 'xp-real-008',
      code: 'XP-008',
      client: 'XP',
      clientCustom: '',
      system: 'Onboarding & Acessos',
      macro: 'A - Gestão de Acessos (Piloto 2)',
      title: 'Configuração de Acessos - Piloto 2',
      responsibleName: 'Luiz Jorge / Débora Sawada',
      responsibleEmail: 'debora.sawada@xp.com.br',
      area: 'Gestão de Acessos',
      startDate: '2026-11-18',
      endDate: '2026-11-27',
      newEnd: '',
      status: 'Não iniciado',
      progress: 0,
      notes: 'Depende da entrega da lista consolidada de usuários do Piloto 2.',
      createdBy: 'AllanSantos',
      createdAt: today
    },
    {
      id: 'xp-real-009',
      code: 'XP-009',
      client: 'XP',
      clientCustom: '',
      system: 'Onboarding & Acessos',
      macro: 'B - Sustentação & WarRoom',
      title: 'Canal de suporte e Monitoramento da adoção (WarRoom)',
      responsibleName: 'Camila Silva / Tatiana Lima',
      responsibleEmail: 'camila.silva@xp.com.br',
      area: 'PMO / Squad SAP / Epi-Use',
      startDate: '2026-11-03',
      endDate: '2027-01-01',
      newEnd: '',
      status: 'Em andamento',
      progress: 30,
      notes: 'Acompanhamento diário de estabilização pós-go-live.',
      createdBy: 'AllanSantos',
      createdAt: today
    }
  ];

  const ritms = [
    {
      uid: 'xp-ritm-001',
      client: 'XP',
      system: 'SAP Recruiting',
      code: 'RITM18437224',
      severity: 'Alta P2',
      description: 'Disponibilizar para o LinkedIn o XML do job posting conforme solicitado.',
      squad: 'EPI Use - Karina Santos',
      status: 'Concluído',
      action: 'Feed XML ajustado e disponibilizado. Fechado no Taylor.',
      ownerEmail: 'allan.santos@empresa.com',
      createdAt: today
    },
    {
      uid: 'xp-ritm-002',
      client: 'XP',
      system: 'Admissão Digital',
      code: 'RITM18437741',
      severity: 'Média P3',
      description: 'Quando há declínio na Admissão Digital (Genera), atualizar o status da posição para o recrutamento no EC.',
      squad: 'EPI Use - Natanael',
      status: 'Em análise',
      action: 'Ajuste realizado no ADM Digital e disponível no ambiente de QAS para validação.',
      ownerEmail: 'karina.andreto@xp.com.br',
      createdAt: today
    },
    {
      uid: 'xp-ritm-003',
      client: 'XP',
      system: 'Onboarding & Acessos',
      code: 'RITM18437763',
      severity: 'Média P3',
      description: 'Contrato de Trabalho e mensagens do Onboarding devem ser enviados para o e-mail pessoal dos colaboradores.',
      squad: 'EPI Use - Natanael / Squad SAP - Fabio e Rafael',
      status: 'Em análise',
      action: 'Correção feita no ADM Digital; testes em andamento com Karina Andreto em QAS.',
      ownerEmail: 'fabio.lima@xp.com.br',
      createdAt: today
    }
  ];

  const execNotes = [
    {
      id: 'xp-note-001',
      client: 'XP',
      system: 'Admissão Digital',
      text: 'Validar fechamento da volumetria de documentos não integrados da Vlow (XP-006) e conclusão dos testes em QAS do RITM18437741.',
      author: 'Allan Santos',
      timestamp: '11/11/2026'
    }
  ];

  return { activities, ritms, execNotes };
}

function purgeLegacyDemoStorage() {
  [
    'gov_portal_data_v1',
    'as_gov_wbs_activities_v4',
    'as_gov_wbs_ritms_v4',
    'as_gov_wbs_exec_notes_v4',
    'as_gov_wbs_notifs_v4',
    'as_gov_demo_seed_v5'
  ].forEach(k => localStorage.removeItem(k));
}

function loadState() {
  try {
    // Limpa caches antigos de demonstração para carregar os dados reais sem precisar limpar o navegador manualmente
    purgeLegacyDemoStorage();

    const users = localStorage.getItem(STORAGE_KEY_USERS);
    const activities = localStorage.getItem(STORAGE_KEY_ACTIVITIES);
    const ritms = localStorage.getItem(STORAGE_KEY_RITMS);
    const execNotes = localStorage.getItem(STORAGE_KEY_EXEC_NOTES);
    const notifs = localStorage.getItem(STORAGE_KEY_NOTIFS);
    const session = localStorage.getItem(STORAGE_KEY_SESSION);

    AppState.users = users ? JSON.parse(users) : [...DEFAULT_USERS];
    AppState.activities = (activities ? JSON.parse(activities) : [])
      .filter(a => !/^act-demo-/.test(a.id || '') && !/^AT-00[1-7]$/i.test(a.code || ''));
    AppState.ritms = (ritms ? JSON.parse(ritms) : [])
      .filter(r => !/^ritm-demo-/.test(r.uid || ''));
    AppState.execNotes = (execNotes ? JSON.parse(execNotes) : [])
      .filter(n => n.id !== 'note-demo-001');
    AppState.notifications = notifs ? JSON.parse(notifs) : [];
    AppState.session = session ? JSON.parse(session) : null;

    if (!localStorage.getItem(STORAGE_KEY_DEMO_SEED)) {
      const seed = createTestSeedData();
      if (AppState.activities.length === 0) AppState.activities = seed.activities;
      if (AppState.ritms.length === 0) AppState.ritms = seed.ritms;
      if (AppState.execNotes.length === 0) AppState.execNotes = seed.execNotes;
      localStorage.setItem(STORAGE_KEY_DEMO_SEED, '1');
      saveState();
    }
  } catch (e) {
    console.warn('[loadState] Erro ao carregar estado, carregando massa inicial XP:', e);
    const seed = createTestSeedData();
    AppState.users = [...DEFAULT_USERS];
    AppState.activities = seed.activities;
    AppState.ritms = seed.ritms;
    AppState.execNotes = seed.execNotes;
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

  if (AppState.users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
    errorEl.textContent = 'Este usuário já está em uso.';
    errorEl.classList.remove('hidden');
    return;
  }
  if (AppState.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    errorEl.textContent = 'Este e-mail já está cadastrado.';
    errorEl.classList.remove('hidden');
    return;
  }

  // Trava de segurança: perfil Gerente só entra com chave corporativa GOV2026
  if (role === 'Gerente' && managerKey !== MANAGER_KEY) {
    errorEl.textContent = 'Chave corporativa inválida para perfil Gerente.';
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

  addNotification('new_user', name + ' (' + role + ') criou conta no portal.', null, email);
  showApp();
  showToast('Conta criada! Bem-vindo, ' + name + '.', 'success');
}

function toggleRegisterForm() {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const toggleText = document.getElementById('login-toggle-text');
  const toggleBtn = document.getElementById('login-toggle-btn');

  const showingReg = !registerForm.classList.contains('hidden');
  if (showingReg) {
    registerForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
    toggleText.textContent = 'Não tem conta?';
    toggleBtn.textContent = 'Cadastre-se';
  } else {
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
    toggleText.textContent = 'Já tem conta?';
    toggleBtn.textContent = 'Fazer login';
  }
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
  closeModal('modal-activity');
  closeModal('modal-ritm');
  hideGanttTooltip();
  document.getElementById('popover-notifications')?.classList.remove('open');
  document.getElementById('homologation-bar')?.classList.add('hidden');
  document.getElementById('app-shell').classList.add('hidden');
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('login-form').reset();
  document.getElementById('login-error').classList.add('hidden');
}

// ========================
// SEGURANÇA: RBAC & ESCOPO DE DADOS
// ========================

// Trava de segurança: separa Gerente (visão consolidada) de Colaborador (só suas frentes)
function checkAccessPermission(requiredRole) {
  const user = AppState.session?.user;
  if (!user) return false;
  if (requiredRole === 'Gerente' && user.role !== 'Gerente') {
    return false;
  }
  return true;
}

function isOwnerOrManager(ownerEmail) {
  const user = AppState.session?.user;
  if (!user) return false;
  if (user.role === 'Gerente') return true;
  return (ownerEmail || '').toLowerCase() === (user.email || '').toLowerCase();
}

// Colaborador nunca enxerga entregas ou RITMs de outros colegas na memória renderizada
function getAccessibleActivities() {
  const user = AppState.session?.user;
  if (!user) return [];
  if (user.role === 'Gerente') return AppState.activities;
  const myEmail = (user.email || '').toLowerCase();
  return AppState.activities.filter(a => (a.responsibleEmail || '').toLowerCase() === myEmail);
}

function getAccessibleRitms() {
  const user = AppState.session?.user;
  if (!user) return [];
  if (user.role === 'Gerente') return AppState.ritms;
  const myEmail = (user.email || '').toLowerCase();
  const mySystems = new Set(
    getAccessibleActivities().map(a => a.client + '::' + a.system.toLowerCase())
  );
  return AppState.ritms.filter(r =>
    (r.ownerEmail || '').toLowerCase() === myEmail ||
    mySystems.has(r.client + '::' + (r.system || '').toLowerCase())
  );
}

function getAccessibleExecNotes() {
  const user = AppState.session?.user;
  if (!user) return [];
  if (user.role === 'Gerente') return AppState.execNotes;
  const myActs = getAccessibleActivities();
  const myClients = new Set(myActs.map(a => a.client));
  const mySystems = new Set(myActs.map(a => a.system.toLowerCase()));
  return AppState.execNotes.filter(n =>
    n.client === 'Geral' ||
    (myClients.has(n.client) && (!n.system || mySystems.has(n.system.toLowerCase())))
  );
}

// Vigia manipulação manual do DOM no navegador caso colaborador tente abrir painel restrito
let domGuardObserver = null;
function initDomGuard() {
  if (domGuardObserver) return;
  const execForm = document.getElementById('exec-note-form');
  const homoBar = document.getElementById('homologation-bar');

  domGuardObserver = new MutationObserver(() => {
    const user = AppState.session?.user;
    if (execForm && (!user || user.role !== 'Gerente')) {
      if (!execForm.classList.contains('hidden') || execForm.style.display === 'block') {
        execForm.classList.add('hidden');
        execForm.style.display = '';
        console.warn('[DomGuard] Bloqueada tentativa de exibir formulário executivo para colaborador.');
      }
    }
    if (homoBar && AppState.session?.canSimulate !== true) {
      if (!homoBar.classList.contains('hidden') || homoBar.style.display === 'flex' || homoBar.style.display === 'block') {
        homoBar.classList.add('hidden');
        homoBar.style.display = '';
      }
    }
  });

  if (execForm) domGuardObserver.observe(execForm, { attributes: true, attributeFilter: ['class', 'style'] });
  if (homoBar) domGuardObserver.observe(homoBar, { attributes: true, attributeFilter: ['class', 'style'] });
}

// ========================
// BADGES, LOGOS & CORES DE STATUS
// ========================

// Se a logo (.webp) ou o fallback (.png) não estiver na pasta, cai num ponto colorido elegante sem quebrar layout
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

function getClientBadgeHtml(client, clientCustom) {
  const label = escapeHtml(client === 'Outro' ? (clientCustom || 'Outro') : client);
  const webpMap = { 'XP': 'logoxp.webp', 'Santander': 'logosantander.webp', 'Vivo': 'logovivo.webp' };
  const pngFallbacks = { 'XP': 'xp.png', 'Santander': 'santander.png', 'Vivo': 'vivo.png' };
  const dotMap = { 'XP': 'xp', 'Santander': 'santander', 'Vivo': 'vivo' };

  const logo = webpMap[client];
  const fallback = pngFallbacks[client] || '';
  const dot = dotMap[client] || 'outro';

  if (logo) {
    return '<span class="badge-client">' +
      '<img src="' + escapeHtml(logo) + '" alt="" data-fallback-src="' + escapeHtml(fallback) + '" data-client-class="' + escapeHtml(dot) + '" onerror="handleClientLogoError(this)">' +
      '<span>' + label + '</span></span>';
  }
  return '<span class="badge-client"><span class="client-dot ' + escapeHtml(dot) + '"></span><span>' + label + '</span></span>';
}

function getStatusBadgeHtml(status) {
  const clsMap = {
    'Concluído': 'st-concluido',
    'Em andamento': 'st-andamento',
    'Não iniciado': 'st-nao-iniciado',
    'Em atenção': 'st-atencao',
    'Atrasado': 'st-atrasado',
    'Bloqueado': 'st-bloqueado'
  };
  const cls = clsMap[status] || 'st-nao-iniciado';
  return '<span class="wbs-status-badge ' + cls + '">' + escapeHtml(status) + '</span>';
}

function getProgressFillClass(status) {
  if (status === 'Concluído') return 'status-done';
  if (status === 'Em atenção') return 'status-warn';
  if (status === 'Atrasado') return 'status-late';
  if (status === 'Bloqueado') return 'status-blocked';
  if (status === 'Não iniciado') return 'status-none';
  return '';
}

function getGanttBarClass(status) {
  const map = {
    'Concluído': 'bar-concluido',
    'Em andamento': 'bar-andamento',
    'Não iniciado': 'bar-nao-iniciado',
    'Em atenção': 'bar-atencao',
    'Atrasado': 'bar-atrasado',
    'Bloqueado': 'bar-bloqueado'
  };
  return map[status] || 'bar-nao-iniciado';
}

function getSeverityBadgeHtml(severity) {
  const s = String(severity || '');
  let cls = 'badge-p5';
  if (s.includes('P2') || s.includes('Alta')) cls = 'badge-p2';
  else if (s.includes('P3') || s.includes('Média')) cls = 'badge-p3';
  else if (s.includes('P4') || s.includes('Baixa')) cls = 'badge-p4';
  return '<span class="badge-severity ' + cls + '">' + escapeHtml(s) + '</span>';
}

// ========================
// SHOW APP & NAVEGAÇÃO POR 4 ABAS
// ========================

function showApp() {
  const user = AppState.session?.user;
  if (!user) return;

  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('app-shell').classList.remove('hidden');

  document.getElementById('header-username').textContent = user.name;
  document.getElementById('header-role').textContent = user.role;

  const isManager = user.role === 'Gerente';
  const greetingEl = document.getElementById('workspace-greeting');
  const contextEl = document.getElementById('workspace-context');
  const execForm = document.getElementById('exec-note-form');
  const homoBar = document.getElementById('homologation-bar');

  if (greetingEl) {
    greetingEl.textContent = isManager
      ? 'Painel Executivo — Governança e Cronograma'
      : 'Minhas Entregas — ' + user.name;
  }
  if (contextEl) {
    contextEl.textContent = isManager
      ? 'Visão consolidada multi-cliente (XP, Santander, Vivo) — Árvore em 3 Níveis & Hypercare'
      : 'Exibindo apenas atividades e chamados sob sua responsabilidade (' + user.email + ')';
  }
  if (execForm) {
    if (isManager) execForm.classList.remove('hidden');
    else execForm.classList.add('hidden');
  }
  if (homoBar) {
    if (AppState.session?.canSimulate === true) {
      homoBar.classList.remove('hidden');
      populateDebugSwitchUser();
    } else {
      homoBar.classList.add('hidden');
    }
  }

  // Data de referência inicial = hoje
  if (!AppState.referenceDate) {
    AppState.referenceDate = getTodayISO();
  }
  const refInput = document.getElementById('ref-date-input');
  if (refInput) refInput.value = AppState.referenceDate;

  renderWorkspace();
  renderNotifications();
  initDomGuard();
}

function switchWorkspaceTab(tab) {
  AppState.activeTab = tab;
  const tabs = ['overview', 'wbs', 'gantt', 'hypercare'];

  tabs.forEach(t => {
    const btn = document.getElementById('nav-tab-' + t);
    const panel = document.getElementById('panel-' + t);
    if (t === tab) {
      btn?.classList.add('active');
      panel?.classList.remove('hidden');
    } else {
      btn?.classList.remove('active');
      panel?.classList.add('hidden');
    }
  });

  // Ajusta controles de árvore visíveis (fazem sentido em Cronograma WBS e Gantt)
  const showTreeBtns = (tab === 'wbs' || tab === 'gantt');
  ['btn-expand-all', 'btn-collapse-micros', 'btn-collapse-systems'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('hidden', !showTreeBtns);
  });

  const showStatusControls = (tab !== 'hypercare');
  const stGroup = document.getElementById('filter-status-group');
  const treeRow = document.getElementById('tree-controls-row');
  if (stGroup) stGroup.classList.toggle('hidden', !showStatusControls);
  if (treeRow) treeRow.classList.toggle('hidden', !showStatusControls);

  hideGanttTooltip();
  renderActiveTab();
}

function handleRefDateChange() {
  const val = document.getElementById('ref-date-input')?.value;
  AppState.referenceDate = val || getTodayISO();
  renderActiveTab();
  if (AppState.activeTab === 'gantt') {
    showToast('Linha de corte atualizada para ' + formatDateBR(AppState.referenceDate), 'success');
  }
}

function printExecutiveReport() {
  const user = AppState.session?.user;
  const tabNames = {
    overview: 'Visão Geral Executiva',
    wbs: 'Cronograma',
    gantt: 'Gráfico de Gantt (Linha do Tempo)',
    hypercare: 'Hypercare & Validações'
  };
  const titleEl = document.getElementById('print-meta-title');
  const dateEl = document.getElementById('print-meta-date');
  if (titleEl) {
    titleEl.innerHTML = '<strong>Projetos Allan Santos</strong> — ' + escapeHtml(tabNames[AppState.activeTab] || '');
  }
  if (dateEl) {
    dateEl.textContent = 'Data de referência: ' + formatDateBR(AppState.referenceDate) +
      ' | Emitido por: ' + (user?.name || 'Sistema') + ' em ' + nowTimestamp();
  }
  window.print();
}

// ========================
// FILTROS & SUGESTÕES NATIVAS
// ========================

function populateFilterOptions() {
  const acts = getAccessibleActivities();
  const ritms = getAccessibleRitms();

  // Sistemas disponíveis tanto nas atividades quanto nos RITMs
  const systems = [...new Set([
    ...acts.map(a => a.system),
    ...ritms.map(r => r.system)
  ].filter(Boolean))].sort();

  const macros = [...new Set(acts.map(a => a.macro).filter(Boolean))].sort();
  const responsibles = [...new Set(acts.map(a => a.responsibleName).filter(Boolean))].sort();

  const sysSelect = document.getElementById('filter-system');
  if (sysSelect) {
    const cur = sysSelect.value;
    sysSelect.innerHTML = '<option value="">Todos</option>' +
      systems.map(s => '<option value="' + escapeHtml(s) + '">' + escapeHtml(s) + '</option>').join('');
    sysSelect.value = systems.includes(cur) ? cur : '';
  }

  const respSelect = document.getElementById('filter-responsible');
  if (respSelect) {
    const cur = respSelect.value;
    respSelect.innerHTML = '<option value="">Todos</option>' +
      responsibles.map(r => '<option value="' + escapeHtml(r) + '">' + escapeHtml(r) + '</option>').join('');
    respSelect.value = responsibles.includes(cur) ? cur : '';
  }

  // Alimenta datalists pros formulários nativos (evita digitar nomes duplicados)
  const dlSystems = document.getElementById('dl-systems');
  if (dlSystems) {
    dlSystems.innerHTML = systems.map(s => '<option value="' + escapeHtml(s) + '">').join('');
  }
  const dlMacros = document.getElementById('dl-macros');
  if (dlMacros) {
    dlMacros.innerHTML = macros.map(m => '<option value="' + escapeHtml(m) + '">').join('');
  }
  const dlUsers = document.getElementById('dl-users-names');
  if (dlUsers) {
    dlUsers.innerHTML = AppState.users.map(u => '<option value="' + escapeHtml(u.name) + '">').join('');
  }
}

function setFilterClient(client) {
  AppState.filters.client = client;
  document.querySelectorAll('#client-filter-buttons .client-filter-btn').forEach(btn => {
    const target = btn.getAttribute('onclick')?.match(/setFilterClient\('(.+?)'\)/)?.[1];
    btn.classList.toggle('active', target === client);
  });
  applyFilters();
}

function applyFilters() {
  AppState.filters.system = document.getElementById('filter-system')?.value || '';
  AppState.filters.status = document.getElementById('filter-status')?.value || '';
  AppState.filters.responsible = document.getElementById('filter-responsible')?.value || '';
  AppState.filters.search = (document.getElementById('filter-search')?.value || '').trim().toLowerCase();
  AppState.filters.hideDone = Boolean(document.getElementById('filter-hide-done')?.checked);

  renderWorkspaceCounts();
  renderActiveTab();
}

function clearFilters() {
  AppState.filters = {
    client: 'all',
    system: '',
    status: '',
    responsible: '',
    search: '',
    hideDone: false
  };
  ['filter-system', 'filter-status', 'filter-responsible', 'filter-search'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const hideCb = document.getElementById('filter-hide-done');
  if (hideCb) hideCb.checked = false;

  setFilterClient('all');
}

function getFilteredActivities() {
  const f = AppState.filters;
  return getAccessibleActivities().filter(a => {
    if (f.client !== 'all' && a.client !== f.client) return false;
    if (f.system && a.system !== f.system) return false;
    if (f.status && a.status !== f.status) return false;
    if (f.responsible && a.responsibleName !== f.responsible) return false;
    if (f.hideDone && (a.status === 'Concluído' || Number(a.progress) === 100)) return false;
    if (f.search) {
      const hay = [
        a.code, a.system, a.macro, a.title,
        a.responsibleName, a.area, a.notes, a.clientCustom
      ].join(' ').toLowerCase();
      if (!hay.includes(f.search)) return false;
    }
    return true;
  });
}

function getFilteredRitms() {
  const f = AppState.filters;
  return getAccessibleRitms().filter(r => {
    if (f.client !== 'all' && r.client !== f.client) return false;
    if (f.system && r.system !== f.system) return false;
    if (f.responsible && !(r.squad || '').toLowerCase().includes(f.responsible.toLowerCase())) return false;
    if (f.search) {
      const hay = [r.code, r.system, r.description, r.squad, r.action, r.status].join(' ').toLowerCase();
      if (!hay.includes(f.search)) return false;
    }
    return true;
  });
}

// ========================
// MOTOR DA ÁRVORE WBS EM 3 NÍVEIS (SISTEMA > MACRO > MICRO)
// ========================

function summarizeActivities(items) {
  const counts = {
    'Concluído': 0,
    'Em andamento': 0,
    'Não iniciado': 0,
    'Em atenção': 0,
    'Atrasado': 0,
    'Bloqueado': 0
  };
  let minStart = null;
  let maxEnd = null;
  let sumProg = 0;

  items.forEach(item => {
    const st = counts[item.status] !== undefined ? item.status : 'Não iniciado';
    counts[st]++;
    sumProg += (st === 'Concluído') ? 100 : (Number(item.progress) || 0);

    const effEnd = item.newEnd || item.endDate;
    if (item.startDate && (!minStart || item.startDate < minStart)) minStart = item.startDate;
    if (effEnd && (!maxEnd || effEnd > maxEnd)) maxEnd = effEnd;
  });

  const progress = items.length > 0 ? Math.round(sumProg / items.length) : 0;

  // Regra executiva de rollup de status do grupo pai
  let status = 'Não iniciado';
  if (items.length > 0 && counts['Concluído'] === items.length) status = 'Concluído';
  else if (counts['Bloqueado'] > 0) status = 'Bloqueado';
  else if (counts['Atrasado'] > 0) status = 'Atrasado';
  else if (counts['Em atenção'] > 0) status = 'Em atenção';
  else if (counts['Em andamento'] > 0 || counts['Concluído'] > 0) status = 'Em andamento';

  const duration = (minStart && maxEnd) ? Math.max(diffDaysUTC(minStart, maxEnd) + 1, 1) : 0;

  return { counts, minStart, maxEnd, progress, status, duration };
}

// Agrupa as microatividades planas numa árvore limpa Sistema -> Macro -> Micro
function buildWbsTree(activities) {
  const sysMap = new Map();

  activities.forEach(act => {
    const clientLabel = act.client === 'Outro' ? (act.clientCustom || 'Outro') : act.client;
    const sysKey = act.client + '|' + clientLabel + '::' + act.system;

    if (!sysMap.has(sysKey)) {
      sysMap.set(sysKey, {
        key: sysKey,
        client: act.client,
        clientCustom: act.clientCustom || '',
        clientLabel,
        system: act.system,
        macrosMap: new Map(),
        allMicros: []
      });
    }
    const sysNode = sysMap.get(sysKey);
    sysNode.allMicros.push(act);

    const macroKey = sysKey + '::' + act.macro;
    if (!sysNode.macrosMap.has(macroKey)) {
      sysNode.macrosMap.set(macroKey, {
        key: macroKey,
        macro: act.macro,
        micros: []
      });
    }
    sysNode.macrosMap.get(macroKey).micros.push(act);
  });

  const systems = [];
  sysMap.forEach(sys => {
    const macros = [];
    sys.macrosMap.forEach(mac => {
      mac.micros.sort((a, b) => (a.startDate || '').localeCompare(b.startDate || '') || (a.code || '').localeCompare(b.code || ''));
      macros.push({
        key: mac.key,
        macro: mac.macro,
        micros: mac.micros,
        summary: summarizeActivities(mac.micros)
      });
    });
    macros.sort((a, b) => a.macro.localeCompare(b.macro));

    systems.push({
      key: sys.key,
      client: sys.client,
      clientCustom: sys.clientCustom,
      clientLabel: sys.clientLabel,
      system: sys.system,
      macros,
      allMicros: sys.allMicros,
      summary: summarizeActivities(sys.allMicros)
    });
  });

  systems.sort((a, b) => a.clientLabel.localeCompare(b.clientLabel) || a.system.localeCompare(b.system));
  return systems;
}

// Controles de expandir / recolher em massa (sincronizados entre WBS e Gantt)
function toggleSystemNode(sysKey) {
  if (AppState.collapsedSystems.has(sysKey)) {
    AppState.collapsedSystems.delete(sysKey);
  } else {
    AppState.collapsedSystems.add(sysKey);
  }
  renderActiveTab();
}

function toggleMacroNode(macroKey) {
  if (AppState.collapsedMacros.has(macroKey)) {
    AppState.collapsedMacros.delete(macroKey);
  } else {
    AppState.collapsedMacros.add(macroKey);
  }
  renderActiveTab();
}

function expandAllNodes() {
  AppState.collapsedSystems.clear();
  AppState.collapsedMacros.clear();
  renderActiveTab();
}

function collapseMicros() {
  AppState.collapsedSystems.clear();
  const tree = buildWbsTree(getFilteredActivities());
  AppState.collapsedMacros.clear();
  tree.forEach(sys => {
    sys.macros.forEach(mac => AppState.collapsedMacros.add(mac.key));
  });
  renderActiveTab();
}

function collapseSystems() {
  const tree = buildWbsTree(getFilteredActivities());
  AppState.collapsedSystems.clear();
  tree.forEach(sys => AppState.collapsedSystems.add(sys.key));
  renderActiveTab();
}

// ========================
// RENDERIZAÇÃO DO WORKSPACE
// ========================

function renderWorkspace() {
  populateFilterOptions();
  renderWorkspaceCounts();
  switchWorkspaceTab(AppState.activeTab);
}

function renderWorkspaceCounts() {
  const filteredActs = getFilteredActivities();
  const filteredRitms = getFilteredRitms();

  const elOverview = document.getElementById('count-tab-overview');
  const elWbs = document.getElementById('count-tab-wbs');
  const elHyp = document.getElementById('count-tab-hypercare');
  if (elOverview) elOverview.textContent = filteredActs.length;
  if (elWbs) elWbs.textContent = filteredActs.length;
  if (elHyp) elHyp.textContent = filteredRitms.length;
}

function renderActiveTab() {
  renderWorkspaceCounts();
  if (AppState.activeTab === 'overview') renderOverviewTab();
  else if (AppState.activeTab === 'wbs') renderWbsTab();
  else if (AppState.activeTab === 'gantt') renderGanttTab();
  else if (AppState.activeTab === 'hypercare') renderHypercareTab();
}

function buildEmptyStateHtml(isFiltered) {
  const title = isFiltered
    ? 'Nenhuma atividade encontrada neste filtro'
    : 'Nenhuma atividade ou frente cadastrada';
  const text = isFiltered
    ? 'Ajuste os filtros acima ou clique em "Limpar filtros" para visualizar todo o cronograma.'
    : 'A base está pronta para receber seu cronograma em 3 níveis (Sistema, Macroatividade e Microatividade).';
  const actionBtn = isFiltered
    ? '<button type="button" class="btn-secondary" onclick="clearFilters()">Limpar filtros</button>'
    : '<button type="button" class="btn-primary" onclick="openNewActivityModal()">+ Cadastrar Primeira Atividade / Frente</button>';

  return '<svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' +
    '<rect x="3" y="4" width="18" height="16" rx="2"/>' +
    '<path d="M3 10h18M9 20V10"/>' +
    '</svg>' +
    '<div class="empty-state-title">' + title + '</div>' +
    '<div class="empty-state-text">' + text + '</div>' +
    actionBtn;
}

// ========================
// ABA 1: VISÃO GERAL
// ========================

function renderOverviewTab() {
  const acts = getFilteredActivities();
  const hasAnyInBase = getAccessibleActivities().length > 0;
  const summary = summarizeActivities(acts);
  const total = acts.length;
  const pctOf = (n) => (total > 0 ? Math.round((n / total) * 100) + '% do plano' : '0% do plano');
  const reprogrammed = acts.filter(a => a.endDate && a.newEnd && a.endDate !== a.newEnd).length;
  const criticalCount = summary.counts['Atrasado'] + summary.counts['Bloqueado'];

  const setTxt = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
  setTxt('kpi-progress', summary.progress + '%');
  setTxt('kpi-total-sub', total + (total === 1 ? ' atividade' : ' atividades'));
  setTxt('kpi-done', summary.counts['Concluído']);
  setTxt('kpi-done-pct', pctOf(summary.counts['Concluído']));
  setTxt('kpi-inprog', summary.counts['Em andamento']);
  setTxt('kpi-inprog-pct', pctOf(summary.counts['Em andamento']));
  setTxt('kpi-notstarted', summary.counts['Não iniciado']);
  setTxt('kpi-notstarted-pct', pctOf(summary.counts['Não iniciado']));
  setTxt('kpi-attention', summary.counts['Em atenção']);
  setTxt('kpi-reprogrammed-sub', reprogrammed + (reprogrammed === 1 ? ' reprogramada' : ' reprogramadas'));
  setTxt('kpi-critical', criticalCount);
  setTxt('kpi-critical-sub', summary.counts['Atrasado'] + ' atrasada(s) • ' + summary.counts['Bloqueado'] + ' bloqueada(s)');

  const contentEl = document.getElementById('overview-content');
  const emptyEl = document.getElementById('overview-empty');
  if (total === 0) {
    contentEl?.classList.add('hidden');
    if (emptyEl) {
      emptyEl.innerHTML = buildEmptyStateHtml(hasAnyInBase);
      emptyEl.classList.remove('hidden');
    }
    return;
  }

  emptyEl?.classList.add('hidden');
  contentEl?.classList.remove('hidden');

  // Resumo por Cliente
  const clientGroups = new Map();
  acts.forEach(a => {
    const label = a.client === 'Outro' ? (a.clientCustom || 'Outro') : a.client;
    const key = a.client + '|' + label;
    if (!clientGroups.has(key)) clientGroups.set(key, { client: a.client, clientCustom: a.clientCustom, items: [] });
    clientGroups.get(key).items.push(a);
  });

  const clientsGrid = document.getElementById('overview-clients-grid');
  if (clientsGrid) {
    clientsGrid.innerHTML = [...clientGroups.values()].map(g => {
      const s = summarizeActivities(g.items);
      const fill = getProgressFillClass(s.status);
      return '<div class="summary-card">' +
        '<div class="summary-card-top">' +
          getClientBadgeHtml(g.client, g.clientCustom) +
          '<span class="summary-card-pct font-mono tabular-nums">' + Number(s.progress) + '%</span>' +
        '</div>' +
        '<div class="progress-bar-track"><div class="progress-bar-fill ' + escapeHtml(fill) + '" style="width:' + Number(s.progress) + '%"></div></div>' +
        '<div class="summary-card-meta">' +
          '<span><strong>' + Number(g.items.length) + '</strong> entregas</span>' +
          '<span>Concluídas: <strong>' + Number(s.counts['Concluído']) + '</strong></span>' +
          '<span>Críticas: <strong>' + Number(s.counts['Atrasado'] + s.counts['Bloqueado']) + '</strong></span>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  // Resumo por Sistema / Módulo
  const systemsTree = buildWbsTree(acts);
  const sysGrid = document.getElementById('overview-systems-grid');
  if (sysGrid) {
    sysGrid.innerHTML = systemsTree.map(sys => {
      const s = sys.summary;
      const fill = getProgressFillClass(s.status);
      return '<div class="summary-card clickable" data-client="' + escapeHtml(sys.client) + '" data-system="' + escapeHtml(sys.system) + '" onclick="jumpToModule(this.dataset.client, this.dataset.system)">' +
        '<div class="summary-card-top">' +
          '<div>' +
            getClientBadgeHtml(sys.client, sys.clientCustom) +
            '<div class="summary-card-title" style="margin-top:6px;">' + escapeHtml(sys.system) + '</div>' +
          '</div>' +
          '<span class="summary-card-pct font-mono tabular-nums">' + Number(s.progress) + '%</span>' +
        '</div>' +
        '<div class="progress-bar-track"><div class="progress-bar-fill ' + escapeHtml(fill) + '" style="width:' + Number(s.progress) + '%"></div></div>' +
        '<div class="summary-card-meta">' +
          '<span><strong>' + Number(sys.macros.length) + '</strong> macro(s)</span>' +
          '<span><strong>' + Number(sys.allMicros.length) + '</strong> micro(s)</span>' +
          '<span>' + getStatusBadgeHtml(s.status) + '</span>' +
        '</div>' +
      '</div>';
    }).join('');
  }
}

function jumpToModule(client, system) {
  setFilterClient(client);
  const sysSelect = document.getElementById('filter-system');
  if (sysSelect) sysSelect.value = system;
  AppState.filters.system = system;
  switchWorkspaceTab('wbs');
}

// ========================
// ABA 2: CRONOGRAMA WBS (3 NÍVEIS)
// ========================

function renderWbsTab() {
  const tbody = document.getElementById('tbody-wbs');
  const countEl = document.getElementById('wbs-count');
  if (!tbody) return;

  const acts = getFilteredActivities();
  const hasAnyInBase = getAccessibleActivities().length > 0;

  if (countEl) {
    countEl.textContent = acts.length + (acts.length === 1 ? ' microatividade' : ' microatividades');
  }

  if (acts.length === 0) {
    tbody.innerHTML = '<tr><td colspan="10" style="padding:18px;">' +
      '<div class="empty-state" style="border:none;">' + buildEmptyStateHtml(hasAnyInBase) + '</div>' +
      '</td></tr>';
    return;
  }

  const tree = buildWbsTree(acts);
  const rows = [];

  tree.forEach(sys => {
    const sysCollapsed = AppState.collapsedSystems.has(sys.key);
    const s = sys.summary;

    // Nível 1: Sistema / Módulo
    rows.push(
      '<tr class="wbs-row-l1">' +
        '<td>' +
          '<div class="wbs-cell-l1">' +
            '<button type="button" class="wbs-toggle-btn" data-sys-key="' + escapeHtml(sys.key) + '" onclick="toggleSystemNode(this.dataset.sysKey)">' + (sysCollapsed ? '&#9654;' : '&#9660;') + '</button>' +
            '<span>' + escapeHtml(sys.system) + '</span>' +
            '<span class="wbs-count-pill">' + Number(sys.allMicros.length) + ' micro' + (sys.allMicros.length > 1 ? 's' : '') + '</span>' +
          '</div>' +
        '</td>' +
        '<td>' + getClientBadgeHtml(sys.client, sys.clientCustom) + '</td>' +
        '<td style="color:#64748B;">—</td>' +
        '<td class="font-mono tabular-nums">' + escapeHtml(formatDateBR(s.minStart)) + '</td>' +
        '<td class="font-mono tabular-nums">' + escapeHtml(formatDateBR(s.maxEnd)) + '</td>' +
        '<td>—</td>' +
        '<td class="font-mono tabular-nums">' + Number(s.duration) + 'd</td>' +
        '<td>' + renderProgressCell(s.progress, s.status) + '</td>' +
        '<td>' + getStatusBadgeHtml(s.status) + '</td>' +
        '<td class="no-print" style="text-align:right;color:#94A3B8;font-size:10.5px;">Nível 1</td>' +
      '</tr>'
    );

    if (sysCollapsed) return;

    sys.macros.forEach(mac => {
      const macCollapsed = AppState.collapsedMacros.has(mac.key);
      const m = mac.summary;

      // Nível 2: Macroatividade
      rows.push(
        '<tr class="wbs-row-l2">' +
          '<td>' +
            '<div class="wbs-cell-l2">' +
              '<button type="button" class="wbs-toggle-btn" data-mac-key="' + escapeHtml(mac.key) + '" onclick="toggleMacroNode(this.dataset.macKey)">' + (macCollapsed ? '&#9654;' : '&#9660;') + '</button>' +
              '<span>' + escapeHtml(mac.macro) + '</span>' +
              '<span class="wbs-count-pill">' + Number(mac.micros.length) + ' micro' + (mac.micros.length > 1 ? 's' : '') + '</span>' +
            '</div>' +
          '</td>' +
          '<td>' + getClientBadgeHtml(sys.client, sys.clientCustom) + '</td>' +
          '<td style="color:#64748B;">—</td>' +
          '<td class="font-mono tabular-nums">' + escapeHtml(formatDateBR(m.minStart)) + '</td>' +
          '<td class="font-mono tabular-nums">' + escapeHtml(formatDateBR(m.maxEnd)) + '</td>' +
          '<td>—</td>' +
          '<td class="font-mono tabular-nums">' + Number(m.duration) + 'd</td>' +
          '<td>' + renderProgressCell(m.progress, m.status) + '</td>' +
          '<td>' + getStatusBadgeHtml(m.status) + '</td>' +
          '<td class="no-print" style="text-align:right;color:#94A3B8;font-size:10.5px;">Nível 2</td>' +
        '</tr>'
      );

      if (macCollapsed) return;

      // Nível 3: Microatividade
      mac.micros.forEach(act => {
        const effEnd = act.newEnd || act.endDate;
        const dur = (act.startDate && effEnd) ? Math.max(diffDaysUTC(act.startDate, effEnd) + 1, 1) : 0;
        const hasVariance = act.endDate && act.newEnd && act.endDate !== act.newEnd;
        const newEndHtml = hasVariance
          ? '<span class="variance-tag font-mono tabular-nums" title="Prazo reprogramado">' + escapeHtml(formatDateBR(act.newEnd)) + ' &#916;</span>'
          : (act.newEnd ? '<span class="font-mono tabular-nums">' + escapeHtml(formatDateBR(act.newEnd)) + '</span>' : '<span style="color:#94A3B8;">—</span>');

        const prog = act.status === 'Concluído' ? 100 : (Number(act.progress) || 0);

        rows.push(
          '<tr class="wbs-row-l3">' +
            '<td>' +
              '<div class="wbs-cell-l3">' +
                '<span class="wbs-id-pill">' + escapeHtml(act.code) + '</span>' +
                '<span title="' + escapeHtml(act.notes || act.title) + '">' + escapeHtml(act.title) + '</span>' +
              '</div>' +
            '</td>' +
            '<td>' + getClientBadgeHtml(act.client, act.clientCustom) + '</td>' +
            '<td>' +
              '<div>' + escapeHtml(act.responsibleName) + '</div>' +
              (act.area ? '<div style="font-size:10px;color:#64748B;">' + escapeHtml(act.area) + '</div>' : '') +
            '</td>' +
            '<td class="font-mono tabular-nums" style="white-space:nowrap;">' + escapeHtml(formatDateBR(act.startDate)) + '</td>' +
            '<td class="font-mono tabular-nums" style="white-space:nowrap;color:#64748B;">' + escapeHtml(formatDateBR(act.endDate)) + '</td>' +
            '<td style="white-space:nowrap;">' + newEndHtml + '</td>' +
            '<td class="font-mono tabular-nums">' + Number(dur) + 'd</td>' +
            '<td>' + renderProgressCell(prog, act.status) + '</td>' +
            '<td>' + getStatusBadgeHtml(act.status) + '</td>' +
            '<td class="no-print" style="text-align:right;white-space:nowrap;">' +
              '<button type="button" class="btn-secondary btn-xs" data-act-id="' + escapeHtml(act.id) + '" onclick="openEditActivityModal(this.dataset.actId)">Editar</button>' +
            '</td>' +
          '</tr>'
        );
      });
    });
  });

  tbody.innerHTML = rows.join('');
}

function renderProgressCell(pct, status) {
  const fill = getProgressFillClass(status);
  return '<div style="display:flex;align-items:center;gap:6px;min-width:92px;">' +
    '<div class="progress-bar-track" style="flex:1;"><div class="progress-bar-fill ' + escapeHtml(fill) + '" style="width:' + Number(pct) + '%"></div></div>' +
    '<span class="font-mono tabular-nums" style="font-size:11px;font-weight:700;min-width:32px;text-align:right;">' + Number(pct) + '%</span>' +
    '</div>';
}

// ========================
// ABA 3: GRÁFICO DE GANTT + LINHA DE CORTE + TOOLTIP
// ========================

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
  let timelineEndISO = addDaysISO(maxISO, 4);
  const totalSpanDays = diffDaysUTC(timelineStartISO, timelineEndISO) + 1;

  // Trava pra evitar travar o navegador se alguém cadastrar datas distantes tipo 2020 -> 2035
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
          '<span class="client-dot ' + escapeHtml(sys.client === 'XP' ? 'xp' : (sys.client === 'Santander' ? 'santander' : (sys.client === 'Vivo' ? 'vivo' : 'outro'))) + '"></span>' +
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

// ========================
// ABA 4: HYPERCARE & VALIDAÇÕES
// ========================

function renderHypercareTab() {
  renderRitmsTable();
  renderExecNotes();
}

function renderRitmsTable() {
  const tbody = document.getElementById('tbody-ritms');
  if (!tbody) return;

  const ritms = getFilteredRitms();
  if (ritms.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="padding:28px;text-align:center;color:#64748B;">' +
      '<div style="font-weight:700;color:#334155;margin-bottom:4px;">Nenhum chamado Hypercare registrado</div>' +
      '<div style="font-size:11.5px;margin-bottom:12px;">Registre defeitos ou solicitações vinculados aos módulos do projeto.</div>' +
      '<button type="button" class="btn-primary btn-sm" onclick="openNewRitmModal()">+ Novo Chamado</button>' +
      '</td></tr>';
    return;
  }

  const statuses = ['Em análise', 'Chamado SAP', 'Pendente', 'Concluído'];

  tbody.innerHTML = ritms.map(r => {
    const canEdit = isOwnerOrManager(r.ownerEmail);
    const statusControl = canEdit
      ? '<select class="ritm-status-select" data-ritm-uid="' + escapeHtml(r.uid) + '" onchange="updateRitmStatus(this.dataset.ritmUid, this.value)">' +
          statuses.map(s => '<option value="' + escapeHtml(s) + '"' + (r.status === s ? ' selected' : '') + '>' + escapeHtml(s) + '</option>').join('') +
        '</select>'
      : '<span class="wbs-status-badge st-nao-iniciado">' + escapeHtml(r.status) + '</span>';

    return '<tr>' +
      '<td class="font-mono tabular-nums" style="font-weight:700;white-space:nowrap;">' + escapeHtml(r.code) + '</td>' +
      '<td>' +
        '<div style="display:flex;flex-direction:column;gap:2px;">' +
          getClientBadgeHtml(r.client, '') +
          '<span style="font-size:11px;font-weight:600;color:#334155;">' + escapeHtml(r.system) + '</span>' +
        '</div>' +
      '</td>' +
      '<td>' +
        '<div style="font-weight:600;color:#0F172A;">' + escapeHtml(r.description) + '</div>' +
        (r.action ? '<div style="font-size:10.5px;color:#64748B;margin-top:2px;">Ação: ' + escapeHtml(r.action) + '</div>' : '') +
      '</td>' +
      '<td>' + getSeverityBadgeHtml(r.severity) + '</td>' +
      '<td>' + escapeHtml(r.squad) + '</td>' +
      '<td>' + statusControl + '</td>' +
      '<td class="no-print" style="text-align:right;white-space:nowrap;">' +
        (canEdit ? '<button type="button" class="btn-secondary btn-xs" data-ritm-uid="' + escapeHtml(r.uid) + '" onclick="openEditRitmModal(this.dataset.ritmUid)">Editar</button>' : '—') +
      '</td>' +
    '</tr>';
  }).join('');
}

function renderExecNotes() {
  const listEl = document.getElementById('exec-notes-list');
  if (!listEl) return;

  const isManager = checkAccessPermission('Gerente');
  const notes = getAccessibleExecNotes();

  if (notes.length === 0) {
    listEl.innerHTML = '<div style="text-align:center;padding:24px 12px;color:#94A3B8;font-size:12px;">' +
      (isManager ? 'Nenhuma cobrança ou validação registrada.' : 'Nenhuma cobrança executiva vinculada às suas frentes.') +
      '</div>';
    return;
  }

  listEl.innerHTML = notes.map(n =>
    '<div class="exec-note-item">' +
      '<div class="exec-note-header">' +
        '<span><strong>' + escapeHtml(n.author) + '</strong> &bull; ' + escapeHtml(n.client) + (n.system ? ' / ' + escapeHtml(n.system) : '') + '</span>' +
        '<span>' + escapeHtml(n.timestamp) + (isManager ? ' <button type="button" class="btn-icon" style="padding:1px 4px;color:#DC2626;" data-note-id="' + escapeHtml(n.id) + '" onclick="deleteExecNote(this.dataset.noteId)" title="Excluir cobrança">&times;</button>' : '') + '</span>' +
      '</div>' +
      '<div class="exec-note-text">' + escapeHtml(n.text) + '</div>' +
    '</div>'
  ).join('');
}

function handleSaveExecNote(e) {
  e.preventDefault();
  // Trava RBAC: só gerente registra cobrança executiva
  if (!checkAccessPermission('Gerente')) {
    showToast('Apenas o gerente pode registrar cobranças executivas.', 'error');
    return;
  }

  const client = document.getElementById('exec-note-client').value;
  const system = document.getElementById('exec-note-system').value.trim();
  const text = document.getElementById('exec-note-text').value.trim();
  if (!text) return;

  const user = AppState.session.user;
  AppState.execNotes.unshift({
    id: generateId('note'),
    client,
    system,
    text,
    author: user.name,
    timestamp: nowTimestamp()
  });
  saveState();

  document.getElementById('exec-note-text').value = '';
  document.getElementById('exec-note-system').value = '';
  renderExecNotes();

  addNotification('exec_note', 'Cobrança executiva de ' + user.name + ' (' + client + (system ? ' / ' + system : '') + '): ' + text.substring(0, 60));
  showToast('Cobrança executiva registrada.', 'success');
}

function deleteExecNote(noteId) {
  if (!checkAccessPermission('Gerente')) {
    showToast('Apenas o gerente pode excluir cobranças.', 'error');
    return;
  }
  AppState.execNotes = AppState.execNotes.filter(n => n.id !== noteId);
  saveState();
  renderExecNotes();
}

// ========================
// MODAL DE ATIVIDADE WBS (CRIAR / EDITAR)
// ========================

function toggleActCustomClient() {
  const client = document.getElementById('act-client').value;
  document.getElementById('act-client-custom-group').classList.toggle('hidden', client !== 'Outro');
}

function syncResponsibleEmailFromName() {
  const nameInput = document.getElementById('act-resp-name');
  const emailInput = document.getElementById('act-resp-email');
  if (!nameInput || !emailInput || emailInput.readOnly) return;

  const match = AppState.users.find(u => u.name.toLowerCase() === nameInput.value.trim().toLowerCase());
  if (match) emailInput.value = match.email;
}

function syncProgressFromStatus() {
  const status = document.getElementById('act-status').value;
  const progEl = document.getElementById('act-progress');
  const valEl = document.getElementById('act-progress-val');
  if (!progEl || !valEl) return;

  if (status === 'Concluído') {
    progEl.value = 100;
    valEl.textContent = '100%';
  } else if (status === 'Não iniciado') {
    progEl.value = 0;
    valEl.textContent = '0%';
  } else if (Number(progEl.value) === 0 || Number(progEl.value) === 100) {
    progEl.value = 50;
    valEl.textContent = '50%';
  }
}

function nextActivityCode() {
  let maxNum = 0;
  AppState.activities.forEach(a => {
    const m = (a.code || '').match(/^AT-(\d+)$/i);
    if (m) maxNum = Math.max(maxNum, Number(m[1]));
  });
  return 'AT-' + String(maxNum + 1).padStart(3, '0');
}

function openNewActivityModal() {
  const user = AppState.session?.user;
  if (!user) return;

  populateFilterOptions();
  document.getElementById('activity-form').reset();
  document.getElementById('act-edit-id').value = '';
  document.getElementById('modal-activity-title').textContent = 'Novo Cadastro — Atividade';
  document.getElementById('act-delete-btn').classList.add('hidden');

  const today = AppState.referenceDate || getTodayISO();
  document.getElementById('act-start').value = today;
  document.getElementById('act-end').value = addDaysISO(today, 7);
  document.getElementById('act-progress').value = 0;
  document.getElementById('act-progress-val').textContent = '0%';

  if (AppState.filters.client !== 'all') {
    document.getElementById('act-client').value = AppState.filters.client;
  }
  toggleActCustomClient();

  const nameEl = document.getElementById('act-resp-name');
  const emailEl = document.getElementById('act-resp-email');
  if (user.role === 'Colaborador') {
    nameEl.value = user.name;
    emailEl.value = user.email;
    nameEl.readOnly = true;
    emailEl.readOnly = true;
  } else {
    nameEl.readOnly = false;
    emailEl.readOnly = false;
  }

  document.getElementById('modal-activity').classList.add('open');
}

function openEditActivityModal(actId) {
  const act = AppState.activities.find(a => a.id === actId);
  const user = AppState.session?.user;
  if (!act || !user) return;

  // Anti-IDOR: colaborador não edita entrega de colega
  if (!isOwnerOrManager(act.responsibleEmail)) {
    showToast('Sem permissão para editar atividades de outro responsável.', 'error');
    return;
  }

  populateFilterOptions();
  document.getElementById('act-edit-id').value = act.id;
  document.getElementById('modal-activity-title').textContent = 'Editar Atividade (' + act.code + ')';
  document.getElementById('act-delete-btn').classList.remove('hidden');

  document.getElementById('act-client').value = act.client;
  document.getElementById('act-client-custom').value = act.clientCustom || '';
  toggleActCustomClient();

  document.getElementById('act-system').value = act.system;
  document.getElementById('act-macro').value = act.macro;
  document.getElementById('act-code').value = act.code;
  document.getElementById('act-title').value = act.title;

  const nameEl = document.getElementById('act-resp-name');
  const emailEl = document.getElementById('act-resp-email');
  nameEl.value = act.responsibleName;
  emailEl.value = act.responsibleEmail;
  nameEl.readOnly = (user.role !== 'Gerente');
  emailEl.readOnly = (user.role !== 'Gerente');

  document.getElementById('act-start').value = act.startDate;
  document.getElementById('act-end').value = act.endDate;
  document.getElementById('act-new-end').value = act.newEnd || '';
  document.getElementById('act-status').value = act.status;
  const prog = act.status === 'Concluído' ? 100 : (Number(act.progress) || 0);
  document.getElementById('act-progress').value = prog;
  document.getElementById('act-progress-val').textContent = prog + '%';
  document.getElementById('act-notes').value = act.notes || '';

  document.getElementById('modal-activity').classList.add('open');
}

function handleSaveActivity(e) {
  e.preventDefault();
  const user = AppState.session?.user;
  if (!user) return;

  const editId = document.getElementById('act-edit-id').value;
  const client = document.getElementById('act-client').value;
  const clientCustom = document.getElementById('act-client-custom').value.trim();
  const system = document.getElementById('act-system').value.trim();
  const macro = document.getElementById('act-macro').value.trim();
  const codeInput = document.getElementById('act-code').value.trim();
  const title = document.getElementById('act-title').value.trim();
  let responsibleName = document.getElementById('act-resp-name').value.trim();
  let responsibleEmail = document.getElementById('act-resp-email').value.trim();
  const startDate = document.getElementById('act-start').value;
  const endDate = document.getElementById('act-end').value;
  const newEnd = document.getElementById('act-new-end').value;
  const status = document.getElementById('act-status').value;
  let progress = Number(document.getElementById('act-progress').value) || 0;
  const notes = document.getElementById('act-notes').value.trim();

  if (client === 'Outro' && !clientCustom) {
    showToast('Informe o nome do cliente.', 'error');
    return;
  }
  if (diffDaysUTC(startDate, endDate) < 0) {
    showToast('A data fim planejada não pode ser anterior ao início.', 'error');
    return;
  }
  if (newEnd && diffDaysUTC(startDate, newEnd) < 0) {
    showToast('A nova data fim não pode ser anterior ao início.', 'error');
    return;
  }

  // Colaborador só grava atividade em seu próprio nome/e-mail
  if (user.role !== 'Gerente') {
    responsibleName = user.name;
    responsibleEmail = user.email;
  }
  if (status === 'Concluído') progress = 100;

  if (editId) {
    const existing = AppState.activities.find(a => a.id === editId);
    if (!existing) return;
    if (!isOwnerOrManager(existing.responsibleEmail)) {
      showToast('Sem permissão para salvar alterações nesta atividade.', 'error');
      return;
    }
    Object.assign(existing, {
      client,
      clientCustom: client === 'Outro' ? clientCustom : '',
      system,
      macro,
      code: codeInput || existing.code,
      title,
      responsibleName,
      responsibleEmail,
      startDate,
      endDate,
      newEnd,
      status,
      progress,
      notes
    });
    addNotification('activity_update', user.name + ' atualizou ' + existing.code + ' (' + status + ' - ' + progress + '%).', existing.id, existing.responsibleEmail);
    showToast('Atividade ' + existing.code + ' atualizada!', 'success');
  } else {
    const newCode = codeInput || nextActivityCode();
    const newAct = {
      id: generateId('act'),
      code: newCode,
      client,
      clientCustom: client === 'Outro' ? clientCustom : '',
      system,
      macro,
      title,
      responsibleName,
      responsibleEmail,
      startDate,
      endDate,
      newEnd,
      status,
      progress,
      notes,
      createdBy: user.username,
      createdAt: getTodayISO()
    };
    AppState.activities.push(newAct);
    addNotification('activity_new', user.name + ' cadastrou ' + newCode + ': ' + title + ' (' + system + ').', newAct.id, newAct.responsibleEmail);
    showToast('Atividade ' + newCode + ' cadastrada!', 'success');
  }

  saveState();
  closeModal('modal-activity');
  populateFilterOptions();
  renderActiveTab();
}

function deleteActivityFromModal() {
  const editId = document.getElementById('act-edit-id').value;
  if (!editId) return;
  const act = AppState.activities.find(a => a.id === editId);
  if (!act) return;

  if (!isOwnerOrManager(act.responsibleEmail)) {
    showToast('Sem permissão para excluir esta atividade.', 'error');
    return;
  }
  if (!confirm('Excluir a atividade "' + act.code + ' — ' + act.title + '"?')) return;

  AppState.activities = AppState.activities.filter(a => a.id !== editId);
  saveState();
  closeModal('modal-activity');
  populateFilterOptions();
  renderActiveTab();
  showToast('Atividade ' + act.code + ' excluída.', '');
}

// ========================
// MODAL DE CHAMADO HYPERCARE (RITM)
// ========================

function openNewRitmModal() {
  const user = AppState.session?.user;
  if (!user) return;

  populateFilterOptions();
  document.getElementById('ritm-form').reset();
  document.getElementById('ritm-edit-uid').value = '';
  document.getElementById('modal-ritm-title').textContent = 'Registrar Chamado / Defeito (Hypercare)';
  document.getElementById('ritm-delete-btn').classList.add('hidden');

  if (AppState.filters.client !== 'all') {
    document.getElementById('ritm-client').value = AppState.filters.client;
  }
  if (AppState.filters.system) {
    document.getElementById('ritm-system').value = AppState.filters.system;
  }

  const emailEl = document.getElementById('ritm-owner-email');
  emailEl.value = user.email;
  emailEl.readOnly = (user.role !== 'Gerente');

  document.getElementById('modal-ritm').classList.add('open');
}

function openEditRitmModal(uid) {
  const ritm = AppState.ritms.find(r => r.uid === uid);
  const user = AppState.session?.user;
  if (!ritm || !user) return;

  if (!isOwnerOrManager(ritm.ownerEmail)) {
    showToast('Sem permissão para editar este chamado.', 'error');
    return;
  }

  populateFilterOptions();
  document.getElementById('ritm-edit-uid').value = ritm.uid;
  document.getElementById('modal-ritm-title').textContent = 'Editar Chamado (' + ritm.code + ')';
  document.getElementById('ritm-delete-btn').classList.remove('hidden');

  document.getElementById('ritm-client').value = ritm.client;
  document.getElementById('ritm-system').value = ritm.system;
  document.getElementById('ritm-code').value = ritm.code;
  document.getElementById('ritm-severity').value = ritm.severity;
  document.getElementById('ritm-desc').value = ritm.description;
  document.getElementById('ritm-squad').value = ritm.squad;
  document.getElementById('ritm-status').value = ritm.status;
  document.getElementById('ritm-action').value = ritm.action || '';

  const emailEl = document.getElementById('ritm-owner-email');
  emailEl.value = ritm.ownerEmail || '';
  emailEl.readOnly = (user.role !== 'Gerente');

  document.getElementById('modal-ritm').classList.add('open');
}

function handleSaveRitm(e) {
  e.preventDefault();
  const user = AppState.session?.user;
  if (!user) return;

  const editUid = document.getElementById('ritm-edit-uid').value;
  const client = document.getElementById('ritm-client').value;
  const system = document.getElementById('ritm-system').value.trim();
  const code = document.getElementById('ritm-code').value.trim();
  const severity = document.getElementById('ritm-severity').value;
  const description = document.getElementById('ritm-desc').value.trim();
  const squad = document.getElementById('ritm-squad').value.trim();
  const status = document.getElementById('ritm-status').value;
  const action = document.getElementById('ritm-action').value.trim();
  const ownerEmail = user.role === 'Gerente'
    ? document.getElementById('ritm-owner-email').value.trim()
    : user.email;

  if (editUid) {
    const existing = AppState.ritms.find(r => r.uid === editUid);
    if (!existing) return;
    if (!isOwnerOrManager(existing.ownerEmail)) {
      showToast('Sem permissão para alterar este chamado.', 'error');
      return;
    }
    Object.assign(existing, { client, system, code, severity, description, squad, status, action, ownerEmail });
    addNotification('ritm_update', user.name + ' atualizou o chamado ' + code + ' (' + status + ').', null, ownerEmail);
    showToast('Chamado ' + code + ' atualizado!', 'success');
  } else {
    AppState.ritms.push({
      uid: generateId('ritm'),
      client,
      system,
      code,
      severity,
      description,
      squad,
      status,
      action,
      ownerEmail,
      createdAt: getTodayISO()
    });
    addNotification('ritm_new', user.name + ' abriu chamado ' + code + ' em ' + system + ' (' + severity + ').', null, ownerEmail);
    showToast('Chamado ' + code + ' registrado!', 'success');
  }

  saveState();
  closeModal('modal-ritm');
  populateFilterOptions();
  renderWorkspaceCounts();
  renderHypercareTab();
}

function updateRitmStatus(uid, newStatus) {
  const ritm = AppState.ritms.find(r => r.uid === uid);
  const user = AppState.session?.user;
  if (!ritm || !user) return;

  if (!isOwnerOrManager(ritm.ownerEmail)) {
    showToast('Sem permissão para atualizar este chamado.', 'error');
    renderRitmsTable();
    return;
  }
  ritm.status = newStatus;
  saveState();
  addNotification('ritm_status', user.name + ' moveu ' + ritm.code + ' para ' + newStatus + '.', null, ritm.ownerEmail);
  showToast('Chamado ' + ritm.code + ': ' + newStatus, 'success');
}

function deleteRitmFromModal() {
  const uid = document.getElementById('ritm-edit-uid').value;
  if (!uid) return;
  const ritm = AppState.ritms.find(r => r.uid === uid);
  if (!ritm) return;
  if (!isOwnerOrManager(ritm.ownerEmail)) {
    showToast('Sem permissão para excluir.', 'error');
    return;
  }
  if (!confirm('Excluir o chamado "' + ritm.code + '"?')) return;

  AppState.ritms = AppState.ritms.filter(r => r.uid !== uid);
  saveState();
  closeModal('modal-ritm');
  renderWorkspaceCounts();
  renderHypercareTab();
  showToast('Chamado ' + ritm.code + ' excluído.', '');
}

function closeModal(modalId) {
  document.getElementById(modalId)?.classList.remove('open');
}

// ========================
// NOTIFICAÇÕES
// ========================

function addNotification(type, message, refId, targetEmail) {
  AppState.notifications.unshift({
    id: generateId('notif'),
    type,
    message,
    refId: refId || null,
    targetEmail: targetEmail || null,
    timestamp: nowTimestamp(),
    read: false
  });
  if (AppState.notifications.length > 50) {
    AppState.notifications = AppState.notifications.slice(0, 50);
  }
  saveState();
  renderNotifications();
}

function getVisibleNotifications() {
  const user = AppState.session?.user;
  if (!user) return [];
  if (user.role === 'Gerente') return AppState.notifications;

  const myEmail = (user.email || '').toLowerCase();
  return AppState.notifications.filter(n => n.targetEmail && n.targetEmail.toLowerCase() === myEmail);
}

function toggleNotifications() {
  document.getElementById('popover-notifications')?.classList.toggle('open');
}

function renderNotifications() {
  const listEl = document.getElementById('notif-list');
  const badgeEl = document.getElementById('notif-badge');
  if (!listEl) return;

  const visible = getVisibleNotifications();
  const unread = visible.filter(n => !n.read).length;

  if (badgeEl) {
    badgeEl.textContent = unread;
    badgeEl.classList.toggle('hidden', unread === 0);
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
  const ids = new Set(getVisibleNotifications().map(n => n.id));
  AppState.notifications.forEach(n => { if (ids.has(n.id)) n.read = true; });
  saveState();
  renderNotifications();
}

// ========================
// HOMOLOGAÇÃO (SIMULAÇÃO PARA GERENTE)
// ========================

function populateDebugSwitchUser() {
  const select = document.getElementById('debug-switch-user');
  if (!select) return;

  select.innerHTML = AppState.users.map(u =>
    '<option value="' + escapeHtml(u.id) + '"' + (AppState.session?.user?.id === u.id ? ' selected' : '') + '>' +
      escapeHtml(u.name) + ' (' + escapeHtml(u.role) + ')' +
    '</option>'
  ).join('');
}

function switchDebugUser() {
  if (AppState.session?.canSimulate !== true) {
    showToast('Simulação exclusiva para gerentes autenticados.', 'error');
    return;
  }
  const select = document.getElementById('debug-switch-user');
  const user = AppState.users.find(u => u.id === select?.value);
  if (!user) return;

  AppState.session = { user: { ...user }, canSimulate: true };
  saveState();
  clearFilters();
  showApp();
  showToast('Simulando visão de: ' + user.name + ' (' + user.role + ')', 'success');
}

// ========================
// BOOT & LISTENERS GLOBAIS
// ========================

function initApp() {
  // Garante fallback caso alguma logo estática tenha falhado antes do script rodar
  document.querySelectorAll('#client-filter-buttons img').forEach(img => {
    if (img.complete && img.naturalWidth === 0) handleClientLogoError(img);
  });

  // Delegação de hover nas barras do Gantt pro tooltip flutuante
  const ganttScroll = document.getElementById('gantt-scroll-area');
  if (ganttScroll) {
    ganttScroll.addEventListener('mouseover', (e) => {
      const bar = e.target.closest('.gantt-bar');
      if (bar) showGanttTooltip(bar, e);
    });
    ganttScroll.addEventListener('mousemove', (e) => {
      if (e.target.closest('.gantt-bar')) positionGanttTooltip(e);
    });
    ganttScroll.addEventListener('mouseout', (e) => {
      const bar = e.target.closest('.gantt-bar');
      if (bar && (!e.relatedTarget || !bar.contains(e.relatedTarget))) {
        hideGanttTooltip();
      }
    });
  }

  loadState();

  if (AppState.session?.user) {
    const freshUser = AppState.users.find(u => u.id === AppState.session.user.id);
    if (freshUser) {
      const canSim = AppState.session.canSimulate === true || freshUser.role === 'Gerente';
      AppState.session = { user: { ...freshUser }, canSimulate: canSim };
      showApp();
      return;
    }
    AppState.session = null;
    localStorage.removeItem(STORAGE_KEY_SESSION);
  }

  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('app-shell').classList.add('hidden');
}

document.addEventListener('click', (e) => {
  // Fecha popover de notificações ao clicar fora
  const popover = document.getElementById('popover-notifications');
  const btn = document.getElementById('btn-toggle-notifs');
  if (popover && popover.classList.contains('open') && !popover.contains(e.target) && !(btn && btn.contains(e.target))) {
    popover.classList.remove('open');
  }
  // Fecha modal se clicar no backdrop escuro
  if (e.target.classList && e.target.classList.contains('modal-backdrop')) {
    e.target.classList.remove('open');
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal('modal-activity');
    closeModal('modal-ritm');
    hideGanttTooltip();
    document.getElementById('popover-notifications')?.classList.remove('open');
  }
});

document.addEventListener('DOMContentLoaded', initApp);
