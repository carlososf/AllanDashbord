// ============================================================
// store.js — Camada de Persistência (LocalStorage -> Futura API)
// Projetos Allan Santos — Portal de Governança & PMO
//
// Centraliza gravação, leitura, migração e massa inicial.
// Para integrar com banco/API REST no futuro, basta substituir os
// métodos de DataStore mantendo o mesmo contrato para os módulos.
// ============================================================

'use strict';

const DataStore = {
  driver: API_CONFIG.mode,

  readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  },

  writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },

  removeKey(key) {
    localStorage.removeItem(key);
  },

  purgeLegacyDemoStorage() {
    [
      'gov_portal_data_v1',
      'as_gov_wbs_activities_v4',
      'as_gov_wbs_ritms_v4',
      'as_gov_wbs_exec_notes_v4',
      'as_gov_wbs_notifs_v4',
      'as_gov_demo_seed_v5'
    ].forEach(k => this.removeKey(k));
  },

  clearSession() {
    this.removeKey(STORAGE_KEY_SESSION);
  },

  normalizeUsersList(rawUsers) {
    let changed = false;
    const source = Array.isArray(rawUsers) && rawUsers.length > 0
      ? rawUsers
      : DEFAULT_USERS.map(u => ({ ...u }));
    if (!Array.isArray(rawUsers) || rawUsers.length === 0) changed = true;

    const byId = new Map();
    const baseManager = { ...DEFAULT_USERS[0] };

    source.forEach(raw => {
      if (!raw || !raw.id) { changed = true; return; }
      const copy = { ...raw };

      // Migra qualquer senha antiga em texto puro para SHA-256 com salt
      if (typeof copy.password === 'string' && copy.password.length > 0) {
        if (!copy.passHash) copy.passHash = hashPassword(copy.password, copy.id);
        delete copy.password;
        changed = true;
      } else if ('password' in copy) {
        delete copy.password;
        changed = true;
      }

      // Regra de gerente único: apenas Allan Santos (usr-001) pode manter perfil Gerente
      if (copy.id === MANAGER_USER_ID) {
        if (copy.name !== baseManager.name || copy.email !== baseManager.email || copy.username !== baseManager.username || copy.role !== 'Gerente') {
          changed = true;
        }
        copy.name = baseManager.name;
        copy.email = baseManager.email;
        copy.username = baseManager.username;
        copy.role = 'Gerente';
        if (!copy.passHash) {
          copy.passHash = baseManager.passHash;
          changed = true;
        }
      } else if (copy.role !== 'Colaborador') {
        copy.role = 'Colaborador';
        changed = true;
      }

      if (!byId.has(copy.id)) byId.set(copy.id, copy);
    });

    if (!byId.has(MANAGER_USER_ID)) {
      byId.set(MANAGER_USER_ID, baseManager);
      changed = true;
    }

    const managerUser = byId.get(MANAGER_USER_ID);
    const list = [managerUser];
    byId.forEach((u, id) => {
      if (id === MANAGER_USER_ID) return;
      const uName = (u.username || '').toLowerCase();
      const uMail = (u.email || '').toLowerCase();
      if (uName === managerUser.username.toLowerCase() || uMail === managerUser.email.toLowerCase()) {
        changed = true;
        return;
      }
      list.push(u);
    });

    return { users: list, changed };
  },

  createSeedData() {
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
  },

  saveAll() {
    try {
      const safeUsers = AppState.users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        username: u.username,
        passHash: u.passHash || '',
        role: u.id === MANAGER_USER_ID ? 'Gerente' : 'Colaborador'
      }));
      this.writeJson(STORAGE_KEY_USERS, safeUsers);
      this.writeJson(STORAGE_KEY_ACTIVITIES, AppState.activities);
      this.writeJson(STORAGE_KEY_RITMS, AppState.ritms);
      this.writeJson(STORAGE_KEY_EXEC_NOTES, AppState.execNotes);
      this.writeJson(STORAGE_KEY_NOTIFS, AppState.notifications);
      if (AppState.session && AppState.session.user) {
        this.writeJson(STORAGE_KEY_SESSION, {
          user: sanitizeSessionUser(AppState.session.user),
          canSimulate: isSimulationAllowed()
        });
      }
    } catch (e) {
      console.warn('[DataStore.saveAll] Falha ao gravar no armazenamento local:', e);
    }
  },

  loadAll() {
    try {
      // Limpa caches antigos de demonstração para carregar os dados reais sem exigir reset manual
      this.purgeLegacyDemoStorage();

      const parsedUsers = this.readJson(STORAGE_KEY_USERS, null);
      const norm = this.normalizeUsersList(parsedUsers);
      AppState.users = norm.users;
      AppState.activities = this.readJson(STORAGE_KEY_ACTIVITIES, [])
        .filter(a => !/^act-demo-/.test(a.id || '') && !/^AT-00[1-7]$/i.test(a.code || ''));
      AppState.ritms = this.readJson(STORAGE_KEY_RITMS, [])
        .filter(r => !/^ritm-demo-/.test(r.uid || ''));
      AppState.execNotes = this.readJson(STORAGE_KEY_EXEC_NOTES, [])
        .filter(n => n.id !== 'note-demo-001');
      AppState.notifications = this.readJson(STORAGE_KEY_NOTIFS, []);
      AppState.session = this.readJson(STORAGE_KEY_SESSION, null);

      const sessionHadSecret = !!(AppState.session?.user && ('password' in AppState.session.user || 'passHash' in AppState.session.user));

      if (!localStorage.getItem(STORAGE_KEY_DEMO_SEED)) {
        const seed = this.createSeedData();
        if (AppState.activities.length === 0) AppState.activities = seed.activities;
        if (AppState.ritms.length === 0) AppState.ritms = seed.ritms;
        if (AppState.execNotes.length === 0) AppState.execNotes = seed.execNotes;
        localStorage.setItem(STORAGE_KEY_DEMO_SEED, '1');
        this.saveAll();
      } else if (norm.changed || sessionHadSecret) {
        this.saveAll();
      }
    } catch (e) {
      console.warn('[DataStore.loadAll] Erro ao carregar estado, restaurando massa inicial:', e);
      const seed = this.createSeedData();
      AppState.users = DEFAULT_USERS.map(u => ({ ...u }));
      AppState.activities = seed.activities;
      AppState.ritms = seed.ritms;
      AppState.execNotes = seed.execNotes;
      AppState.notifications = [];
      AppState.session = null;
    }
  }
};

// Wrappers globais para compatibilidade com os demais módulos
function saveState() { DataStore.saveAll(); }
function loadState() { DataStore.loadAll(); }
function createTestSeedData() { return DataStore.createSeedData(); }
function purgeLegacyDemoStorage() { DataStore.purgeLegacyDemoStorage(); }
function normalizeUsersList(rawUsers) { return DataStore.normalizeUsersList(rawUsers); }
