const GOVERNANCE_KEY = 'GOV2026';
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 min de inatividade
const STORAGE_PREFIX = 'allan_santos_gov_v8_';

const STORAGE_KEYS = {
  USERS: `${STORAGE_PREFIX}users`,
  PROJECTS: `${STORAGE_PREFIX}projects`,
  SESSION: `${STORAGE_PREFIX}session`,
  NOTIFICATIONS: `${STORAGE_PREFIX}notifications`,
  SECURITY_LOGS: `${STORAGE_PREFIX}security_logs`
};

// equipe oficial de teste solicitada (CarlosSouza como usuario)
const INITIAL_USERS = [
  {
    id: 'usr_001',
    name: 'Allan Santos',
    username: 'AllanSantos',
    email: 'allan.santos@empresa.com',
    role: 'Gerente',
    client: 'Allan',
    password: '12345'
  },
  {
    id: 'usr_002',
    name: 'Carlos Souza',
    username: 'CarlosSouza',
    email: 'carlos.souza@empresa.com',
    role: 'Trainee',
    client: 'Allan',
    password: '54321'
  },
  {
    id: 'usr_003',
    name: 'Beatriz Prugno',
    username: 'BeatrizP',
    email: 'beatriz.prugno@santander.com.br',
    role: 'Senior',
    client: 'Santander',
    password: 'Bia123'
  }
];

// projetos iniciais oficiais
const INITIAL_PROJECTS = [
  {
    id: 'PRJ-2026-001',
    client: 'Allan',
    title: 'Dashboard de Projetos',
    category: 'Governança & Business Intelligence',
    description: 'Construção e sustentação do painel executivo corporativo para monitoramento contínuo do portfólio de iniciativas e indicadores agregados de entrega.',
    responsibleName: 'Carlos Souza',
    responsibleUsername: 'CarlosSouza',
    responsibleEmail: 'carlos.souza@empresa.com',
    status: 'Em Andamento',
    progress: 75,
    health: 'green',
    deadline: 'Indeterminado',
    weeklyNotes: 'Painel redondo executivo implementado com gráfico de distribuição e taxa média de entrega agregada.',
    comments: [
      {
        author: 'Allan Santos',
        role: 'Gerente',
        date: '10/11/2026 10:15',
        text: 'Layout do dashboard circular aprovado. Garantir que os filtros de clientes e status permaneçam rápidos.'
      },
      {
        author: 'Carlos Souza',
        role: 'Trainee',
        date: '10/11/2026 11:30',
        text: 'Painel executivo redondo funcionando perfeitamente com atualização em tempo real.'
      }
    ]
  },
  {
    id: 'PRJ-2026-002',
    client: 'Santander',
    title: 'PMO riscos TI Santander',
    category: 'Gestão de Riscos & TI',
    description: 'Cobranças diarias de demandas, entre ela: Runtime, CNJP, APIGEE',
    responsibleName: 'Beatriz Prugno',
    responsibleUsername: 'BeatrizP',
    responsibleEmail: 'beatriz.prugno@santander.com.br',
    status: 'Em Andamento',
    progress: 85,
    health: 'yellow',
    deadline: 'Indeterminado',
    weeklyNotes: 'Cobranças diárias de demandas ativas (Runtime, CNJP, APIGEE). Homologação de apontamentos em curso.',
    comments: [
      {
        author: 'Beatriz Prugno',
        role: 'Senior',
        date: '10/11/2026 15:42',
        text: 'Escopo atualizado: Cobranças diárias de demandas, entre elas: Runtime, CNJP, APIGEE. Prazo definido como Indeterminado.'
      },
      {
        author: 'Allan Santos',
        role: 'Gerente',
        date: '10/11/2026 09:00',
        text: 'Excelente acompanhamento. Manter alinhamento diário até a homologação final.'
      }
    ]
  }
];

// notificacoes para o painel executivo do Allan (no cantinho)
const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif_001',
    author: 'Beatriz Prugno',
    role: 'Senior',
    client: 'Santander',
    projectId: 'PRJ-2026-002',
    projectTitle: 'PMO riscos TI Santander',
    date: 'Hoje às 15:42',
    changeType: 'Prazo & Escopo',
    details: 'Prazo alterado para (Indeterminado). Cobranças diárias de demandas: Runtime, CNJP, APIGEE.',
    message: 'Cobranças diárias de demandas, entre ela: Runtime, CNJP, APIGEE',
    isNew: true
  },
  {
    id: 'notif_002',
    author: 'Carlos Souza',
    role: 'Trainee',
    client: 'Allan',
    projectId: 'PRJ-2026-001',
    projectTitle: 'Dashboard de Projetos',
    date: 'Hoje às 14:15',
    changeType: 'Status & Progresso',
    details: 'Progresso em 75% (No Prazo). Gráfico executivo e filtros consolidados.',
    message: 'Painel redondo de governança integrado com sucesso.',
    isNew: true
  }
];

const AppState = {
  users: [],
  projects: [],
  session: null,
  activeModalProjectId: null,
  notifications: [],
  securityLogs: []
};

// Limpa caracteres perigosos contra script malicioso
function sanitize(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Trava de segurança: se o usuário não for gerente, impede acesso à tela executiva
function checkAccessPermission(requiredRole) {
  if (!AppState.session || !AppState.session.user) {
    recordSecurityIncident('ACESSO_NAO_AUTENTICADO', 'Tentativa de acesso à área restrita sem login.');
    handleForceLogout('Sessão expirada ou inválida.');
    return false;
  }

  const currentUser = AppState.session.user;

  if (requiredRole === 'Gerente' && currentUser.role !== 'Gerente') {
    recordSecurityIncident(
      'VIOLACAO_RBAC_GERENTE',
      `Tentativa de acesso ao painel do gerente por: ${currentUser.email || currentUser.username}`
    );
    showToast('Acesso negado: perfil de Gerente obrigatório.', 'error');
    renderColaboradorView();
    return false;
  }

  return true;
}

// Checa se o projeto pertence ao usuário logado ou se é gerente
function validateProjectMutation(project) {
  if (!AppState.session || !AppState.session.user) return false;
  
  const user = AppState.session.user;
  if (user.role === 'Gerente') return true;

  const isOwner = (project.responsibleEmail && project.responsibleEmail.trim().toLowerCase() === user.email.trim().toLowerCase()) ||
                  (project.responsibleUsername && user.username && project.responsibleUsername.trim().toLowerCase() === user.username.trim().toLowerCase());

  if (!isOwner) {
    recordSecurityIncident(
      'VIOLACAO_AUTORIA_PROJETO',
      `Usuário '${user.username || user.email}' tentou alterar o projeto '${project.id}' de '${project.responsibleName}'.`
    );
    showToast('Ação bloqueada: você só pode editar projetos sob sua responsabilidade.', 'error');
    return false;
  }

  return true;
}

function recordSecurityIncident(type, description) {
  const incident = {
    id: 'SEC-' + Date.now(),
    timestamp: new Date().toISOString(),
    formattedDate: getFormattedNow(),
    type: type,
    description: description,
    userEmail: AppState.session?.user?.email || AppState.session?.user?.username || 'ANONYMOUS'
  };

  AppState.securityLogs.unshift(incident);
  if (AppState.securityLogs.length > 50) AppState.securityLogs.pop();
  
  localStorage.setItem(STORAGE_KEYS.SECURITY_LOGS, JSON.stringify(AppState.securityLogs));
  renderSecurityBadge();
}

function updateSessionActivity() {
  if (AppState.session) {
    AppState.session.lastActivity = Date.now();
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(AppState.session));
  }
}

function verifySessionTimeout() {
  if (!AppState.session) return;

  const now = Date.now();
  const idleTime = now - (AppState.session.lastActivity || now);

  if (idleTime > SESSION_TIMEOUT_MS) {
    recordSecurityIncident('EXPIRACAO_SESSAO', `Sessão de ${AppState.session.user.username || AppState.session.user.email} expirada por inatividade.`);
    handleForceLogout('Sua sessão expirou por inatividade.');
  }
}

function initApplication() {
  loadStoredData();
  setupEventListeners();
  setupSecurityActivityTrackers();

  if (AppState.session && AppState.session.user) {
    const idle = Date.now() - (AppState.session.lastActivity || 0);
    if (idle < SESSION_TIMEOUT_MS) {
      applyActiveSession(AppState.session.user);
    } else {
      handleForceLogout('Sessão expirada.');
    }
  } else {
    showScreen('screen-login');
  }

  setInterval(verifySessionTimeout, 60000);
}

function loadStoredData() {
  try {
    const savedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
    AppState.users = savedUsers ? JSON.parse(savedUsers) : INITIAL_USERS;
    if (!savedUsers) localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));

    const savedProjects = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    AppState.projects = savedProjects ? JSON.parse(savedProjects) : INITIAL_PROJECTS;
    if (!savedProjects) localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(INITIAL_PROJECTS));

    const savedNotifs = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    AppState.notifications = savedNotifs ? JSON.parse(savedNotifs) : INITIAL_NOTIFICATIONS;
    if (!savedNotifs) localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));

    const savedLogs = localStorage.getItem(STORAGE_KEYS.SECURITY_LOGS);
    AppState.securityLogs = savedLogs ? JSON.parse(savedLogs) : [];

    const savedSession = localStorage.getItem(STORAGE_KEYS.SESSION);
    if (savedSession) {
      AppState.session = JSON.parse(savedSession);
    }
  } catch (err) {
    console.error('Erro ao ler localStorage:', err);
    AppState.users = INITIAL_USERS;
    AppState.projects = INITIAL_PROJECTS;
    AppState.notifications = INITIAL_NOTIFICATIONS;
  }
}

function saveProjectsData() {
  localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(AppState.projects));
}

function saveUsersData() {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(AppState.users));
}

function saveNotificationsData() {
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(AppState.notifications));
}

// Controle do popover de notificacoes no cantinho
function toggleNotificationsPopover() {
  const popover = document.getElementById('popover-gerente-notifications');
  if (popover) {
    popover.classList.toggle('hidden');
  }
}

// Notificacoes para o painel do Allan
function addNotification(notif) {
  AppState.notifications.unshift(notif);
  if (AppState.notifications.length > 25) AppState.notifications.pop();
  saveNotificationsData();
  renderNotificationsList();
}

function clearAllNotifications() {
  AppState.notifications = [];
  saveNotificationsData();
  renderNotificationsList();
  showToast('Notificações limpas.', 'info');
}

function renderNotificationsList() {
  const container = document.getElementById('notifications-list');
  const badgeCount = document.getElementById('notif-badge-count');
  if (!container) return;

  container.innerHTML = '';
  const count = AppState.notifications.length;
  if (badgeCount) {
    badgeCount.innerText = count > 0 ? `${count} novas` : '0 novas';
    badgeCount.className = count > 0 
      ? 'text-[10px] font-bold px-1.5 py-0.2 bg-blue-600 text-white rounded-full' 
      : 'text-[10px] font-medium px-1.5 py-0.2 bg-slate-200 text-slate-600 rounded-full';
  }

  if (count === 0) {
    container.innerHTML = `
      <div class="p-3 text-center text-xs text-slate-500 italic bg-slate-50 rounded border border-slate-100">
        Nenhuma nova notificação.
      </div>
    `;
    return;
  }

  AppState.notifications.forEach(n => {
    const item = document.createElement('div');
    item.className = 'p-2.5 bg-slate-50 hover:bg-slate-100/80 rounded border border-slate-200 text-xs transition';
    
    let badgeColor = 'bg-blue-100 text-blue-800 border-blue-200';
    if (n.changeType.includes('Prazo')) {
      badgeColor = 'bg-amber-100 text-amber-900 border-amber-300';
    } else if (n.changeType.includes('Status')) {
      badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }

    item.innerHTML = `
      <div class="flex items-center justify-between gap-2 mb-1">
        <div class="flex items-center gap-1.5">
          <span class="font-bold text-slate-900">${sanitize(n.author)}</span>
          <span class="text-[10px] text-slate-500">(${sanitize(n.role)})</span>
          <span class="text-[10px] font-semibold px-1.5 py-0.2 rounded border ${badgeColor}">${sanitize(n.changeType)}</span>
        </div>
        <span class="text-[10px] font-mono text-slate-500 shrink-0">${sanitize(n.date)}</span>
      </div>
      <div class="text-slate-800 font-medium">
        <span class="font-mono text-blue-700 font-semibold cursor-pointer hover:underline" onclick="openProjectDetailModal('${n.projectId}')">[${sanitize(n.projectId)}] ${sanitize(n.projectTitle)}</span>: 
        ${sanitize(n.details)}
      </div>
      ${n.message ? `
        <div class="mt-1 text-[11px] text-slate-600 bg-white p-1.5 rounded border border-slate-200 italic">
          &ldquo;${sanitize(n.message)}&rdquo;
        </div>
      ` : ''}
    `;

    container.appendChild(item);
  });
}

// Login aceita tanto usuário quanto e-mail corporativo (CarlosSouza ou UsuarioCarlosSouza)
function handleLoginSubmit(event) {
  event.preventDefault();
  const credential = (document.getElementById('login-credential')?.value || '').trim();
  const password = document.getElementById('login-password')?.value;

  if (!credential || !password) {
    showToast('Preencha seu usuário/e-mail e sua senha.', 'warning');
    return;
  }

  const user = AppState.users.find(u => {
    const un = (u.username || '').toLowerCase();
    const cred = credential.toLowerCase();
    const matchUser = (un === cred) || 
                      (un === 'carlossouza' && cred === 'usuariocarlossouza') || 
                      (un === 'usuariocarlossouza' && cred === 'carlossouza');
    const matchEmail = (u.email || '').toLowerCase() === cred;
    return matchUser || matchEmail;
  });

  if (!user) {
    recordSecurityIncident('LOGIN_FALHOU', `Tentativa de login inexistente: ${credential}`);
    showToast('Usuário ou e-mail corporativo não encontrado.', 'error');
    return;
  }

  if (user.password && user.password !== password) {
    recordSecurityIncident('SENHA_INCORRETA', `Senha incorreta informada para: ${credential}`);
    showToast('Senha de acesso incorreta.', 'error');
    return;
  }

  createSession(user);
}

// Cadastro simplificado: cria usuário SEM necessidade de cliente (cliente é escolhido ao criar projeto)
function handleRegisterSubmit(event) {
  event.preventDefault();
  const name = document.getElementById('reg-name')?.value.trim();
  const username = document.getElementById('reg-username')?.value.trim();
  const email = document.getElementById('reg-email')?.value.trim();
  const roleSelect = document.getElementById('reg-role')?.value;
  const govToken = document.getElementById('reg-gov-token')?.value.trim();
  const password = document.getElementById('reg-password')?.value;
  const passwordConfirm = document.getElementById('reg-password-confirm')?.value;

  if (!name || !username || !email || !password) {
    showToast('Preencha todos os campos obrigatórios.', 'warning');
    return;
  }

  if (password !== passwordConfirm) {
    showToast('As senhas digitadas não conferem.', 'error');
    return;
  }

  const existsEmail = AppState.users.some(u => u.email.toLowerCase() === email.toLowerCase());
  if (existsEmail) {
    showToast('Este e-mail corporativo já está cadastrado.', 'warning');
    return;
  }

  const existsUser = AppState.users.some(u => u.username && u.username.toLowerCase() === username.toLowerCase());
  if (existsUser) {
    showToast('Este nome de usuário já está em uso.', 'warning');
    return;
  }

  let finalRole = roleSelect;
  if (roleSelect === 'Gerente') {
    if (govToken === GOVERNANCE_KEY) {
      finalRole = 'Gerente';
    } else {
      recordSecurityIncident(
        'CHAVE_GOVERNANCA_INVALIDA',
        `Tentativa de registro de Gerente para '${username}' (${email}) com chave inválida.`
      );
      showToast('Chave de Governança incorreta. Conta criada como Senior.', 'warning');
      finalRole = 'Senior';
    }
  }

  const newUser = {
    id: 'usr_' + Date.now(),
    name: name,
    username: username,
    email: email,
    role: finalRole,
    password: password
  };

  AppState.users.push(newUser);
  saveUsersData();
  populateResponsibleOptions();
  populateClientFilterOptions();

  showToast(`Conta criada com sucesso: ${username} (${finalRole}).`, 'success');
  createSession(newUser);
}

function createSession(user) {
  AppState.session = {
    user: user,
    token: 'jwt_mock_' + Math.random().toString(36).substring(2) + Date.now(),
    loginTime: Date.now(),
    lastActivity: Date.now()
  };

  localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(AppState.session));
  applyActiveSession(user);
  showToast(`Conectado como: ${user.name} (${user.role})`, 'info');
}

function applyActiveSession(user) {
  document.getElementById('nav-user-name').innerText = user.name;
  
  const roleDisplay = user.client && user.client !== 'Geral'
    ? `${user.role} &bull; ${sanitize(user.client)}`
    : user.role;
  document.getElementById('nav-user-role').innerHTML = roleDisplay;

  const initials = user.name
    .split(' ')
    .map(p => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  document.getElementById('nav-user-avatar').innerText = initials;

  const debugSelect = document.getElementById('debug-switch-user');
  if (debugSelect) debugSelect.value = user.email;

  showScreen('screen-app');

  // Todos tem a mesma aba, menos o gerente, que tem a especial para ele
  if (user.role === 'Gerente') {
    renderGerenteView();
  } else {
    renderColaboradorView();
  }

  populateResponsibleOptions();
  populateClientFilterOptions();
  renderSecurityBadge();
}

function handleLogout() {
  AppState.session = null;
  localStorage.removeItem(STORAGE_KEYS.SESSION);
  showScreen('screen-login');
  showToast('Desconectado com sucesso.', 'info');
}

function handleForceLogout(reason) {
  AppState.session = null;
  localStorage.removeItem(STORAGE_KEYS.SESSION);
  showScreen('screen-login');
  showToast(reason || 'Sessão encerrada.', 'warning');
}

// Visao especial para gerente: painel redondo de governanca e notificacoes no cantinho
function renderGerenteView() {
  if (!checkAccessPermission('Gerente')) {
    return;
  }

  document.getElementById('view-gerente').classList.remove('hidden');
  document.getElementById('view-colaborador').classList.add('hidden');

  updateDonutChart();
  renderNotificationsList();
  populateClientFilterOptions();
  renderExecutiveTable();
}

// Atualiza o dashboard circular (donut SVG) do gerente
function updateDonutChart() {
  const total = AppState.projects.length;
  const green = AppState.projects.filter(p => p.health === 'green').length;
  const yellow = AppState.projects.filter(p => p.health === 'yellow').length;
  const red = AppState.projects.filter(p => p.health === 'red').length;

  const totalEl = document.getElementById('donut-total');
  if (totalEl) totalEl.innerText = total;

  // Circunferencia para raio r=54: 2 * PI * 54 = 339.292
  const C = 339.292;
  const circleGreen = document.getElementById('donut-circle-green');
  const circleYellow = document.getElementById('donut-circle-yellow');
  const circleRed = document.getElementById('donut-circle-red');

  if (total === 0) {
    if (circleGreen) circleGreen.setAttribute('stroke-dasharray', `0 ${C}`);
    if (circleYellow) circleYellow.setAttribute('stroke-dasharray', `0 ${C}`);
    if (circleRed) circleRed.setAttribute('stroke-dasharray', `0 ${C}`);
  } else {
    const lenGreen = (green / total) * C;
    const lenYellow = (yellow / total) * C;
    const lenRed = (red / total) * C;

    if (circleGreen) {
      circleGreen.setAttribute('stroke-dasharray', `${lenGreen} ${C}`);
      circleGreen.setAttribute('stroke-dashoffset', '0');
    }
    if (circleYellow) {
      circleYellow.setAttribute('stroke-dasharray', `${lenYellow} ${C}`);
      circleYellow.setAttribute('stroke-dashoffset', `-${lenGreen}`);
    }
    if (circleRed) {
      circleRed.setAttribute('stroke-dasharray', `${lenRed} ${C}`);
      circleRed.setAttribute('stroke-dashoffset', `-${lenGreen + lenYellow}`);
    }
  }

  // Legendas com porcentagem
  const pctGreen = total > 0 ? Math.round((green / total) * 100) : 0;
  const pctYellow = total > 0 ? Math.round((yellow / total) * 100) : 0;
  const pctRed = total > 0 ? Math.round((red / total) * 100) : 0;

  const legGreen = document.getElementById('legend-green-count');
  const legYellow = document.getElementById('legend-yellow-count');
  const legRed = document.getElementById('legend-red-count');

  if (legGreen) legGreen.innerText = `${green} (${pctGreen}%)`;
  if (legYellow) legYellow.innerText = `${yellow} (${pctYellow}%)`;
  if (legRed) legRed.innerText = `${red} (${pctRed}%)`;

  // Taxa media de entrega
  const avg = total > 0 ? Math.round(AppState.projects.reduce((acc, p) => acc + (p.progress || 0), 0) / total) : 0;
  const avgEl = document.getElementById('donut-avg-progress');
  if (avgEl) avgEl.innerText = `${avg}%`;

  // Gauge circular de entrega r=25: 2 * PI * 25 = 157.08
  const C_avg = 157.08;
  const circleAvg = document.getElementById('donut-circle-avg');
  if (circleAvg) {
    const lenAvg = (avg / 100) * C_avg;
    circleAvg.setAttribute('stroke-dasharray', `${lenAvg} ${C_avg}`);
  }

  // Clientes ativos consolidados
  const activeClientsEl = document.getElementById('donut-active-clients');
  if (activeClientsEl) {
    const clients = [...new Set(AppState.projects.map(p => p.client || 'Geral').filter(Boolean))];
    activeClientsEl.innerText = clients.length > 0 ? clients.join(', ') : 'Nenhum';
  }
}

function renderExecutiveTable() {
  if (!AppState.session || AppState.session.user.role !== 'Gerente') {
    return;
  }

  const searchVal = (document.getElementById('table-search-input')?.value || '').toLowerCase().trim();
  const filterClient = document.getElementById('table-filter-client')?.value || 'all';
  const filterColab = document.getElementById('table-filter-colab')?.value || 'all';
  const filterHealth = document.getElementById('table-filter-health')?.value || 'all';

  const tbody = document.getElementById('executive-table-body');
  const emptyRow = document.getElementById('executive-table-empty');
  tbody.innerHTML = '';

  const filtered = AppState.projects.filter(p => {
    const clientName = p.client || 'Geral';
    const matchesSearch = !searchVal ||
      p.title.toLowerCase().includes(searchVal) ||
      p.id.toLowerCase().includes(searchVal) ||
      clientName.toLowerCase().includes(searchVal) ||
      p.category.toLowerCase().includes(searchVal) ||
      p.responsibleName.toLowerCase().includes(searchVal);

    const matchesClient = filterClient === 'all' || clientName.toLowerCase() === filterClient.toLowerCase();
    const matchesColab = filterColab === 'all' || p.responsibleEmail.toLowerCase() === filterColab.toLowerCase();
    const matchesHealth = filterHealth === 'all' || p.health === filterHealth;

    return matchesSearch && matchesClient && matchesColab && matchesHealth;
  });

  if (filtered.length === 0) {
    emptyRow.classList.remove('hidden');
    return;
  }
  emptyRow.classList.add('hidden');

  filtered.forEach(project => {
    const tr = document.createElement('tr');

    let barColor = 'bg-blue-600';
    if (project.health === 'yellow') barColor = 'bg-amber-500';
    if (project.health === 'red') barColor = 'bg-rose-600';
    if (project.health === 'green' && project.progress === 100) barColor = 'bg-emerald-600';

    const healthBadge = renderHealthBadgeHTML(project.health);
    const dateFormatted = formatDateBR(project.deadline);
    const clientBadge = renderClientBadgeHTML(project.client);

    const respUser = AppState.users.find(u => 
      (u.email && u.email.toLowerCase() === project.responsibleEmail.toLowerCase()) ||
      (u.username && project.responsibleUsername && u.username.toLowerCase() === project.responsibleUsername.toLowerCase())
    );
    const respCargo = respUser ? respUser.role : 'Colaborador';

    tr.innerHTML = `
      <td class="font-medium text-slate-900">
        <div class="flex items-center gap-2">
          <span class="text-[11px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">${sanitize(project.id)}</span>
          <span class="font-semibold text-slate-800 hover:text-blue-700 cursor-pointer" onclick="openProjectDetailModal('${project.id}')">
            ${sanitize(project.title)}
          </span>
        </div>
        <div class="text-[11px] text-slate-500 mt-0.5">${sanitize(project.category)}</div>
      </td>
      <td>
        ${clientBadge}
      </td>
      <td>
        <div class="text-xs font-semibold text-slate-800">${sanitize(project.responsibleName)}</div>
        <div class="text-[11px] text-slate-500">${sanitize(respCargo)} &bull; ${sanitize(project.responsibleEmail)}</div>
      </td>
      <td>
        <span class="inline-flex items-center px-2 py-0.5 text-[11px] font-medium bg-slate-100 text-slate-700 rounded border border-slate-200">
          ${sanitize(project.status)}
        </span>
      </td>
      <td>
        ${healthBadge}
      </td>
      <td>
        <div class="flex items-center gap-2">
          <div class="w-16 bg-slate-100 h-1.5 rounded overflow-hidden border border-slate-200">
            <div class="${barColor} h-1.5" style="width: ${project.progress}%"></div>
          </div>
          <span class="text-xs font-semibold font-mono text-slate-700">${project.progress}%</span>
        </div>
      </td>
      <td class="text-xs font-mono text-slate-700">
        ${project.deadline === 'Indeterminado' ? '<span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-300">Indeterminado</span>' : dateFormatted}
      </td>
      <td class="text-center">
        <div class="flex items-center justify-center gap-1">
          <button 
            onclick="openProjectDetailModal('${project.id}')"
            title="Ver Detalhes e Histórico" 
            class="p-1 text-slate-500 hover:text-blue-700 hover:bg-slate-100 rounded"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
          </button>
          <button 
            onclick="openUpdateStatusModal('${project.id}')"
            title="Atualizar Status / Prazo" 
            class="p-1 text-slate-500 hover:text-blue-700 hover:bg-slate-100 rounded"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
          </button>
          <button 
            onclick="handleDeleteProject('${project.id}')"
            title="Remover projeto incorreto" 
            class="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function filterByHealthKpi(health) {
  const select = document.getElementById('table-filter-health');
  if (select) {
    select.value = health;
    renderExecutiveTable();
  }
}

// Visao para Trainee, Especialista e Senior
function renderColaboradorView() {
  if (!AppState.session || !AppState.session.user) return;

  const user = AppState.session.user;

  document.getElementById('view-gerente').classList.add('hidden');
  document.getElementById('view-colaborador').classList.remove('hidden');

  document.getElementById('colab-banner-name').innerText = user.name;
  const colabRoleDisplay = user.client && user.client !== 'Geral'
    ? `${user.role} &bull; ${sanitize(user.client)}`
    : user.role;
  document.getElementById('colab-banner-role').innerHTML = colabRoleDisplay;

  const myProjects = AppState.projects.filter(p => 
    (p.responsibleEmail && p.responsibleEmail.toLowerCase() === user.email.toLowerCase()) ||
    (p.responsibleUsername && user.username && p.responsibleUsername.toLowerCase() === user.username.toLowerCase())
  );

  document.getElementById('colab-kpi-total').innerText = myProjects.length;
  const avg = myProjects.length > 0 
    ? Math.round(myProjects.reduce((acc, c) => acc + c.progress, 0) / myProjects.length)
    : 0;
  document.getElementById('colab-kpi-avg').innerText = avg + '%';
  const alerts = myProjects.filter(p => p.health === 'yellow' || p.health === 'red').length;
  document.getElementById('colab-kpi-alerts').innerText = alerts;

  const container = document.getElementById('colab-projects-container');
  const emptyState = document.getElementById('colab-empty-state');
  container.innerHTML = '';

  if (myProjects.length === 0) {
    emptyState.classList.remove('hidden');
    return;
  }
  emptyState.classList.add('hidden');

  myProjects.forEach(project => {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-md border border-slate-200 shadow-xs p-4 flex flex-col justify-between hover:border-slate-300 transition';

    let barColor = 'bg-blue-600';
    if (project.health === 'yellow') barColor = 'bg-amber-500';
    if (project.health === 'red') barColor = 'bg-rose-600';

    const healthBadge = renderHealthBadgeHTML(project.health);
    const dateFormatted = formatDateBR(project.deadline);
    const clientBadge = renderClientBadgeHTML(project.client);

    card.innerHTML = `
      <div>
        <div class="flex items-center justify-between gap-2 mb-2">
          <div class="flex items-center gap-1.5">
            <span class="text-[11px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">${sanitize(project.id)}</span>
            ${clientBadge}
          </div>
          ${healthBadge}
        </div>

        <h3 class="text-sm font-bold text-slate-900 leading-snug hover:text-blue-700 cursor-pointer" onclick="openProjectDetailModal('${project.id}')">
          ${sanitize(project.title)}
        </h3>

        <div class="text-[11px] text-slate-500 mt-1">${sanitize(project.category)}</div>

        <p class="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
          ${sanitize(project.description)}
        </p>

        <div class="mt-4 pt-3 border-t border-slate-100">
          <div class="flex justify-between items-center text-xs font-semibold text-slate-700 mb-1">
            <span class="text-[11px] text-slate-500 font-normal">Progresso:</span>
            <span>${project.progress}%</span>
          </div>
          <div class="w-full bg-slate-100 h-2 rounded-xs overflow-hidden border border-slate-200">
            <div class="${barColor} h-2" style="width: ${project.progress}%"></div>
          </div>
        </div>

        <div class="mt-3 space-y-2 text-xs">
          <div class="flex justify-between text-slate-600 text-[11px]">
            <span>Prazo:</span>
            <span class="font-mono font-semibold text-slate-800">${dateFormatted}</span>
          </div>

          ${project.weeklyNotes ? `
            <div class="p-2 bg-slate-50 rounded border border-slate-100 text-[11px] text-slate-700">
              <span class="font-bold text-slate-800 block mb-0.5">Nota da Semana:</span>
              <span class="line-clamp-2 italic">"${sanitize(project.weeklyNotes)}"</span>
            </div>
          ` : ''}
        </div>
      </div>

      <div class="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5">
        <button 
          onclick="openUpdateStatusModal('${project.id}')"
          class="flex-1 py-1.5 px-3 bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white font-semibold text-xs rounded transition flex items-center justify-center gap-1.5 shadow-xs"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Atualizar Status
        </button>
        <button 
          onclick="openProjectDetailModal('${project.id}')"
          title="Ver detalhes"
          class="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded border border-slate-200 transition"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
        <button 
          onclick="handleDeleteProject('${project.id}')"
          title="Remover projeto incorreto" 
          class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded border border-slate-200 hover:border-rose-300 transition"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    `;

    container.appendChild(card);
  });
}

function toggleUpdateIndefiniteDeadline(isIndefinite) {
  const dateInput = document.getElementById('modal-update-deadline');
  if (!dateInput) return;
  if (isIndefinite) {
    dateInput.value = '';
    dateInput.disabled = true;
    dateInput.required = false;
    dateInput.classList.add('opacity-50', 'bg-slate-200');
  } else {
    dateInput.disabled = false;
    dateInput.required = true;
    dateInput.classList.remove('opacity-50', 'bg-slate-200');
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 30);
    dateInput.value = defaultDate.toISOString().split('T')[0];
  }
}

function openUpdateStatusModal(projectId) {
  const project = AppState.projects.find(p => p.id === projectId);
  if (!project) return;

  if (!validateProjectMutation(project)) {
    return;
  }

  AppState.activeModalProjectId = projectId;
  document.getElementById('modal-update-project-id').value = project.id;
  document.getElementById('modal-update-project-title').innerText = `${project.id} - ${project.title} (${project.client || 'Geral'})`;

  const range = document.getElementById('modal-update-range');
  range.value = project.progress;
  document.getElementById('modal-update-progress-label').innerText = project.progress + '%';

  const radios = document.getElementsByName('modal-update-health');
  radios.forEach(r => {
    r.checked = (r.value === project.health);
  });

  document.getElementById('modal-update-notes').value = project.weeklyNotes || '';

  // Configura campo de prazo e checkbox de indeterminado
  const isIndefinite = (project.deadline === 'Indeterminado' || project.deadline?.toLowerCase() === 'indeterminado');
  const deadlineCheck = document.getElementById('modal-update-indefinite');
  const deadlineInput = document.getElementById('modal-update-deadline');
  const deadlineMsgInput = document.getElementById('modal-update-deadline-msg');

  if (deadlineCheck) deadlineCheck.checked = isIndefinite;
  if (deadlineMsgInput) deadlineMsgInput.value = '';

  if (deadlineInput) {
    if (isIndefinite) {
      deadlineInput.value = '';
      deadlineInput.disabled = true;
      deadlineInput.classList.add('opacity-50', 'bg-slate-200');
    } else {
      deadlineInput.disabled = false;
      deadlineInput.classList.remove('opacity-50', 'bg-slate-200');
      deadlineInput.value = project.deadline || '';
    }
  }

  openModal('modal-update-status');
}

function handleSaveStatusUpdate(event) {
  event.preventDefault();
  const projectId = document.getElementById('modal-update-project-id').value;
  const project = AppState.projects.find(p => p.id === projectId);
  if (!project) return;

  if (!validateProjectMutation(project)) {
    closeModal('modal-update-status');
    return;
  }

  const newProgress = parseInt(document.getElementById('modal-update-range').value, 10);
  const newHealth = document.querySelector('input[name="modal-update-health"]:checked')?.value || 'green';
  const newNotes = document.getElementById('modal-update-notes').value.trim();

  // Tratamento do novo prazo
  const isIndefinite = document.getElementById('modal-update-indefinite')?.checked;
  const deadlineInput = document.getElementById('modal-update-deadline');
  const newDeadline = isIndefinite ? 'Indeterminado' : (deadlineInput?.value || project.deadline);
  const deadlineMsg = (document.getElementById('modal-update-deadline-msg')?.value || '').trim();

  const oldDeadline = project.deadline;
  const deadlineChanged = (oldDeadline !== newDeadline);

  project.progress = newProgress;
  project.health = newHealth;
  project.weeklyNotes = newNotes;
  project.deadline = newDeadline;

  if (newProgress === 100) {
    project.status = 'Concluído';
  } else if (newProgress > 0) {
    project.status = 'Em Andamento';
  }

  const user = AppState.session.user;
  if (!project.comments) project.comments = [];

  let deadlineCommentText = '';
  if (deadlineChanged) {
    deadlineCommentText = ` • Prazo alterado de "${formatDateBR(oldDeadline)}" para "${formatDateBR(newDeadline)}"`;
    if (deadlineMsg) {
      deadlineCommentText += ` (Motivo: "${deadlineMsg}")`;
    }
  }

  project.comments.unshift({
    author: user.name,
    role: user.role,
    date: getFormattedNow(),
    text: `Status atualizado: ${newProgress}% (${translateHealth(newHealth)})${deadlineCommentText}. Nota: "${newNotes || 'Sem observações'}"`
  });

  // Gera notificacao para a central executiva do Allan
  const changeTypeStr = deadlineChanged ? 'Prazo & Status' : 'Atualização de Status';
  const changeDetails = `Progresso: ${newProgress}% (${translateHealth(newHealth)})${deadlineChanged ? ` • Prazo: ${formatDateBR(newDeadline)}` : ''}`;
  const changeMsg = deadlineMsg || newNotes || 'Atualização realizada pelo responsável.';

  addNotification({
    id: 'notif_' + Date.now(),
    author: user.name,
    role: user.role,
    client: project.client || 'Geral',
    projectId: project.id,
    projectTitle: project.title,
    date: getFormattedNow(),
    changeType: changeTypeStr,
    details: changeDetails,
    message: changeMsg,
    isNew: true
  });

  saveProjectsData();
  closeModal('modal-update-status');

  if (user.role === 'Gerente') {
    renderGerenteView();
  } else {
    renderColaboradorView();
  }

  showToast('Status e prazo atualizados com sucesso.', 'success');
}

// Exclusao de projetos inseridos incorretamente
function handleDeleteProject(projectId) {
  const project = AppState.projects.find(p => p.id === projectId);
  if (!project) return;

  const user = AppState.session?.user;
  if (!user) return;

  const isOwner = (project.responsibleEmail && project.responsibleEmail.trim().toLowerCase() === user.email.trim().toLowerCase()) ||
                  (project.responsibleUsername && user.username && project.responsibleUsername.trim().toLowerCase() === user.username.trim().toLowerCase());
  const isGerente = user.role === 'Gerente';

  if (!isGerente && !isOwner) {
    showToast('Você só pode remover projetos cadastrados sob sua responsabilidade.', 'error');
    return;
  }

  const confirmMsg = `Deseja realmente remover o projeto "${project.id} - ${project.title}" do cliente ${project.client || 'Geral'}? Esta ação é definitiva.`;
  if (!confirm(confirmMsg)) return;

  AppState.projects = AppState.projects.filter(p => p.id !== projectId);
  saveProjectsData();

  closeModal('modal-detail-project');
  closeModal('modal-update-status');

  populateClientFilterOptions();

  if (user.role === 'Gerente') {
    renderGerenteView();
  } else {
    renderColaboradorView();
  }

  showToast(`Projeto ${project.id} removido com sucesso.`, 'info');
}

// Alterna exibicao do campo de texto quando o cliente selecionado for "Outros"
function toggleNewProjectClientCustom(val) {
  const customField = document.getElementById('field-new-project-client-custom');
  const customInput = document.getElementById('new-project-client-custom');
  if (!customField) return;
  if (val === 'Outros') {
    customField.classList.remove('hidden');
    if (customInput) customInput.focus();
  } else {
    customField.classList.add('hidden');
    if (customInput) customInput.value = '';
  }
}

// Controle de prazo indeterminado no modal de criacao
function toggleIndefiniteDeadline(isIndefinite) {
  const dateInput = document.getElementById('new-project-deadline');
  if (!dateInput) return;
  if (isIndefinite) {
    dateInput.value = '';
    dateInput.disabled = true;
    dateInput.required = false;
    dateInput.classList.add('opacity-50', 'bg-slate-200');
  } else {
    dateInput.disabled = false;
    dateInput.required = true;
    dateInput.classList.remove('opacity-50', 'bg-slate-200');
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 30);
    dateInput.value = defaultDate.toISOString().split('T')[0];
  }
}

function openNewProjectModal() {
  if (!AppState.session) return;

  const indefiniteCheck = document.getElementById('new-project-indefinite');
  if (indefiniteCheck) {
    indefiniteCheck.checked = false;
    toggleIndefiniteDeadline(false);
  }

  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 30);
  const dateInput = document.getElementById('new-project-deadline');
  if (dateInput) {
    dateInput.value = defaultDate.toISOString().split('T')[0];
  }

  // Reseta selecao de cliente (Santander por padrao, Outros oculto)
  const clientSelect = document.getElementById('new-project-client-select');
  if (clientSelect) {
    clientSelect.value = 'Santander';
    toggleNewProjectClientCustom('Santander');
  }

  openModal('modal-new-project');
}

// Criar nova iniciativa: Cliente e selecionado aqui (Santander, Vivo, XP, Outros) e Responsavel e automatico
function handleCreateProject(event) {
  event.preventDefault();
  const title = document.getElementById('new-project-title').value.trim();
  
  // Leitura do cliente com regra de "Outros"
  const clientSelect = document.getElementById('new-project-client-select')?.value || 'Santander';
  const clientCustom = document.getElementById('new-project-client-custom')?.value.trim();
  const client = (clientSelect === 'Outros') ? (clientCustom || 'Outros') : clientSelect;

  const category = document.getElementById('new-project-category').value.trim() || 'Geral';
  const isIndefinite = document.getElementById('new-project-indefinite')?.checked;
  const deadlineInput = document.getElementById('new-project-deadline');
  const deadline = isIndefinite ? 'Indeterminado' : deadlineInput.value;
  const health = document.getElementById('new-project-health').value;
  const description = document.getElementById('new-project-desc').value.trim();

  if (!isIndefinite && !deadline) {
    showToast('Informe o prazo ou marque (Indeterminado).', 'warning');
    return;
  }

  // O criador da iniciativa e automaticamente o responsavel (auto-alimentavel)
  const respUser = AppState.session?.user || AppState.users[0];
  const newProjId = 'PRJ-' + new Date().getFullYear() + '-' + String(AppState.projects.length + 1).padStart(3, '0');

  const newProject = {
    id: newProjId,
    client: client,
    title: title,
    category: category,
    description: description,
    responsibleName: respUser.name,
    responsibleUsername: respUser.username || '',
    responsibleEmail: respUser.email,
    status: 'Em Andamento',
    progress: 0,
    health: health,
    deadline: deadline,
    weeklyNotes: 'Iniciativa cadastrada no portfólio.',
    comments: [
      {
        author: respUser.name,
        role: respUser.role,
        date: getFormattedNow(),
        text: `Projeto cadastrado para o cliente ${client}.`
      }
    ]
  };

  AppState.projects.unshift(newProject);
  saveProjectsData();
  closeModal('modal-new-project');
  document.getElementById('form-new-project').reset();
  toggleIndefiniteDeadline(false);
  toggleNewProjectClientCustom('Santander');

  // Notificacao de novo projeto criado
  addNotification({
    id: 'notif_' + Date.now(),
    author: respUser.name,
    role: respUser.role,
    client: client,
    projectId: newProjId,
    projectTitle: title,
    date: getFormattedNow(),
    changeType: 'Novo Projeto',
    details: `Iniciativa cadastrada no portfólio para o cliente ${client} • Prazo: ${formatDateBR(deadline)}`,
    message: description || 'Novo projeto cadastrado.',
    isNew: true
  });

  populateClientFilterOptions();

  if (AppState.session.user.role === 'Gerente') {
    renderGerenteView();
  } else {
    renderColaboradorView();
  }

  showToast(`Projeto ${newProjId} cadastrado com sucesso (${client}).`, 'success');
}

function openProjectDetailModal(projectId) {
  const project = AppState.projects.find(p => p.id === projectId);
  if (!project) return;

  AppState.activeModalProjectId = projectId;

  document.getElementById('modal-detail-id').innerText = project.id;
  document.getElementById('modal-detail-title').innerText = project.title;

  const clientBadge = document.getElementById('modal-detail-client-badge');
  clientBadge.innerText = project.client || 'Geral';

  document.getElementById('modal-detail-meta').innerText = `Cliente: ${project.client || 'Geral'} | Resp: ${project.responsibleName} (${project.responsibleEmail}) | Prazo: ${formatDateBR(project.deadline)}`;
  document.getElementById('modal-detail-desc').innerText = project.description || 'Sem descrição cadastrada.';

  const healthBadgeContainer = document.getElementById('modal-detail-health');
  healthBadgeContainer.innerHTML = renderHealthBadgeHTML(project.health);

  document.getElementById('modal-detail-prog-val').innerText = project.progress + '%';
  const bar = document.getElementById('modal-detail-prog-bar');
  bar.style.width = project.progress + '%';
  bar.className = project.health === 'red' ? 'bg-rose-600 h-2' : (project.health === 'yellow' ? 'bg-amber-500 h-2' : 'bg-blue-700 h-2');

  document.getElementById('modal-detail-notes').innerText = project.weeklyNotes ? `"${project.weeklyNotes}"` : 'Nenhuma observação declarada nesta semana.';

  // Visibilidade do botao de exclusao no modal de detalhes
  const deleteBtn = document.getElementById('modal-detail-delete-btn');
  const user = AppState.session?.user;
  const isOwner = user && ((project.responsibleEmail && project.responsibleEmail.toLowerCase() === user.email.toLowerCase()) || (project.responsibleUsername && user.username && project.responsibleUsername.toLowerCase() === user.username.toLowerCase()));
  if (user && (user.role === 'Gerente' || isOwner)) {
    deleteBtn.classList.remove('hidden');
  } else {
    deleteBtn.classList.add('hidden');
  }

  renderCommentsList(project);
  openModal('modal-detail-project');
}

function renderCommentsList(project) {
  const container = document.getElementById('modal-comments-container');
  container.innerHTML = '';

  if (!project.comments || project.comments.length === 0) {
    container.innerHTML = '<p class="text-xs text-slate-500 italic">Nenhum comentário registrado.</p>';
    return;
  }

  project.comments.forEach(c => {
    const item = document.createElement('div');
    item.className = 'p-2.5 bg-slate-50 rounded border border-slate-200 text-xs';

    const isGerente = c.role === 'Gerente';
    const badge = isGerente
      ? '<span class="text-[10px] font-bold text-blue-800 bg-blue-100 px-1 py-0.2 rounded border border-blue-200">Gerente</span>'
      : `<span class="text-[10px] font-medium text-slate-700 bg-slate-200 px-1 py-0.2 rounded">${sanitize(c.role || 'Equipe')}</span>`;

    item.innerHTML = `
      <div class="flex items-center justify-between mb-1 text-[11px]">
        <div class="flex items-center gap-1.5 font-semibold text-slate-800">
          <span>${sanitize(c.author)}</span>
          ${badge}
        </div>
        <span class="font-mono text-slate-500">${sanitize(c.date)}</span>
      </div>
      <p class="text-slate-700 leading-relaxed">${sanitize(c.text)}</p>
    `;
    container.appendChild(item);
  });
}

function handleAddComment(event) {
  event.preventDefault();
  const input = document.getElementById('modal-comment-input');
  const text = input.value.trim();
  if (!text || !AppState.activeModalProjectId) return;

  const project = AppState.projects.find(p => p.id === AppState.activeModalProjectId);
  if (!project) return;

  const user = AppState.session.user;
  if (!project.comments) project.comments = [];

  project.comments.unshift({
    author: user.name,
    role: user.role,
    date: getFormattedNow(),
    text: text
  });

  saveProjectsData();
  input.value = '';
  renderCommentsList(project);
  showToast('Comentário publicado.', 'info');
}

function toggleHomologationBar() {
  const content = document.getElementById('homologation-content');
  const arrow = document.getElementById('homologation-arrow');
  if (content.classList.contains('hidden')) {
    content.classList.remove('hidden');
    arrow.style.transform = 'rotate(180deg)';
  } else {
    content.classList.add('hidden');
    arrow.style.transform = 'rotate(0deg)';
  }
}

function simulateUserSwitch(credential) {
  const targetUser = AppState.users.find(u => 
    (u.email && u.email.toLowerCase() === credential.toLowerCase()) ||
    (u.username && u.username.toLowerCase() === credential.toLowerCase())
  );
  if (targetUser) {
    createSession(targetUser);
  }
}

function resetDefaultDemoData() {
  if (confirm('Restaurar dados originais de demonstração com clientes e cargos?')) {
    AppState.projects = JSON.parse(JSON.stringify(INITIAL_PROJECTS));
    AppState.users = JSON.parse(JSON.stringify(INITIAL_USERS));
    AppState.notifications = JSON.parse(JSON.stringify(INITIAL_NOTIFICATIONS));
    AppState.securityLogs = [];
    saveProjectsData();
    saveUsersData();
    saveNotificationsData();
    localStorage.removeItem(STORAGE_KEYS.SECURITY_LOGS);

    if (AppState.session && AppState.session.user) {
      applyActiveSession(AppState.session.user);
    }
    showToast('Dados restaurados com sucesso.', 'success');
  }
}

function renderSecurityBadge() {
  const badge = document.getElementById('homologation-security-count');
  if (badge) {
    badge.innerText = `${AppState.securityLogs.length} eventos`;
  }
}

function openSecurityAuditModal() {
  const container = document.getElementById('modal-security-list');
  container.innerHTML = '';

  if (AppState.securityLogs.length === 0) {
    container.innerHTML = '<p class="text-xs text-slate-500 italic p-4 text-center">Nenhum evento registrado.</p>';
  } else {
    AppState.securityLogs.forEach(log => {
      const item = document.createElement('div');
      item.className = 'p-2.5 bg-slate-50 rounded border border-slate-200 text-xs font-mono';
      item.innerHTML = `
        <div class="flex justify-between text-slate-500 text-[10px] mb-1">
          <span class="font-bold text-rose-700">${sanitize(log.type)}</span>
          <span>${sanitize(log.formattedDate)}</span>
        </div>
        <p class="text-slate-800">${sanitize(log.description)}</p>
        <span class="text-[10px] text-slate-500 block mt-1">Origem: ${sanitize(log.userEmail)}</span>
      `;
      container.appendChild(item);
    });
  }

  openModal('modal-security-audit');
}

function setupEventListeners() {
  const tabLogin = document.getElementById('tab-btn-login');
  const tabRegister = document.getElementById('tab-btn-register');

  if (tabLogin && tabRegister) {
    tabLogin.addEventListener('click', () => switchAuthTab('login'));
    tabRegister.addEventListener('click', () => switchAuthTab('register'));
  }

  const regRoleSelect = document.getElementById('reg-role');
  const govTokenField = document.getElementById('field-gov-token');

  if (regRoleSelect && govTokenField) {
    regRoleSelect.addEventListener('change', (e) => {
      if (e.target.value === 'Gerente') {
        govTokenField.classList.remove('hidden');
      } else {
        govTokenField.classList.add('hidden');
      }
    });
  }

  // Listener para selecao de cliente em "+ Novo Projeto"
  const npClientSelect = document.getElementById('new-project-client-select');
  if (npClientSelect) {
    npClientSelect.addEventListener('change', (e) => toggleNewProjectClientCustom(e.target.value));
  }

  const modalRange = document.getElementById('modal-update-range');
  if (modalRange) {
    modalRange.addEventListener('input', (e) => {
      document.getElementById('modal-update-progress-label').innerText = e.target.value + '%';
    });
  }
}

function switchAuthTab(tab) {
  const loginBtn = document.getElementById('tab-btn-login');
  const regBtn = document.getElementById('tab-btn-register');
  const loginForm = document.getElementById('form-login');
  const regForm = document.getElementById('form-register');

  if (tab === 'login') {
    loginBtn.className = 'py-1.5 text-xs font-semibold rounded bg-white text-blue-700 shadow-xs';
    regBtn.className = 'py-1.5 text-xs font-medium rounded text-slate-600 hover:text-slate-900';
    loginForm.classList.remove('hidden');
    regForm.classList.add('hidden');
  } else {
    regBtn.className = 'py-1.5 text-xs font-semibold rounded bg-white text-blue-700 shadow-xs';
    loginBtn.className = 'py-1.5 text-xs font-medium rounded text-slate-600 hover:text-slate-900';
    regForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
  }
}

function showScreen(screenId) {
  document.getElementById('screen-login').classList.add('hidden');
  document.getElementById('screen-app').classList.add('hidden');
  document.getElementById('screen-app').classList.remove('flex');

  const target = document.getElementById(screenId);
  target.classList.remove('hidden');
  if (screenId === 'screen-app') {
    target.classList.add('flex');
  }
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('hidden');
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('hidden');
}

function populateResponsibleOptions() {
  const filterSelect = document.getElementById('table-filter-colab');

  if (filterSelect) {
    filterSelect.innerHTML = '<option value="all">Todos os Responsáveis</option>';
    AppState.users.forEach(u => {
      const opt = document.createElement('option');
      opt.value = u.email;
      opt.textContent = `${u.name} (${u.role})`;
      filterSelect.appendChild(opt);
    });
  }

  const debugSelect = document.getElementById('debug-switch-user');
  if (debugSelect) {
    debugSelect.innerHTML = '';
    AppState.users.forEach(u => {
      const opt = document.createElement('option');
      opt.value = u.email;
      opt.textContent = `${u.name} [${u.role}]`;
      debugSelect.appendChild(opt);
    });
    if (AppState.session && AppState.session.user) {
      debugSelect.value = AppState.session.user.email;
    }
  }
}

function populateClientFilterOptions() {
  const filterClient = document.getElementById('table-filter-client');
  if (!filterClient) return;

  const currentSelection = filterClient.value || 'all';

  const clientsSet = new Set();
  AppState.projects.forEach(p => {
    if (p.client && p.client.trim()) clientsSet.add(p.client.trim());
  });

  filterClient.innerHTML = '<option value="all">Todos os Clientes</option>';
  Array.from(clientsSet).sort().forEach(c => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c;
    filterClient.appendChild(opt);
  });

  filterClient.value = currentSelection;
}

function renderClientBadgeHTML(client) {
  const c = client || 'Geral';
  const cLower = c.toLowerCase();

  let colorClasses = 'bg-slate-100 text-slate-800 border-slate-300';
  if (cLower.includes('santander')) {
    colorClasses = 'bg-rose-50 text-rose-800 border-rose-200';
  } else if (cLower.includes('xp')) {
    colorClasses = 'bg-amber-50 text-amber-900 border-amber-300';
  } else if (cLower.includes('vivo')) {
    colorClasses = 'bg-purple-50 text-purple-800 border-purple-200';
  } else if (cLower.includes('allan')) {
    colorClasses = 'bg-blue-50 text-blue-800 border-blue-200';
  }

  return `<span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${colorClasses}">${sanitize(c)}</span>`;
}

function renderHealthBadgeHTML(health) {
  if (health === 'green') {
    return `<span class="health-badge green"><span class="health-badge-dot"></span>No Prazo</span>`;
  } else if (health === 'yellow') {
    return `<span class="health-badge yellow"><span class="health-badge-dot"></span>Em Atenção</span>`;
  } else {
    return `<span class="health-badge red"><span class="health-badge-dot"></span>Crítico</span>`;
  }
}

function translateHealth(h) {
  if (h === 'green') return 'No Prazo';
  if (h === 'yellow') return 'Em Atenção';
  return 'Crítico';
}

function formatDateBR(dateStr) {
  if (!dateStr) return '-';
  if (dateStr === 'Indeterminado' || dateStr.toLowerCase() === 'indeterminado') {
    return 'Indeterminado';
  }
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

function getFormattedNow() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');

  let borderColor = 'border-slate-300';
  let badgeText = 'INFO';
  let badgeColor = 'bg-slate-100 text-slate-700';

  if (type === 'success') {
    borderColor = 'border-emerald-500';
    badgeText = 'SUCESSO';
    badgeColor = 'bg-emerald-100 text-emerald-800';
  } else if (type === 'warning') {
    borderColor = 'border-amber-500';
    badgeText = 'AVISO';
    badgeColor = 'bg-amber-100 text-amber-800';
  } else if (type === 'error') {
    borderColor = 'border-rose-600';
    badgeText = 'ERRO';
    badgeColor = 'bg-rose-100 text-rose-800';
  }

  toast.className = `p-3 bg-white rounded border-l-4 ${borderColor} shadow-md text-xs pointer-events-auto transition duration-200 transform translate-y-1 opacity-0`;
  toast.innerHTML = `
    <div class="flex items-center justify-between gap-2 mb-1">
      <span class="text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${badgeColor}">${badgeText}</span>
      <span class="text-[10px] text-slate-500 font-mono">${getFormattedNow().split(' ')[1]}</span>
    </div>
    <div class="text-slate-800 font-medium">${sanitize(message)}</div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.remove('translate-y-1', 'opacity-0');
  }, 10);

  setTimeout(() => {
    toast.classList.add('opacity-0');
    setTimeout(() => toast.remove(), 250);
  }, 4000);
}

function setupSecurityActivityTrackers() {
  ['click', 'keydown', 'mousemove'].forEach(evt => {
    window.addEventListener(evt, () => updateSessionActivity(), { passive: true });
  });

  // Garante que usuario sem perfil de gerente nao acesse a visao restrita
  const observer = new MutationObserver(() => {
    if (AppState.session && AppState.session.user && AppState.session.user.role !== 'Gerente') {
      const gerenteView = document.getElementById('view-gerente');
      if (gerenteView && !gerenteView.classList.contains('hidden')) {
        gerenteView.classList.add('hidden');
        recordSecurityIncident('INVASAO_DOM_F12', 'Tentativa de visualização do painel restrito.');
        showToast('Acesso negado: sem permissão para o painel de Gerente.', 'error');
        renderColaboradorView();
      }
    }
  });

  const appView = document.getElementById('screen-app');
  if (appView) {
    observer.observe(appView, { attributes: true, subtree: true, attributeFilter: ['class', 'style'] });
  }
}

document.addEventListener('DOMContentLoaded', initApplication);
