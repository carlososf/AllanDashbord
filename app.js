/* ==========================================================================
   Projetos Allan Santos — Portal de Governança | XP
   app.js — Aplicação unificada na raiz (Auth, RBAC, Store, WBS, Gantt & Hypercare)
   ========================================================================== */

(function () {
  'use strict';

  // Chave única de persistência exclusiva dos projetos XP
  const STORAGE_KEY_PORTAL = 'xp_gov_portal_v1';

  // Chaves legadas de versões anteriores que precisam ser varridas no boot
  const LEGACY_STORAGE_KEYS = [
    'as_gov_users_v3',
    'as_gov_session_v3',
    'as_gov_wbs_activities_v4',
    'as_gov_wbs_ritms_v4',
    'as_gov_wbs_exec_notes_v4',
    'as_gov_wbs_notifs_v4',
    'as_gov_demo_seed_v5',
    'gov_portal_data_v1',
    'gov_portal_xp_real_v1',
    'gov_portal_xp_real_v1_acts',
    'gov_portal_xp_real_v1_ritms',
    'gov_portal_xp_real_v1_notes',
    'gov_portal_xp_real_v1_notifs'
  ];

  // Gerente único autorizado no portal (ninguém mais recebe perfil Gerente)
  const MANAGER_USER_ID = 'usr-001';
  const AUTH_SALT = 'asgov-2026';

  const DEFAULT_MANAGER = {
    id: MANAGER_USER_ID,
    name: 'Allan Santos',
    username: 'AllanSantos',
    email: 'allan.santos@consultoria.com',
    role: 'Gerente',
    passHash: '8b2b7473fd9dcbb135da011ab65487d300f89bdd3e234eadcbd8fc89c35f2782'
  };

  // Base inicial real exclusiva de projetos XP (9 entregas em 3 módulos)
  const SEED_ACTIVITIES = [
    {
      id: 'XP-001',
      system: 'SAP Recruiting',
      macro: 'A - Convivência & Migração de Dados',
      title: 'Migração dos Currículos para o Blobstorage',
      responsibleName: 'Fabio Lima / Thiago Doria',
      squad: 'People Analytics / Squad Change',
      responsibleEmail: 'fabio.lima@xpinc.com',
      start: '2026-11-09',
      end: '2026-11-13',
      newEnd: '',
      status: 'Em andamento',
      progress: 45,
      notes: 'Extração e carga histórica dos currículos do Greenhouse para Blobstorage.'
    },
    {
      id: 'XP-002',
      system: 'SAP Recruiting',
      macro: 'A - Convivência & Migração de Dados',
      title: 'Criação de De-Para dos campos (Greenhouse x SAP)',
      responsibleName: 'Fabio Lima',
      squad: 'Squad SAP / People Analytics',
      responsibleEmail: 'fabio.lima@xpinc.com',
      start: '2026-11-06',
      end: '2026-11-12',
      newEnd: '',
      status: 'Em atenção',
      progress: 70,
      notes: 'Validação final dos campos críticos antes da virada do Piloto 2.'
    },
    {
      id: 'XP-003',
      system: 'SAP Recruiting',
      macro: 'B - Operação & Convivência R&S',
      title: 'Acompanhamento de Vagas e Indicadores (nos dois sistemas)',
      responsibleName: 'Luiza Angélica',
      squad: 'R&S',
      responsibleEmail: 'luiza.angelica@xpinc.com',
      start: '2026-10-14',
      end: '2026-12-31',
      newEnd: '',
      status: 'Em andamento',
      progress: 35,
      notes: 'Governança rígida durante período de convivência Greenhouse e SAP Recruiting.'
    },
    {
      id: 'XP-004',
      system: 'Admissão Digital',
      macro: 'A - Integração & Homologação',
      title: 'Homologação da solução GreenHouse > Genera',
      responsibleName: 'Sara Campos / Karina Andreto',
      squad: 'Admissão / Epi-Use',
      responsibleEmail: 'sara.campos@xpinc.com',
      start: '2026-10-20',
      end: '2026-10-26',
      newEnd: '2026-10-30',
      status: 'Concluído',
      progress: 100,
      notes: 'Warroom de validação da integração concluída com sucesso.'
    },
    {
      id: 'XP-005',
      system: 'Admissão Digital',
      macro: 'B - Legado & Decommission Vlow',
      title: 'Execução do robô do legado Vlow',
      responsibleName: 'Guilherme Magalhães / Karina Andreto',
      squad: 'Run&Ops / Admissão',
      responsibleEmail: 'guilherme.magalhaes@xpinc.com',
      start: '2026-11-04',
      end: '2026-11-04',
      newEnd: '2026-11-06',
      status: 'Em atenção',
      progress: 80,
      notes: 'Reprogramado em +2 dias para saneamento das evidências de adesão.'
    },
    {
      id: 'XP-006',
      system: 'Admissão Digital',
      macro: 'B - Legado & Decommission Vlow',
      title: 'Cálculo da volumetria de documentos não integrados - Vlow',
      responsibleName: 'Rafael Oliveira / Ivo Hashimoto',
      squad: 'Squad SAP',
      responsibleEmail: 'rafael.oliveira@xpinc.com',
      start: '2026-11-06',
      end: '2026-11-10',
      newEnd: '',
      status: 'Atrasado',
      progress: 65,
      notes: 'Aguardando fechamento da volumetria final junto à Squad SAP.'
    },
    {
      id: 'XP-007',
      system: 'Onboarding & Acessos',
      macro: 'A - Gestão de Acessos (Piloto 2)',
      title: 'Consolidar e disponibilizar a lista de usuários do Piloto 2',
      responsibleName: 'Beatriz Mancini',
      squad: 'R&S',
      responsibleEmail: 'beatriz.mancini@xpinc.com',
      start: '2026-11-06',
      end: '2026-11-13',
      newEnd: '',
      status: 'Em andamento',
      progress: 60,
      notes: 'Base de recrutadores e líderes em validação para liberação de perfis.'
    },
    {
      id: 'XP-008',
      system: 'Onboarding & Acessos',
      macro: 'A - Gestão de Acessos (Piloto 2)',
      title: 'Configuração de Acessos - Piloto 2',
      responsibleName: 'Luiz Jorge / Débora Sawada',
      squad: 'Gestão de Acessos',
      responsibleEmail: 'luiz.jorge@xpinc.com',
      start: '2026-11-18',
      end: '2026-11-27',
      newEnd: '',
      status: 'Não iniciado',
      progress: 0,
      notes: 'Depende da entrega da lista consolidada de usuários do Piloto 2.'
    },
    {
      id: 'XP-009',
      system: 'Onboarding & Acessos',
      macro: 'B - Sustentação & WarRoom',
      title: 'Canal de suporte e Monitoramento da adoção (WarRoom)',
      responsibleName: 'Camila Silva / Tatiana Lima',
      squad: 'PMO / Squad SAP / Epi-Use',
      responsibleEmail: 'camila.silva@xpinc.com',
      start: '2026-11-03',
      end: '2027-01-01',
      newEnd: '',
      status: 'Em andamento',
      progress: 30,
      notes: 'Acompanhamento diário de estabilização pós-go-live.'
    }
  ];

  // 3 chamados reais iniciais de Hypercare XP
  const SEED_RITMS = [
    {
      uid: 'ritm-xp-1',
      code: 'RITM18437224',
      system: 'SAP Recruiting',
      description: 'Disponibilizar para o LinkedIn o XML do job posting conforme solicitado.',
      action: 'Feed XML ajustado e disponibilizado. Fechado no Taylor.',
      severity: 'Alta (P2)',
      squad: 'EPI Use - Karina Santos',
      status: 'Concluído',
      ownerEmail: 'karina.santos@epiuse.com'
    },
    {
      uid: 'ritm-xp-2',
      code: 'RITM18437741',
      system: 'Admissão Digital',
      description: 'Quando há declínio na Admissão Digital (Genera), atualizar o status da posição para o recrutamento no EC.',
      action: 'Ajuste realizado no ADM Digital e disponível no ambiente de QAS para validação.',
      severity: 'Média (P3)',
      squad: 'EPI Use - Natanael',
      status: 'Em análise',
      ownerEmail: 'natanael@epiuse.com'
    },
    {
      uid: 'ritm-xp-3',
      code: 'RITM18437763',
      system: 'Onboarding & Acessos',
      description: 'Contrato de Trabalho e mensagens do Onboarding devem ser enviados para o e-mail pessoal dos colaboradores.',
      action: 'Correção feita no ADM Digital; testes em andamento com Karina Andreto em QAS.',
      severity: 'Média (P3)',
      squad: 'EPI Use - Natanael / Squad SAP - Fabio e Rafael',
      status: 'Em análise',
      ownerEmail: 'natanael@epiuse.com'
    }
  ];

  // Cobrança executiva inicial
  const SEED_EXEC_NOTES = [
    {
      id: 'xp-note-001',
      system: 'Admissão Digital',
      author: 'Allan Santos',
      date: '11/11/2026',
      text: 'Validar fechamento da volumetria de documentos não integrados da Vlow (XP-006) e conclusão dos testes em QAS do RITM18437741.'
    }
  ];

  const SEED_NOTIFICATIONS = [
    {
      id: 'notif-xp-1',
      title: 'Atraso crítico em Admissão Digital (XP-006)',
      body: 'Volumetria de documentos não integrados da Vlow venceu em 10/11/2026 — aguardando fechamento da Squad SAP.',
      time: '11/11/2026 09:30',
      read: false,
      targetTab: 'wbs'
    },
    {
      id: 'notif-xp-2',
      title: 'Validação em QAS pendente — RITM18437741',
      body: 'Atualização de posição no EC após declínio na Admissão Digital disponível em QAS para teste.',
      time: '11/11/2026 10:15',
      read: false,
      targetTab: 'hypercare'
    }
  ];

  const STATUS_RANK = {
    'Bloqueado': 6,
    'Atrasado': 5,
    'Em atenção': 4,
    'Em andamento': 3,
    'Não iniciado': 2,
    'Concluído': 1
  };

  const ZOOM_WIDTHS = {
    compact: 18,
    normal: 32,
    expanded: 48
  };

  const MONTH_SHORT_PT = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
  ];

  // Estado principal da sessão em memória (nunca exposto direto no window)
  let portalData = null;
  let currentUser = null;
  let simulationUser = null;
  let activeTab = 'overview';
  let ganttZoom = 'normal';
  let refDateIso = getTodayIso();

  const filterState = {
    system: '',
    status: '',
    responsible: '',
    search: '',
    hideDone: false
  };

  const expandedSystems = new Set();
  const expandedMacros = new Set();
  let domGuardObserver = null;

  /* ========================================================================
     UTILITÁRIOS: XSS, DATA UTC E CRIPTOGRAFIA SHA-256
     ======================================================================== */

  // Toda string vinda de formulário/storage passa por aqui antes de tocar innerHTML — evita XSS
  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function normalizeText(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();
  }

  function getTodayIso() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function formatNowBr() {
    const now = new Date();
    const d = String(now.getDate()).padStart(2, '0');
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const y = now.getFullYear();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    return `${d}/${m}/${y} ${hh}:${mm}`;
  }

  function formatDateShortBr() {
    const now = new Date();
    const d = String(now.getDate()).padStart(2, '0');
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${d}/${m}/${now.getFullYear()}`;
  }

  function isoToMsUTC(iso) {
    if (!iso || typeof iso !== 'string') return NaN;
    const parts = iso.split('-');
    if (parts.length !== 3) return NaN;
    return Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  }

  function msToIsoUTC(ms) {
    const dt = new Date(ms);
    const y = dt.getUTCFullYear();
    const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
    const d = String(dt.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function diffDaysUTC(startIso, endIso) {
    const s = isoToMsUTC(startIso);
    const e = isoToMsUTC(endIso);
    if (Number.isNaN(s) || Number.isNaN(e)) return 0;
    return Math.round((e - s) / 86400000);
  }

  function addDaysIsoUTC(iso, deltaDays) {
    const ms = isoToMsUTC(iso);
    if (Number.isNaN(ms)) return iso;
    return msToIsoUTC(ms + deltaDays * 86400000);
  }

  function formatIsoToBr(iso) {
    if (!iso || typeof iso !== 'string') return '—';
    const parts = iso.split('-');
    if (parts.length !== 3) return '—';
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  // SHA-256 síncrono em JS puro (FIPS 180-4) pra rodar liso tanto via file:// quanto HTTPS sem expor senha
  function sha256Hex(rawInput) {
    const str = unescape(encodeURIComponent(String(rawInput || '')));
    const bytes = [];
    for (let i = 0; i < str.length; i++) bytes.push(str.charCodeAt(i));

    const origBitLen = bytes.length * 8;
    bytes.push(0x80);
    while ((bytes.length % 64) !== 56) bytes.push(0);

    const hiBits = Math.floor(origBitLen / 0x100000000);
    const loBits = origBitLen >>> 0;
    for (let i = 3; i >= 0; i--) bytes.push((hiBits >>> (i * 8)) & 0xff);
    for (let i = 3; i >= 0; i--) bytes.push((loBits >>> (i * 8)) & 0xff);

    const H = [
      0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
      0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
    ];
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
    const rotr = (v, n) => (v >>> n) | (v << (32 - n));

    const w = new Array(64);
    for (let offset = 0; offset < bytes.length; offset += 64) {
      for (let i = 0; i < 16; i++) {
        w[i] = (
          (bytes[offset + i * 4] << 24) |
          (bytes[offset + i * 4 + 1] << 16) |
          (bytes[offset + i * 4 + 2] << 8) |
          bytes[offset + i * 4 + 3]
        ) >>> 0;
      }
      for (let i = 16; i < 64; i++) {
        const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
        const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
      }

      let a = H[0], b = H[1], c = H[2], d = H[3];
      let e = H[4], f = H[5], g = H[6], h = H[7];

      for (let i = 0; i < 64; i++) {
        const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
        const ch = (e & f) ^ (~e & g);
        const temp1 = (h + S1 + ch + K[i] + w[i]) >>> 0;
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

    return H.map((n) => n.toString(16).padStart(8, '0')).join('');
  }

  function hashPassword(userId, plainPassword) {
    return sha256Hex(`${AUTH_SALT}:${userId}:${plainPassword}`);
  }

  /* ========================================================================
     PERSISTÊNCIA ÚNICA (xp_gov_portal_v1) & LIMPEZA DE CACHE ANTIGO
     ======================================================================== */

  function purgeLegacyStorage() {
    // Limpa sobras de versões antigas pro usuário nunca ver histórico obsoleto no navegador
    LEGACY_STORAGE_KEYS.forEach((legacyKey) => {
      try {
        localStorage.removeItem(legacyKey);
      } catch (_) {
        /* ignore */
      }
    });
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key !== STORAGE_KEY_PORTAL && (key.startsWith('xp_pd') || key.startsWith('as_gov_') || key.startsWith('gov_portal_'))) {
          localStorage.removeItem(key);
        }
      }
    } catch (_) {
      /* ignore */
    }
  }

  function sanitizeSessionUser(user) {
    if (!user || !user.id) return null;
    // Sessão gravada no storage nunca carrega hash ou campo de senha
    return {
      id: String(user.id),
      name: String(user.name || ''),
      username: String(user.username || ''),
      email: String(user.email || ''),
      role: user.id === MANAGER_USER_ID ? 'Gerente' : 'Colaborador'
    };
  }

  function normalizeUsersList(rawUsers) {
    const list = Array.isArray(rawUsers) ? rawUsers : [];
    const others = list
      .filter((u) => u && u.id && u.id !== MANAGER_USER_ID && normalizeText(u.username) !== 'allansantos')
      .map((u) => {
        const cleanId = String(u.id);
        // Garante hash mesmo se vier registro antigo e trava qualquer usuário comum como Colaborador
        const computedHash = u.passHash
          ? String(u.passHash)
          : (u.password ? hashPassword(cleanId, u.password) : '');
        return {
          id: cleanId,
          name: String(u.name || 'Colaborador'),
          username: String(u.username || cleanId),
          email: String(u.email || ''),
          role: 'Colaborador',
          passHash: computedHash
        };
      });

    // Gerente único fixo: AllanSantos
    return [{ ...DEFAULT_MANAGER }, ...others];
  }

  function createInitialPortalState() {
    return {
      version: 1,
      seeded: true,
      users: normalizeUsersList([]),
      activities: SEED_ACTIVITIES.map((a) => ({ ...a })),
      ritms: SEED_RITMS.map((r) => ({ ...r })),
      execNotes: SEED_EXEC_NOTES.map((n) => ({ ...n })),
      notifications: SEED_NOTIFICATIONS.map((n) => ({ ...n })),
      session: null
    };
  }

  function loadStore() {
    purgeLegacyStorage();
    try {
      const raw = localStorage.getItem(STORAGE_KEY_PORTAL);
      if (!raw) {
        portalData = createInitialPortalState();
        saveStore();
        return;
      }
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.seeded || !Array.isArray(parsed.activities)) {
        portalData = createInitialPortalState();
        saveStore();
        return;
      }

      portalData = {
        version: 1,
        seeded: true,
        users: normalizeUsersList(parsed.users),
        activities: parsed.activities.map((a) => ({
          id: String(a.id || ''),
          system: String(a.system || 'Projeto XP'),
          macro: String(a.macro || 'Geral'),
          title: String(a.title || ''),
          responsibleName: String(a.responsibleName || ''),
          squad: String(a.squad || ''),
          responsibleEmail: String(a.responsibleEmail || ''),
          start: String(a.start || refDateIso),
          end: String(a.end || refDateIso),
          newEnd: String(a.newEnd || ''),
          status: String(a.status || 'Não iniciado'),
          progress: Math.max(0, Math.min(100, Number(a.progress) || 0)),
          notes: String(a.notes || '')
        })),
        ritms: Array.isArray(parsed.ritms) ? parsed.ritms.map((r) => ({ ...r })) : SEED_RITMS.map((r) => ({ ...r })),
        execNotes: Array.isArray(parsed.execNotes) ? parsed.execNotes.map((n) => ({ ...n })) : [],
        notifications: Array.isArray(parsed.notifications) ? parsed.notifications.map((n) => ({ ...n })) : [],
        session: parsed.session ? sanitizeSessionUser(parsed.session) : null
      };
    } catch (_) {
      portalData = createInitialPortalState();
      saveStore();
    }
  }

  function saveStore() {
    if (!portalData) return;
    try {
      const safePayload = {
        version: 1,
        seeded: true,
        users: portalData.users,
        activities: portalData.activities,
        ritms: portalData.ritms,
        execNotes: portalData.execNotes,
        notifications: portalData.notifications,
        session: sanitizeSessionUser(portalData.session)
      };
      localStorage.setItem(STORAGE_KEY_PORTAL, JSON.stringify(safePayload));
    } catch (_) {
      showToast('Aviso: armazenamento local indisponível.', 'error');
    }
  }

  /* ========================================================================
     AUTENTICAÇÃO, RBAC E PROTEÇÃO DE DOM
     ======================================================================== */

  function isManagerUser(user) {
    return Boolean(user && user.id === MANAGER_USER_ID && user.role === 'Gerente');
  }

  function getEffectiveUser() {
    if (isManagerUser(currentUser) && simulationUser) return simulationUser;
    return currentUser;
  }

  function getEffectiveRole() {
    const eff = getEffectiveUser();
    return eff ? eff.role : 'Colaborador';
  }

  function canManageAll() {
    return isManagerUser(currentUser) && getEffectiveRole() === 'Gerente';
  }

  function canEditActivity(act) {
    if (!currentUser) return false;
    if (canManageAll()) return true;
    const eff = getEffectiveUser();
    const effMail = normalizeText(eff.email);
    const effName = normalizeText(eff.name);
    return (
      (effMail && normalizeText(act.responsibleEmail) === effMail) ||
      (effName && normalizeText(act.responsibleName).includes(effName))
    );
  }

  function canEditRitm(ritm) {
    if (!currentUser) return false;
    if (canManageAll()) return true;
    const eff = getEffectiveUser();
    const effMail = normalizeText(eff.email);
    const effName = normalizeText(eff.name);
    return (
      (effMail && normalizeText(ritm.ownerEmail) === effMail) ||
      (effName && normalizeText(ritm.squad).includes(effName))
    );
  }

  function renderExecNoteFormSlot() {
    const slot = document.getElementById('exec-note-form-slot');
    if (!slot) return;

    // Só injeta o formulário de cobrança executiva no DOM quando é realmente a gerência
    if (!canManageAll()) {
      slot.innerHTML = '';
      return;
    }

    slot.innerHTML = `
      <form id="exec-note-form" onsubmit="submitExecNote(event)" style="margin-bottom:14px;padding-bottom:12px;border-bottom:1px solid var(--border);">
        <div class="form-group" style="margin-bottom:8px;">
          <label class="form-label" for="exec-note-system">Sistema / Módulo (XP)</label>
          <input type="text" class="form-input" id="exec-note-system" list="dl-systems" placeholder="Ex: Admissão Digital" required>
        </div>
        <div class="form-group" style="margin-bottom:8px;">
          <label class="form-label" for="exec-note-text">Cobrança / Direcionamento Executivo</label>
          <textarea class="form-textarea" id="exec-note-text" rows="2" placeholder="Registre cobrança, validação ou ponto de atenção..." required></textarea>
        </div>
        <button type="submit" class="btn-primary btn-sm w-full">Registrar Cobrança</button>
      </form>
    `;
  }

  function syncHomologationBar() {
    const existing = document.getElementById('homologation-bar');
    if (!isManagerUser(currentUser)) {
      if (existing) existing.remove();
      return;
    }

    let bar = existing;
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'homologation-bar';
      bar.className = 'no-print';
      const shell = document.getElementById('app-shell');
      if (shell) shell.appendChild(bar);
    }

    const collabs = portalData.users.filter((u) => u.id !== MANAGER_USER_ID);
    const simId = simulationUser ? simulationUser.id : 'manager';

    let optionsHtml = `<option value="manager"${simId === 'manager' ? ' selected' : ''}>Visão Gerente (Allan Santos)</option>`;
    optionsHtml += `<option value="collab-preview"${simId === 'collab-preview' ? ' selected' : ''}>Simular Colaborador Padrão (somente leitura global)</option>`;
    collabs.forEach((c) => {
      optionsHtml += `<option value="${escapeHtml(c.id)}"${simId === c.id ? ' selected' : ''}>Simular: ${escapeHtml(c.name)}</option>`;
    });

    bar.innerHTML = `
      <span><strong>Homologação RBAC:</strong></span>
      <label for="homologation-select" style="font-weight:600;">Visualizar como</label>
      <select id="homologation-select" onchange="handleHomologationViewChange(this.value)">
        ${optionsHtml}
      </select>
    `;
  }

  function initDomGuard() {
    if (domGuardObserver) domGuardObserver.disconnect();
    const target = document.getElementById('app-shell');
    if (!target || typeof MutationObserver === 'undefined') return;

    // Vigia injeção manual pelo Inspecionar do navegador caso alguém tente forjar form de gerente
    domGuardObserver = new MutationObserver(() => {
      if (!canManageAll()) {
        const injectedForm = document.getElementById('exec-note-form');
        if (injectedForm) injectedForm.remove();
      }
      if (!isManagerUser(currentUser)) {
        const injectedBar = document.getElementById('homologation-bar');
        if (injectedBar) injectedBar.remove();
      }
    });

    domGuardObserver.observe(target, { childList: true, subtree: true });
  }

  function handleHomologationViewChange(selectedId) {
    if (!isManagerUser(currentUser)) return;
    if (selectedId === 'manager') {
      simulationUser = null;
    } else if (selectedId === 'collab-preview') {
      simulationUser = {
        id: 'collab-preview',
        name: 'Colaborador XP (Simulação)',
        username: 'colaborador.xp',
        email: 'colaborador@xpinc.com',
        role: 'Colaborador'
      };
    } else {
      const found = portalData.users.find((u) => u.id === selectedId);
      simulationUser = found ? sanitizeSessionUser(found) : null;
    }
    updateHeaderAndWorkspaceIdentity();
    renderAll();
  }

  function toggleRegisterForm() {
    const loginForm = document.getElementById('login-form');
    const regForm = document.getElementById('register-form');
    const toggleText = document.getElementById('login-toggle-text');
    const toggleBtn = document.getElementById('login-toggle-btn');

    document.getElementById('login-error').classList.add('hidden');
    document.getElementById('register-error').classList.add('hidden');

    const showingLogin = !loginForm.classList.contains('hidden');
    if (showingLogin) {
      loginForm.classList.add('hidden');
      regForm.classList.remove('hidden');
      toggleText.textContent = 'Já possui acesso?';
      toggleBtn.textContent = 'Voltar para Login';
    } else {
      regForm.classList.add('hidden');
      loginForm.classList.remove('hidden');
      toggleText.textContent = 'Não tem conta?';
      toggleBtn.textContent = 'Cadastre-se';
    }
  }

  function handleLogin(event) {
    event.preventDefault();
    const userInput = document.getElementById('login-username').value.trim();
    const passInput = document.getElementById('login-password').value;
    const errEl = document.getElementById('login-error');
    errEl.classList.add('hidden');

    const normInput = normalizeText(userInput);
    const matchedUser = portalData.users.find(
      (u) => normalizeText(u.username) === normInput || normalizeText(u.email) === normInput
    );

    if (!matchedUser || hashPassword(matchedUser.id, passInput) !== matchedUser.passHash) {
      errEl.textContent = 'Usuário/e-mail ou senha inválidos.';
      errEl.classList.remove('hidden');
      return;
    }

    currentUser = sanitizeSessionUser(matchedUser);
    simulationUser = null;
    portalData.session = currentUser;
    saveStore();

    document.getElementById('login-password').value = '';
    enterAppShell();
  }

  function handleRegister(event) {
    event.preventDefault();
    const name = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const username = document.getElementById('register-username').value.trim();
    const pass = document.getElementById('register-password').value;
    const errEl = document.getElementById('register-error');
    errEl.classList.add('hidden');

    if (!name || !email || !username || pass.length < 4) {
      errEl.textContent = 'Preencha todos os campos (senha mínima de 4 caracteres).';
      errEl.classList.remove('hidden');
      return;
    }

    if (normalizeText(username) === 'allansantos') {
      errEl.textContent = 'Nome de usuário reservado para a gerência do portal.';
      errEl.classList.remove('hidden');
      return;
    }

    const exists = portalData.users.some(
      (u) => normalizeText(u.username) === normalizeText(username) || normalizeText(u.email) === normalizeText(email)
    );
    if (exists) {
      errEl.textContent = 'Usuário ou e-mail já cadastrado.';
      errEl.classList.remove('hidden');
      return;
    }

    const newId = 'usr-' + Date.now();
    // Auto-cadastro é bloqueado sempre como Colaborador (gerente único = AllanSantos)
    const newUser = {
      id: newId,
      name,
      username,
      email,
      role: 'Colaborador',
      passHash: hashPassword(newId, pass)
    };

    portalData.users.push(newUser);
    currentUser = sanitizeSessionUser(newUser);
    simulationUser = null;
    portalData.session = currentUser;
    saveStore();

    document.getElementById('register-form').reset();
    showToast(`Bem-vindo(a), ${name}! Acesso criado como Colaborador.`, 'success');
    enterAppShell();
  }

  function logout() {
    currentUser = null;
    simulationUser = null;
    portalData.session = null;
    saveStore();

    const homBar = document.getElementById('homologation-bar');
    if (homBar) homBar.remove();
    const slot = document.getElementById('exec-note-form-slot');
    if (slot) slot.innerHTML = '';

    if (domGuardObserver) {
      domGuardObserver.disconnect();
      domGuardObserver = null;
    }

    document.getElementById('popover-notifications').classList.remove('open');
    document.getElementById('app-shell').classList.add('hidden');
    document.getElementById('login-screen').classList.remove('hidden');
  }

  function updateHeaderAndWorkspaceIdentity() {
    const eff = getEffectiveUser();
    if (!eff) return;

    document.getElementById('header-username').textContent = eff.name;
    const roleText = isManagerUser(currentUser) && simulationUser
      ? `Simulando: ${eff.role}`
      : `${eff.role} • Projetos XP`;
    document.getElementById('header-role').textContent = roleText;

    document.getElementById('workspace-greeting').textContent = `Painel de Governança — ${eff.name}`;
    document.getElementById('workspace-context').textContent =
      'Portfólio de Projetos XP — Cronograma WBS em 3 Níveis & Hypercare';

    renderExecNoteFormSlot();
    syncHomologationBar();
  }

  function expandDefaultTreeNodes() {
    expandedSystems.clear();
    expandedMacros.clear();
    portalData.activities.forEach((act) => {
      expandedSystems.add(act.system);
      expandedMacros.add(`${act.system}:::${act.macro}`);
    });
  }

  function enterAppShell() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('app-shell').classList.remove('hidden');

    const refEl = document.getElementById('ref-date-input');
    if (refEl) refEl.value = refDateIso;

    expandDefaultTreeNodes();
    updateHeaderAndWorkspaceIdentity();
    initDomGuard();
    switchWorkspaceTab(activeTab || 'overview');
  }

  /* ========================================================================
     FILTROS, BUSCA & CONTROLE DA ÁRVORE
     ======================================================================== */

  function populateFilterAndDatalistOptions() {
    const sysSet = new Set();
    const macroSet = new Set();
    const respSet = new Set();

    portalData.activities.forEach((a) => {
      if (a.system) sysSet.add(a.system);
      if (a.macro) macroSet.add(a.macro);
      if (a.responsibleName) respSet.add(a.responsibleName);
    });
    portalData.ritms.forEach((r) => {
      if (r.system) sysSet.add(r.system);
    });

    const systems = Array.from(sysSet).sort((a, b) => a.localeCompare(b, 'pt-BR'));
    const macros = Array.from(macroSet).sort((a, b) => a.localeCompare(b, 'pt-BR'));
    const resps = Array.from(respSet).sort((a, b) => a.localeCompare(b, 'pt-BR'));

    const filterSysEl = document.getElementById('filter-system');
    const prevSys = filterSysEl.value;
    filterSysEl.innerHTML = '<option value="">Todos</option>' +
      systems.map((s) => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('');
    if (systems.includes(prevSys)) filterSysEl.value = prevSys;

    const filterRespEl = document.getElementById('filter-responsible');
    const prevResp = filterRespEl.value;
    filterRespEl.innerHTML = '<option value="">Todos</option>' +
      resps.map((r) => `<option value="${escapeHtml(r)}">${escapeHtml(r)}</option>`).join('');
    if (resps.includes(prevResp)) filterRespEl.value = prevResp;

    document.getElementById('dl-systems').innerHTML = systems.map((s) => `<option value="${escapeHtml(s)}">`).join('');
    document.getElementById('dl-macros').innerHTML = macros.map((m) => `<option value="${escapeHtml(m)}">`).join('');

    const peopleMap = new Map();
    portalData.users.forEach((u) => {
      if (u.name) peopleMap.set(u.name, u.email || '');
    });
    portalData.activities.forEach((a) => {
      if (a.responsibleName && !peopleMap.has(a.responsibleName)) {
        peopleMap.set(a.responsibleName, a.responsibleEmail || '');
      }
    });
    document.getElementById('dl-users-names').innerHTML = Array.from(peopleMap.keys())
      .sort((a, b) => a.localeCompare(b, 'pt-BR'))
      .map((name) => `<option value="${escapeHtml(name)}">`)
      .join('');
  }

  function getFilteredActivities() {
    const q = normalizeText(filterState.search);
    return portalData.activities.filter((act) => {
      if (filterState.system && act.system !== filterState.system) return false;
      if (filterState.status && act.status !== filterState.status) return false;
      if (filterState.responsible && act.responsibleName !== filterState.responsible) return false;
      if (filterState.hideDone && act.status === 'Concluído') return false;
      if (q) {
        const hay = normalizeText(
          `${act.id} ${act.system} ${act.macro} ${act.title} ${act.responsibleName} ${act.squad} ${act.notes}`
        );
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }

  function getFilteredRitms() {
    const q = normalizeText(filterState.search);
    return portalData.ritms.filter((r) => {
      if (filterState.system && r.system !== filterState.system) return false;
      if (q) {
        const hay = normalizeText(`${r.code} ${r.system} ${r.description} ${r.action} ${r.squad} ${r.status}`);
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }

  function getFilteredExecNotes() {
    const q = normalizeText(filterState.search);
    return portalData.execNotes.filter((n) => {
      if (filterState.system && n.system !== filterState.system) return false;
      if (q) {
        const hay = normalizeText(`${n.system} ${n.author} ${n.text}`);
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }

  function applyFilters() {
    filterState.system = document.getElementById('filter-system').value;
    filterState.status = document.getElementById('filter-status').value;
    filterState.responsible = document.getElementById('filter-responsible').value;
    filterState.search = document.getElementById('filter-search').value;
    filterState.hideDone = document.getElementById('filter-hide-done').checked;
    renderAll();
  }

  function clearFilters() {
    document.getElementById('filter-system').value = '';
    document.getElementById('filter-status').value = '';
    document.getElementById('filter-responsible').value = '';
    document.getElementById('filter-search').value = '';
    document.getElementById('filter-hide-done').checked = false;
    filterState.system = '';
    filterState.status = '';
    filterState.responsible = '';
    filterState.search = '';
    filterState.hideDone = false;
    renderAll();
  }

  function expandAllNodes() {
    portalData.activities.forEach((a) => {
      expandedSystems.add(a.system);
      expandedMacros.add(`${a.system}:::${a.macro}`);
    });
    renderWbs();
    renderGantt();
  }

  function collapseMicros() {
    portalData.activities.forEach((a) => expandedSystems.add(a.system));
    expandedMacros.clear();
    renderWbs();
    renderGantt();
  }

  function collapseSystems() {
    expandedSystems.clear();
    expandedMacros.clear();
    renderWbs();
    renderGantt();
  }

  function toggleSystemNode(sysEncoded) {
    const sys = decodeURIComponent(sysEncoded);
    if (expandedSystems.has(sys)) {
      expandedSystems.delete(sys);
    } else {
      expandedSystems.add(sys);
    }
    renderWbs();
    renderGantt();
  }

  function toggleMacroNode(keyEncoded) {
    const key = decodeURIComponent(keyEncoded);
    if (expandedMacros.has(key)) {
      expandedMacros.delete(key);
    } else {
      expandedMacros.add(key);
    }
    renderWbs();
    renderGantt();
  }

  /* ========================================================================
     NAVEGAÇÃO ENTRE AS 4 ABAS & DATA DE REFERÊNCIA
     ======================================================================== */

  function switchWorkspaceTab(tab) {
    activeTab = tab;

    const tabs = ['overview', 'wbs', 'gantt', 'hypercare'];
    tabs.forEach((t) => {
      const btn = document.getElementById(`nav-tab-${t}`);
      const panel = document.getElementById(`panel-${t}`);
      if (btn) btn.classList.toggle('active', t === tab);
      if (panel) panel.classList.toggle('hidden', t !== tab);
    });

    const isTreeTab = tab === 'wbs' || tab === 'gantt';
    const isHypercare = tab === 'hypercare';

    document.getElementById('filter-status-group').classList.toggle('hidden', isHypercare);
    document.getElementById('filter-responsible-group').classList.toggle('hidden', isHypercare);
    document.getElementById('tree-controls-row').classList.toggle('hidden', !isTreeTab);

    renderAll();
  }

  function handleRefDateChange() {
    const val = document.getElementById('ref-date-input').value;
    refDateIso = val || getTodayIso();
    renderGantt();
  }

  function printExecutiveReport() {
    const eff = getEffectiveUser();
    const metaEl = document.getElementById('print-meta-date');
    if (metaEl) {
      metaEl.textContent = `Emitido por ${eff ? eff.name : 'Usuário'} em ${formatNowBr()} | Data Ref.: ${formatIsoToBr(refDateIso)}`;
    }
    window.print();
  }

  /* ========================================================================
     MOTOR DE ÁRVORE WBS (3 NÍVEIS COM CONSOLIDAÇÃO BOTTOM-UP)
     ======================================================================== */

  function getStatusBadgeClass(status) {
    switch (status) {
      case 'Concluído': return 'st-concluido';
      case 'Em andamento': return 'st-andamento';
      case 'Em atenção': return 'st-atencao';
      case 'Atrasado': return 'st-atrasado';
      case 'Bloqueado': return 'st-bloqueado';
      default: return 'st-nao-iniciado';
    }
  }

  function getProgressFillClass(status) {
    switch (status) {
      case 'Concluído': return 'status-done';
      case 'Em atenção': return 'status-warn';
      case 'Atrasado': return 'status-late';
      case 'Bloqueado': return 'status-blocked';
      case 'Não iniciado': return 'status-none';
      default: return '';
    }
  }

  function getGanttBarClass(status) {
    switch (status) {
      case 'Concluído': return 'bar-concluido';
      case 'Em andamento': return 'bar-andamento';
      case 'Em atenção': return 'bar-atencao';
      case 'Atrasado': return 'bar-atrasado';
      case 'Bloqueado': return 'bar-bloqueado';
      default: return 'bar-nao-iniciado';
    }
  }

  function aggregateMetrics(items) {
    let minStart = null;
    let maxPlannedEnd = null;
    let maxEffectiveEnd = null;
    let progressSum = 0;
    let allDone = items.length > 0;
    let highestStatus = 'Não iniciado';
    let highestRank = 0;

    items.forEach((item) => {
      const s = item.start;
      const e = item.end;
      const effE = item.newEnd || item.end;

      if (!minStart || s < minStart) minStart = s;
      if (!maxPlannedEnd || e > maxPlannedEnd) maxPlannedEnd = e;
      if (!maxEffectiveEnd || effE > maxEffectiveEnd) maxEffectiveEnd = effE;

      progressSum += Number(item.progress) || 0;
      if (item.status !== 'Concluído') allDone = false;

      const r = STATUS_RANK[item.status] || 1;
      if (r > highestRank) {
        highestRank = r;
        highestStatus = item.status;
      }
    });

    if (allDone) highestStatus = 'Concluído';

    const durationDays = minStart && maxEffectiveEnd
      ? Math.max(1, diffDaysUTC(minStart, maxEffectiveEnd) + 1)
      : 0;

    return {
      count: items.length,
      start: minStart || '',
      end: maxPlannedEnd || '',
      effectiveEnd: maxEffectiveEnd || '',
      hasReplan: Boolean(maxEffectiveEnd && maxPlannedEnd && maxEffectiveEnd !== maxPlannedEnd),
      durationDays,
      progress: items.length ? Math.round(progressSum / items.length) : 0,
      status: highestStatus
    };
  }

  // Consolida microatividades em Árvore WBS de 3 níveis: Sistema -> Macro -> Micro
  function buildWbsTree(activities) {
    const sysMap = new Map();

    activities.forEach((act) => {
      if (!sysMap.has(act.system)) {
        sysMap.set(act.system, new Map());
      }
      const macroMap = sysMap.get(act.system);
      if (!macroMap.has(act.macro)) {
        macroMap.set(act.macro, []);
      }
      macroMap.get(act.macro).push(act);
    });

    const tree = [];
    sysMap.forEach((macroMap, systemName) => {
      const allSysItems = [];
      const macros = [];

      macroMap.forEach((microList, macroName) => {
        const sortedMicros = microList.slice().sort((a, b) => a.start.localeCompare(b.start) || a.id.localeCompare(b.id));
        allSysItems.push(...sortedMicros);
        macros.push({
          system: systemName,
          macro: macroName,
          metrics: aggregateMetrics(sortedMicros),
          micros: sortedMicros
        });
      });

      macros.sort((a, b) => a.macro.localeCompare(b.macro, 'pt-BR'));
      tree.push({
        system: systemName,
        metrics: aggregateMetrics(allSysItems),
        macros
      });
    });

    return tree;
  }

  /* ========================================================================
     RENDERIZAÇÃO: ABA 1 — VISÃO GERAL (KPIs + RESUMO POR SISTEMA / MÓDULO)
     ======================================================================== */

  function renderOverview() {
    const acts = getFilteredActivities();
    const total = acts.length;

    const countDone = acts.filter((a) => a.status === 'Concluído').length;
    const countInProg = acts.filter((a) => a.status === 'Em andamento').length;
    const countNotStarted = acts.filter((a) => a.status === 'Não iniciado').length;
    const countAttention = acts.filter((a) => a.status === 'Em atenção').length;
    const countCritical = acts.filter((a) => a.status === 'Atrasado' || a.status === 'Bloqueado').length;
    const countReplan = acts.filter((a) => Boolean(a.newEnd && a.newEnd !== a.end)).length;

    const avgProgress = total
      ? Math.round(acts.reduce((acc, a) => acc + (Number(a.progress) || 0), 0) / total)
      : 0;

    const pct = (n) => (total ? Math.round((n / total) * 100) + '% do plano' : '0% do plano');

    document.getElementById('kpi-progress').textContent = `${avgProgress}%`;
    document.getElementById('kpi-total-sub').textContent = `${total} ${total === 1 ? 'atividade' : 'atividades'} (XP)`;
    document.getElementById('kpi-done').textContent = countDone;
    document.getElementById('kpi-done-pct').textContent = pct(countDone);
    document.getElementById('kpi-inprog').textContent = countInProg;
    document.getElementById('kpi-inprog-pct').textContent = pct(countInProg);
    document.getElementById('kpi-notstarted').textContent = countNotStarted;
    document.getElementById('kpi-notstarted-pct').textContent = pct(countNotStarted);
    document.getElementById('kpi-attention').textContent = countAttention;
    document.getElementById('kpi-reprogrammed-sub').textContent = `${countReplan} ${countReplan === 1 ? 'reprogramada' : 'reprogramadas'}`;
    document.getElementById('kpi-critical').textContent = countCritical;
    document.getElementById('kpi-critical-sub').textContent = countCritical > 0 ? 'Ação imediata' : 'Sem bloqueios críticos';

    const contentEl = document.getElementById('overview-content');
    const emptyEl = document.getElementById('overview-empty');
    const sysGrid = document.getElementById('overview-systems-grid');

    if (total === 0) {
      contentEl.classList.add('hidden');
      emptyEl.classList.remove('hidden');
      emptyEl.innerHTML = `
        <div class="empty-state-title">Nenhuma atividade encontrada para os filtros aplicados</div>
        <div class="empty-state-text">Limpe os filtros ou cadastre uma nova entrega dos projetos XP.</div>
        <button type="button" class="btn-secondary btn-sm" onclick="clearFilters()">Limpar Filtros</button>
      `;
      return;
    }

    contentEl.classList.remove('hidden');
    emptyEl.classList.add('hidden');

    const tree = buildWbsTree(acts);
    sysGrid.innerHTML = tree.map((sysNode) => {
      const m = sysNode.metrics;
      const doneInSys = sysNode.macros.reduce(
        (sum, mc) => sum + mc.micros.filter((item) => item.status === 'Concluído').length,
        0
      );
      const lateInSys = sysNode.macros.reduce(
        (sum, mc) => sum + mc.micros.filter((item) => item.status === 'Atrasado' || item.status === 'Bloqueado').length,
        0
      );
      const attnInSys = sysNode.macros.reduce(
        (sum, mc) => sum + mc.micros.filter((item) => item.status === 'Em atenção').length,
        0
      );
      const ritmsInSys = portalData.ritms.filter(
        (r) => r.system === sysNode.system && r.status !== 'Concluído'
      ).length;

      return `
        <div class="summary-card clickable" onclick="jumpToSystemWbs('${encodeURIComponent(sysNode.system)}')" title="Clique para filtrar no Cronograma WBS">
          <div class="summary-card-top">
            <span class="summary-card-title">${escapeHtml(sysNode.system)}</span>
            <span class="summary-card-pct tabular-nums">${m.progress}%</span>
          </div>
          <div class="progress-bar-track">
            <div class="progress-bar-fill ${getProgressFillClass(m.status)}" style="width:${m.progress}%"></div>
          </div>
          <div class="summary-card-meta">
            <span><strong>${doneInSys}/${m.count}</strong> concluídas</span>
            ${attnInSys > 0 ? `<span style="color:#B45309;"><strong>${attnInSys}</strong> atenção</span>` : ''}
            ${lateInSys > 0 ? `<span style="color:#DC2626;"><strong>${lateInSys}</strong> críticas</span>` : ''}
            ${ritmsInSys > 0 ? `<span><strong>${ritmsInSys}</strong> RITM ativo</span>` : ''}
            <span>Prazo: ${formatIsoToBr(m.effectiveEnd)}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  function jumpToSystemWbs(sysEncoded) {
    const sysName = decodeURIComponent(sysEncoded);
    document.getElementById('filter-system').value = sysName;
    filterState.system = sysName;
    expandedSystems.add(sysName);
    switchWorkspaceTab('wbs');
  }

  /* ========================================================================
     RENDERIZAÇÃO: ABA 2 — CRONOGRAMA WBS EM 3 NÍVEIS (9 COLUNAS)
     ======================================================================== */

  function renderWbs() {
    const acts = getFilteredActivities();
    const tbody = document.getElementById('tbody-wbs');
    const countEl = document.getElementById('wbs-count');

    countEl.textContent = `${acts.length} ${acts.length === 1 ? 'microatividade' : 'microatividades'}`;

    if (acts.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" style="padding:36px 16px;text-align:center;color:var(--text-muted);">
            Nenhuma atividade corresponde aos filtros atuais.
            <button type="button" class="btn-secondary btn-xs" style="margin-left:8px;" onclick="clearFilters()">Limpar filtros</button>
          </td>
        </tr>
      `;
      return;
    }

    const tree = buildWbsTree(acts);
    const chevronRight = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><polyline points="9 18 15 12 9 6"/></svg>';
    const chevronDown = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><polyline points="6 9 12 15 18 9"/></svg>';

    const rowsHtml = [];

    tree.forEach((sysNode) => {
      const sysOpen = expandedSystems.has(sysNode.system);
      const sm = sysNode.metrics;

      rowsHtml.push(`
        <tr class="wbs-row-l1">
          <td>
            <div class="wbs-cell-l1">
              <button type="button" class="wbs-toggle-btn" onclick="toggleSystemNode('${encodeURIComponent(sysNode.system)}')" title="${sysOpen ? 'Recolher módulo' : 'Expandir módulo'}">
                ${sysOpen ? chevronDown : chevronRight}
              </button>
              <span>${escapeHtml(sysNode.system)}</span>
              <span class="wbs-count-pill">${sm.count}</span>
            </div>
          </td>
          <td style="color:var(--text-light);">—</td>
          <td class="font-mono tabular-nums">${formatIsoToBr(sm.start)}</td>
          <td class="font-mono tabular-nums">${formatIsoToBr(sm.end)}</td>
          <td class="font-mono tabular-nums">${sm.hasReplan ? formatIsoToBr(sm.effectiveEnd) : '—'}</td>
          <td class="font-mono tabular-nums">${sm.durationDays}d</td>
          <td>
            <div style="display:flex;align-items:center;gap:6px;min-width:86px;">
              <div class="progress-bar-track" style="flex:1;">
                <div class="progress-bar-fill ${getProgressFillClass(sm.status)}" style="width:${sm.progress}%"></div>
              </div>
              <span class="font-mono tabular-nums" style="font-size:11px;min-width:30px;text-align:right;">${sm.progress}%</span>
            </div>
          </td>
          <td><span class="wbs-status-badge ${getStatusBadgeClass(sm.status)}">${escapeHtml(sm.status)}</span></td>
          <td class="no-print" style="text-align:right;color:var(--text-light);">—</td>
        </tr>
      `);

      if (!sysOpen) return;

      sysNode.macros.forEach((macroNode) => {
        const macroKey = `${sysNode.system}:::${macroNode.macro}`;
        const macroOpen = expandedMacros.has(macroKey);
        const mm = macroNode.metrics;

        rowsHtml.push(`
          <tr class="wbs-row-l2">
            <td>
              <div class="wbs-cell-l2">
                <button type="button" class="wbs-toggle-btn" onclick="toggleMacroNode('${encodeURIComponent(macroKey)}')" title="${macroOpen ? 'Recolher macroatividade' : 'Expandir macroatividade'}">
                  ${macroOpen ? chevronDown : chevronRight}
                </button>
                <span>${escapeHtml(macroNode.macro)}</span>
                <span class="wbs-count-pill">${mm.count}</span>
              </div>
            </td>
            <td style="color:var(--text-light);">—</td>
            <td class="font-mono tabular-nums">${formatIsoToBr(mm.start)}</td>
            <td class="font-mono tabular-nums">${formatIsoToBr(mm.end)}</td>
            <td class="font-mono tabular-nums">${mm.hasReplan ? formatIsoToBr(mm.effectiveEnd) : '—'}</td>
            <td class="font-mono tabular-nums">${mm.durationDays}d</td>
            <td>
              <div style="display:flex;align-items:center;gap:6px;min-width:86px;">
                <div class="progress-bar-track" style="flex:1;">
                  <div class="progress-bar-fill ${getProgressFillClass(mm.status)}" style="width:${mm.progress}%"></div>
                </div>
                <span class="font-mono tabular-nums" style="font-size:11px;min-width:30px;text-align:right;">${mm.progress}%</span>
              </div>
            </td>
            <td><span class="wbs-status-badge ${getStatusBadgeClass(mm.status)}">${escapeHtml(mm.status)}</span></td>
            <td class="no-print" style="text-align:right;color:var(--text-light);">—</td>
          </tr>
        `);

        if (!macroOpen) return;

        macroNode.micros.forEach((act) => {
          const effEnd = act.newEnd || act.end;
          const dur = Math.max(1, diffDaysUTC(act.start, effEnd) + 1);
          const delta = act.newEnd ? diffDaysUTC(act.end, act.newEnd) : 0;
          const deltaBadge = delta !== 0
            ? `<span class="variance-tag ${delta < 0 ? 'improved' : ''}">${delta > 0 ? '+' + delta : delta}d</span>`
            : '';

          const editable = canEditActivity(act);
          const actionCell = editable
            ? `<button type="button" class="btn-secondary btn-xs" onclick="openEditActivityModal('${escapeHtml(act.id)}')">Editar</button>`
            : '<span style="font-size:10.5px;color:var(--text-light);">Leitura</span>';

          rowsHtml.push(`
            <tr class="wbs-row-l3">
              <td>
                <div class="wbs-cell-l3">
                  <span class="wbs-id-pill">${escapeHtml(act.id)}</span>
                  <div style="min-width:0;">
                    <div style="font-weight:500;color:var(--text-main);">${escapeHtml(act.title)}</div>
                    ${act.notes ? `<div style="font-size:10.5px;color:var(--text-muted);">${escapeHtml(act.notes)}</div>` : ''}
                  </div>
                </div>
              </td>
              <td>
                <div style="font-weight:500;color:var(--text-main);white-space:nowrap;">${escapeHtml(act.responsibleName)}</div>
                ${act.squad ? `<div style="font-size:10.5px;color:var(--text-muted);">${escapeHtml(act.squad)}</div>` : ''}
              </td>
              <td class="font-mono tabular-nums" style="white-space:nowrap;">${formatIsoToBr(act.start)}</td>
              <td class="font-mono tabular-nums" style="white-space:nowrap;">${formatIsoToBr(act.end)}</td>
              <td class="font-mono tabular-nums" style="white-space:nowrap;">${act.newEnd ? formatIsoToBr(act.newEnd) + deltaBadge : '—'}</td>
              <td class="font-mono tabular-nums">${dur}d</td>
              <td>
                <div style="display:flex;align-items:center;gap:6px;min-width:86px;">
                  <div class="progress-bar-track" style="flex:1;">
                    <div class="progress-bar-fill ${getProgressFillClass(act.status)}" style="width:${act.progress}%"></div>
                  </div>
                  <span class="font-mono tabular-nums" style="font-size:11px;min-width:30px;text-align:right;">${act.progress}%</span>
                </div>
              </td>
              <td><span class="wbs-status-badge ${getStatusBadgeClass(act.status)}">${escapeHtml(act.status)}</span></td>
              <td class="no-print" style="text-align:right;white-space:nowrap;">${actionCell}</td>
            </tr>
          `);
        });
      });
    });

    tbody.innerHTML = rowsHtml.join('');
  }

  /* ========================================================================
     RENDERIZAÇÃO: ABA 3 — GANTT (LINHA DO TEMPO INTERATIVA)
     ======================================================================== */

  function setGanttZoom(mode) {
    if (!ZOOM_WIDTHS[mode]) return;
    ganttZoom = mode;
    document.documentElement.style.setProperty('--gantt-day-w', `${ZOOM_WIDTHS[mode]}px`);

    const btns = document.querySelectorAll('#gantt-zoom-group .zoom-btn');
    btns.forEach((btn) => {
      const target = btn.getAttribute('onclick') || '';
      btn.classList.toggle('active', target.includes(`'${mode}'`));
    });

    renderGantt();
  }

  function renderGantt() {
    const acts = getFilteredActivities();
    const emptyEl = document.getElementById('gantt-empty');
    const areaEl = document.getElementById('gantt-scroll-area');

    if (acts.length === 0) {
      areaEl.classList.add('hidden');
      areaEl.innerHTML = '';
      emptyEl.classList.remove('hidden');
      emptyEl.innerHTML = `
        <div class="empty-state-title">Linha do tempo vazia</div>
        <div class="empty-state-text">Nenhuma entrega do projeto XP corresponde aos filtros ativos.</div>
        <button type="button" class="btn-secondary btn-sm" onclick="clearFilters()">Limpar Filtros</button>
      `;
      return;
    }

    emptyEl.classList.add('hidden');
    areaEl.classList.remove('hidden');

    const dayW = ZOOM_WIDTHS[ganttZoom] || 32;
    document.documentElement.style.setProperty('--gantt-day-w', `${dayW}px`);

    let minIso = acts[0].start;
    let maxIso = acts[0].newEnd || acts[0].end;
    acts.forEach((a) => {
      if (a.start < minIso) minIso = a.start;
      const eff = a.newEnd || a.end;
      if (eff > maxIso) maxIso = eff;
    });

    if (refDateIso) {
      if (refDateIso < minIso) minIso = refDateIso;
      if (refDateIso > maxIso) maxIso = refDateIso;
    }

    const tlStart = addDaysIsoUTC(minIso, -2);
    const tlEnd = addDaysIsoUTC(maxIso, 4);
    const totalDays = Math.max(14, diffDaysUTC(tlStart, tlEnd) + 1);
    const timelineWidthPx = totalDays * dayW;

    // Monta cabeçalho de meses + dias com destaque de fim de semana e data de referência
    const daysMeta = [];
    const monthBuckets = [];
    let currentBucket = null;

    for (let i = 0; i < totalDays; i++) {
      const iso = addDaysIsoUTC(tlStart, i);
      const dt = new Date(isoToMsUTC(iso));
      const dow = dt.getUTCDay();
      const dd = dt.getUTCDate();
      const mm = dt.getUTCMonth();
      const yyyy = dt.getUTCFullYear();
      const monthKey = `${yyyy}-${mm}`;

      if (!currentBucket || currentBucket.key !== monthKey) {
        currentBucket = {
          key: monthKey,
          label: `${MONTH_SHORT_PT[mm]} ${yyyy}`,
          count: 1
        };
        monthBuckets.push(currentBucket);
      } else {
        currentBucket.count++;
      }

      daysMeta.push({
        iso,
        dayNum: dd,
        isWeekend: dow === 0 || dow === 6,
        isRef: iso === refDateIso
      });
    }

    const monthsHtml = monthBuckets.map((b) =>
      `<div class="gantt-month-cell" style="width:${b.count * dayW}px;">${escapeHtml(b.label)}</div>`
    ).join('');

    const daysHtml = daysMeta.map((d) => {
      const cls = ['gantt-day-cell'];
      if (d.isWeekend) cls.push('weekend');
      if (d.isRef) cls.push('ref-day');
      const label = ganttZoom === 'compact'
        ? (d.dayNum % 2 === 1 || d.isRef ? d.dayNum : '')
        : d.dayNum;
      return `<div class="${cls.join(' ')}" title="${formatIsoToBr(d.iso)}">${label}</div>`;
    }).join('');

    const bgColsHtml = daysMeta.map((d) =>
      `<div class="gantt-bg-col${d.isWeekend ? ' weekend' : ''}"></div>`
    ).join('');

    // Calcula posição horizontal exata da linha vermelha vertical de Data de Referência
    const refOffsetDays = diffDaysUTC(tlStart, refDateIso);
    let refLineHtml = '';
    if (refOffsetDays >= 0 && refOffsetDays < totalDays) {
      const offsetPx = (refOffsetDays * dayW) + Math.floor(dayW / 2);
      refLineHtml = `<div class="gantt-ref-line" style="left:calc(var(--gantt-tree-w) + ${offsetPx}px);" title="Data de referência: ${formatIsoToBr(refDateIso)}"></div>`;
    }

    const tree = buildWbsTree(acts);
    const chevronRight = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><polyline points="9 18 15 12 9 6"/></svg>';
    const chevronDown = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><polyline points="6 9 12 15 18 9"/></svg>';

    const rowsHtml = [];

    const buildBarHtml = (startIso, endIso, status, progress, labelText, kindClass, tooltipPayloadJson, clickFn) => {
      const startOff = diffDaysUTC(tlStart, startIso);
      const spanDays = Math.max(1, diffDaysUTC(startIso, endIso) + 1);
      const leftPx = startOff * dayW + 2;
      const widthPx = Math.max(10, spanDays * dayW - 4);
      const barCls = ['gantt-bar', getGanttBarClass(status)];
      if (kindClass) barCls.push(kindClass);

      return `
        <div class="${barCls.join(' ')}"
             style="left:${leftPx}px;width:${widthPx}px;"
             data-tip="${escapeHtml(tooltipPayloadJson)}"
             ${clickFn ? `onclick="${clickFn}"` : ''}
             onmouseenter="showGanttTooltip(event, this)"
             onmousemove="moveGanttTooltip(event)"
             onmouseleave="hideGanttTooltip()">
          <span class="gantt-bar-label">${escapeHtml(labelText)}</span>
        </div>
      `;
    };

    tree.forEach((sysNode) => {
      const sysOpen = expandedSystems.has(sysNode.system);
      const sm = sysNode.metrics;
      const sysTip = JSON.stringify({
        title: sysNode.system,
        code: `${sm.count} entregas`,
        system: sysNode.system,
        macro: 'Resumo do Módulo',
        resp: 'Múltiplos squads XP',
        start: sm.start,
        end: sm.end,
        newEnd: sm.hasReplan ? sm.effectiveEnd : '',
        progress: sm.progress,
        status: sm.status,
        notes: 'Clique nos botões de árvore para expandir ou recolher macroatividades.'
      });

      rowsHtml.push(`
        <div class="gantt-row l1">
          <div class="gantt-tree-cell">
            <button type="button" class="wbs-toggle-btn" onclick="toggleSystemNode('${encodeURIComponent(sysNode.system)}')">
              ${sysOpen ? chevronDown : chevronRight}
            </button>
            <span class="gantt-tree-title" title="${escapeHtml(sysNode.system)}">${escapeHtml(sysNode.system)}</span>
            <span class="wbs-count-pill">${sm.count}</span>
          </div>
          <div class="gantt-track" style="width:${timelineWidthPx}px;">
            ${buildBarHtml(sm.start, sm.effectiveEnd, sm.status, sm.progress, `${sm.progress}%`, 'group-l1', sysTip, '')}
          </div>
        </div>
      `);

      if (!sysOpen) return;

      sysNode.macros.forEach((macroNode) => {
        const macroKey = `${sysNode.system}:::${macroNode.macro}`;
        const macroOpen = expandedMacros.has(macroKey);
        const mm = macroNode.metrics;
        const macroTip = JSON.stringify({
          title: macroNode.macro,
          code: `${mm.count} entregas`,
          system: sysNode.system,
          macro: macroNode.macro,
          resp: 'Consolidado da Macroatividade',
          start: mm.start,
          end: mm.end,
          newEnd: mm.hasReplan ? mm.effectiveEnd : '',
          progress: mm.progress,
          status: mm.status,
          notes: ''
        });

        rowsHtml.push(`
          <div class="gantt-row l2">
            <div class="gantt-tree-cell">
              <button type="button" class="wbs-toggle-btn" onclick="toggleMacroNode('${encodeURIComponent(macroKey)}')">
                ${macroOpen ? chevronDown : chevronRight}
              </button>
              <span class="gantt-tree-title" title="${escapeHtml(macroNode.macro)}">${escapeHtml(macroNode.macro)}</span>
              <span class="wbs-count-pill">${mm.count}</span>
            </div>
            <div class="gantt-track" style="width:${timelineWidthPx}px;">
              ${buildBarHtml(mm.start, mm.effectiveEnd, mm.status, mm.progress, `${mm.progress}%`, 'group-l2', macroTip, '')}
            </div>
          </div>
        `);

        if (!macroOpen) return;

        macroNode.micros.forEach((act) => {
          const effEnd = act.newEnd || act.end;
          const actTip = JSON.stringify({
            title: act.title,
            code: act.id,
            system: act.system,
            macro: act.macro,
            resp: act.squad ? `${act.responsibleName} (${act.squad})` : act.responsibleName,
            start: act.start,
            end: act.end,
            newEnd: act.newEnd,
            progress: act.progress,
            status: act.status,
            notes: act.notes
          });
          const clickAttr = canEditActivity(act)
            ? `openEditActivityModal('${escapeHtml(act.id)}')`
            : '';

          rowsHtml.push(`
            <div class="gantt-row l3">
              <div class="gantt-tree-cell">
                <span class="wbs-id-pill">${escapeHtml(act.id)}</span>
                <span class="gantt-tree-title" title="${escapeHtml(act.title)}">${escapeHtml(act.title)}</span>
              </div>
              <div class="gantt-track" style="width:${timelineWidthPx}px;">
                ${buildBarHtml(act.start, effEnd, act.status, act.progress, `${act.id} • ${act.progress}%`, '', actTip, clickAttr)}
              </div>
            </div>
          `);
        });
      });
    });

    areaEl.innerHTML = `
      <div class="gantt-canvas">
        <div class="gantt-header">
          <div class="gantt-header-left">
            <span>Estrutura WBS — XP</span>
            <span class="font-mono">${acts.length} itens</span>
          </div>
          <div class="gantt-header-timeline" style="width:${timelineWidthPx}px;">
            <div class="gantt-months-row">${monthsHtml}</div>
            <div class="gantt-days-row">${daysHtml}</div>
          </div>
        </div>
        <div class="gantt-body">
          <div class="gantt-bg-overlay" style="width:${timelineWidthPx}px;">
            ${bgColsHtml}
          </div>
          ${refLineHtml}
          ${rowsHtml.join('')}
        </div>
      </div>
    `;
  }

  function showGanttTooltip(event, barEl) {
    const tipEl = document.getElementById('gantt-tooltip');
    if (!tipEl) return;

    let payload;
    try {
      payload = JSON.parse(barEl.getAttribute('data-tip') || '{}');
    } catch (_) {
      return;
    }

    tipEl.innerHTML = `
      <div class="gantt-tooltip-title">${escapeHtml(payload.code ? payload.code + ' — ' : '')}${escapeHtml(payload.title)}</div>
      <div class="gantt-tooltip-row"><strong>Módulo:</strong> ${escapeHtml(payload.system)}</div>
      <div class="gantt-tooltip-row"><strong>Resp.:</strong> ${escapeHtml(payload.resp)}</div>
      <div class="gantt-tooltip-row"><strong>Planejado:</strong> ${formatIsoToBr(payload.start)} a ${formatIsoToBr(payload.end)}</div>
      ${payload.newEnd ? `<div class="gantt-tooltip-row"><strong>Nova Data Fim:</strong> ${formatIsoToBr(payload.newEnd)}</div>` : ''}
      <div class="gantt-tooltip-row"><strong>Status:</strong> ${escapeHtml(payload.status)} (${Number(payload.progress) || 0}%)</div>
      ${payload.notes ? `<div class="gantt-tooltip-summary">${escapeHtml(payload.notes)}</div>` : ''}
    `;

    tipEl.classList.remove('hidden');
    moveGanttTooltip(event);
  }

  function moveGanttTooltip(event) {
    const tipEl = document.getElementById('gantt-tooltip');
    if (!tipEl || tipEl.classList.contains('hidden')) return;

    const pad = 14;
    let left = event.clientX + pad;
    let top = event.clientY + pad;

    const rect = tipEl.getBoundingClientRect();
    if (left + rect.width > window.innerWidth - 10) {
      left = Math.max(10, event.clientX - rect.width - pad);
    }
    if (top + rect.height > window.innerHeight - 10) {
      top = Math.max(10, event.clientY - rect.height - pad);
    }

    tipEl.style.left = `${left}px`;
    tipEl.style.top = `${top}px`;
  }

  function hideGanttTooltip() {
    const tipEl = document.getElementById('gantt-tooltip');
    if (tipEl) tipEl.classList.add('hidden');
  }

  /* ========================================================================
     RENDERIZAÇÃO: ABA 4 — HYPERCARE & VALIDAÇÕES EXECUTIVAS (7 COLUNAS)
     ======================================================================== */

  function getSeverityBadgeClass(severity) {
    const s = String(severity || '');
    if (s.includes('P2')) return 'badge-p2';
    if (s.includes('P3')) return 'badge-p3';
    if (s.includes('P4')) return 'badge-p4';
    return 'badge-p5';
  }

  function renderHypercare() {
    const ritms = getFilteredRitms();
    const tbody = document.getElementById('tbody-ritms');

    if (ritms.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="padding:32px 14px;text-align:center;color:var(--text-muted);">
            Nenhum chamado de Hypercare encontrado.
          </td>
        </tr>
      `;
    } else {
      tbody.innerHTML = ritms.map((r) => {
        const editable = canEditRitm(r);
        const statusCell = editable
          ? `
            <select class="ritm-status-select" onchange="updateRitmStatusInline('${escapeHtml(r.uid)}', this.value)">
              <option value="Em análise"${r.status === 'Em análise' ? ' selected' : ''}>Em análise</option>
              <option value="Chamado SAP"${r.status === 'Chamado SAP' ? ' selected' : ''}>Chamado SAP</option>
              <option value="Pendente"${r.status === 'Pendente' ? ' selected' : ''}>Pendente</option>
              <option value="Concluído"${r.status === 'Concluído' ? ' selected' : ''}>Concluído</option>
            </select>
          `
          : `<span class="wbs-status-badge ${r.status === 'Concluído' ? 'st-concluido' : 'st-atencao'}">${escapeHtml(r.status)}</span>`;

        const actionCell = editable
          ? `<button type="button" class="btn-secondary btn-xs" onclick="openEditRitmModal('${escapeHtml(r.uid)}')">Editar</button>`
          : '<span style="font-size:10.5px;color:var(--text-light);">Leitura</span>';

        return `
          <tr>
            <td class="font-mono" style="font-weight:700;white-space:nowrap;">${escapeHtml(r.code)}</td>
            <td style="font-weight:600;color:var(--text-main);white-space:nowrap;">${escapeHtml(r.system)}</td>
            <td>
              <div style="color:var(--text-main);font-weight:500;">${escapeHtml(r.description)}</div>
              ${r.action ? `<div style="font-size:10.5px;color:var(--text-muted);margin-top:2px;"><strong>Ação:</strong> ${escapeHtml(r.action)}</div>` : ''}
            </td>
            <td><span class="badge-severity ${getSeverityBadgeClass(r.severity)}">${escapeHtml(r.severity)}</span></td>
            <td>
              <div style="font-weight:500;">${escapeHtml(r.squad)}</div>
              ${r.ownerEmail ? `<div style="font-size:10.5px;color:var(--text-muted);">${escapeHtml(r.ownerEmail)}</div>` : ''}
            </td>
            <td>${statusCell}</td>
            <td class="no-print" style="text-align:right;white-space:nowrap;">${actionCell}</td>
          </tr>
        `;
      }).join('');
    }

    renderExecNotesList();
  }

  function renderExecNotesList() {
    const listEl = document.getElementById('exec-notes-list');
    if (!listEl) return;

    const notes = getFilteredExecNotes();
    if (notes.length === 0) {
      listEl.innerHTML = '<div style="font-size:12px;color:var(--text-light);text-align:center;padding:18px 8px;">Nenhuma cobrança executiva registrada.</div>';
      return;
    }

    const canDeleteNote = canManageAll();
    listEl.innerHTML = notes.map((n) => `
      <div class="exec-note-item">
        <div class="exec-note-header">
          <span><strong>${escapeHtml(n.system)}</strong> • ${escapeHtml(n.author)}</span>
          <span style="display:inline-flex;align-items:center;gap:6px;">
            <span>${escapeHtml(n.date)}</span>
            ${canDeleteNote ? `<button type="button" class="btn-icon" style="padding:2px;" title="Remover" onclick="deleteExecNote('${escapeHtml(n.id)}')">&times;</button>` : ''}
          </span>
        </div>
        <div class="exec-note-text">${escapeHtml(n.text)}</div>
      </div>
    `).join('');
  }

  function submitExecNote(event) {
    event.preventDefault();
    if (!canManageAll()) {
      showToast('Apenas a gerência pode registrar cobranças executivas.', 'error');
      return;
    }

    const sysInput = document.getElementById('exec-note-system');
    const txtInput = document.getElementById('exec-note-text');
    const system = sysInput ? sysInput.value.trim() : '';
    const text = txtInput ? txtInput.value.trim() : '';
    if (!system || !text) return;

    const newNote = {
      id: 'xp-note-' + Date.now(),
      system,
      author: currentUser.name,
      date: formatDateShortBr(),
      text
    };

    portalData.execNotes.unshift(newNote);
    addNotification(
      `Cobrança executiva — ${system}`,
      text,
      'hypercare'
    );
    saveStore();

    if (sysInput) sysInput.value = '';
    if (txtInput) txtInput.value = '';
    showToast('Cobrança executiva registrada.', 'success');
    renderAll();
  }

  function deleteExecNote(noteId) {
    if (!canManageAll()) {
      showToast('Acesso negado para excluir cobrança executiva.', 'error');
      return;
    }
    portalData.execNotes = portalData.execNotes.filter((n) => n.id !== noteId);
    saveStore();
    renderAll();
    showToast('Registro removido.', 'success');
  }

  function updateRitmStatusInline(uid, newStatus) {
    const ritm = portalData.ritms.find((r) => r.uid === uid);
    if (!ritm) return;

    if (!canEditRitm(ritm)) {
      showToast('Sem permissão para alterar este chamado.', 'error');
      renderHypercare();
      return;
    }

    ritm.status = newStatus;
    addNotification(`Chamado ${ritm.code} atualizado`, `Novo status em ${ritm.system}: ${newStatus}.`, 'hypercare');
    saveStore();
    renderAll();
    showToast(`Status de ${ritm.code} alterado para ${newStatus}.`, 'success');
  }

  /* ========================================================================
     MODAIS: CRUD ATIVIDADES WBS & CHAMADOS HYPERCARE
     ======================================================================== */

  function openModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('open');
  }

  function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('open');
  }

  function generateNextActivityCode() {
    let maxNum = portalData.activities.length;
    portalData.activities.forEach((a) => {
      const m = String(a.id).match(/(\d+)$/);
      if (m) {
        const n = parseInt(m[1], 10);
        if (n > maxNum) maxNum = n;
      }
    });
    return 'XP-' + String(maxNum + 1).padStart(3, '0');
  }

  function syncResponsibleEmailFromName() {
    const typed = normalizeText(document.getElementById('act-resp-name').value);
    if (!typed) return;

    const u = portalData.users.find((x) => normalizeText(x.name) === typed);
    if (u && u.email) {
      document.getElementById('act-resp-email').value = u.email;
      return;
    }

    const existingAct = portalData.activities.find((a) => normalizeText(a.responsibleName) === typed);
    if (existingAct && existingAct.responsibleEmail) {
      document.getElementById('act-resp-email').value = existingAct.responsibleEmail;
    }
  }

  function syncProgressFromStatus() {
    const st = document.getElementById('act-status').value;
    const rangeEl = document.getElementById('act-progress');
    const valEl = document.getElementById('act-progress-val');
    if (st === 'Concluído') {
      rangeEl.value = 100;
      valEl.textContent = '100%';
    } else if (st === 'Não iniciado') {
      rangeEl.value = 0;
      valEl.textContent = '0%';
    }
  }

  function openNewActivityModal() {
    if (!currentUser) return;
    const eff = getEffectiveUser();

    document.getElementById('modal-activity-title').textContent = 'Novo Cadastro — Entrega XP';
    document.getElementById('activity-form').reset();
    document.getElementById('act-edit-id').value = '';
    document.getElementById('act-code').value = '';
    document.getElementById('act-code').readOnly = false;
    document.getElementById('act-start').value = refDateIso || getTodayIso();
    document.getElementById('act-end').value = addDaysIsoUTC(refDateIso || getTodayIso(), 5);
    document.getElementById('act-new-end').value = '';
    document.getElementById('act-status').value = 'Em andamento';
    document.getElementById('act-progress').value = 20;
    document.getElementById('act-progress-val').textContent = '20%';
    document.getElementById('act-delete-btn').classList.add('hidden');

    if (eff) {
      document.getElementById('act-resp-name').value = eff.name;
      document.getElementById('act-resp-email').value = eff.email;
    }

    if (filterState.system) {
      document.getElementById('act-system').value = filterState.system;
    }

    openModal('modal-activity');
  }

  function openEditActivityModal(actId) {
    const act = portalData.activities.find((a) => a.id === actId);
    if (!act) return;

    if (!canEditActivity(act)) {
      showToast('Apenas o responsável pela entrega ou a gerência podem editá-la.', 'error');
      return;
    }

    document.getElementById('modal-activity-title').textContent = `Editar Atividade — ${act.id}`;
    document.getElementById('act-edit-id').value = act.id;
    document.getElementById('act-system').value = act.system;
    document.getElementById('act-macro').value = act.macro;
    document.getElementById('act-code').value = act.id;
    document.getElementById('act-code').readOnly = true;
    document.getElementById('act-title').value = act.title;
    document.getElementById('act-resp-name').value = act.responsibleName;
    document.getElementById('act-resp-email').value = act.responsibleEmail;
    document.getElementById('act-start').value = act.start;
    document.getElementById('act-end').value = act.end;
    document.getElementById('act-new-end').value = act.newEnd || '';
    document.getElementById('act-status').value = act.status;
    document.getElementById('act-progress').value = act.progress;
    document.getElementById('act-progress-val').textContent = `${act.progress}%`;
    document.getElementById('act-notes').value = act.notes || '';

    document.getElementById('act-delete-btn').classList.toggle('hidden', !canManageAll());
    openModal('modal-activity');
  }

  function handleSaveActivity(event) {
    event.preventDefault();
    const editId = document.getElementById('act-edit-id').value.trim();

    const system = document.getElementById('act-system').value.trim();
    const macro = document.getElementById('act-macro').value.trim();
    const rawCode = document.getElementById('act-code').value.trim();
    const title = document.getElementById('act-title').value.trim();
    const responsibleName = document.getElementById('act-resp-name').value.trim();
    const responsibleEmail = document.getElementById('act-resp-email').value.trim();
    const start = document.getElementById('act-start').value;
    const end = document.getElementById('act-end').value;
    const newEnd = document.getElementById('act-new-end').value;
    let status = document.getElementById('act-status').value;
    let progress = Math.max(0, Math.min(100, parseInt(document.getElementById('act-progress').value, 10) || 0));
    const notes = document.getElementById('act-notes').value.trim();

    if (start && end && end < start) {
      showToast('A data Fim Planejado deve ser igual ou posterior à Data Início.', 'error');
      return;
    }

    if (status === 'Concluído') progress = 100;

    if (editId) {
      const idx = portalData.activities.findIndex((a) => a.id === editId);
      if (idx === -1) return;
      if (!canEditActivity(portalData.activities[idx])) {
        showToast('Sem permissão para alterar esta atividade.', 'error');
        return;
      }

      portalData.activities[idx] = {
        ...portalData.activities[idx],
        system,
        macro,
        title,
        responsibleName,
        responsibleEmail,
        start,
        end,
        newEnd,
        status,
        progress,
        notes
      };
      addNotification(`Entrega ${editId} atualizada`, `${system} — ${title} (${status}, ${progress}%).`, 'wbs');
      showToast(`Atividade ${editId} atualizada.`, 'success');
    } else {
      const code = rawCode || generateNextActivityCode();
      if (portalData.activities.some((a) => normalizeText(a.id) === normalizeText(code))) {
        showToast(`O código ${code} já está em uso.`, 'error');
        return;
      }

      portalData.activities.push({
        id: code,
        system,
        macro,
        title,
        responsibleName,
        squad: '',
        responsibleEmail,
        start,
        end,
        newEnd,
        status,
        progress,
        notes
      });
      expandedSystems.add(system);
      expandedMacros.add(`${system}:::${macro}`);
      addNotification(`Nova entrega cadastrada (${code})`, `${system} — ${title}`, 'wbs');
      showToast(`Entrega ${code} incluída no projeto XP.`, 'success');
    }

    saveStore();
    closeModal('modal-activity');
    renderAll();
  }

  function deleteActivityFromModal() {
    if (!canManageAll()) {
      showToast('Apenas a gerência pode excluir atividades do cronograma.', 'error');
      return;
    }
    const editId = document.getElementById('act-edit-id').value.trim();
    if (!editId) return;

    portalData.activities = portalData.activities.filter((a) => a.id !== editId);
    saveStore();
    closeModal('modal-activity');
    renderAll();
    showToast(`Atividade ${editId} removida.`, 'success');
  }

  function openNewRitmModal() {
    if (!currentUser) return;
    const eff = getEffectiveUser();

    document.getElementById('modal-ritm-title').textContent = 'Registrar Chamado / Defeito (Hypercare XP)';
    document.getElementById('ritm-form').reset();
    document.getElementById('ritm-edit-uid').value = '';
    document.getElementById('ritm-severity').value = 'Média (P3)';
    document.getElementById('ritm-status').value = 'Em análise';
    document.getElementById('ritm-owner-email').value = eff ? eff.email : '';
    document.getElementById('ritm-delete-btn').classList.add('hidden');

    if (filterState.system) {
      document.getElementById('ritm-system').value = filterState.system;
    }

    openModal('modal-ritm');
  }

  function openEditRitmModal(uid) {
    const ritm = portalData.ritms.find((r) => r.uid === uid);
    if (!ritm) return;

    if (!canEditRitm(ritm)) {
      showToast('Apenas o ponto focal ou a gerência podem editar este chamado.', 'error');
      return;
    }

    document.getElementById('modal-ritm-title').textContent = `Editar Chamado — ${ritm.code}`;
    document.getElementById('ritm-edit-uid').value = ritm.uid;
    document.getElementById('ritm-code').value = ritm.code;
    document.getElementById('ritm-system').value = ritm.system;
    document.getElementById('ritm-severity').value = ritm.severity;
    document.getElementById('ritm-desc').value = ritm.description;
    document.getElementById('ritm-squad').value = ritm.squad;
    document.getElementById('ritm-status').value = ritm.status;
    document.getElementById('ritm-owner-email').value = ritm.ownerEmail || '';
    document.getElementById('ritm-action').value = ritm.action || '';

    document.getElementById('ritm-delete-btn').classList.toggle('hidden', !canManageAll());
    openModal('modal-ritm');
  }

  function handleSaveRitm(event) {
    event.preventDefault();
    const editUid = document.getElementById('ritm-edit-uid').value.trim();

    const code = document.getElementById('ritm-code').value.trim().toUpperCase();
    const system = document.getElementById('ritm-system').value.trim();
    const severity = document.getElementById('ritm-severity').value;
    const description = document.getElementById('ritm-desc').value.trim();
    const squad = document.getElementById('ritm-squad').value.trim();
    const status = document.getElementById('ritm-status').value;
    const ownerEmail = document.getElementById('ritm-owner-email').value.trim();
    const action = document.getElementById('ritm-action').value.trim();

    if (editUid) {
      const idx = portalData.ritms.findIndex((r) => r.uid === editUid);
      if (idx === -1) return;
      if (!canEditRitm(portalData.ritms[idx])) {
        showToast('Sem permissão para alterar este chamado.', 'error');
        return;
      }
      portalData.ritms[idx] = {
        ...portalData.ritms[idx],
        code,
        system,
        severity,
        description,
        squad,
        status,
        ownerEmail,
        action
      };
      addNotification(`Chamado ${code} atualizado`, `${system} — ${status}`, 'hypercare');
      showToast(`Chamado ${code} salvo.`, 'success');
    } else {
      portalData.ritms.unshift({
        uid: 'ritm-xp-' + Date.now(),
        code,
        system,
        severity,
        description,
        squad,
        status,
        ownerEmail,
        action
      });
      addNotification(`Novo chamado Hypercare (${code})`, `${system} — ${description}`, 'hypercare');
      showToast(`Chamado ${code} registrado no Hypercare.`, 'success');
    }

    saveStore();
    closeModal('modal-ritm');
    renderAll();
  }

  function deleteRitmFromModal() {
    if (!canManageAll()) {
      showToast('Apenas a gerência pode excluir chamados.', 'error');
      return;
    }
    const uid = document.getElementById('ritm-edit-uid').value.trim();
    if (!uid) return;

    portalData.ritms = portalData.ritms.filter((r) => r.uid !== uid);
    saveStore();
    closeModal('modal-ritm');
    renderAll();
    showToast('Chamado removido.', 'success');
  }

  /* ========================================================================
     NOTIFICAÇÕES, CONTADORES & TOASTS
     ======================================================================== */

  function addNotification(title, body, targetTab) {
    if (!portalData) return;
    portalData.notifications.unshift({
      id: 'notif-' + Date.now(),
      title,
      body,
      time: formatNowBr(),
      read: false,
      targetTab: targetTab || 'overview'
    });
    if (portalData.notifications.length > 25) {
      portalData.notifications.length = 25;
    }
  }

  function renderNotifications() {
    const badge = document.getElementById('notif-badge');
    const listEl = document.getElementById('notif-list');
    if (!badge || !listEl) return;

    const unreadCount = portalData.notifications.filter((n) => !n.read).length;
    badge.textContent = unreadCount;
    badge.classList.toggle('hidden', unreadCount === 0);

    if (portalData.notifications.length === 0) {
      listEl.innerHTML = '<div class="notif-empty">Nenhuma notificação registrada.</div>';
      return;
    }

    listEl.innerHTML = portalData.notifications.map((n) => `
      <div class="notif-item${n.read ? '' : ' unread'}" onclick="markNotificationRead('${escapeHtml(n.id)}')">
        <div style="font-weight:600;color:var(--text-main);margin-bottom:2px;">${escapeHtml(n.title)}</div>
        <div style="color:var(--text-body);">${escapeHtml(n.body)}</div>
        <div class="notif-item-time">${escapeHtml(n.time)}</div>
      </div>
    `).join('');
  }

  function toggleNotifications() {
    const pop = document.getElementById('popover-notifications');
    if (pop) pop.classList.toggle('open');
  }

  function markNotificationRead(id) {
    const item = portalData.notifications.find((n) => n.id === id);
    if (!item) return;
    item.read = true;
    saveStore();
    renderNotifications();
    if (item.targetTab) {
      document.getElementById('popover-notifications').classList.remove('open');
      switchWorkspaceTab(item.targetTab);
    }
  }

  function markAllRead() {
    portalData.notifications.forEach((n) => { n.read = true; });
    saveStore();
    renderNotifications();
  }

  function showToast(message, type) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type || ''}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3400);
  }

  function updateTabCounters() {
    const filteredActs = getFilteredActivities();
    const activeRitms = getFilteredRitms().filter((r) => r.status !== 'Concluído').length;

    document.getElementById('count-tab-overview').textContent = filteredActs.length;
    document.getElementById('count-tab-wbs').textContent = filteredActs.length;
    document.getElementById('count-tab-hypercare').textContent = activeRitms;
  }

  function renderAll() {
    if (!portalData || !currentUser) return;
    populateFilterAndDatalistOptions();
    updateTabCounters();
    renderOverview();
    renderWbs();
    renderGantt();
    renderHypercare();
    renderNotifications();
  }

  /* ========================================================================
     EVENTOS GLOBAIS & BOOT INICIAL
     ======================================================================== */

  document.addEventListener('click', (e) => {
    const pop = document.getElementById('popover-notifications');
    const btn = document.getElementById('btn-toggle-notifs');
    if (pop && pop.classList.contains('open') && !pop.contains(e.target) && btn && !btn.contains(e.target)) {
      pop.classList.remove('open');
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal('modal-activity');
      closeModal('modal-ritm');
      const pop = document.getElementById('popover-notifications');
      if (pop) pop.classList.remove('open');
    }
  });

  // Exposição explícita apenas dos handlers acionados pelo HTML
  window.handleLogin = handleLogin;
  window.handleRegister = handleRegister;
  window.toggleRegisterForm = toggleRegisterForm;
  window.logout = logout;
  window.toggleNotifications = toggleNotifications;
  window.markNotificationRead = markNotificationRead;
  window.markAllRead = markAllRead;
  window.handleRefDateChange = handleRefDateChange;
  window.printExecutiveReport = printExecutiveReport;
  window.switchWorkspaceTab = switchWorkspaceTab;
  window.applyFilters = applyFilters;
  window.clearFilters = clearFilters;
  window.expandAllNodes = expandAllNodes;
  window.collapseMicros = collapseMicros;
  window.collapseSystems = collapseSystems;
  window.toggleSystemNode = toggleSystemNode;
  window.toggleMacroNode = toggleMacroNode;
  window.jumpToSystemWbs = jumpToSystemWbs;
  window.setGanttZoom = setGanttZoom;
  window.showGanttTooltip = showGanttTooltip;
  window.moveGanttTooltip = moveGanttTooltip;
  window.hideGanttTooltip = hideGanttTooltip;
  window.openNewActivityModal = openNewActivityModal;
  window.openEditActivityModal = openEditActivityModal;
  window.handleSaveActivity = handleSaveActivity;
  window.deleteActivityFromModal = deleteActivityFromModal;
  window.syncResponsibleEmailFromName = syncResponsibleEmailFromName;
  window.syncProgressFromStatus = syncProgressFromStatus;
  window.openNewRitmModal = openNewRitmModal;
  window.openEditRitmModal = openEditRitmModal;
  window.handleSaveRitm = handleSaveRitm;
  window.deleteRitmFromModal = deleteRitmFromModal;
  window.updateRitmStatusInline = updateRitmStatusInline;
  window.submitExecNote = submitExecNote;
  window.deleteExecNote = deleteExecNote;
  window.closeModal = closeModal;
  window.handleHomologationViewChange = handleHomologationViewChange;

  function bootPortal() {
    loadStore();
    if (portalData.session && portalData.session.id) {
      const validUser = portalData.users.find((u) => u.id === portalData.session.id);
      if (validUser) {
        currentUser = sanitizeSessionUser(validUser);
        enterAppShell();
        return;
      }
      portalData.session = null;
      saveStore();
    }
  }

  document.addEventListener('DOMContentLoaded', bootPortal);
})();
