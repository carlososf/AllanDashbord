// ============================================================
// config.js — Configurações, Constantes, Logos, Status & Estado
// Projetos Allan Santos — Portal de Governança & PMO
// ============================================================

'use strict';

// ========================
// CONFIGURAÇÃO DE PERSISTÊNCIA & FUTURA API
// ========================
const API_CONFIG = {
  mode: 'localStorage', // Trocar para 'rest' quando houver back-end dedicado
  baseUrl: ''
};

const STORAGE_KEY_USERS = 'as_gov_users_v3';
const STORAGE_KEY_ACTIVITIES = 'gov_portal_xp_real_v1_acts';
const STORAGE_KEY_RITMS = 'gov_portal_xp_real_v1_ritms';
const STORAGE_KEY_EXEC_NOTES = 'gov_portal_xp_real_v1_notes';
const STORAGE_KEY_NOTIFS = 'gov_portal_xp_real_v1_notifs';
const STORAGE_KEY_SESSION = 'as_gov_session_v3';
const STORAGE_KEY_DEMO_SEED = 'gov_portal_xp_real_v1';

// ========================
// IDENTIDADE DE ACESSO & REGRAS DE DOMÍNIO
// ========================
const MANAGER_USER_ID = 'usr-001'; // Gerente único permitido no sistema
const AUTH_SALT = 'asgov-2026';

const STATUS_ORDER = [
  'Concluído',
  'Em andamento',
  'Não iniciado',
  'Em atenção',
  'Atrasado',
  'Bloqueado'
];

const STATUS_UI_MAP = {
  'Concluído':    { badgeClass: 'st-concluido',    fillClass: 'status-done',    barClass: 'bar-concluido' },
  'Em andamento': { badgeClass: 'st-andamento',    fillClass: '',               barClass: 'bar-andamento' },
  'Não iniciado': { badgeClass: 'st-nao-iniciado', fillClass: 'status-none',    barClass: 'bar-nao-iniciado' },
  'Em atenção':   { badgeClass: 'st-atencao',      fillClass: 'status-warn',    barClass: 'bar-atencao' },
  'Atrasado':     { badgeClass: 'st-atrasado',     fillClass: 'status-late',    barClass: 'bar-atrasado' },
  'Bloqueado':    { badgeClass: 'st-bloqueado',    fillClass: 'status-blocked', barClass: 'bar-bloqueado' }
};

const ZOOM_DAY_WIDTH = {
  compact: 20,
  normal: 32,
  expanded: 48
};

// ========================
// MAPEAMENTO DE LOGOS & ASSETS
// ========================
const ASSETS_IMAGES_DIR = 'src/assets/images/';

const CLIENT_LOGOS = {
  XP: {
    webp: ASSETS_IMAGES_DIR + 'logoxp.webp',
    fallback: ASSETS_IMAGES_DIR + 'xp.png',
    dotClass: 'xp'
  },
  Santander: {
    webp: ASSETS_IMAGES_DIR + 'logosantander.webp',
    fallback: ASSETS_IMAGES_DIR + 'santander.png',
    dotClass: 'santander'
  },
  Vivo: {
    webp: ASSETS_IMAGES_DIR + 'logovivo.webp',
    fallback: ASSETS_IMAGES_DIR + 'vivo.png',
    dotClass: 'vivo'
  }
};

// Usuário único de gestão (cadastro público cria exclusivamente perfil Colaborador)
const DEFAULT_USERS = [
  {
    id: 'usr-001',
    name: 'Allan Santos',
    email: 'allan.santos@empresa.com',
    username: 'AllanSantos',
    passHash: '8b2b7473fd9dcbb135da011ab65487d300f89bdd3e234eadcbd8fc89c35f2782',
    role: 'Gerente'
  }
];

// ========================
// ESTADO GLOBAL DA APLICAÇÃO
// ========================
const AppState = {
  users: [],
  activities: [],     // Entregas WBS vinculadas a Cliente/Sistema/Macro
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
// UTILITÁRIOS COMPARTILHADOS (XSS, IDS & DATAS)
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
