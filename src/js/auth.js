// ============================================================
// auth.js — Autenticação SHA-256, Gerente Único, RBAC & DOM Guard
// Projetos Allan Santos — Portal de Governança & PMO
// ============================================================

'use strict';

let managerSimulationUnlocked = false;
let domGuardObserver = null;

// Hash SHA-256 puro em JS para não expor senhas em texto puro no código nem no armazenamento local
function sha256Hex(input) {
  const str = String(input || '');
  const bytes = typeof TextEncoder !== 'undefined'
    ? Array.from(new TextEncoder().encode(str))
    : Array.from(unescape(encodeURIComponent(str)), ch => ch.charCodeAt(0));

  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];
  const H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];

  const bitLen = bytes.length * 8;
  bytes.push(0x80);
  while ((bytes.length % 64) !== 56) bytes.push(0);
  const hi = Math.floor(bitLen / 4294967296);
  const lo = bitLen >>> 0;
  for (let i = 24; i >= 0; i -= 8) bytes.push((hi >>> i) & 0xff);
  for (let i = 24; i >= 0; i -= 8) bytes.push((lo >>> i) & 0xff);

  const rotr = (x, n) => (x >>> n) | (x << (32 - n));
  const W = new Array(64);

  for (let offset = 0; offset < bytes.length; offset += 64) {
    for (let i = 0; i < 16; i++) {
      W[i] = (
        (bytes[offset + i * 4] << 24) |
        (bytes[offset + i * 4 + 1] << 16) |
        (bytes[offset + i * 4 + 2] << 8) |
        bytes[offset + i * 4 + 3]
      ) >>> 0;
    }
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(W[i - 15], 7) ^ rotr(W[i - 15], 18) ^ (W[i - 15] >>> 3);
      const s1 = rotr(W[i - 2], 17) ^ rotr(W[i - 2], 19) ^ (W[i - 2] >>> 10);
      W[i] = (W[i - 16] + s0 + W[i - 7] + s1) >>> 0;
    }

    let a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K[i] + W[i]) >>> 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;
      h = g; g = f; f = e;
      e = (d + temp1) >>> 0;
      d = c; c = b; b = a;
      a = (temp1 + temp2) >>> 0;
    }
    H[0] = (H[0] + a) >>> 0; H[1] = (H[1] + b) >>> 0;
    H[2] = (H[2] + c) >>> 0; H[3] = (H[3] + d) >>> 0;
    H[4] = (H[4] + e) >>> 0; H[5] = (H[5] + f) >>> 0;
    H[6] = (H[6] + g) >>> 0; H[7] = (H[7] + h) >>> 0;
  }

  return H.map(w => (w >>> 0).toString(16).padStart(8, '0')).join('');
}

function hashPassword(password, userId) {
  return sha256Hex(AUTH_SALT + ':' + String(userId || '') + ':' + String(password || ''));
}

function sanitizeSessionUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    username: user.username,
    role: user.id === MANAGER_USER_ID ? 'Gerente' : 'Colaborador'
  };
}

function isManagerUser(user) {
  return !!(user && user.id === MANAGER_USER_ID && user.role === 'Gerente');
}

function isSimulationAllowed() {
  return managerSimulationUnlocked === true && AppState.session?.canSimulate === true;
}

// ========================
// LOGIN & CADASTRO
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

  const inputHash = user ? hashPassword(password, user.id) : '';
  if (!user || user.passHash !== inputHash) {
    errorEl.textContent = 'Usuário ou senha inválidos.';
    errorEl.classList.remove('hidden');
    return;
  }

  const isMgr = isManagerUser(user);
  managerSimulationUnlocked = isMgr;
  AppState.session = {
    user: sanitizeSessionUser(user),
    canSimulate: isMgr
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

  // Gerente único: novos cadastros recebem exclusivamente perfil Colaborador
  const role = 'Colaborador';
  const id = generateId('usr');
  const newUser = {
    id,
    name,
    email,
    username,
    passHash: hashPassword(password, id),
    role
  };

  AppState.users.push(newUser);
  managerSimulationUnlocked = false;
  AppState.session = {
    user: sanitizeSessionUser(newUser),
    canSimulate: false
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

function logout() {
  managerSimulationUnlocked = false;
  AppState.session = null;
  DataStore.clearSession();
  closeModal('modal-activity');
  closeModal('modal-ritm');
  hideGanttTooltip();
  document.getElementById('popover-notifications')?.classList.remove('open');
  syncHomologationBar();
  const execSlot = document.getElementById('exec-note-form-slot');
  if (execSlot) execSlot.innerHTML = '';
  document.getElementById('app-shell').classList.add('hidden');
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('login-form').reset();
  document.getElementById('login-error').classList.add('hidden');
}

// ========================
// RBAC & ESCOPO DE DADOS
// ========================

// Trava de segurança: separa Gerente único (visão consolidada) de Colaborador (só suas frentes)
function checkAccessPermission(requiredRole) {
  const user = AppState.session?.user;
  if (!user) return false;
  if (requiredRole === 'Gerente') {
    return isManagerUser(user);
  }
  return true;
}

function isOwnerOrManager(ownerEmail) {
  const user = AppState.session?.user;
  if (!user) return false;
  if (isManagerUser(user)) return true;
  return (ownerEmail || '').toLowerCase() === (user.email || '').toLowerCase();
}

// Colaborador nunca enxerga entregas ou RITMs de outros colegas na memória renderizada
function getAccessibleActivities() {
  const user = AppState.session?.user;
  if (!user) return [];
  if (isManagerUser(user)) return AppState.activities;
  const myEmail = (user.email || '').toLowerCase();
  return AppState.activities.filter(a => (a.responsibleEmail || '').toLowerCase() === myEmail);
}

function getAccessibleRitms() {
  const user = AppState.session?.user;
  if (!user) return [];
  if (isManagerUser(user)) return AppState.ritms;
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
  if (isManagerUser(user)) return AppState.execNotes;
  const myActs = getAccessibleActivities();
  const myClients = new Set(myActs.map(a => a.client));
  const mySystems = new Set(myActs.map(a => a.system.toLowerCase()));
  return AppState.execNotes.filter(n =>
    n.client === 'Geral' ||
    (myClients.has(n.client) && (!n.system || mySystems.has(n.system.toLowerCase())))
  );
}

function getVisibleNotifications() {
  const user = AppState.session?.user;
  if (!user) return [];
  if (isManagerUser(user)) return AppState.notifications;

  const myEmail = (user.email || '').toLowerCase();
  return AppState.notifications.filter(n => n.targetEmail && n.targetEmail.toLowerCase() === myEmail);
}

// Vigia manipulação manual do DOM no navegador caso usuário tente injetar painel restrito
function initDomGuard() {
  if (domGuardObserver) return;
  const execSlot = document.getElementById('exec-note-form-slot');

  domGuardObserver = new MutationObserver(() => {
    const execForm = document.getElementById('exec-note-form');
    if (execForm && !checkAccessPermission('Gerente')) {
      execForm.remove();
      console.warn('[DomGuard] Bloqueada tentativa de exibir formulário executivo para colaborador.');
    }
    const homoBar = document.getElementById('homologation-bar');
    if (homoBar && !isSimulationAllowed()) {
      homoBar.remove();
    }
  });

  if (execSlot) domGuardObserver.observe(execSlot, { childList: true, subtree: true });
  if (document.body) domGuardObserver.observe(document.body, { childList: true });
}

// ========================
// HOMOLOGAÇÃO (SIMULAÇÃO PARA GERENTE)
// ========================

// Insere ou remove a barra de homologação dinamicamente para não deixar controles de gerente no HTML inicial
function syncHomologationBar() {
  const existing = document.getElementById('homologation-bar');
  if (!isSimulationAllowed()) {
    if (existing) existing.remove();
    return;
  }
  if (!existing) {
    const tpl = document.createElement('template');
    tpl.innerHTML =
      '<div id="homologation-bar" class="no-print">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>' +
        '<span>Modo Homologação (Gerente) — Simular visão como:</span>' +
        '<select id="debug-switch-user" onchange="switchDebugUser()"></select>' +
      '</div>';
    document.body.appendChild(tpl.content.firstElementChild);
  }
  populateDebugSwitchUser();
}

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
  if (!isSimulationAllowed()) {
    showToast('Simulação exclusiva para o gerente autenticado.', 'error');
    return;
  }
  const select = document.getElementById('debug-switch-user');
  const user = AppState.users.find(u => u.id === select?.value);
  if (!user) return;

  AppState.session = { user: sanitizeSessionUser(user), canSimulate: true };
  saveState();
  clearFilters();
  showApp();
  showToast('Simulando visão de: ' + user.name + ' (' + user.role + ')', 'success');
}
