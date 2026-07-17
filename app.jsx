/* @jsxRuntime classic */
/* =====================================================================
   Plataforma Interna — LATAM ConsultUs + MaximUs
   React 18 (UMD) + Tailwind (Play CDN) + localStorage
   IMPORTANTE: el pragma @jsxRuntime classic de arriba fuerza a Babel a
   usar React.createElement en vez de 'react/jsx-runtime' (import), que
   rompería al correr como script no-módulo.
   ===================================================================== */

const { useState, useEffect, useMemo, useReducer, useRef, useCallback,
        createContext, useContext } = React;

/* ─────────────────────────────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────────────────────────────── */
const STORAGE_KEY = 'plataforma-interna-v2';
const SESSION_KEY = 'plataforma-interna-session-v2';

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

const ls = {
  get(k, fb = null) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch { return fb; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

const HOUR = 3600 * 1000;
const DAY  = 24 * HOUR;
const now  = () => Date.now();

const fmtDate = (ts) => {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleDateString('es-UY', { day: '2-digit', month: 'short', year: 'numeric' });
};
const fmtDateTime = (ts) => {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleString('es-UY', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};
const fmtTimeLeft = (ts) => {
  if (!ts) return '—';
  const diff = ts - now();
  const abs = Math.abs(diff);
  const h = Math.round(abs / HOUR);
  if (diff <= 0) {
    if (h < 24) return `Vencido hace ${h}h`;
    return `Vencido hace ${Math.round(abs / DAY)}d`;
  }
  if (h < 24) return `Faltan ${h}h`;
  return `Faltan ${Math.round(diff / DAY)}d`;
};
const startOfDay = (ts) => { const d = new Date(ts); d.setHours(0,0,0,0); return d.getTime(); };
const sameDay = (a, b) => startOfDay(a) === startOfDay(b);
const toInputDateTime = (ts) => {
  if (!ts) return '';
  const d = new Date(ts);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const fromInputDateTime = (s) => s ? new Date(s).getTime() : null;

const deadlineColor = (ts, completed) => {
  if (completed) return 'text-muted';
  if (!ts) return 'text-muted';
  const diff = ts - now();
  if (diff <= 0) return 'text-bad';
  if (diff < 24 * HOUR) return 'text-warn';
  return 'text-muted';
};

/* Días hábiles (skip sábados/domingos). Si hoy es viernes + 1 día hábil → lunes. */
const isWeekend = (d) => { const w = d.getDay(); return w === 0 || w === 6; };
const addBusinessDays = (startTs, days) => {
  const d = new Date(startTs);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    if (!isWeekend(d)) added++;
  }
  // Si el deadline tiene hora pasada en el día, dejarla en hora razonable (fin de día laboral)
  if (d.getHours() < 9) d.setHours(18, 0, 0, 0);
  return d.getTime();
};
const addBusinessHours = (startTs, hours) => addBusinessDays(startTs, Math.ceil(hours / 24));

const COUNTRY_COLOR = {
  'Argentina':     { bg: '#dbeafe', text: '#1e40af' },
  'Brasil':        { bg: '#dcfce7', text: '#166534' },
  'Chile':         { bg: '#fee2e2', text: '#991b1b' },
  'Uruguay':       { bg: '#e0e7ff', text: '#3730a3' },
  'México':        { bg: '#fef3c7', text: '#92400e' },
  'Mexico':        { bg: '#fef3c7', text: '#92400e' },
  'Estados Unidos':{ bg: '#f3e8ff', text: '#6b21a8' },
  'Miami':         { bg: '#f3e8ff', text: '#6b21a8' },
  'Colombia':      { bg: '#fce7f3', text: '#9d174d' },
  'Perú':          { bg: '#ffedd5', text: '#9a3412' },
  'Peru':          { bg: '#ffedd5', text: '#9a3412' },
  'España':        { bg: '#fee2e2', text: '#991b1b' },
  'Espana':        { bg: '#fee2e2', text: '#991b1b' },
  'Panamá':        { bg: '#cffafe', text: '#155e75' },
  'Panama':        { bg: '#cffafe', text: '#155e75' },
  'Paraguay':      { bg: '#ecfccb', text: '#3f6212' },
  'Ecuador':       { bg: '#fef3c7', text: '#854d0e' },
  'Guatemala':     { bg: '#e0f2fe', text: '#075985' },
  'Costa Rica':    { bg: '#dcfce7', text: '#14532d' },
  'Puerto Rico':   { bg: '#fae8ff', text: '#86198f' },
};
const countryStyle = (c) => COUNTRY_COLOR[c] || { bg: '#f1f5f9', text: '#475569' };

/* Inferencia de instrumento desde el texto del pedido. */
const INSTRUMENTOS = ['Ports','Bonos','Acciones','Fondos','ETF','Alts','Otros'];
const INSTR_COLORS = {
  Ports:'#0066CC', Bonos:'#0EA5E9', Acciones:'#22C55E',
  Fondos:'#A855F7', ETF:'#F59E0B', Alts:'#EC4899', Otros:'#64748B',
};
const getInstrumento = (card) => {
  const t = `${card.descripcion || ''} ${card.aCargo || ''}`.toLowerCase();
  if (/\bport(s|afolio|folios)?\b|port\d|portafolio/i.test(t) || /\bports\b/.test(t)) return 'Ports';
  if (/\bbono|\bbonds?\b|renta fija|rf\b/i.test(t)) return 'Bonos';
  if (/\baccio?n|equity|equities|stock|shares/i.test(t)) return 'Acciones';
  if (/\bfondo|mutual fund|fondos|fund\b/i.test(t)) return 'Fondos';
  if (/\betf|exchange traded/i.test(t)) return 'ETF';
  if (/\balt(s|ernativ)|hedge|private/i.test(t)) return 'Alts';
  return 'Otros';
};
const MONTHS_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const formatRenovacion = (yyyymm) => {
  if (!yyyymm) return '—';
  const [y, m] = String(yyyymm).split('-');
  const mi = parseInt(m, 10) - 1;
  if (isNaN(mi) || mi < 0 || mi > 11) return yyyymm;
  return `${MONTHS_ES[mi]} ${y}`;
};
const monthKey = (ts) => { const d = new Date(ts); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; };
const monthLabel = (ts) => { const d = new Date(ts); return `${MONTHS_ES[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`; };

/* ─────────────────────────────────────────────────────────────────────
   Icons (subset de Lucide, inline SVG)
   ───────────────────────────────────────────────────────────────────── */
const ICONS = {
  layout:    'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
  calendar:  'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
  bar:       'M3 3v18h18 M7 15v4 M11 11v8 M15 7v12 M19 13v6',
  users:     'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75',
  cube:      'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z M3.27 6.96L12 12.01l8.73-5.05 M12 22.08V12',
  plus:      'M12 5v14 M5 12h14',
  trash:     'M3 6h18 M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6 M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2 M10 11v6 M14 11v6',
  edit:      'M12 20h9 M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z',
  x:         'M18 6L6 18 M6 6l12 12',
  check:     'M20 6L9 17l-5-5',
  clock:     'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z M12 6v6l4 2',
  flag:      'M4 22V4 M4 4h13l-2 4 2 4H4',
  user:      'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
  pipeline:  'M6 3v12 M18 3v6 M6 21l-3-3h6l-3 3z M18 21l-3-3h6l-3 3z M6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M11 12h6',
  task:      'M9 11l3 3L22 4 M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11',
  search:    'M11 2a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M21 21l-4.35-4.35',
  filter:    'M22 3H2l8 9.46V19l4 2v-8.54L22 3z',
  download:  'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3',
  upload:    'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M17 8l-5-5-5 5 M12 3v12',
  chevR:     'M9 18l6-6-6-6',
  chevL:     'M15 18l-6-6 6-6',
  chevD:     'M6 9l6 6 6-6',
  link:      'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71 M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71',
  shield:    'M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z',
  logout:    'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9',
  send:      'M22 2L11 13 M22 2l-7 20-4-9-9-4 20-7z',
  pin:       'M12 17v5 M9 10.76V6a3 3 0 0 1 3-3 3 3 0 0 1 3 3v4.76l3 2.24-2 4H8l-2-4 3-2.24z',
  briefcase: 'M20 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16',
  trend:     'M22 7l-9 9-5-5-7 7 M16 7h6v6',
  alert:     'M12 2L1 21h22L12 2z M12 9v4 M12 17h.01',
  menu:      'M3 12h18 M3 6h18 M3 18h18',
};

function Icon({ name, size = 18, className = '', stroke = 'currentColor' }) {
  const d = ICONS[name];
  if (!d) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
         className={className}>
      {d.split(' M').map((p, i) => <path key={i} d={(i === 0 ? '' : 'M') + p} />)}
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Seed data
   ───────────────────────────────────────────────────────────────────── */
/* Equipo. perms: 'admin' (ve todo, incluye métricas Consultora),
   'consultora' (sin métricas), 'maximus' (solo MaximUs).
   La password es solo barrera de entrada en uso interno — los analistas pueden
   cambiarla en su perfil. Para auth real usamos Supabase Auth (magic link). */
const TEAM_SEED = [
  { id: 'u-sh', username: 'dehaedo',  password: 'Santiago2026',  perms: 'admin',      nonAssignable: true,  name: 'Santiago de Haedo',initials: 'SH', role: 'Director general',                   units: ['consultora','maximus'], color: '#004C99' },
  { id: 'u-vr', username: 'vero',     password: 'Vero2026',      perms: 'consultora', nonAssignable: true,  name: 'Verónica Rey',     initials: 'VR', role: 'Directora ejecutiva',                units: ['consultora','maximus'], color: '#06b6d4' },
  { id: 'u-mm', username: 'mautner',  password: 'Martin2026',    perms: 'admin',      nonAssignable: true,  name: 'Martín Mautner',   initials: 'MM', role: 'Director de producto',               units: ['consultora','maximus'], color: '#0066CC' },
  { id: 'u-da', username: 'debo',     password: 'Debo2026',      perms: 'consultora',                       name: 'Deborah Amatti',   initials: 'DA', role: 'Directora de estrategia',            units: ['consultora'],           color: '#ec4899' },
  { id: 'u-pm', username: 'pablo',    password: 'Pablo2026',     perms: 'consultora', extraPerms: ['maximus'], name: 'Pablo Machado',    initials: 'PM', role: 'Director analista de crédito',       units: ['consultora','maximus'], color: '#14b8a6' },
  { id: 'u-em', username: 'emeterio', password: 'Emeterio2026',  perms: 'consultora',                       name: 'Emeterio Morales', initials: 'EM', role: 'Director analista de portafolios',   units: ['consultora'],           color: '#a855f7' },
  { id: 'u-mn', username: 'nogues',   password: 'Nogues2026',    perms: 'consultora',                       name: 'Martín Nogués',    initials: 'MN', role: 'Director analista de renta variable',units: ['consultora'],           color: '#f97316' },
  { id: 'u-ma', username: 'mati',     password: 'Mati2026',      perms: 'consultora',                       name: 'Matías Acevedo',   initials: 'MA', role: 'Analista de portafolios',            units: ['consultora'],           color: '#3b82f6' },
  { id: 'u-fh', username: 'hazan',    password: 'Federico2026',  perms: 'maximus',                          name: 'Federico Hazan',   initials: 'FH', role: 'Analista de datos',                  units: ['maximus'],              color: '#22c55e' },
  { id: 'u-ax', username: 'araujo',   password: 'Max2026',       perms: 'maximus',                          name: 'Máximo Araújo',    initials: 'MX', role: 'Analista',                           units: ['maximus'],              color: '#eab308' },
  { id: 'u-fd', username: 'donagaray',password: 'Felipe2026',    perms: 'consultora', nonAssignable: true,  name: 'Felipe Donagaray', initials: 'FD', role: 'Responsable en comunicación y marketing', units: ['consultora','maximus'], color: '#0EA5E9' },
  { id: 'u-pl', username: 'paulina',  password: 'Paulina2026',   perms: 'consultora', nonAssignable: true,  name: 'Paulina Lorenzo',  initials: 'PL', role: 'Responsable en comunicación y marketing', units: ['consultora','maximus'], color: '#F472B6' },
];

/* Reglas de permisos por route */
const ROUTE_PERMS = {
  'consult/kanban':   ['admin','consultora'],
  'consult/calendar': ['admin','consultora'],
  'consult/metrics':  ['admin'],
  'max/usage':        ['admin','maximus'],
  'max/plan':         ['admin'],
  'max/analisis':     ['admin','maximus'],
  'max/prospects':    ['admin','maximus'],
  'max/tasks':        ['admin','maximus'],
  'max/sala':         ['admin','maximus','consultora'],
};
const canSee = (user, routeId) => {
  if (!user) return false;
  const allowed = ROUTE_PERMS[routeId];
  if (!allowed) return false;
  // El usuario ve la ruta si su perms principal O alguno de sus extraPerms está permitido
  const perms = [user.perms, ...(user.extraPerms || [])];
  return perms.some(p => allowed.includes(p));
};
const firstVisibleRoute = (user) => Object.keys(ROUTE_PERMS).find(r => canSee(user, r)) || 'consult/kanban';

const CONSULTORA_COLS = [
  { id: 'backlog',          label: 'Backlog' },
  { id: 'in_progress',      label: 'En progreso' },
  { id: 'esperando',        label: 'Esperando respuesta' },
  { id: 'in_review',        label: 'En revisión' },
  { id: 'done',             label: 'Listo' },
];

/* Columnas del Kanban de Prospects — espejan los estados del Jira */
const PROSPECT_COLS = [
  { id: 'a_contactar',           label: 'A contactar' },
  { id: 'contactar_esta_semana', label: 'Contactar esta semana' },
  { id: 'volver_a_contactar',    label: 'Volver a contactar' },
  { id: 'esperando_respuesta',   label: 'Esperando respuesta' },
  { id: 'reunion_agendada',      label: 'Reunión agendada' },
  { id: 'probando_servicio',     label: 'Probando servicio' },
  { id: 'cliente',               label: 'Cliente' },
  { id: 'no_les_interesa',       label: 'No les interesa' },
];

const TASK_COLS = [
  { id: 'pending',  label: 'Pendiente' },
  { id: 'doing',    label: 'En curso' },
  { id: 'review',   label: 'En revisión' },
  { id: 'done',     label: 'Hecho' },
];

const PRIORIDADES = [
  { id: 'alta',  label: 'Alta',  cls: 'bg-bad/15 text-bad border-bad/30' },
  { id: 'media', label: 'Media', cls: 'bg-warn/15 text-warn border-warn/30' },
  { id: 'baja',  label: 'Baja',  cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
];

const seedConsultora = () => {
  const arr = (typeof window !== 'undefined' && window.SEED_PENDINGS) || [];
  return arr.slice();
};

/* Regla auto-archive:
   - Cards 'done' viejas (+2 días desde completedAt) se ocultan automáticamente.
   - Cards activas (Backlog / In progress / Review) NUNCA se archivan automáticamente —
     una card hace mucho que sigue abierta es MÁS importante, no menos.
   No se elimina ni cambia estado: solo se oculta del Kanban. Métricas ven todo. */
const ARCHIVE_DAYS_DONE = 2;
const isArchived = (card) => {
  if (card.estado !== 'done') return false;
  const ref = card.completedAt || card.createdAt;
  if (!ref) return false;
  return (now() - ref) > ARCHIVE_DAYS_DONE * DAY;
};

const seedClients = () => {
  const arr = (typeof window !== 'undefined' && window.SEED_CLIENTS) || [];
  return arr.map(c => ({ id: uid(), ...c }));
};

const seedProspects = () => {
  const arr = (typeof window !== 'undefined' && window.SEED_PROSPECTS) || [];
  return arr.slice();
};

const seedTasks = () => {
  const t = now();
  return [
    { id: uid(), titulo: 'Pipeline ingestión PDF Pershing',  descripcion: 'Refactor extractor secciones Portfolio at a Glance.', asignados: ['u-ax','u-fh'], prioridad: 'alta',  deadline: t + 3*DAY, estado: 'doing',   comentarios: [{ id: uid(), autorId: 'u-mm', ts: t - 0.2*DAY, texto: 'Prioridad alta este sprint.' }] },
    { id: uid(), titulo: 'Bug login SSO',                    descripcion: 'Algunos usuarios reportan loop al loguearse.',       asignados: ['u-fh'],         prioridad: 'alta',  deadline: t + 1*DAY, estado: 'review',  comentarios: [] },
    { id: uid(), titulo: 'Job semanal scoring clientes',     descripcion: 'Automatizar cálculo del health score.',               asignados: ['u-ax'],         prioridad: 'media', deadline: t + 7*DAY, estado: 'pending', comentarios: [] },
    { id: uid(), titulo: 'Actualizar dashboard ARS',         descripcion: 'Nuevo tipo de cambio + cotizaciones BCRA.',           asignados: ['u-sh','u-ax'],  prioridad: 'baja',  deadline: t + 14*DAY,estado: 'pending', comentarios: [] },
    { id: uid(), titulo: 'Documentar API v2',                descripcion: 'OpenAPI spec + ejemplos.',                            asignados: ['u-fh'],         prioridad: 'media', deadline: t - 2*DAY, estado: 'done',    comentarios: [] },
  ];
};

const initialState = () => {
  const existing = ls.get(STORAGE_KEY);
  // Migración: si el team no tiene username (versión anterior), regenerar todo desde seed
  const teamOK = existing?.team?.[0]?.username && existing?.team?.[0]?.password;
  if (existing && teamOK && existing.consultora && existing.maximus) return existing;
  // Borrar también keys viejas para que no se acumulen
  try { localStorage.removeItem('plataforma-interna-v1'); localStorage.removeItem('plataforma-interna-session-v1'); } catch {}
  return {
    team: TEAM_SEED,
    consultora: { cards: seedConsultora() },
    maximus:    { clients: seedClients(), prospects: seedProspects(), tasks: seedTasks(), analisis: [], envios: [], reservas: [] },
  };
};

/* ─────────────────────────────────────────────────────────────────────
   Reducer
   ───────────────────────────────────────────────────────────────────── */
function reducer(state, action) {
  switch (action.type) {
    /* Consultora */
    case 'CONSULT_ADD':     return { ...state, consultora: { cards: [action.card, ...state.consultora.cards] } };
    case 'CONSULT_UPDATE':  return { ...state, consultora: { cards: state.consultora.cards.map(c => c.id === action.card.id ? { ...c, ...action.card } : c) } };
    case 'CONSULT_MOVE':    return { ...state, consultora: { cards: state.consultora.cards.map(c => {
        if (c.id !== action.id) return c;
        const next = { ...c, estado: action.estado };
        if (action.estado === 'done' && !c.completedAt) next.completedAt = now();
        if (action.estado !== 'done' && c.completedAt)  next.completedAt = null;
        return next;
      }) } };
    case 'CONSULT_DELETE':  return { ...state, consultora: { cards: state.consultora.cards.filter(c => c.id !== action.id) } };

    /* Clientes MaximUs */
    case 'CLIENT_UPSERT': {
      const exists = state.maximus.clients.some(c => c.id === action.client.id);
      const clients = exists
        ? state.maximus.clients.map(c => c.id === action.client.id ? { ...c, ...action.client } : c)
        : [action.client, ...state.maximus.clients];
      return { ...state, maximus: { ...state.maximus, clients } };
    }
    case 'CLIENT_BULK':    return { ...state, maximus: { ...state.maximus, clients: action.clients } };
    case 'CLIENT_DELETE':  return { ...state, maximus: { ...state.maximus, clients: state.maximus.clients.filter(c => c.id !== action.id) } };

    /* Prospects */
    case 'PROS_ADD':       return { ...state, maximus: { ...state.maximus, prospects: [action.p, ...state.maximus.prospects] } };
    case 'PROS_UPDATE':    return { ...state, maximus: { ...state.maximus, prospects: state.maximus.prospects.map(p => p.id === action.p.id ? { ...p, ...action.p } : p) } };
    case 'PROS_MOVE':      return { ...state, maximus: { ...state.maximus, prospects: state.maximus.prospects.map(p => p.id === action.id ? { ...p, estado: action.estado } : p) } };
    case 'PROS_DELETE':    return { ...state, maximus: { ...state.maximus, prospects: state.maximus.prospects.filter(p => p.id !== action.id) } };

    /* Tareas equipo */
    case 'TASK_ADD':       return { ...state, maximus: { ...state.maximus, tasks: [action.t, ...state.maximus.tasks] } };
    case 'TASK_UPDATE':    return { ...state, maximus: { ...state.maximus, tasks: state.maximus.tasks.map(t => t.id === action.t.id ? { ...t, ...action.t } : t) } };
    case 'TASK_MOVE':      return { ...state, maximus: { ...state.maximus, tasks: state.maximus.tasks.map(t => t.id === action.id ? { ...t, estado: action.estado } : t) } };
    case 'TASK_DELETE':    return { ...state, maximus: { ...state.maximus, tasks: state.maximus.tasks.filter(t => t.id !== action.id) } };
    case 'TASK_COMMENT':   return { ...state, maximus: { ...state.maximus, tasks: state.maximus.tasks.map(t => t.id === action.id ? { ...t, comentarios: [...(t.comentarios||[]), action.c] } : t) } };

    /* Análisis / envíos */
    case 'ANALISIS_ADD':    return { ...state, maximus: { ...state.maximus, analisis: [action.a, ...(state.maximus.analisis||[])] } };
    case 'ANALISIS_DELETE': return { ...state, maximus: { ...state.maximus, analisis: (state.maximus.analisis||[]).filter(a => a.id !== action.id) } };
    case 'ENVIO_ADD':       return { ...state, maximus: { ...state.maximus, envios: [action.e, ...(state.maximus.envios||[])] } };

    /* Reservas sala */
    case 'RESERVA_UPSERT': {
      const list = state.maximus.reservas || [];
      const exists = list.some(r => r.id === action.r.id);
      const reservas = exists ? list.map(r => r.id === action.r.id ? { ...r, ...action.r } : r) : [action.r, ...list];
      return { ...state, maximus: { ...state.maximus, reservas } };
    }
    case 'RESERVA_DELETE':  return { ...state, maximus: { ...state.maximus, reservas: (state.maximus.reservas||[]).filter(r => r.id !== action.id) } };

    /* Team */
    case 'TEAM_UPSERT': {
      const exists = state.team.some(u => u.id === action.user.id);
      const team = exists ? state.team.map(u => u.id === action.user.id ? { ...u, ...action.user } : u)
                          : [...state.team, action.user];
      return { ...state, team };
    }
    case 'RESET':          return action.state;
    default: return state;
  }
}

/* ─────────────────────────────────────────────────────────────────────
   Context
   ───────────────────────────────────────────────────────────────────── */
const AppCtx = createContext(null);
const useApp = () => useContext(AppCtx);

/* ─────────────────────────────────────────────────────────────────────
   UI primitives
   ───────────────────────────────────────────────────────────────────── */
function Avatar({ user, size = 28 }) {
  if (!user) return null;
  return (
    <span
      className="inline-flex items-center justify-center font-semibold text-[11px] rounded-full shrink-0"
      style={{ width: size, height: size, background: user.color, color: '#fff' }}
      title={user.name}
    >{user.initials}</span>
  );
}

function Badge({ children, className = '' }) {
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-medium ${className}`}>{children}</span>;
}

function Btn({ children, onClick, variant = 'primary', size = 'md', className = '', type = 'button', disabled }) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition border';
  const sizes = { sm: 'px-2.5 py-1.5 text-xs', md: 'px-3.5 py-2 text-sm', lg: 'px-4 py-2.5 text-sm' };
  const variants = {
    primary: 'bg-gold hover:bg-gold-2 text-white border-gold shadow-gold',
    ghost:   'bg-transparent hover:bg-surface-2 text-ink border-line',
    soft:    'bg-surface-2 hover:bg-surface-3 text-ink border-line',
    danger:  'bg-bad/10 hover:bg-bad/20 text-bad border-bad/30',
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`${base} ${sizes[size]} ${variants[variant]} ${disabled ? 'opacity-40 cursor-not-allowed' : ''} ${className}`}>
      {children}
    </button>
  );
}

function Modal({ open, onClose, title, children, width = 'max-w-xl' }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className={`w-full ${width} bg-surface border border-line rounded-2xl shadow-card`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <h3 className="font-semibold text-base">{title}</h3>
          <button onClick={onClose} className="text-muted hover:text-ink"><Icon name="x" /></button>
        </div>
        <div className="px-5 py-4 max-h-[75vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children, hint }) {
  return (
    <label className="block mb-3">
      <div className="text-[12px] font-medium text-muted mb-1.5">{label}</div>
      {children}
      {hint && <div className="text-[11px] text-muted/80 mt-1">{hint}</div>}
    </label>
  );
}

function PriorityBadge({ value }) {
  const p = PRIORIDADES.find(p => p.id === value) || PRIORIDADES[1];
  return <Badge className={p.cls}><Icon name="flag" size={11} />{p.label}</Badge>;
}

function EmptyState({ icon = 'cube', title, hint, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6 border border-dashed border-line rounded-2xl bg-surface">
      <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center text-gold mb-3"><Icon name={icon} size={22} /></div>
      <h4 className="font-semibold mb-1">{title}</h4>
      {hint && <p className="text-sm text-muted max-w-md">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   LOGIN
   ───────────────────────────────────────────────────────────────────── */
/* Logo LATAM ConsultUs — SVG inline reproduciendo el lockup oficial:
   LATAM grande + CONSULTUS con tracking expandido abajo + (opcional) divisor
   vertical + tagline "El valor de ser independiente". Color navy oficial. */
function LatamLogo({ size = 'md', tagline = false }) {
  // Conservado para compatibilidad, ahora muestra el logo MaximUs.
  return <MaximusLogo size={size} tagline={tagline} />;
}

/* Logo MaximUs — imagen PNG oficial (extraída del docx de firmas). */
function MaximusLogo({ size = 'md' }) {
  const sizes = { sm: 30, md: 44, lg: 64, xl: 84 };
  const h = sizes[size] || sizes.md;
  return (
    <img src="./assets/maximus-logo.png" alt="MaximUs"
         style={{ height: h, width: 'auto', display: 'block' }} />
  );
}

function Login({ team, onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const submit = (e) => {
    e?.preventDefault();
    const u = team.find(x => (x.username || '').toLowerCase() === username.trim().toLowerCase());
    if (!u || u.password !== password) { setError('Usuario o contraseña incorrectos.'); return; }
    setError(''); onLogin(u.id);
  };
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-bg-2 border-r border-line">
        <LatamLogo size="lg" />
        <div>
          <h2 className="font-display text-2xl font-semibold text-ink mb-3 leading-tight">
            Plataforma interna del equipo
          </h2>
          <p className="text-sm text-ink-2 max-w-md">
            Gestión de pedidos de Consultora, seguimiento de uso de MaximUs y pipeline comercial.
            Sincronizado entre los analistas del equipo.
          </p>
          <div className="mt-8 flex items-center gap-3 text-xs text-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-gold" />
            Versión interna · {new Date().getFullYear()}
          </div>
        </div>
        <div className="text-[10px] text-muted">© LATAM ConsultUs · Punta del Este, Uruguay</div>
      </div>
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-6"><LatamLogo size="md" /></div>
          <h1 className="font-display text-xl font-semibold mb-1 text-ink">Iniciar sesión</h1>
          <p className="text-sm text-muted mb-6">Ingresá con tu usuario y contraseña.</p>
          <form onSubmit={submit} className="space-y-3">
            <Field label="Usuario">
              <input value={username} onChange={e => setUsername(e.target.value)} autoFocus autoComplete="username" placeholder="ej: mautner" />
            </Field>
            <Field label="Contraseña">
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" placeholder="•••••••••" />
            </Field>
            {error && <div className="text-bad text-xs px-1">{error}</div>}
            <Btn type="submit" className="w-full justify-center mt-2">Entrar</Btn>
          </form>
          <div className="hr-soft my-6" />
          <p className="text-[11px] text-muted">
            ¿Olvidaste tu contraseña? Pedile a Martín o Santiago que te la recuerden.<br/>
            En la próxima versión la app va a usar login con magic link por email.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   SIDEBAR
   ───────────────────────────────────────────────────────────────────── */
const NAV = [
  { group: 'Consultora', items: [
    { id: 'consult/kanban',   label: 'Pedidos (Kanban)', icon: 'layout' },
    { id: 'consult/calendar', label: 'Calendario',        icon: 'calendar' },
    { id: 'consult/metrics',  label: 'Métricas',          icon: 'bar' },
  ]},
  { group: 'MaximUs', items: [
    { id: 'max/usage',     label: 'Uso clientes',    icon: 'trend' },
    { id: 'max/plan',      label: 'Plan comercial',  icon: 'flag' },
    { id: 'max/analisis',  label: 'Análisis + WhatsApp', icon: 'send' },
    { id: 'max/prospects', label: 'Pipeline ventas', icon: 'pipeline' },
    { id: 'max/tasks',     label: 'Tareas equipo',   icon: 'task' },
  ]},
  { group: 'Equipo', items: [
    { id: 'max/sala',      label: 'Sala de reuniones', icon: 'calendar' },
  ]},
];

function Sidebar({ route, setRoute, me, onLogout, counters, synced, mobileOpen, onMobileClose }) {
  const visibleNav = NAV
    .map(g => ({ ...g, items: g.items.filter(it => canSee(me, it.id)) }))
    .filter(g => g.items.length > 0);

  const handleNav = (id) => { setRoute(id); onMobileClose?.(); };

  return (
    <aside className="fixed lg:relative inset-y-0 left-0 z-50 shrink-0 border-r border-line bg-bg-2 flex flex-col" style={{
      width: 230,
      transform: mobileOpen || (typeof window !== 'undefined' && window.innerWidth >= 1024) ? 'translateX(0)' : 'translateX(-101%)',
      transition: 'transform .22s ease',
    }}>
      <div className="p-4 border-b border-line">
        <LatamLogo size="sm" />
        <div className="text-[10px] text-muted leading-tight uppercase tracking-[0.18em] mt-1.5">Plataforma interna</div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-5">
        {visibleNav.map(group => (
          <div key={group.group}>
            <div className="text-[10px] font-semibold tracking-[0.18em] uppercase text-muted/80 px-2 mb-2">
              {group.group}
            </div>
            <div className="space-y-1">
              {group.items.map(it => {
                const active = route === it.id;
                const count = counters[it.id];
                return (
                  <button key={it.id} onClick={() => handleNav(it.id)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition
                      ${active ? 'bg-gold/15 text-gold border border-gold/30' : 'text-muted hover:text-ink hover:bg-surface-2 border border-transparent'}`}>
                    <Icon name={it.icon} size={16} />
                    <span className="flex-1 text-left">{it.label}</span>
                    {count > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${active ? 'bg-surface-3' : 'bg-surface text-muted'}`}>{count}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-line">
        <div className="flex items-center gap-2.5 px-2 py-2">
          <Avatar user={me} size={32} />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{me.name}</div>
            <div className="text-[11px] text-muted truncate">{me.role}</div>
          </div>
          <button onClick={onLogout} title="Cerrar sesión" className="text-muted hover:text-ink"><Icon name="logout" size={16} /></button>
        </div>
        <div className="flex items-center gap-1.5 px-2 pt-1 text-[10px] text-muted">
          {synced ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-ok" />
              Sincronizado con equipo
            </>
          ) : window.SUPABASE_CFG ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-warn animate-pulse" />
              Conectando con Supabase…
            </>
          ) : (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-muted" />
              Local (sin sync)
            </>
          )}
        </div>
      </div>
    </aside>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   CONSULTORA — KANBAN
   ───────────────────────────────────────────────────────────────────── */
function ConsultoraKanban() {
  const { state, dispatch, me } = useApp();
  const team = state.team.filter(u => u.units.includes('consultora') && !u.nonAssignable);
  // Lista única de clientes desde MaximUs (Uso Clientes), no de pendings — para mantener canónico
  const clientesUnicos = useMemo(() => {
    const set = new Set();
    state.maximus.clients.forEach(c => c.cliente && set.add(c.cliente));
    return Array.from(set).sort();
  }, [state.maximus.clients]);
  const cards = state.consultora.cards;
  const [editing, setEditing] = useState(null);   // card | null
  const [creating, setCreating] = useState(false);
  const [filterAnalista, setFilterAnalista] = useState('');
  const [search, setSearch] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const isAdmin = me.role === 'Admin' || me.role.includes('Admin');

  const archivedCount = useMemo(() => cards.filter(isArchived).length, [cards]);

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return cards.filter(c =>
      (showArchived || !isArchived(c)) &&
      (!filterAnalista || c.analistaId === filterAnalista) &&
      (!s || `${c.cliente} ${c.descripcion} ${c.aCargo || ''}`.toLowerCase().includes(s))
    );
  }, [cards, search, filterAnalista, showArchived]);

  const byCol = useMemo(() => {
    const m = Object.fromEntries(CONSULTORA_COLS.map(c => [c.id, []]));
    filtered.forEach(c => { (m[c.estado] || m.backlog).push(c); });
    return m;
  }, [filtered]);

  const onDrop = (estado, e) => {
    e.preventDefault(); e.currentTarget.classList.remove('drop-target');
    const id = e.dataTransfer.getData('text/plain');
    if (id) dispatch({ type: 'CONSULT_MOVE', id, estado });
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Pedidos de clientes"
        subtitle={`Tablero compartido del equipo de Consultora. Las cards en Listo se ocultan a los ${ARCHIVE_DAYS_DONE} días. ${archivedCount > 0 ? `${archivedCount} en histórico.` : ''}`}
        actions={<>
          <div className="relative">
            <Icon name="search" size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cliente o pedido…"
              className="!pl-8 !py-2 !text-sm" style={{ width: 220 }} />
          </div>
          <select value={filterAnalista} onChange={e => setFilterAnalista(e.target.value)} className="!py-2 !text-sm" style={{ width: 170 }}>
            <option value="">Todos los analistas</option>
            {team.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <Btn variant={showArchived ? 'primary' : 'soft'} size="md" onClick={() => setShowArchived(s => !s)} title={`${archivedCount} cards archivadas`}>
            <Icon name="clock" size={14} />{showArchived ? 'Ocultando histórico' : `Ver histórico (${archivedCount})`}
          </Btn>
          <Btn onClick={() => setCreating(true)}><Icon name="plus" size={16} />Nuevo pedido</Btn>
        </>}
      />

      <div className="kanban-board flex gap-3 px-3 sm:px-6 pb-6 flex-1 overflow-x-auto overflow-y-hidden">
        {CONSULTORA_COLS.map(col => (
          <div key={col.id}
               onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('drop-target'); }}
               onDragLeave={e => e.currentTarget.classList.remove('drop-target')}
               onDrop={e => onDrop(col.id, e)}
               className="kanban-col shrink-0 flex flex-col rounded-lg bg-bg-2 border border-line">
            <div className="px-3 py-2.5 flex items-center justify-between border-b border-line">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-2">{col.label}</span>
              <span className="text-[10px] font-medium text-muted px-1.5 py-0.5 rounded bg-surface tabular-nums">{byCol[col.id].length}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[120px]">
              {byCol[col.id].map(card => (
                <KanbanCard key={card.id} card={card} team={state.team} onClick={() => setEditing(card)} />
              ))}
              {byCol[col.id].length === 0 && (
                <div className="text-[11px] text-muted/60 px-2 py-6 text-center italic">Vacío</div>
              )}
            </div>
          </div>
        ))}
      </div>

      <CardEditor
        open={creating || !!editing}
        card={editing}
        team={team}
        clientes={clientesUnicos}
        isAdmin={isAdmin}
        onClose={() => { setEditing(null); setCreating(false); }}
        onSave={(card) => { if (card.id) dispatch({ type: 'CONSULT_UPDATE', card }); else dispatch({ type: 'CONSULT_ADD', card: { ...card, id: uid(), createdAt: now(), completedAt: null, estado: card.estado || 'backlog' } }); setEditing(null); setCreating(false); }}
        onDelete={(id) => { dispatch({ type: 'CONSULT_DELETE', id }); setEditing(null); setCreating(false); }}
      />
    </div>
  );
}

function KanbanCard({ card, team, onClick }) {
  const analista = team.find(u => u.id === card.analistaId);
  const overdue = card.deadline && card.deadline < now() && card.estado !== 'done';
  const isDone = card.estado === 'done';
  const onDragStart = (e) => { e.dataTransfer.setData('text/plain', card.id); e.currentTarget.classList.add('dragging'); };
  const onDragEnd   = (e) => e.currentTarget.classList.remove('dragging');
  return (
    <div draggable onDragStart={onDragStart} onDragEnd={onDragEnd} onClick={onClick}
         className="card-lift card-shadow cursor-grab active:cursor-grabbing rounded-lg border border-line bg-bg overflow-hidden">
      {/* Color rail según prioridad/estado */}
      <div className="h-0.5" style={{
        background: isDone ? '#22c55e' : overdue ? '#E74C3C' : card.prioridad === 'alta' ? '#E74C3C' : card.prioridad === 'media' ? '#FF9500' : '#22c55e'
      }} />
      <div className="p-3">
        <div className="font-semibold text-ink text-[13px] leading-tight mb-1 line-clamp-2">{card.descripcion}</div>
        <div className="text-[11px] text-ink-2 font-medium mb-2.5">{card.cliente}</div>
        <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
          <PriorityBadge value={card.prioridad} />
          {overdue && !isDone && <Badge className="bg-bad/10 text-bad border-bad/30"><Icon name="alert" size={10} />Vencido</Badge>}
        </div>
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-line">
          <div className="flex items-center gap-1.5 min-w-0">
            {analista
              ? <><Avatar user={analista} size={20} /><span className="text-[11px] text-ink-2 truncate">{analista.name}</span></>
              : card.aCargo
                ? <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-surface-2 text-[10px] text-ink-2 truncate" title={card.aCargo}>
                    <Icon name="user" size={10} />{card.aCargo}
                  </span>
                : <span className="text-[10px] text-muted italic">sin asignar</span>}
          </div>
          {card.deadline && (
            <div className={`flex items-center gap-1 text-[10px] tabular-nums shrink-0 ${isDone ? 'text-muted' : overdue ? 'text-bad font-semibold' : 'text-ink-2'}`}>
              <Icon name="clock" size={10} />
              {isDone ? fmtDate(card.completedAt || card.deadline) : fmtTimeLeft(card.deadline)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CardEditor({ open, card, team, clientes = [], isAdmin, onClose, onSave, onDelete }) {
  const isNew = !card;
  const [form, setForm] = useState(card || { cliente: '', descripcion: '', analistaId: isAdmin ? '' : team[0]?.id || '', prioridad: 'media', deadline: now() + 2*DAY, estado: 'backlog' });
  useEffect(() => { if (open) setForm(card || { cliente: '', descripcion: '', analistaId: '', prioridad: 'media', deadline: now() + 2*DAY, estado: 'backlog' }); }, [open, card]);

  const setPreset = (days) => setForm(f => ({ ...f, deadline: addBusinessDays(now(), days) }));

  if (!open) return null;
  return (
    <Modal open={open} onClose={onClose} title={isNew ? 'Nuevo pedido' : 'Editar pedido'}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
        <Field label="Cliente" hint="Empezá a escribir para autocompletar o agregá uno nuevo">
          <input list="cli-dl" value={form.cliente} onChange={e => setForm({ ...form, cliente: e.target.value })} placeholder="Ej: Banco Macro" />
          <datalist id="cli-dl">
            {clientes.map(c => <option key={c} value={c} />)}
          </datalist>
        </Field>
        <Field label="Prioridad">
          <select value={form.prioridad} onChange={e => setForm({ ...form, prioridad: e.target.value })}>
            {PRIORIDADES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </Field>
        <div className="sm:col-span-2">
          <Field label="Descripción">
            <textarea rows={3} value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} placeholder="Detalle del pedido…" />
          </Field>
        </div>
        <Field label="Analista asignado" hint={form.aCargo && !form.analistaId ? `Originalmente a/c: ${form.aCargo}` : null}>
          <select value={form.analistaId || ''} onChange={e => setForm({ ...form, analistaId: e.target.value })}>
            <option value="">Sin asignar{form.aCargo ? ` (a/c ${form.aCargo})` : ''}</option>
            {team.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </Field>
        <Field label="Estado">
          <select value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })}>
            {CONSULTORA_COLS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </Field>
        <div className="sm:col-span-2">
          <Field label="Deadline" hint="Atajos en días hábiles (saltan sábados y domingos)">
            <div className="flex gap-2 items-center">
              <input type="datetime-local" value={toInputDateTime(form.deadline)} onChange={e => setForm({ ...form, deadline: fromInputDateTime(e.target.value) })} className="flex-1" />
              <Btn variant="soft" size="sm" onClick={() => setPreset(1)}>+1d hábil</Btn>
              <Btn variant="soft" size="sm" onClick={() => setPreset(2)}>+2d</Btn>
              <Btn variant="soft" size="sm" onClick={() => setPreset(3)}>+3d</Btn>
            </div>
          </Field>
        </div>
      </div>
      <div className="flex items-center justify-between pt-2">
        <div>
          {!isNew && <Btn variant="danger" onClick={() => onDelete(card.id)}><Icon name="trash" size={14} />Eliminar</Btn>}
        </div>
        <div className="flex gap-2">
          <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
          <Btn onClick={() => onSave({ ...form, id: card?.id })}><Icon name="check" size={14} />Guardar</Btn>
        </div>
      </div>
    </Modal>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   CALENDARIO
   ───────────────────────────────────────────────────────────────────── */
function ConsultoraCalendar() {
  const { state } = useApp();
  const [view, setView] = useState('mes'); // 'mes' | 'sem'
  const [anchor, setAnchor] = useState(new Date());
  const [selected, setSelected] = useState(null);
  const team = state.team;

  const monthStart = useMemo(() => { const d = new Date(anchor); d.setDate(1); d.setHours(0,0,0,0); return d; }, [anchor]);
  const monthEnd   = useMemo(() => { const d = new Date(monthStart); d.setMonth(d.getMonth()+1); return d; }, [monthStart]);

  const events = useMemo(() => state.consultora.cards.filter(c => c.deadline && c.estado !== 'done'), [state.consultora.cards]);

  const move = (n) => {
    const d = new Date(anchor);
    if (view === 'mes') d.setMonth(d.getMonth() + n);
    else d.setDate(d.getDate() + 7 * n);
    setAnchor(d);
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Calendario de deadlines"
        subtitle="Vista mensual o semanal de los pedidos activos del equipo de Consultora."
        actions={<>
          <div className="flex items-center gap-1 bg-surface p-1 rounded-lg border border-line">
            <button onClick={() => setView('mes')} className={`px-3 py-1.5 text-xs rounded-md ${view==='mes'?'bg-gold text-white':'text-muted'}`}>Mes</button>
            <button onClick={() => setView('sem')} className={`px-3 py-1.5 text-xs rounded-md ${view==='sem'?'bg-gold text-white':'text-muted'}`}>Semana</button>
          </div>
          <Btn variant="soft" size="sm" onClick={() => move(-1)}><Icon name="chevL" size={14} /></Btn>
          <Btn variant="soft" size="sm" onClick={() => setAnchor(new Date())}>Hoy</Btn>
          <Btn variant="soft" size="sm" onClick={() => move(1)}><Icon name="chevR" size={14} /></Btn>
        </>}
      />

      <div className="px-6 pb-6 flex-1 overflow-y-auto">
        {view === 'mes'
          ? <MonthGrid anchor={anchor} events={events} team={team} onPick={setSelected} />
          : <WeekGrid  anchor={anchor} events={events} team={team} onPick={setSelected} />}
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Detalle del pedido">
        {selected && <CardDetail card={selected} team={team} />}
      </Modal>
    </div>
  );
}

function MonthGrid({ anchor, events, team, onPick }) {
  const first = new Date(anchor); first.setDate(1); first.setHours(0,0,0,0);
  const dow = (first.getDay() + 6) % 7; // lunes = 0
  const gridStart = new Date(first); gridStart.setDate(first.getDate() - dow);
  const cells = Array.from({length: 42}, (_, i) => { const d = new Date(gridStart); d.setDate(gridStart.getDate()+i); return d; });
  const monthName = anchor.toLocaleDateString('es-UY', { month: 'long', year: 'numeric' });
  return (
    <div>
      <div className="mb-2 text-lg capitalize">{monthName}</div>
      <div className="cal-grid rounded-xl overflow-hidden border border-line">
        {['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].map(d => (
          <div key={d} className="bg-surface text-[11px] uppercase tracking-wider text-muted px-2 py-2 text-center">{d}</div>
        ))}
        {cells.map((d, i) => {
          const isOtherMonth = d.getMonth() !== anchor.getMonth();
          const isToday = sameDay(d.getTime(), now());
          const dayEvents = events.filter(e => sameDay(e.deadline, d.getTime()));
          return (
            <div key={i} className={`cal-cell ${isOtherMonth ? 'dim' : ''} ${isToday ? 'today' : ''}`}>
              <div className="text-[11px] font-medium mb-1 opacity-80">{d.getDate()}</div>
              <div className="space-y-1">
                {dayEvents.slice(0,3).map(ev => {
                  const a = team.find(u => u.id === ev.analistaId);
                  const c = a?.color || '#0066CC';
                  return (
                    <button key={ev.id} onClick={() => onPick(ev)}
                      className="w-full text-left text-[11px] font-medium px-1.5 py-1 rounded truncate hover:brightness-95 transition"
                      style={{ background: c + '1A', color: c, borderLeft: `3px solid ${c}` }}
                      title={`${ev.cliente} — ${ev.descripcion}`}>
                      {ev.cliente}
                    </button>
                  );
                })}
                {dayEvents.length > 3 && (
                  <div className="text-[10px] text-muted">+{dayEvents.length - 3} más</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekGrid({ anchor, events, team, onPick }) {
  const start = new Date(anchor); const dow = (start.getDay() + 6) % 7; start.setDate(start.getDate() - dow); start.setHours(0,0,0,0);
  const days = Array.from({length:7}, (_, i) => { const d = new Date(start); d.setDate(start.getDate()+i); return d; });
  return (
    <div className="rounded-xl overflow-hidden border border-line">
      <div className="grid grid-cols-7 bg-surface">
        {days.map((d, i) => (
          <div key={i} className={`px-3 py-2.5 text-center border-r border-line last:border-r-0 ${sameDay(d.getTime(), now()) ? 'bg-gold/20' : ''}`}>
            <div className="text-[10px] uppercase tracking-wider text-muted">{d.toLocaleDateString('es-UY',{ weekday:'short' })}</div>
            <div className="font-semibold">{d.getDate()}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 bg-bg-2/40">
        {days.map((d, i) => {
          const dayEvents = events.filter(e => sameDay(e.deadline, d.getTime()));
          return (
            <div key={i} className="p-2 min-h-[280px] border-r border-line last:border-r-0 space-y-2">
              {dayEvents.length === 0 && <div className="text-[11px] text-muted/60 text-center py-4">—</div>}
              {dayEvents.map(ev => {
                const a = team.find(u => u.id === ev.analistaId);
                const c = a?.color || '#0066CC';
                return (
                  <button key={ev.id} onClick={() => onPick(ev)} className="w-full text-left p-2 rounded-md hover:brightness-95 transition"
                    style={{ background: c + '12', borderLeft: `3px solid ${c}` }}>
                    <div className="text-[12px] font-semibold truncate" style={{ color: c }}>{ev.cliente}</div>
                    <div className="text-[11px] text-ink-2 line-clamp-2 mt-0.5">{ev.descripcion}</div>
                    <div className="text-[10px] text-muted mt-1">{fmtDateTime(ev.deadline)}</div>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CardDetail({ card, team }) {
  const a = team.find(u => u.id === card.analistaId);
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <PriorityBadge value={card.prioridad} />
        <Badge className="bg-surface-2 border-line text-ink-2">{CONSULTORA_COLS.find(c => c.id === card.estado)?.label}</Badge>
      </div>
      <h3 className="text-lg font-semibold">{card.cliente}</h3>
      <p className="text-sm text-ink-2">{card.descripcion}</p>
      <div className="hr-soft" />
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div><div className="text-[11px] text-muted">Analista</div><div className="flex items-center gap-2 mt-1">{a ? <><Avatar user={a} size={20} />{a.name}</> : 'Sin asignar'}</div></div>
        <div><div className="text-[11px] text-muted">Deadline</div><div className={`mt-1 ${deadlineColor(card.deadline, card.estado==='done')}`}>{fmtDateTime(card.deadline)} · {fmtTimeLeft(card.deadline)}</div></div>
        <div><div className="text-[11px] text-muted">Creado</div><div className="mt-1">{fmtDateTime(card.createdAt)}</div></div>
        {card.completedAt && <div><div className="text-[11px] text-muted">Completado</div><div className="mt-1">{fmtDateTime(card.completedAt)}</div></div>}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   CONSULTORA — MÉTRICAS
   ───────────────────────────────────────────────────────────────────── */
function ConsultoraMetrics() {
  const { state } = useApp();
  const [tab, setTab] = useState('productividad'); // productividad | analisis
  const [period, setPeriod] = useState('semana'); // dia | semana | mes | 90d | year | custom | all
  const [customFrom, setCustomFrom] = useState(() => new Date(now() - 30*DAY).toISOString().slice(0,10));
  const [customTo,   setCustomTo]   = useState(() => new Date(now()).toISOString().slice(0,10));
  const cards = state.consultora.cards;
  const team = state.team.filter(u => u.units.includes('consultora') && !u.nonAssignable);

  const range = useMemo(() => {
    if (period === 'all') {
      return { from: 0, to: now() * 2, label: 'Histórico completo' };
    }
    if (period === 'custom') {
      const from = customFrom ? new Date(customFrom).setHours(0,0,0,0) : now() - 30*DAY;
      const to   = customTo   ? new Date(customTo).setHours(23,59,59,999) : now();
      return { from, to, label: `${customFrom} a ${customTo}` };
    }
    const map = { dia: 1, semana: 7, mes: 30, '90d': 90, year: 365 };
    const days = map[period] || 7;
    return { from: now() - days * DAY, to: now(), label: `Últimos ${days === 1 ? '24h' : days + ' días'}` };
  }, [period, customFrom, customTo]);

  const periodMs = range.to - range.from;
  const since = range.from;

  const completed = cards.filter(c => c.completedAt && c.completedAt >= range.from && c.completedAt <= range.to);
  const totalCompleted = completed.length;
  const avgHoursOverall = completed.length
    ? Math.round(completed.reduce((s,c) => s + (c.completedAt - c.createdAt), 0) / completed.length / HOUR)
    : 0;

  const byAnalista = team.map(u => {
    const list = completed.filter(c => c.analistaId === u.id);
    const avgH = list.length ? Math.round(list.reduce((s,c) => s + (c.completedAt - c.createdAt), 0) / list.length / HOUR) : 0;
    return { user: u, count: list.length, avgH };
  });

  const byEstado = CONSULTORA_COLS.map(col => ({
    col, count: cards.filter(c => c.estado === col.id).length
  }));

  // Series por día/semana según el largo del rango
  const totalDays = Math.max(1, Math.round(periodMs / DAY));
  const bucketDays = totalDays <= 30 ? 1 : totalDays <= 120 ? 7 : 30; // diaria / semanal / mensual
  const buckets = Math.min(40, Math.ceil(totalDays / bucketDays));
  const series = Array.from({ length: buckets }, (_, i) => {
    const dEnd = startOfDay(range.to - (buckets - 1 - i) * bucketDays * DAY) + bucketDays * DAY;
    const dStart = dEnd - bucketDays * DAY;
    const n = cards.filter(c => c.completedAt && c.completedAt >= dStart && c.completedAt < dEnd).length;
    const label = bucketDays === 1
      ? new Date(dStart).toLocaleDateString('es-UY', { day:'2-digit', month:'2-digit' })
      : new Date(dStart).toLocaleDateString('es-UY', { day:'2-digit', month:'short' });
    return { label, n };
  });
  const maxN = Math.max(1, ...series.map(s => s.n));

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Métricas de Consultora"
        subtitle={`${tab === 'productividad' ? 'Productividad del equipo' : 'Análisis de pedidos'} · ${range.label}`}
        actions={<>
          <div className="flex items-center gap-1 bg-surface p-1 rounded-lg border border-line">
            <button onClick={() => setTab('productividad')} className={`px-3 py-1.5 text-xs rounded-md ${tab==='productividad' ? 'bg-gold text-white' : 'text-muted hover:text-ink'}`}>Productividad</button>
            <button onClick={() => setTab('analisis')}      className={`px-3 py-1.5 text-xs rounded-md ${tab==='analisis'      ? 'bg-gold text-white' : 'text-muted hover:text-ink'}`}>Análisis pedidos</button>
          </div>
          <div className="flex items-center gap-1 bg-surface p-1 rounded-lg border border-line">
            {[['dia','24h'],['semana','7d'],['mes','30d'],['90d','90d'],['year','Año'],['all','Todo'],['custom','Custom']].map(([p,label]) => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs rounded-md ${period === p ? 'bg-gold text-white' : 'text-muted hover:text-ink'}`}>{label}</button>
            ))}
          </div>
          {period === 'custom' && (
            <div className="flex items-center gap-1.5">
              <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} className="!py-1.5 !text-xs" style={{ width: 140 }} />
              <span className="text-muted text-xs">→</span>
              <input type="date" value={customTo}   onChange={e => setCustomTo(e.target.value)}   className="!py-1.5 !text-xs" style={{ width: 140 }} />
            </div>
          )}
        </>}
      />

      <div className="px-3 sm:px-6 pb-6 flex-1 overflow-y-auto space-y-5">
        {tab === 'productividad' && <>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Tarjetas completadas" value={totalCompleted} hint={range.label} />
          <StatCard title="Tiempo promedio" value={`${avgHoursOverall}h`} hint="Desde creación hasta done" />
          <StatCard title="Activas en el tablero" value={cards.filter(c => c.estado !== 'done').length} hint="Backlog + In progress + Review" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Panel title={bucketDays === 1 ? 'Tarjetas completadas por día' : bucketDays === 7 ? 'Tarjetas completadas por semana' : 'Tarjetas completadas por mes'}>
            {series.every(s => s.n === 0) ? <EmptyState title="Sin completas en el período" hint="Mové tarjetas a Listo para ver datos acá." /> : (
              <div>
                <div className="flex gap-2" style={{ height: 220 }}>
                  {/* Eje Y */}
                  <div className="flex flex-col justify-between text-[10px] text-muted tabular-nums pr-1 py-0" style={{ minWidth: 22 }}>
                    <span>{maxN}</span>
                    <span>{Math.round(maxN * 2 / 3)}</span>
                    <span>{Math.round(maxN / 3)}</span>
                    <span>0</span>
                  </div>
                  {/* Área del chart */}
                  <div className="flex-1 relative">
                    {/* Líneas de grid */}
                    {[0, 1, 2, 3].map(i => (
                      <div key={i} className="absolute left-0 right-0 border-t border-line/60" style={{ top: `${i * 33.33}%` }} />
                    ))}
                    {/* Barras */}
                    <div className="absolute inset-0 flex items-stretch gap-1.5 px-1">
                      {series.map((s, i) => {
                        const pct = (s.n / maxN) * 100;
                        return (
                          <div key={i} className="flex-1 flex flex-col justify-end items-center min-w-0 group relative">
                            {s.n > 0 && (
                              <div className="absolute text-[10px] tabular-nums text-ink font-semibold pointer-events-none"
                                   style={{ bottom: `calc(${pct}% + 2px)` }}>
                                {s.n}
                              </div>
                            )}
                            <div className="w-full rounded-t-md transition-all hover:brightness-110"
                                 style={{
                                   height: s.n > 0 ? `${pct}%` : 0,
                                   minHeight: s.n > 0 ? 8 : 0,
                                   background: s.n > 0 ? '#0066CC' : 'transparent',
                                 }}
                                 title={`${s.label}: ${s.n}`} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                {/* Labels del eje X */}
                <div className="flex gap-1.5 px-1 mt-2" style={{ marginLeft: 30 }}>
                  {series.map((s, i) => {
                    const show = buckets <= 12 || i % Math.ceil(buckets / 8) === 0;
                    return (
                      <div key={i} className="flex-1 text-[10px] text-muted text-center tabular-nums truncate">
                        {show ? s.label : ''}
                      </div>
                    );
                  })}
                </div>
                <div className="text-[10px] text-muted text-center mt-3 pt-2 border-t border-line">
                  Total del período: <b className="text-ink">{series.reduce((a,b) => a + b.n, 0)}</b> · Día con más: <b className="text-ink">{maxN}</b>
                </div>
              </div>
            )}
          </Panel>

          <Panel title="Distribución por estado">
            <div className="space-y-3">
              {byEstado.map(({ col, count }) => {
                const total = cards.length || 1;
                const pct = Math.round(count / total * 100);
                return (
                  <div key={col.id}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>{col.label}</span>
                      <span className="text-muted">{count} · {pct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-surface overflow-hidden">
                      <div className="h-full bg-gold" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>

        <Panel title="Performance por analista">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted text-[11px] uppercase tracking-wider">
                <tr><th className="py-2">Analista</th><th>Completadas</th><th>Tiempo promedio</th><th>Carga actual</th></tr>
              </thead>
              <tbody>
                {byAnalista.map(({ user, count, avgH }) => {
                  const carga = cards.filter(c => c.analistaId === user.id && c.estado !== 'done').length;
                  return (
                    <tr key={user.id} className="border-t border-line">
                      <td className="py-2.5"><div className="flex items-center gap-2"><Avatar user={user} size={24} />{user.name}</div></td>
                      <td>{count}</td>
                      <td>{count > 0 ? `${avgH}h` : '—'}</td>
                      <td>{carga} activas</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
        </>}

        {tab === 'analisis' && <AnalisisPedidos cards={cards} range={range} />}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   ANÁLISIS DE PEDIDOS (estilo PPT informe interno)
   ───────────────────────────────────────────────────────────────────── */
function AnalisisPedidos({ cards, range }) {
  const data = useMemo(() => {
    // Filtrar por createdAt dentro del range seleccionado
    const withDate = cards.filter(c => c.createdAt && c.createdAt >= range.from && c.createdAt <= range.to);
    const totalPedidos = withDate.length;
    const clientesUnicos = new Set(withDate.map(c => c.cliente)).size;

    // Per mes
    const byMonth = {};
    withDate.forEach(c => {
      const k = monthKey(c.createdAt);
      if (!byMonth[k]) byMonth[k] = { key: k, label: monthLabel(c.createdAt), total: 0, byInstr: {} };
      byMonth[k].total++;
      const instr = getInstrumento(c);
      byMonth[k].byInstr[instr] = (byMonth[k].byInstr[instr] || 0) + 1;
    });
    const months = Object.values(byMonth).sort((a,b) => a.key.localeCompare(b.key));
    const pico = months.reduce((m, x) => x.total > (m?.total || 0) ? x : m, null);
    const piso = months.reduce((m, x) => (!m || x.total < m.total) ? x : m, null);
    const promMensual = months.length ? Math.round(totalPedidos / months.length * 10) / 10 : 0;

    // Por instrumento
    const byInstr = {};
    INSTRUMENTOS.forEach(i => { byInstr[i] = { instr: i, total: 0, byCliente: {} }; });
    withDate.forEach(c => {
      const i = getInstrumento(c);
      byInstr[i].total++;
      byInstr[i].byCliente[c.cliente] = (byInstr[i].byCliente[c.cliente] || 0) + 1;
    });

    // Top clientes overall
    const clientCount = {};
    withDate.forEach(c => { clientCount[c.cliente] = (clientCount[c.cliente] || 0) + 1; });
    const topClientes = Object.entries(clientCount).map(([cliente,n]) => ({ cliente, n, pct: n/totalPedidos*100 })).sort((a,b) => b.n - a.n).slice(0, 10);
    const top5pct = topClientes.slice(0,5).reduce((s,c) => s + c.n, 0) / Math.max(1,totalPedidos) * 100;

    return { totalPedidos, clientesUnicos, promMensual, months, pico, piso, byInstr, topClientes, top5pct };
  }, [cards, range]);

  if (data.totalPedidos === 0) return <EmptyState title="Sin pedidos para analizar" hint="Cargá pedidos en el Kanban para ver el análisis." />;

  const maxMonth = Math.max(...data.months.map(m => m.total), 1);
  const maxInstr = Math.max(...INSTRUMENTOS.map(i => data.byInstr[i].total), 1);

  return (
    <>
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard title="Pedidos totales"  value={data.totalPedidos} />
        <StatCard title="Clientes activos" value={data.clientesUnicos} />
        <StatCard title="Pedidos / mes"    value={data.promMensual} hint="promedio" />
        <StatCard title="Meses cubiertos"  value={data.months.length} />
      </div>

      {/* Distribución por instrumento (bar chart horizontal) */}
      <Panel title="Distribución por tipo de instrumento">
        <div className="space-y-2">
          {INSTRUMENTOS.filter(i => data.byInstr[i].total > 0).sort((a,b) => data.byInstr[b].total - data.byInstr[a].total).map(i => {
            const n = data.byInstr[i].total;
            const pct = n / data.totalPedidos * 100;
            return (
              <div key={i} className="flex items-center gap-3">
                <div className="w-20 text-xs text-ink-2 shrink-0">{i}</div>
                <div className="flex-1 h-6 bg-surface-2 rounded overflow-hidden relative">
                  <div className="h-full transition-all" style={{ width: `${(n/maxInstr)*100}%`, background: INSTR_COLORS[i] }} />
                </div>
                <div className="w-28 text-right text-xs tabular-nums text-ink-2 shrink-0">
                  <span className="font-semibold text-ink">{n}</span>
                  <span className="text-muted"> · {pct.toFixed(1)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      {/* Evolución mensual + pico/piso */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel title="Evolución de pedidos por mes" className="lg:col-span-2">
          <div className="h-56 relative">
            <svg viewBox={`0 0 ${data.months.length * 50} 200`} preserveAspectRatio="none" className="w-full h-full">
              {/* gridlines */}
              {[0, 0.25, 0.5, 0.75, 1].map(p => (
                <line key={p} x1="0" x2={data.months.length * 50} y1={200 - p * 180 - 10} y2={200 - p * 180 - 10} stroke="rgba(15,37,64,0.08)" strokeWidth="1" />
              ))}
              {/* line path */}
              <polyline fill="none" stroke="#0066CC" strokeWidth="2" vectorEffect="non-scaling-stroke"
                points={data.months.map((m, i) => `${i * 50 + 25},${200 - (m.total / maxMonth) * 180 - 10}`).join(' ')} />
              {/* area fill */}
              <polygon fill="rgba(0,102,204,0.10)"
                points={`0,200 ${data.months.map((m, i) => `${i * 50 + 25},${200 - (m.total / maxMonth) * 180 - 10}`).join(' ')} ${data.months.length * 50},200`} />
              {/* dots */}
              {data.months.map((m, i) => (
                <circle key={i} cx={i * 50 + 25} cy={200 - (m.total / maxMonth) * 180 - 10} r="3" fill="#0066CC" vectorEffect="non-scaling-stroke">
                  <title>{m.label}: {m.total} pedidos</title>
                </circle>
              ))}
            </svg>
          </div>
          <div className="flex justify-between text-[10px] text-muted mt-1 px-1 tabular-nums">
            {data.months.map((m, i) => {
              const show = data.months.length <= 12 || i % Math.ceil(data.months.length / 8) === 0;
              return <span key={i} className="flex-1 text-center">{show ? m.label : ''}</span>;
            })}
          </div>
        </Panel>

        <div className="space-y-3">
          <div className="bg-bg-2 border border-line rounded-lg p-4">
            <div className="text-[10px] uppercase tracking-wider text-muted">Pico</div>
            <div className="text-xl font-semibold text-ink mt-1">{data.pico?.label}</div>
            <div className="text-sm text-ok mt-0.5">{data.pico?.total} pedidos</div>
          </div>
          <div className="bg-bg-2 border border-line rounded-lg p-4">
            <div className="text-[10px] uppercase tracking-wider text-muted">Piso</div>
            <div className="text-xl font-semibold text-ink mt-1">{data.piso?.label}</div>
            <div className="text-sm text-warn mt-0.5">{data.piso?.total} pedidos</div>
          </div>
          <div className="bg-bg-2 border border-line rounded-lg p-4">
            <div className="text-[10px] uppercase tracking-wider text-muted">Top 5 clientes</div>
            <div className="text-xl font-semibold text-gold mt-1">{data.top5pct.toFixed(0)}%</div>
            <div className="text-[11px] text-muted mt-0.5">del flujo total</div>
          </div>
        </div>
      </div>

      {/* Top 10 clientes */}
      <Panel title="Top 10 clientes por volumen">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted text-[10.5px] uppercase tracking-wider">
              <tr><th className="py-2 pr-2 w-8">#</th><th className="pr-2">Cliente</th><th className="text-right pr-2">Pedidos</th><th className="text-right pr-2">% total</th><th className="pl-2">Barra</th></tr>
            </thead>
            <tbody>
              {data.topClientes.map((c, i) => (
                <tr key={c.cliente} className="border-t border-line">
                  <td className="py-2 pr-2 text-muted tabular-nums">{i+1}</td>
                  <td className="pr-2 font-medium text-ink">{c.cliente}</td>
                  <td className="text-right pr-2 tabular-nums">{c.n}</td>
                  <td className="text-right pr-2 tabular-nums text-ink-2">{c.pct.toFixed(1)}%</td>
                  <td className="pl-2">
                    <div className="h-2 bg-surface-2 rounded overflow-hidden">
                      <div className="h-full bg-gold" style={{ width: `${(c.n / data.topClientes[0].n) * 100}%` }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Top clientes por instrumento (5 paneles compactos) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {INSTRUMENTOS.filter(i => data.byInstr[i].total > 0).map(i => {
          const block = data.byInstr[i];
          const top = Object.entries(block.byCliente).map(([cl,n]) => ({ cl, n, pct: n/block.total*100 })).sort((a,b) => b.n - a.n).slice(0, 5);
          return (
            <Panel key={i} title={
              <span className="inline-flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: INSTR_COLORS[i] }} />
                {i}
              </span>
            }>
              <div className="flex items-baseline gap-2 mb-3">
                <div className="text-2xl font-bold tabular-nums" style={{ color: INSTR_COLORS[i] }}>{block.total}</div>
                <div className="text-[11px] text-muted">{(block.total/data.totalPedidos*100).toFixed(1)}% del flujo</div>
              </div>
              <div className="text-[10px] uppercase tracking-wider text-muted mb-1.5">Top clientes</div>
              <div className="space-y-1.5">
                {top.map(t => (
                  <div key={t.cl} className="flex items-center justify-between text-xs">
                    <span className="truncate text-ink">{t.cl}</span>
                    <span className="tabular-nums text-ink-2 shrink-0 ml-2">{t.n} · {t.pct.toFixed(0)}%</span>
                  </div>
                ))}
                {top.length === 0 && <div className="text-[11px] text-muted italic">Sin datos</div>}
              </div>
            </Panel>
          );
        })}
      </div>

      {/* Matriz mes × instrumento */}
      <Panel title="Matriz mes × instrumento">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted text-[10.5px] uppercase tracking-wider">
              <tr>
                <th className="py-2 pr-2">Mes</th>
                {INSTRUMENTOS.map(i => (
                  <th key={i} className="text-right pr-2"><span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full" style={{ background: INSTR_COLORS[i] }} />{i}</span></th>
                ))}
                <th className="text-right pr-2 font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {data.months.map(m => (
                <tr key={m.key} className="border-t border-line">
                  <td className="py-2 pr-2 font-medium text-ink">{m.label}</td>
                  {INSTRUMENTOS.map(i => <td key={i} className="text-right pr-2 tabular-nums text-ink-2">{m.byInstr[i] || 0}</td>)}
                  <td className="text-right pr-2 tabular-nums font-semibold text-ink">{m.total}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-line-2 font-semibold bg-surface">
                <td className="py-2 pr-2">TOTAL</td>
                {INSTRUMENTOS.map(i => <td key={i} className="text-right pr-2 tabular-nums">{data.byInstr[i].total}</td>)}
                <td className="text-right pr-2 tabular-nums text-gold">{data.totalPedidos}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}

function StatCard({ title, value, hint }) {
  return (
    <div className="bg-bg-2/60 border border-line rounded-2xl p-4">
      <div className="text-[11px] uppercase tracking-wider text-muted">{title}</div>
      <div className="text-3xl font-bold mt-1">{value}</div>
      {hint && <div className="text-[11px] text-muted mt-1">{hint}</div>}
    </div>
  );
}

function Panel({ title, children, action, className = '' }) {
  return (
    <div className={`bg-bg-2/60 border border-line rounded-2xl p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   MAXIMUS — USO CLIENTES
   ───────────────────────────────────────────────────────────────────── */
/* Score = mezcla del % de uso de Consultora (pedidos) + % de uso MaximUs (logins/features).
   Misma lógica del dashboard interno: semaforo = verde/amarillo/rojo deriva del score. */
function clientScore(c) {
  let score = typeof c.score === 'number' ? c.score : null;
  if (score == null) {
    const ped = Number(c.ped_pct ?? 0);
    const max = Number(c.max_pct ?? 0);
    score = Math.round(ped * 0.5 + max * 0.5);
  }
  let color = c.semaforo;
  if (!color) {
    if (score >= 60) color = 'verde';
    else if (score >= 30) color = 'amarillo';
    else color = 'rojo';
  }
  return { score, color };
}
const SCORE_BADGE = { verde: 'sem-verde', amarillo: 'sem-amarillo', rojo: 'sem-rojo' };
const SCORE_LABEL = { verde: 'Saludable', amarillo: 'Atención', rojo: 'Riesgo' };

/* Categoriza la acción libre del cliente en 4 buckets ejecutables */
const CATEGORIAS = ['Todo OK','Contactar','Armar Reunión','Otros'];
const CATEGORIA_BADGE = {
  'Todo OK':       'bg-emerald-500/15 text-emerald-700 border-emerald-500/30',
  'Contactar':     'bg-amber-500/15 text-amber-700 border-amber-500/30',
  'Armar Reunión': 'bg-blue-500/15 text-blue-700 border-blue-500/30',
  'Otros':         'bg-slate-500/15 text-slate-600 border-slate-500/30',
};
const normalizar = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
function categoriaAccion(accion) {
  const a = (accion || '').toLowerCase().trim();
  if (!a || a === '-' || a.startsWith('todo ok')) return 'Todo OK';
  if (/demo|reuni[oó]n|present|mostrar/.test(a)) return 'Armar Reunión';
  if (/contact|estar atr[aá]s|atr[aá]s|llamar|entrarles|estamos atr|hay que estar/.test(a)) return 'Contactar';
  return 'Otros';
}

function MaximusUsage() {
  const { state, dispatch } = useApp();
  const clients = state.maximus.clients;
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [search, setSearch] = useState('');
  const [filterPais, setFilterPais] = useState('');
  const [filterServicio, setFilterServicio] = useState('');
  const [filterSemaforo, setFilterSemaforo] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('');

  const paises = useMemo(() => Array.from(new Set(clients.map(c => c.pais).filter(Boolean))).sort(), [clients]);
  const servicios = useMemo(() => Array.from(new Set(clients.map(c => c.servicio).filter(Boolean))).sort(), [clients]);
  const categoriaCount = useMemo(() => {
    const m = Object.fromEntries(CATEGORIAS.map(k => [k, 0]));
    clients.forEach(c => { m[categoriaAccion(c.accion)]++; });
    return m;
  }, [clients]);

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return clients.filter(c =>
      (!s || `${c.cliente} ${c.contacto || ''} ${c.pais || ''} ${c.accion || ''}`.toLowerCase().includes(s)) &&
      (!filterPais || c.pais === filterPais) &&
      (!filterServicio || c.servicio === filterServicio) &&
      (!filterSemaforo || clientScore(c).color === filterSemaforo) &&
      (!filterCategoria || categoriaAccion(c.accion) === filterCategoria)
    );
  }, [clients, search, filterPais, filterServicio, filterSemaforo, filterCategoria]);

  const summary = useMemo(() => {
    const r = { verde: 0, amarillo: 0, rojo: 0, total: clients.length };
    clients.forEach(c => { r[clientScore(c).color]++; });
    return r;
  }, [clients]);

  const alerts = useMemo(() => {
    const sinLogin = clients.filter(c => (c.dias_sin_login || 0) >= 60).sort((a,b) => (b.dias_sin_login||0) - (a.dias_sin_login||0));
    const sinPedido = clients.filter(c => (c.dias_sin_pedido || 0) >= 120).sort((a,b) => (b.dias_sin_pedido||0) - (a.dias_sin_pedido||0));
    return { sinLogin, sinPedido };
  }, [clients]);

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Seguimiento de clientes"
        subtitle="Salud, uso de Consultora y MaximUs por cliente. Score 0–100 con semáforo derivado del uso real."
        actions={<>
          <Btn variant="soft" size="md" onClick={() => setImporting(true)}><Icon name="upload" size={14} />Importar JSON</Btn>
          <Btn onClick={() => setCreating(true)}><Icon name="plus" size={16} />Nuevo cliente</Btn>
        </>}
      />

      <div className="px-6 pb-6 flex-1 overflow-y-auto space-y-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard title="Total clientes" value={summary.total} />
          <StatCard title="Saludables" value={summary.verde} hint="Score ≥ 60" />
          <StatCard title="Atención" value={summary.amarillo} hint="Score 30–59" />
          <StatCard title="Riesgo" value={summary.rojo} hint="Score < 30" />
        </div>

        {(alerts.sinLogin.length > 0 || alerts.sinPedido.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {alerts.sinLogin.length > 0 && (
              <Panel title={`Sin login en +60 días (${alerts.sinLogin.length})`}>
                <div className="space-y-1.5 text-sm">
                  {alerts.sinLogin.slice(0,5).map(c => (
                    <div key={c.id} className="flex items-center justify-between border-b border-line py-1.5 last:border-0">
                      <span className="font-medium">{c.cliente}</span>
                      <span className="text-bad text-xs">{c.dias_sin_login}d</span>
                    </div>
                  ))}
                </div>
              </Panel>
            )}
            {alerts.sinPedido.length > 0 && (
              <Panel title={`Sin pedidos en +120 días (${alerts.sinPedido.length})`}>
                <div className="space-y-1.5 text-sm">
                  {alerts.sinPedido.slice(0,5).map(c => (
                    <div key={c.id} className="flex items-center justify-between border-b border-line py-1.5 last:border-0">
                      <span className="font-medium">{c.cliente}</span>
                      <span className="text-warn text-xs">{c.dias_sin_pedido}d</span>
                    </div>
                  ))}
                </div>
              </Panel>
            )}
          </div>
        )}

        <Panel title="Distribución de salud">
          <div className="flex gap-1 h-3 rounded-full overflow-hidden bg-surface-2">
            {summary.total > 0 && <>
              <div style={{ width: `${(summary.verde / summary.total) * 100}%` }} className="bg-ok" title={`${summary.verde} saludables`} />
              <div style={{ width: `${(summary.amarillo / summary.total) * 100}%` }} className="bg-warn" title={`${summary.amarillo} atención`} />
              <div style={{ width: `${(summary.rojo / summary.total) * 100}%` }} className="bg-bad" title={`${summary.rojo} riesgo`} />
            </>}
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-muted">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-ok" />{summary.verde} saludables</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-warn" />{summary.amarillo} atención</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-bad" />{summary.rojo} riesgo</span>
          </div>
        </Panel>

        <Panel title={`Clientes (${filtered.length} de ${clients.length})`}
          action={
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Icon name="search" size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cliente, contacto, acción…" className="!pl-8 !py-1.5 !text-xs" style={{ width: 220 }} />
              </div>
              <select value={filterPais} onChange={e => setFilterPais(e.target.value)} className="!py-1.5 !text-xs" style={{ width: 130 }}>
                <option value="">Todos los países</option>
                {paises.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <select value={filterServicio} onChange={e => setFilterServicio(e.target.value)} className="!py-1.5 !text-xs" style={{ width: 160 }}>
                <option value="">Todos los servicios</option>
                {servicios.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={filterSemaforo} onChange={e => setFilterSemaforo(e.target.value)} className="!py-1.5 !text-xs" style={{ width: 130 }}>
                <option value="">Todo el semáforo</option>
                <option value="verde">Verde</option>
                <option value="amarillo">Amarillo</option>
                <option value="rojo">Rojo</option>
              </select>
              <select value={filterCategoria} onChange={e => setFilterCategoria(e.target.value)} className="!py-1.5 !text-xs" style={{ width: 180 }} title="Filtrar por categoría de acción">
                <option value="">Toda acción</option>
                {CATEGORIAS.map(c => <option key={c} value={c}>{c} ({categoriaCount[c]})</option>)}
              </select>
            </div>
          }>
          {filtered.length === 0 ? <EmptyState title="Sin clientes que coincidan" hint="Ajustá los filtros o agregá un cliente manual." /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted text-[10.5px] uppercase tracking-wider">
                  <tr>
                    <th className="py-2 pr-2">Cliente</th>
                    <th className="pr-2">Servicio</th>
                    <th className="pr-2">País</th>
                    <th className="pr-2">Score</th>
                    <th className="pr-2 text-right">Pedidos 90d</th>
                    <th className="pr-2 text-right">Logins YTD</th>
                    <th className="pr-2 text-right">Sin login</th>
                    <th className="pr-2 text-right">Sin pedido</th>
                    <th className="pr-2">Acción sugerida</th>
                    <th className="pr-2">Renovación</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => {
                    const { score, color } = clientScore(c);
                    return (
                      <tr key={c.id} className="border-t border-line hover:bg-surface-2/40 cursor-pointer" onClick={() => setEditing(c)}>
                        <td className="py-2 pr-2">
                          <div className="font-medium text-ink">{c.cliente}</div>
                          {c.contacto && <div className="text-[10.5px] text-muted line-clamp-1">{c.contacto}{c.a_cargo ? ` · a/c ${c.a_cargo}` : ''}</div>}
                        </td>
                        <td className="pr-2 text-ink-2">{c.servicio || '—'}</td>
                        <td className="pr-2 text-ink-2">{c.pais || '—'}</td>
                        <td className="pr-2"><Badge className={SCORE_BADGE[color]}>{score}</Badge></td>
                        <td className="pr-2 text-right tabular-nums">{c.pedidos_90d ?? 0}</td>
                        <td className="pr-2 text-right tabular-nums">{c.max_logins_ytd ?? 0}</td>
                        <td className={`pr-2 text-right tabular-nums ${(c.dias_sin_login||0) >= 60 ? 'text-bad' : (c.dias_sin_login||0) >= 30 ? 'text-warn' : 'text-muted'}`}>{c.dias_sin_login != null ? `${c.dias_sin_login}d` : '—'}</td>
                        <td className={`pr-2 text-right tabular-nums ${(c.dias_sin_pedido||0) >= 120 ? 'text-bad' : (c.dias_sin_pedido||0) >= 60 ? 'text-warn' : 'text-muted'}`}>{c.dias_sin_pedido != null ? `${c.dias_sin_pedido}d` : '—'}</td>
                        <td className="pr-2 max-w-[260px]">
                          {(() => {
                            const cat = categoriaAccion(c.accion);
                            const raw = (c.accion || '').trim();
                            const nr = normalizar(raw);
                            const showDetail = raw && raw !== '-' && nr !== normalizar(cat) && !CATEGORIAS.some(x => normalizar(x) === nr);
                            return (
                              <div className="flex items-center gap-1.5">
                                <Badge className={CATEGORIA_BADGE[cat]}>{cat}</Badge>
                                {showDetail && <span className="text-ink-2 line-clamp-1 text-[11px]" title={raw}>{raw}</span>}
                              </div>
                            );
                          })()}
                        </td>
                        <td className="pr-2 text-ink-2 tabular-nums">{formatRenovacion(c.fecha_renovacion)}</td>
                        <td><Icon name="chevR" size={14} className="text-muted" /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>

      <ClientEditor
        open={creating || !!editing}
        client={editing}
        onClose={() => { setEditing(null); setCreating(false); }}
        onSave={(c) => { dispatch({ type: 'CLIENT_UPSERT', client: c.id ? c : { ...c, id: uid() } }); setEditing(null); setCreating(false); }}
        onDelete={(id) => { dispatch({ type: 'CLIENT_DELETE', id }); setEditing(null); }}
      />

      <ImportJSON
        open={importing}
        onClose={() => setImporting(false)}
        onImport={(arr) => {
          // Detectar formato del JSON automáticamente
          if (arr && !Array.isArray(arr) && arr.risk_users) {
            // Formato Dashboard MaximUs → agregar por org y mergear con clientes existentes
            const normalize = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
            const RISK_TO_SEM = { 'CRÍTICO': 'rojo', 'ALTO': 'rojo', 'MEDIO': 'amarillo', 'BAJO': 'verde' };
            const ORDER = { 'CRÍTICO': 4, 'ALTO': 3, 'MEDIO': 2, 'BAJO': 1 };
            const ACCION = { 'CRÍTICO': 'Contactar', 'ALTO': 'Contactar', 'MEDIO': 'Otros', 'BAJO': 'Todo OK' };
            const byOrg = {};
            arr.risk_users.forEach(u => {
              const k = u.org;
              if (!byOrg[k]) byOrg[k] = [];
              byOrg[k].push(u);
            });
            const updates = [];
            Object.entries(byOrg).forEach(([org, users]) => {
              const orgN = normalize(org);
              const match = clients.find(c => normalize(c.cliente) === orgN || normalize(c.cliente).includes(orgN) || orgN.includes(normalize(c.cliente)));
              if (!match) return;
              const worst = users.reduce((w, u) => (ORDER[u.risk_level]||0) > (ORDER[w]||0) ? u.risk_level : w, 'BAJO');
              const totalProps = users.reduce((s, u) => s + (u.total_proposals || 0), 0);
              const minDays = Math.min(...users.map(u => u.days_inactive ?? 0));
              const riskScores = users.map(u => u.risk_score || 0);
              const lastLogins = users.map(u => u.last_login_sort).filter(Boolean).sort();
              const maxUltimoLogin = lastLogins[lastLogins.length - 1] || null;
              const score = Math.max(0, 100 - Math.min(...riskScores));
              const detalle = users.map(u => ({
                name: u.name, email: u.email,
                days_inactive: u.days_inactive, last_login: u.last_login,
                total_proposals: u.total_proposals,
                risk_score: u.risk_score, risk_level: u.risk_level,
                recommended_action: u.recommended_action?.action,
              }));
              updates.push({
                ...match,
                dias_sin_login: minDays,
                max_propuestas: totalProps,
                max_users_count: users.length,
                max_ultimo_login: maxUltimoLogin,
                score,
                semaforo: RISK_TO_SEM[worst] || 'amarillo',
                accion: ACCION[worst] || 'Otros',
                risk_level: worst,
                usuarios_max: detalle,
              });
            });
            updates.forEach(c => dispatch({ type: 'CLIENT_UPSERT', client: c }));
            alert(`${updates.length} clientes actualizados con datos del dashboard (${arr.risk_users.length} usuarios, ${Object.keys(byOrg).length} orgs).${Object.keys(byOrg).length > updates.length ? ` ${Object.keys(byOrg).length - updates.length} orgs sin cliente en MaximUs.` : ''}`);
          } else if (Array.isArray(arr)) {
            // Formato legacy: array de clientes con campos directos
            const norm = arr.map(c => ({ id: c.id || uid(), ...c }));
            dispatch({ type: 'CLIENT_BULK', clients: norm });
          }
          setImporting(false);
        }}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   MAXIMUS — SALA DE REUNIONES (reservas por calendario)
   ───────────────────────────────────────────────────────────────────── */
const HORA_INICIO = 8;   // 08:00
const HORA_FIN    = 20;  // 20:00
const SLOT_MIN    = 30;  // slots de 30 min

function MaximusSala() {
  const { state, dispatch, me } = useApp();
  const reservas = state.maximus.reservas || [];
  const team = state.team;
  const [anchor, setAnchor] = useState(() => { const d = new Date(); d.setHours(0,0,0,0); return d; });
  const [editing, setEditing] = useState(null); // reserva | { inicio, fin } (nueva)

  // Lun-Vie de la semana anchor
  const weekStart = useMemo(() => {
    const d = new Date(anchor); const dow = (d.getDay() + 6) % 7; d.setDate(d.getDate() - dow); d.setHours(0,0,0,0); return d;
  }, [anchor]);
  const days = Array.from({ length: 5 }, (_, i) => { const d = new Date(weekStart); d.setDate(weekStart.getDate() + i); return d; });
  const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 5);

  const weekReservas = useMemo(() => reservas.filter(r => r.inicio >= weekStart.getTime() && r.inicio < weekEnd.getTime()), [reservas, weekStart, weekEnd]);

  const hours = [];
  for (let h = HORA_INICIO; h < HORA_FIN; h++) hours.push(h);
  const SLOT_PX = 28;

  const move = (n) => { const d = new Date(anchor); d.setDate(d.getDate() + n * 7); setAnchor(d); };
  const today = () => { const d = new Date(); d.setHours(0,0,0,0); setAnchor(d); };

  const slotClick = (day, hour, minute) => {
    const ini = new Date(day); ini.setHours(hour, minute, 0, 0);
    const fin = new Date(ini); fin.setHours(fin.getHours() + 1);
    // Verificar que no se superponga
    const overlap = weekReservas.some(r => !(r.fin <= ini.getTime() || r.inicio >= fin.getTime()));
    if (overlap) return;
    setEditing({ inicio: ini.getTime(), fin: fin.getTime(), titulo: '', notas: '', reservadoPor: me.id });
  };

  const guardar = (r) => {
    if (!r.titulo || !r.inicio || !r.fin) return;
    const id = r.id || ('res_' + uid());
    dispatch({ type: 'RESERVA_UPSERT', r: { ...r, id, reservadoPor: r.reservadoPor || me.id, reservadoAt: r.reservadoAt || now() } });
    setEditing(null);
  };
  const eliminar = (id) => { dispatch({ type: 'RESERVA_DELETE', id }); setEditing(null); };

  const monthLabel = weekStart.toLocaleDateString('es-UY', { month: 'long', year: 'numeric' });

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Sala de reuniones MaximUs"
        subtitle="Reservá un horario haciendo click en una franja libre. Tus reservas las podés editar o cancelar."
        actions={<>
          <span className="text-xs text-muted capitalize">{monthLabel}</span>
          <Btn variant="soft" size="sm" onClick={() => move(-1)}><Icon name="chevL" size={14} /></Btn>
          <Btn variant="soft" size="sm" onClick={today}>Hoy</Btn>
          <Btn variant="soft" size="sm" onClick={() => move(1)}><Icon name="chevR" size={14} /></Btn>
        </>}
      />
      <div className="px-3 sm:px-6 pb-6 flex-1 overflow-y-auto">
        <div className="border border-line rounded-lg bg-bg overflow-hidden">
          {/* Header con días */}
          <div className="grid bg-surface border-b border-line" style={{ gridTemplateColumns: '60px repeat(5, 1fr)' }}>
            <div className="px-2 py-2 text-[10px] text-muted uppercase tracking-wider"></div>
            {days.map((d, i) => {
              const isToday = sameDay(d.getTime(), now());
              return (
                <div key={i} className={`px-3 py-2 text-center border-l border-line ${isToday ? 'bg-gold/10' : ''}`}>
                  <div className="text-[10px] uppercase tracking-wider text-muted">{d.toLocaleDateString('es-UY', { weekday: 'short' })}</div>
                  <div className={`font-semibold ${isToday ? 'text-gold' : 'text-ink'}`}>{d.getDate()}</div>
                </div>
              );
            })}
          </div>
          {/* Grid de horas */}
          <div className="grid" style={{ gridTemplateColumns: '60px repeat(5, 1fr)' }}>
            {/* Columna de horas */}
            <div>
              {hours.map(h => (
                <div key={h} className="text-[10px] text-muted text-right pr-2 border-b border-line" style={{ height: SLOT_PX * 2 }}>
                  {String(h).padStart(2,'0')}:00
                </div>
              ))}
            </div>
            {/* Columnas de días */}
            {days.map((d, di) => {
              const dayReservas = weekReservas.filter(r => sameDay(r.inicio, d.getTime()));
              return (
                <div key={di} className="border-l border-line relative">
                  {hours.map(h => (
                    <React.Fragment key={h}>
                      <div onClick={() => slotClick(d, h, 0)}
                        className="border-b border-line/50 hover:bg-gold/5 cursor-pointer transition" style={{ height: SLOT_PX }} />
                      <div onClick={() => slotClick(d, h, 30)}
                        className="border-b border-line hover:bg-gold/5 cursor-pointer transition" style={{ height: SLOT_PX }} />
                    </React.Fragment>
                  ))}
                  {/* Reservas como absolute blocks */}
                  {dayReservas.map(r => {
                    const ini = new Date(r.inicio);
                    const fin = new Date(r.fin);
                    const startMin = (ini.getHours() - HORA_INICIO) * 60 + ini.getMinutes();
                    const durMin   = (fin - ini) / 60000;
                    const top = (startMin / SLOT_MIN) * SLOT_PX;
                    const height = (durMin / SLOT_MIN) * SLOT_PX;
                    if (top < 0 || top > (HORA_FIN - HORA_INICIO) * 60 / SLOT_MIN * SLOT_PX) return null;
                    const u = team.find(x => x.id === r.reservadoPor);
                    const color = u?.color || '#0066CC';
                    return (
                      <div key={r.id} onClick={(e) => { e.stopPropagation(); setEditing(r); }}
                        className="absolute left-0.5 right-0.5 rounded text-[10px] p-1.5 cursor-pointer hover:brightness-95 transition overflow-hidden"
                        style={{ top, height: Math.max(height, 18), background: color + '20', borderLeft: `3px solid ${color}` }}>
                        <div className="font-semibold truncate" style={{ color }}>{r.titulo}</div>
                        {height > 32 && u && <div className="text-[9px] text-ink-2 truncate">{u.name.split(' ')[0]}</div>}
                        {height > 50 && <div className="text-[9px] text-muted tabular-nums">{ini.toLocaleTimeString('es-UY',{hour:'2-digit',minute:'2-digit',hour12:false})}–{fin.toLocaleTimeString('es-UY',{hour:'2-digit',minute:'2-digit',hour12:false})}</div>}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
        <div className="text-[10px] text-muted mt-3">Click en una franja libre para reservar · Click en una reserva para editarla</div>
      </div>

      {editing && (
        <ReservaModal reserva={editing} team={team} me={me} onClose={() => setEditing(null)} onSave={guardar} onDelete={eliminar} weekReservas={weekReservas} />
      )}
    </div>
  );
}

function ReservaModal({ reserva, team, me, onClose, onSave, onDelete, weekReservas }) {
  const isNew = !reserva.id;
  const [form, setForm] = useState(reserva);
  const owner = team.find(t => t.id === form.reservadoPor);
  const puedoEditar = !owner || form.reservadoPor === me.id || me.perms === 'admin';

  const setHora = (which, value) => {
    const [h, m] = value.split(':').map(Number);
    const d = new Date(form[which]); d.setHours(h, m, 0, 0);
    setForm({ ...form, [which]: d.getTime() });
  };
  const setFecha = (value) => {
    const [y, mo, d] = value.split('-').map(Number);
    const ini = new Date(form.inicio); ini.setFullYear(y, mo - 1, d);
    const fin = new Date(form.fin);    fin.setFullYear(y, mo - 1, d);
    setForm({ ...form, inicio: ini.getTime(), fin: fin.getTime() });
  };

  const overlapping = weekReservas.some(r =>
    r.id !== form.id &&
    !(r.fin <= form.inicio || r.inicio >= form.fin)
  );

  const fechaInput = new Date(form.inicio).toISOString().slice(0, 10);
  const horaIni = new Date(form.inicio).toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit', hour12: false });
  const horaFin = new Date(form.fin).toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit', hour12: false });

  return (
    <Modal open={true} onClose={onClose} title={isNew ? 'Nueva reserva' : 'Editar reserva'}>
      <Field label="Motivo / título">
        <input value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} placeholder="Reunión cliente Pampa" disabled={!puedoEditar} autoFocus />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4">
        <Field label="Fecha">
          <input type="date" value={fechaInput} onChange={e => setFecha(e.target.value)} disabled={!puedoEditar} />
        </Field>
        <Field label="Hora desde">
          <input type="time" value={horaIni} onChange={e => setHora('inicio', e.target.value)} disabled={!puedoEditar} />
        </Field>
        <Field label="Hora hasta">
          <input type="time" value={horaFin} onChange={e => setHora('fin', e.target.value)} disabled={!puedoEditar} />
        </Field>
      </div>
      <Field label="Notas (opcional)">
        <textarea rows={2} value={form.notas || ''} onChange={e => setForm({ ...form, notas: e.target.value })} disabled={!puedoEditar} />
      </Field>
      {owner && (
        <div className="flex items-center gap-2 text-[12px] text-muted mb-3 px-1">
          <span>Reservado por:</span>
          <Avatar user={owner} size={20} />
          <span>{owner.name}</span>
        </div>
      )}
      {overlapping && <div className="text-bad text-[11px] mb-3 px-1">⚠️ Se superpone con otra reserva</div>}
      <div className="flex items-center justify-between pt-1">
        <div>
          {!isNew && puedoEditar && <Btn variant="danger" onClick={() => onDelete(form.id)}><Icon name="trash" size={14} />Cancelar reserva</Btn>}
        </div>
        <div className="flex gap-2">
          <Btn variant="ghost" onClick={onClose}>Cerrar</Btn>
          {puedoEditar && <Btn onClick={() => onSave(form)} disabled={!form.titulo || overlapping || form.fin <= form.inicio}><Icon name="check" size={14} />Guardar</Btn>}
        </div>
      </div>
    </Modal>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   MAXIMUS — ANÁLISIS Y ENVÍOS (broadcast por holdings)
   ───────────────────────────────────────────────────────────────────── */
const phoneClean = (t) => (t || '').replace(/[^\d]/g, '');
const renderTemplate = (tpl, vars) => Object.entries(vars).reduce((s, [k, v]) => s.replaceAll('{' + k + '}', v || ''), tpl);

function MaximusAnalisis() {
  const { state, dispatch, me } = useApp();
  const [tab, setTab] = useState('enviar'); // enviar | holdings | historial

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Análisis + WhatsApp"
        subtitle="Subí un análisis y mandalo por WhatsApp a los clientes que tienen ese activo."
        actions={<>
          <div className="flex items-center gap-1 bg-surface p-1 rounded-lg border border-line">
            {[['enviar','Enviar análisis'],['holdings','Holdings'],['historial','Historial']].map(([id,label]) => (
              <button key={id} onClick={() => setTab(id)}
                className={`px-3 py-1.5 text-xs rounded-md ${tab===id ? 'bg-gold text-white' : 'text-muted hover:text-ink'}`}>{label}</button>
            ))}
          </div>
        </>}
      />
      <div className="px-3 sm:px-6 pb-6 flex-1 overflow-y-auto">
        {tab === 'enviar'    && <EnviarAnalisis state={state} dispatch={dispatch} me={me} />}
        {tab === 'holdings'  && <HoldingsClientes state={state} dispatch={dispatch} />}
        {tab === 'historial' && <HistorialEnvios state={state} />}
      </div>
    </div>
  );
}

function EnviarAnalisis({ state, dispatch, me }) {
  const clients = state.maximus.clients;
  // Catálogo de tickers que aparecen en algún cliente
  const allTickers = useMemo(() => {
    const s = new Set();
    clients.forEach(c => (c.activos || []).forEach(t => s.add(String(t).trim().toUpperCase())));
    return Array.from(s).sort();
  }, [clients]);

  const [ticker, setTicker] = useState('');
  const [titulo, setTitulo] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [mensaje, setMensaje] = useState('Hola {contacto}, te comparto el análisis actualizado de {ticker}.\n\n{titulo}\nPDF: {link}\n\nSaludos.');
  const [enviados, setEnviados] = useState(new Set()); // ids de clientes a los que ya disparé wa.me en esta sesión

  const destinatarios = useMemo(() => {
    if (!ticker) return [];
    const t = ticker.trim().toUpperCase();
    return clients.filter(c => (c.activos || []).map(x => String(x).trim().toUpperCase()).includes(t));
  }, [clients, ticker]);

  const conTelefono   = destinatarios.filter(c => phoneClean(c.telefono).length >= 8);
  const sinTelefono   = destinatarios.length - conTelefono.length;

  const generarMensajeCliente = (c) => {
    const vars = {
      contacto: c.contacto || c.cliente || '',
      cliente: c.cliente || '',
      ticker: ticker.toUpperCase(),
      titulo: titulo,
      link: pdfUrl,
      yo: me.name.split(' ')[0],
    };
    return renderTemplate(mensaje, vars);
  };

  const enviarUno = (c) => {
    const num = phoneClean(c.telefono);
    if (!num) return;
    const text = generarMensajeCliente(c);
    const url = `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    // Registrar el envío (idempotente local)
    setEnviados(s => new Set([...s, c.id]));
  };

  const guardarAnalisisYRegistrar = () => {
    if (!ticker || !titulo || !pdfUrl) return;
    // 1) Guardar el análisis en DB (1 vez)
    const analisisId = 'an_' + uid();
    dispatch({ type: 'ANALISIS_ADD', a: { id: analisisId, ticker: ticker.toUpperCase(), titulo, pdfUrl, uploadedBy: me.id, uploadedAt: now() } });
    // 2) Registrar un envío por cada cliente al que se le mandó
    conTelefono.forEach(c => {
      if (!enviados.has(c.id)) return;
      dispatch({ type: 'ENVIO_ADD', e: { id: 'env_' + uid(), analisisId, clienteId: c.id, contacto: c.contacto, telefono: c.telefono, mensaje: generarMensajeCliente(c), enviadoBy: me.id } });
    });
    // Reset
    setTicker(''); setTitulo(''); setPdfUrl(''); setEnviados(new Set());
    alert(`Análisis registrado. Se trackeó el envío a ${conTelefono.filter(c => enviados.has(c.id)).length} clientes.`);
  };

  return (
    <div className="space-y-5">
      <Panel title="1. Datos del análisis">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4">
          <Field label="Ticker / activo" hint={allTickers.length > 0 ? `Conocidos: ${allTickers.slice(0,10).join(', ')}${allTickers.length>10?'…':''}` : 'Definí activos en los clientes (tab Holdings)'}>
            <input list="tickers-dl" value={ticker} onChange={e => setTicker(e.target.value.toUpperCase())} placeholder="AAPL" />
            <datalist id="tickers-dl">{allTickers.map(t => <option key={t} value={t} />)}</datalist>
          </Field>
          <Field label="Título del análisis">
            <input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Apple 1T26 — Resultados" />
          </Field>
          <Field label="Link del PDF" hint="ej. https://mxmus.app/storage/pdfs/xxx.pdf">
            <input value={pdfUrl} onChange={e => setPdfUrl(e.target.value)} placeholder="https://..." />
          </Field>
        </div>
        <Field label="Mensaje (con variables {contacto} {cliente} {ticker} {titulo} {link} {yo})">
          <textarea rows={5} value={mensaje} onChange={e => setMensaje(e.target.value)} />
        </Field>
      </Panel>

      <Panel title={`2. Destinatarios (${conTelefono.length}${sinTelefono > 0 ? ` · ${sinTelefono} sin teléfono` : ''})`}>
        {!ticker ? (
          <div className="text-sm text-muted italic px-2 py-4">Elegí un ticker arriba para ver a quién mandárselo.</div>
        ) : destinatarios.length === 0 ? (
          <div className="text-sm text-muted italic px-2 py-4">Ningún cliente tiene <b>{ticker}</b> en su cartera. Cargá holdings en el tab "Holdings" o en el editor de cliente.</div>
        ) : (
          <div className="space-y-2">
            <div className="text-[12px] text-muted">Click <b>Enviar</b> en cada uno: se abre WhatsApp Web con el mensaje pre-armado. Adjuntás el PDF (o el link ya viene). Cuando terminás de mandarlos todos, podés guardar el análisis y registrar el historial con el botón al final.</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted text-[10.5px] uppercase tracking-wider">
                  <tr>
                    <th className="py-2 pr-2">Cliente</th>
                    <th className="pr-2">Contacto</th>
                    <th className="pr-2">Teléfono</th>
                    <th className="pr-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {destinatarios.map(c => {
                    const tel = phoneClean(c.telefono);
                    const yaEnviado = enviados.has(c.id);
                    return (
                      <tr key={c.id} className="border-t border-line">
                        <td className="py-2.5 pr-2 font-medium text-ink">{c.cliente}</td>
                        <td className="pr-2 text-ink-2">{c.contacto || '—'}</td>
                        <td className="pr-2 text-ink-2 tabular-nums">{c.telefono || <span className="text-bad text-[11px]">sin teléfono</span>}</td>
                        <td className="pr-2">
                          {tel ? (
                            <button onClick={() => enviarUno(c)}
                              className={`px-3 py-1.5 text-[11px] rounded border flex items-center gap-1.5 transition ${yaEnviado ? 'bg-ok/10 text-ok border-ok/30' : 'bg-gold/15 text-gold border-gold/40 hover:bg-gold/25'}`}>
                              <Icon name={yaEnviado ? 'check' : 'send'} size={12} />
                              {yaEnviado ? 'Enviado' : 'Enviar'}
                            </button>
                          ) : <span className="text-[11px] text-muted italic">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end pt-3 border-t border-line">
              <Btn onClick={guardarAnalisisYRegistrar} disabled={enviados.size === 0 || !titulo || !pdfUrl}>
                <Icon name="check" size={14} />Guardar análisis y registrar {enviados.size} envío{enviados.size !== 1 ? 's' : ''}
              </Btn>
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
}

function HoldingsClientes({ state, dispatch }) {
  const clients = state.maximus.clients;
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null); // client id en edición
  const filtered = clients.filter(c =>
    !search || `${c.cliente} ${(c.activos || []).join(' ')}`.toLowerCase().includes(search.toLowerCase())
  );

  const updateActivos = (c, newActivos) => {
    const { _cat, ...sanitized } = c;
    dispatch({ type: 'CLIENT_UPSERT', client: { ...sanitized, activos: newActivos } });
  };

  return (
    <div className="space-y-4">
      <Panel title={`Holdings por cliente (${filtered.length} de ${clients.length})`} action={
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cliente o ticker…" className="!py-1.5 !text-xs" style={{ width: 240 }} />
      }>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted text-[10.5px] uppercase tracking-wider">
              <tr>
                <th className="py-2 pr-2">Cliente</th>
                <th className="pr-2">Teléfono</th>
                <th className="pr-2 text-right">Activos</th>
                <th className="pr-2"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const activos = Array.isArray(c.activos) ? c.activos : [];
                const isEditing = editing === c.id;
                return (
                  <React.Fragment key={c.id}>
                    <tr className="border-t border-line align-top">
                      <td className="py-2.5 pr-2 font-medium text-ink">{c.cliente}</td>
                      <td className="pr-2 text-ink-2 text-[11px] whitespace-nowrap">{c.telefono || <span className="text-muted italic">sin tel</span>}</td>
                      <td className="pr-2 text-right tabular-nums">
                        <span className={activos.length === 0 ? 'text-muted' : 'text-ink font-medium'}>{activos.length}</span>
                      </td>
                      <td className="pr-2 whitespace-nowrap text-right">
                        <button onClick={() => setEditing(isEditing ? null : c.id)}
                          className="px-2 py-1 text-[11px] rounded border border-line text-ink-2 hover:border-gold/40 hover:text-ink">
                          {isEditing ? 'Cerrar' : 'Editar'}
                        </button>
                      </td>
                    </tr>
                    {isEditing && (
                      <tr className="bg-surface-2/40">
                        <td colSpan={4} className="py-2 px-2">
                          <textarea
                            autoFocus
                            rows={6}
                            defaultValue={activos.join(', ')}
                            onBlur={(e) => {
                              const newAct = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                              const same = JSON.stringify(newAct) === JSON.stringify(activos);
                              if (!same) updateActivos(c, newAct);
                              setEditing(null);
                            }}
                            onKeyDown={(e) => { if (e.key === 'Escape') setEditing(null); }}
                            placeholder="AAPL, MSFT, TSLA — separados por coma"
                            className="!text-[12px] w-full"
                          />
                          <div className="text-[10px] text-muted mt-1">Esc para cancelar · click afuera para guardar</div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function HistorialEnvios({ state }) {
  const envios = state.maximus.envios || [];
  const analisis = state.maximus.analisis || [];
  const clients = state.maximus.clients;
  const team = state.team;
  if (envios.length === 0) {
    return <EmptyState title="Sin envíos todavía" hint="Mandá un análisis desde el tab 'Enviar análisis' y va a aparecer acá." />;
  }
  return (
    <Panel title={`Historial de envíos (${envios.length})`}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-muted text-[10.5px] uppercase tracking-wider">
            <tr>
              <th className="py-2 pr-2">Fecha</th>
              <th className="pr-2">Análisis</th>
              <th className="pr-2">Cliente</th>
              <th className="pr-2">Contacto</th>
              <th className="pr-2">Enviado por</th>
              <th className="pr-2">PDF</th>
            </tr>
          </thead>
          <tbody>
            {envios.map(e => {
              const a = analisis.find(x => x.id === e.analisisId);
              const c = clients.find(x => x.id === e.clienteId);
              const u = team.find(x => x.id === e.enviadoBy);
              return (
                <tr key={e.id} className="border-t border-line">
                  <td className="py-2 pr-2 text-ink-2 tabular-nums">{fmtDateTime(e.enviadoAt)}</td>
                  <td className="pr-2">{a ? <span><b>{a.ticker}</b> · {a.titulo}</span> : '—'}</td>
                  <td className="pr-2 font-medium">{c?.cliente || e.clienteId}</td>
                  <td className="pr-2 text-ink-2">{e.contacto || '—'}</td>
                  <td className="pr-2">{u ? <div className="flex items-center gap-1.5"><Avatar user={u} size={18} />{u.name.split(' ')[0]}</div> : '—'}</td>
                  <td className="pr-2">{a?.pdfUrl ? <a href={a.pdfUrl} target="_blank" className="text-gold hover:underline text-[11px]">PDF</a> : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

/* Nota editable inline para Plan comercial */
function NotaPlanEditable({ value, onSave, placeholder = 'Agregar motivo del contacto…' }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(value || '');
  useEffect(() => { setText(value || ''); }, [value]);
  const save = () => { if (text !== (value || '')) onSave(text); setEditing(false); };
  if (!editing) {
    return value
      ? <div onClick={() => setEditing(true)} className="text-[11px] text-ink-2 italic cursor-text hover:text-ink line-clamp-2 max-w-[280px]" title={value}>{value}</div>
      : <button onClick={() => setEditing(true)} className="text-[11px] text-muted hover:text-gold italic">+ nota</button>;
  }
  return (
    <textarea autoFocus value={text} onChange={e => setText(e.target.value)} onBlur={save}
      onKeyDown={e => { if (e.key === 'Escape') { setText(value || ''); setEditing(false); } if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) save(); }}
      rows={2} placeholder={placeholder}
      className="!text-[11px] !py-1 !px-2" style={{ width: 280, minHeight: 50 }} />
  );
}

/* ─────────────────────────────────────────────────────────────────────
   MAXIMUS — PLAN COMERCIAL (solo admin)
   Lista clientes con acción Contactar / Armar Reunión, asignable a admins
   ───────────────────────────────────────────────────────────────────── */
function MaximusPlanComercial() {
  const { state, dispatch, me } = useApp();
  const clients = state.maximus.clients;
  const prospects = state.maximus.prospects;
  // Personas a las que se puede asignar trabajo comercial en el Plan
  const ASIGNABLES_PLAN = ['u-mm', 'u-sh', 'u-pm']; // Mautner, De Haedo, Pablo Machado
  const admins = state.team.filter(u => ASIGNABLES_PLAN.includes(u.id))
    .sort((a, b) => ASIGNABLES_PLAN.indexOf(a.id) - ASIGNABLES_PLAN.indexOf(b.id));
  const [filterAsignacion, setFilterAsignacion] = useState('todos');
  const [filterCategoria, setFilterCategoria] = useState('');
  const [search, setSearch] = useState('');

  const candidatos = useMemo(() => {
    return clients
      .filter(c => {
        const cat = categoriaAccion(c.accion);
        return cat === 'Contactar' || cat === 'Armar Reunión';
      })
      .map(c => ({ ...c, _cat: categoriaAccion(c.accion) }));
  }, [clients]);

  const prospectsSemana = useMemo(() => {
    const s = search.toLowerCase();
    return prospects.filter(p =>
      p.estado === 'contactar_esta_semana' &&
      (!s || `${p.empresa} ${p.contacto || ''} ${p.pais || ''} ${p.nota_plan || ''}`.toLowerCase().includes(s)) &&
      (filterAsignacion === 'todos' ||
        (filterAsignacion === 'mio' && p.asignado_a === me.id) ||
        (filterAsignacion === 'sin' && !p.asignado_a) ||
        (p.asignado_a === filterAsignacion))
    );
  }, [prospects, search, filterAsignacion, me]);

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return candidatos.filter(c =>
      (!s || `${c.cliente} ${c.contacto || ''} ${c.accion || ''}`.toLowerCase().includes(s)) &&
      (!filterCategoria || c._cat === filterCategoria) &&
      (filterAsignacion === 'todos' ||
        (filterAsignacion === 'mio' && c.asignado_a === me.id) ||
        (filterAsignacion === 'sin' && !c.asignado_a) ||
        (c.asignado_a === filterAsignacion))
    );
  }, [candidatos, search, filterCategoria, filterAsignacion, me]);

  const prospectsTodosSemana = useMemo(() => prospects.filter(p => p.estado === 'contactar_esta_semana'), [prospects]);
  const stats = useMemo(() => {
    const totalUnits = candidatos.length + prospectsTodosSemana.length;
    const r = { total: totalUnits, sinAsignar: 0, byAdmin: {} };
    admins.forEach(a => { r.byAdmin[a.id] = { user: a, count: 0 }; });
    [...candidatos, ...prospectsTodosSemana].forEach(c => {
      if (!c.asignado_a) r.sinAsignar++;
      else if (r.byAdmin[c.asignado_a]) r.byAdmin[c.asignado_a].count++;
    });
    return r;
  }, [candidatos, prospectsTodosSemana, admins]);

  const sanitize = (c) => { const { _cat, ...rest } = c; return rest; };
  const setAsignado = (client, userId) => {
    dispatch({ type: 'CLIENT_UPSERT', client: { ...sanitize(client), asignado_a: userId } });
  };
  const marcarHecho = (client) => {
    dispatch({ type: 'CLIENT_UPSERT', client: { ...sanitize(client), accion: 'Todo OK', asignado_a: null } });
  };
  const setProspectAsignado = (p, userId) => {
    dispatch({ type: 'PROS_UPDATE', p: { ...p, asignado_a: userId } });
  };
  const moverProspect = (p, nuevoEstado) => {
    dispatch({ type: 'PROS_UPDATE', p: { ...p, estado: nuevoEstado, asignado_a: null } });
  };
  const setNotaPlanCliente = (c, nota) => {
    dispatch({ type: 'CLIENT_UPSERT', client: { ...sanitize(c), nota_plan: nota } });
  };
  const setNotaPlanProspect = (p, nota) => {
    dispatch({ type: 'PROS_UPDATE', p: { ...p, nota_plan: nota } });
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Plan comercial"
        subtitle="Clientes que requieren contacto o reunión. Asignar entre Mautner y de Haedo."
        actions={<>
          <div className="relative">
            <Icon name="search" size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar…" className="!pl-8 !py-2 !text-xs" style={{ width: 200 }} />
          </div>
          <select value={filterCategoria} onChange={e => setFilterCategoria(e.target.value)} className="!py-2 !text-xs" style={{ width: 170 }}>
            <option value="">Todas las acciones</option>
            <option value="Contactar">Solo Contactar</option>
            <option value="Armar Reunión">Solo Armar Reunión</option>
          </select>
          <select value={filterAsignacion} onChange={e => setFilterAsignacion(e.target.value)} className="!py-2 !text-xs" style={{ width: 180 }}>
            <option value="todos">Todos los asignados</option>
            <option value="mio">Solo mis asignaciones</option>
            <option value="sin">Sin asignar</option>
            {admins.map(a => <option key={a.id} value={a.id}>De {a.name.split(' ')[0]}</option>)}
          </select>
        </>}
      />

      <div className="px-3 sm:px-6 pb-6 flex-1 overflow-y-auto space-y-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard title="Total pendientes" value={stats.total} hint="Clientes + prospects esta semana" />
          <StatCard title="Sin asignar" value={stats.sinAsignar} hint={stats.sinAsignar > 0 ? 'Reparta entre los admins' : 'Todos asignados ✓'} />
          {admins.map(a => (
            <StatCard key={a.id} title={a.name.split(' ')[0]} value={stats.byAdmin[a.id]?.count || 0} hint={`asignados a ${a.name.split(' ')[0]}`} />
          ))}
        </div>

        {prospectsSemana.length > 0 && (
          <Panel title={`Prospects · Contactar esta semana (${prospectsSemana.length}${prospectsTodosSemana.length !== prospectsSemana.length ? ` de ${prospectsTodosSemana.length}` : ''})`}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted text-[10.5px] uppercase tracking-wider">
                  <tr>
                    <th className="py-2 pr-2">Empresa</th>
                    <th className="pr-2">Contacto</th>
                    <th className="pr-2">Motivo / nota</th>
                    <th className="pr-2">Asignado</th>
                    <th className="pr-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {prospectsSemana.map(p => {
                    const asig = admins.find(a => a.id === p.asignado_a);
                    return (
                      <tr key={p.id} className="border-t border-line hover:bg-surface-2/40">
                        <td className="py-2.5 pr-2 font-medium text-ink">{p.empresa}</td>
                        <td className="pr-2 text-ink-2">{p.contacto || '—'}</td>
                        <td className="pr-2">
                          <NotaPlanEditable value={p.nota_plan} onSave={(t) => setNotaPlanProspect(p, t)} />
                        </td>
                        <td className="pr-2">
                          {asig ? (
                            <div className="flex items-center gap-1.5">
                              <Avatar user={asig} size={20} />
                              <span className="text-xs text-ink-2">{asig.name.split(' ')[0]}</span>
                            </div>
                          ) : <span className="text-[11px] text-muted italic">sin asignar</span>}
                        </td>
                        <td className="pr-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {admins.map(a => (
                              <button key={a.id} onClick={() => setProspectAsignado(p, a.id)}
                                className={`px-2 py-1 text-[11px] rounded border transition ${p.asignado_a === a.id ? 'bg-gold/10 text-gold border-gold/40' : 'border-line text-ink-2 hover:border-gold/40 hover:text-ink'}`}>
                                {a.name.split(' ')[0]}
                              </button>
                            ))}
                            {p.asignado_a && (
                              <button onClick={() => setProspectAsignado(p, null)} className="px-2 py-1 text-[11px] rounded border border-line text-muted hover:text-bad hover:border-bad/40" title="Quitar asignación">×</button>
                            )}
                            <button onClick={() => moverProspect(p, 'volver_a_contactar')} className="px-2 py-1 text-[11px] rounded bg-ok/10 text-ok border border-ok/30 hover:bg-ok/20" title="Marcar como contactado (pasa a 'Volver a contactar')">
                              <Icon name="check" size={11} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Panel>
        )}

        <Panel title={`Clientes a contactar (${filtered.length} de ${candidatos.length})`}>
          {filtered.length === 0 ? <EmptyState title="Sin clientes pendientes" hint="Modificá los filtros o cargá nuevas acciones en Uso clientes." /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted text-[10.5px] uppercase tracking-wider">
                  <tr>
                    <th className="py-2 pr-2">Cliente</th>
                    <th className="pr-2">Acción</th>
                    <th className="pr-2">Score</th>
                    <th className="pr-2 text-right">Sin login</th>
                    <th className="pr-2">Motivo / nota</th>
                    <th className="pr-2">Asignado</th>
                    <th className="pr-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => {
                    const { score, color } = clientScore(c);
                    const asignadoUser = admins.find(a => a.id === c.asignado_a);
                    return (
                      <tr key={c.id} className="border-t border-line hover:bg-surface-2/40">
                        <td className="py-2.5 pr-2">
                          <div className="font-medium text-ink">{c.cliente}</div>
                          {c.contacto && <div className="text-[10.5px] text-muted line-clamp-1">{c.contacto}</div>}
                        </td>
                        <td className="pr-2">
                          <Badge className={CATEGORIA_BADGE[c._cat]}>{c._cat}</Badge>
                          {(() => {
                            const raw = (c.accion || '').trim();
                            const nr = normalizar(raw);
                            const showDetail = raw && raw !== '-' && nr !== normalizar(c._cat) && !CATEGORIAS.some(x => normalizar(x) === nr);
                            return showDetail
                              ? <div className="text-[10.5px] text-ink-2 line-clamp-2 mt-1 max-w-[280px]" title={raw}>{raw}</div>
                              : null;
                          })()}
                        </td>
                        <td className="pr-2"><Badge className={SCORE_BADGE[color]}>{score}</Badge></td>
                        <td className={`pr-2 text-right tabular-nums ${(c.dias_sin_login||0) >= 60 ? 'text-bad' : (c.dias_sin_login||0) >= 30 ? 'text-warn' : 'text-muted'}`}>{c.dias_sin_login != null ? `${c.dias_sin_login}d` : '—'}</td>
                        <td className="pr-2">
                          <NotaPlanEditable value={c.nota_plan} onSave={(t) => setNotaPlanCliente(c, t)} />
                        </td>
                        <td className="pr-2">
                          {asignadoUser ? (
                            <div className="flex items-center gap-1.5">
                              <Avatar user={asignadoUser} size={20} />
                              <span className="text-xs text-ink-2">{asignadoUser.name.split(' ')[0]}</span>
                            </div>
                          ) : <span className="text-[11px] text-muted italic">sin asignar</span>}
                        </td>
                        <td className="pr-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {admins.map(a => (
                              <button key={a.id} onClick={() => setAsignado(c, a.id)}
                                className={`px-2 py-1 text-[11px] rounded border transition ${c.asignado_a === a.id ? 'bg-gold/10 text-gold border-gold/40' : 'border-line text-ink-2 hover:border-gold/40 hover:text-ink'}`}>
                                {a.name.split(' ')[0]}
                              </button>
                            ))}
                            {c.asignado_a && (
                              <button onClick={() => setAsignado(c, null)} className="px-2 py-1 text-[11px] rounded border border-line text-muted hover:text-bad hover:border-bad/40" title="Quitar asignación">×</button>
                            )}
                            <button onClick={() => marcarHecho(c)} className="px-2 py-1 text-[11px] rounded bg-ok/10 text-ok border border-ok/30 hover:bg-ok/20" title="Marcar acción como hecha (pasa a Todo OK)">
                              <Icon name="check" size={11} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

function ClientEditor({ open, client, onClose, onSave, onDelete }) {
  const isNew = !client;
  const blank = { cliente:'', contacto:'', a_cargo:'', pais:'', servicio:'Consultora', accion:'', pedidos_total:0, pedidos_90d:0, pedidos_180d:0, dias_sin_pedido:null, max_logins_ytd:0, max_logins_total:0, dias_sin_login:null, max_propuestas:0, max_portafolios_analizados:0, max_comparativos:0, max_estrategias:0, score:50, semaforo:'amarillo' };
  const [form, setForm] = useState(client || blank);
  useEffect(() => { if (open) setForm(client || blank); }, [open, client]);
  if (!open) return null;
  const preview = clientScore(form);
  return (
    <Modal open={open} onClose={onClose} title={isNew ? 'Nuevo cliente' : form.cliente} width="max-w-3xl">
      {!isNew && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <MiniStat label="Score" value={preview.score} cls={SCORE_BADGE[preview.color]} />
          <MiniStat label="Pedidos 90d" value={form.pedidos_90d ?? 0} />
          <MiniStat label="Logins YTD" value={form.max_logins_ytd ?? 0} />
          <MiniStat label="Sin login" value={form.dias_sin_login != null ? `${form.dias_sin_login}d` : '—'} />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
        <Field label="Cliente">
          <input value={form.cliente || ''} onChange={e => setForm({ ...form, cliente: e.target.value })} />
        </Field>
        <Field label="Servicio">
          <select value={form.servicio || 'Consultora'} onChange={e => setForm({ ...form, servicio: e.target.value })}>
            <option>Consultora</option><option>MaximUs</option><option>Consultora & MaximUs</option>
            <option>Alternativos</option><option>Informes</option><option>Prospect</option>
          </select>
        </Field>
        <Field label="Contacto">
          <input value={form.contacto || ''} onChange={e => setForm({ ...form, contacto: e.target.value })} />
        </Field>
        <Field label="A cargo (analista)">
          <input value={form.a_cargo || ''} onChange={e => setForm({ ...form, a_cargo: e.target.value })} placeholder="Iniciales del analista" />
        </Field>
        <Field label="País">
          <input value={form.pais || ''} onChange={e => setForm({ ...form, pais: e.target.value })} />
        </Field>
        <Field label="Semáforo">
          <select value={form.semaforo || 'amarillo'} onChange={e => setForm({ ...form, semaforo: e.target.value })}>
            <option value="verde">Verde — saludable</option>
            <option value="amarillo">Amarillo — atención</option>
            <option value="rojo">Rojo — riesgo</option>
          </select>
        </Field>
        <Field label="Mes de renovación" hint="Formato Mes Año (ej. Diciembre 2026)">
          <input type="month" value={form.fecha_renovacion || ''} onChange={e => setForm({ ...form, fecha_renovacion: e.target.value })} />
        </Field>
        <Field label="Teléfono (WhatsApp)" hint="Formato internacional: +598 99 511 008">
          <input value={form.telefono || ''} onChange={e => setForm({ ...form, telefono: e.target.value })} placeholder="+598 99 511 008" />
        </Field>
        <Field label="Activos en cartera" hint="Tickers separados por coma: AAPL, MSFT, TSLA">
          <input value={Array.isArray(form.activos) ? form.activos.join(', ') : ''} onChange={e => setForm({ ...form, activos: e.target.value.split(',').map(s => s.trim().toUpperCase()).filter(Boolean) })} placeholder="AAPL, MSFT, TSLA" />
        </Field>
      </div>

      <div className="text-xs uppercase tracking-wider text-muted mt-2 mb-2">Consultora</div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4">
        <Field label="Pedidos totales">
          <input type="number" value={form.pedidos_total ?? 0} onChange={e => setForm({ ...form, pedidos_total: Number(e.target.value) })} />
        </Field>
        <Field label="Pedidos últimos 90d">
          <input type="number" value={form.pedidos_90d ?? 0} onChange={e => setForm({ ...form, pedidos_90d: Number(e.target.value) })} />
        </Field>
        <Field label="Días sin pedido">
          <input type="number" value={form.dias_sin_pedido ?? ''} onChange={e => setForm({ ...form, dias_sin_pedido: e.target.value === '' ? null : Number(e.target.value) })} />
        </Field>
      </div>

      <div className="text-xs uppercase tracking-wider text-muted mt-2 mb-2">MaximUs</div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4">
        <Field label="Logins YTD">
          <input type="number" value={form.max_logins_ytd ?? 0} onChange={e => setForm({ ...form, max_logins_ytd: Number(e.target.value) })} />
        </Field>
        <Field label="Días sin login">
          <input type="number" value={form.dias_sin_login ?? ''} onChange={e => setForm({ ...form, dias_sin_login: e.target.value === '' ? null : Number(e.target.value) })} />
        </Field>
        <Field label="Propuestas armadas">
          <input type="number" value={form.max_propuestas ?? 0} onChange={e => setForm({ ...form, max_propuestas: Number(e.target.value) })} />
        </Field>
      </div>

      <Field label="Acción sugerida" hint={form.accion && !CATEGORIAS.includes(form.accion) ? `Acción anterior: "${form.accion}"` : null}>
        <select value={CATEGORIAS.includes(form.accion) ? form.accion : (form.accion ? categoriaAccion(form.accion) : '')}
                onChange={e => setForm({ ...form, accion: e.target.value })}>
          <option value="">Sin clasificar</option>
          {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </Field>

      <div className="flex items-center justify-between pt-1">
        <div>{!isNew && <Btn variant="danger" onClick={() => onDelete(client.id)}><Icon name="trash" size={14} />Eliminar</Btn>}</div>
        <div className="flex gap-2">
          <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
          <Btn onClick={() => onSave({ ...form, id: client?.id })}><Icon name="check" size={14} />Guardar</Btn>
        </div>
      </div>
    </Modal>
  );
}

function MiniStat({ label, value, cls = 'bg-surface-2 border border-line text-ink' }) {
  return (
    <div className={`rounded-lg px-3 py-2 ${cls}`}>
      <div className="text-[10px] uppercase tracking-wider opacity-70">{label}</div>
      <div className="text-lg font-semibold tabular-nums leading-tight mt-0.5">{value}</div>
    </div>
  );
}

function ImportJSON({ open, onClose, onImport }) {
  const [text, setText] = useState('');
  const [err, setErr] = useState('');
  useEffect(() => { if (open) { setText(''); setErr(''); } }, [open]);
  if (!open) return null;
  const sample = `// Formato dashboard MaximUs (auto-detectado):
{ "metadata": {...}, "kpis": {...}, "risk_users": [
  { "name": "...", "org": "Atlantis", "days_inactive": 12, "risk_level": "MEDIO", ... }
]}

// O formato legacy (array de clientes):
[{ "cliente": "Cliente X", "score": 70, "loginsMes": 12 }]`;
  return (
    <Modal open={open} onClose={onClose} title="Importar métricas de clientes" width="max-w-2xl">
      <p className="text-sm text-muted mb-3">Pegá el JSON. Se detecta automáticamente si es el dashboard de MaximUs (con <code>risk_users</code>) o el formato legacy. El dashboard <b>actualiza</b> los clientes existentes que matcheen por nombre.</p>
      <textarea rows={12} value={text} onChange={e => setText(e.target.value)} placeholder={sample} className="font-mono !text-[12px]" />
      {err && <div className="text-bad text-sm mt-2">{err}</div>}
      <div className="flex justify-end gap-2 mt-4">
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={() => {
          try {
            const arr = JSON.parse(text);
            if (!Array.isArray(arr)) throw new Error('Tiene que ser un array.');
            onImport(arr);
          } catch (e) { setErr(e.message); }
        }}><Icon name="check" size={14} />Importar</Btn>
      </div>
    </Modal>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   MAXIMUS — PROSPECTS
   ───────────────────────────────────────────────────────────────────── */
function MaximusProspects() {
  const { state, dispatch } = useApp();
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');
  const [filterPais, setFilterPais] = useState('');

  const paises = useMemo(() =>
    Array.from(new Set(state.maximus.prospects.map(p => p.pais).filter(Boolean))).sort(),
    [state.maximus.prospects]);

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return state.maximus.prospects.filter(p =>
      (!s || `${p.empresa} ${p.contacto} ${p.producto} ${p.pais || ''}`.toLowerCase().includes(s)) &&
      (!filterPais || p.pais === filterPais)
    );
  }, [state.maximus.prospects, search, filterPais]);

  const byCol = useMemo(() => {
    const m = Object.fromEntries(PROSPECT_COLS.map(c => [c.id, []]));
    filtered.forEach(p => { (m[p.estado] || m.a_contactar).push(p); });
    return m;
  }, [filtered]);

  const onDrop = (estado, e) => {
    e.preventDefault(); e.currentTarget.classList.remove('drop-target');
    const id = e.dataTransfer.getData('text/plain');
    if (id) dispatch({ type: 'PROS_MOVE', id, estado });
  };

  const clientNames = Array.from(new Set(state.consultora.cards.map(c => c.cliente))).sort();

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Pipeline de prospects"
        subtitle="Gestión comercial del equipo de MaximUs. Los prospects que también son clientes de la Consultora quedan marcados."
        actions={<>
          <div className="relative">
            <Icon name="search" size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar…" className="!pl-8 !py-2 !text-sm" style={{ width: 200 }} />
          </div>
          <select value={filterPais} onChange={e => setFilterPais(e.target.value)} className="!py-2 !text-sm" style={{ width: 160 }}>
            <option value="">Todos los países</option>
            {paises.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <Btn onClick={() => setCreating(true)}><Icon name="plus" size={16} />Nuevo prospect</Btn>
        </>}
      />
      <div className="kanban-board flex gap-3 px-3 sm:px-6 pb-6 flex-1 overflow-x-auto overflow-y-hidden">
        {PROSPECT_COLS.map(col => (
          <div key={col.id}
            onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('drop-target'); }}
            onDragLeave={e => e.currentTarget.classList.remove('drop-target')}
            onDrop={e => onDrop(col.id, e)}
            className="kanban-col shrink-0 flex flex-col rounded-lg bg-bg-2 border border-line">
            <div className="px-3 py-2.5 flex items-center justify-between border-b border-line">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-2">{col.label}</span>
              <span className="text-[10px] font-medium text-muted px-1.5 py-0.5 rounded bg-surface tabular-nums">{byCol[col.id].length}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[120px]">
              {byCol[col.id].map(p => (
                <ProspectCard key={p.id} p={p} onClick={() => setEditing(p)} />
              ))}
              {byCol[col.id].length === 0 && <div className="text-[11px] text-muted/60 px-2 py-6 text-center italic">Vacío</div>}
            </div>
          </div>
        ))}
      </div>

      <ProspectEditor
        open={creating || !!editing}
        prospect={editing}
        clientNames={clientNames}
        onClose={() => { setEditing(null); setCreating(false); }}
        onSave={(p) => { if (p.id) dispatch({ type: 'PROS_UPDATE', p }); else dispatch({ type: 'PROS_ADD', p: { ...p, id: uid(), estado: p.estado || 'a_contactar' } }); setEditing(null); setCreating(false); }}
        onDelete={(id) => { dispatch({ type: 'PROS_DELETE', id }); setEditing(null); }}
      />
    </div>
  );
}

function ProspectCard({ p, onClick }) {
  const onDragStart = (e) => { e.dataTransfer.setData('text/plain', p.id); e.currentTarget.classList.add('dragging'); };
  const onDragEnd   = (e) => e.currentTarget.classList.remove('dragging');
  const pais = p.pais || p.country;
  return (
    <div draggable onDragStart={onDragStart} onDragEnd={onDragEnd} onClick={onClick}
         className="card-lift card-shadow cursor-grab active:cursor-grabbing rounded-lg border border-line bg-bg overflow-hidden">
      <div className="h-0.5 bg-gold" />
      <div className="p-3">
        <div className="font-semibold text-ink text-[13px] leading-tight line-clamp-2 mb-1">{p.empresa}</div>
        {p.contacto && (
          <div className="flex items-center gap-1 text-[11px] text-ink-2 mb-2.5">
            <Icon name="user" size={11} />
            <span className="truncate">{p.contacto}</span>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
          {pais && (() => {
            const c = countryStyle(pais);
            return <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium border" style={{ background: c.bg, color: c.text, borderColor: c.text + '33' }}>{pais}</span>;
          })()}
          {p.clienteCompartido && (
            <Badge className="bg-gold/10 text-gold border-gold/30"><Icon name="link" size={10} />{p.clienteCompartido}</Badge>
          )}
        </div>
        {p.proxSeguimiento && (
          <div className="flex items-center justify-end gap-1 pt-2 border-t border-line text-[10px] text-ink-2 tabular-nums">
            <Icon name="clock" size={10} />{fmtDate(p.proxSeguimiento)}
          </div>
        )}
      </div>
    </div>
  );
}

function ProspectEditor({ open, prospect, clientNames, onClose, onSave, onDelete }) {
  const isNew = !prospect;
  const blank = { empresa:'', contacto:'', producto:'MaximUs Pro', notas:'', proxSeguimiento: now() + 3*DAY, estado:'a_contactar', clienteCompartido:'' };
  const [form, setForm] = useState(prospect || blank);
  useEffect(() => { if (open) setForm(prospect || blank); }, [open, prospect]);
  if (!open) return null;
  return (
    <Modal open={open} onClose={onClose} title={isNew ? 'Nuevo prospect' : 'Editar prospect'} width="max-w-2xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
        <Field label="Empresa"><input value={form.empresa} onChange={e => setForm({...form, empresa: e.target.value })} /></Field>
        <Field label="Contacto"><input value={form.contacto} onChange={e => setForm({...form, contacto: e.target.value })} /></Field>
        <Field label="Producto de interés">
          <select value={form.producto} onChange={e => setForm({...form, producto: e.target.value })}>
            <option>MaximUs Basic</option><option>MaximUs Pro</option><option>MaximUs Enterprise</option>
          </select>
        </Field>
        <Field label="Estado">
          <select value={form.estado} onChange={e => setForm({...form, estado: e.target.value })}>
            {PROSPECT_COLS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </Field>
        <Field label="Próximo seguimiento">
          <input type="date" value={form.proxSeguimiento ? new Date(form.proxSeguimiento).toISOString().slice(0,10) : ''} onChange={e => setForm({...form, proxSeguimiento: e.target.value ? new Date(e.target.value).getTime() : null })} />
        </Field>
        <Field label="Cliente compartido con Consultora" hint="Si esta empresa ya es cliente de la consultora, asociala acá.">
          <select value={form.clienteCompartido} onChange={e => setForm({...form, clienteCompartido: e.target.value })}>
            <option value="">— Ninguno —</option>
            {clientNames.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </Field>
        <div className="sm:col-span-2">
          <Field label="Notas"><textarea rows={3} value={form.notas} onChange={e => setForm({...form, notas: e.target.value })} /></Field>
        </div>
      </div>
      <div className="flex items-center justify-between pt-1">
        <div>{!isNew && <Btn variant="danger" onClick={() => onDelete(prospect.id)}><Icon name="trash" size={14} />Eliminar</Btn>}</div>
        <div className="flex gap-2">
          <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
          <Btn onClick={() => onSave({ ...form, id: prospect?.id })}><Icon name="check" size={14} />Guardar</Btn>
        </div>
      </div>
    </Modal>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   MAXIMUS — TAREAS EQUIPO
   ───────────────────────────────────────────────────────────────────── */
function MaximusTasks() {
  const { state, dispatch, me } = useApp();
  const team = state.team.filter(u => u.units.includes('maximus'));
  const tasks = state.maximus.tasks;
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [scope, setScope] = useState('todas'); // todas | mias
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return tasks.filter(t =>
      (scope === 'todas' || (t.asignados || []).includes(me.id)) &&
      (!s || `${t.titulo} ${t.descripcion}`.toLowerCase().includes(s))
    );
  }, [tasks, scope, search, me]);

  const byCol = useMemo(() => {
    const m = Object.fromEntries(TASK_COLS.map(c => [c.id, []]));
    filtered.forEach(t => { (m[t.estado] || m.pending).push(t); });
    return m;
  }, [filtered]);

  const onDrop = (estado, e) => {
    e.preventDefault(); e.currentTarget.classList.remove('drop-target');
    const id = e.dataTransfer.getData('text/plain');
    if (id) dispatch({ type: 'TASK_MOVE', id, estado });
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Tareas del equipo MaximUs"
        subtitle="Tablero compartido. Una tarea puede tener varios responsables. Cada uno ve todas o solo las suyas."
        actions={<>
          <div className="flex items-center gap-1 bg-surface p-1 rounded-lg border border-line">
            <button onClick={() => setScope('todas')} className={`px-3 py-1.5 text-xs rounded-md ${scope==='todas'?'bg-gold text-white':'text-muted'}`}>Todas</button>
            <button onClick={() => setScope('mias')}  className={`px-3 py-1.5 text-xs rounded-md ${scope==='mias' ?'bg-gold text-white':'text-muted'}`}>Mías</button>
          </div>
          <div className="relative">
            <Icon name="search" size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar…" className="!pl-8 !py-2 !text-sm" style={{ width: 200 }} />
          </div>
          <Btn onClick={() => setCreating(true)}><Icon name="plus" size={16} />Nueva tarea</Btn>
        </>}
      />

      <div className="kanban-board flex gap-3 px-3 sm:px-6 pb-6 flex-1 overflow-x-auto overflow-y-hidden">
        {TASK_COLS.map(col => (
          <div key={col.id}
            onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('drop-target'); }}
            onDragLeave={e => e.currentTarget.classList.remove('drop-target')}
            onDrop={e => onDrop(col.id, e)}
            className="kanban-col shrink-0 flex flex-col rounded-lg bg-bg-2 border border-line">
            <div className="px-3 py-2.5 flex items-center justify-between border-b border-line">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-2">{col.label}</span>
              <span className="text-[10px] font-medium text-muted px-1.5 py-0.5 rounded bg-surface tabular-nums">{byCol[col.id].length}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[120px]">
              {byCol[col.id].map(t => (
                <TaskCard key={t.id} t={t} team={team} onClick={() => setEditing(t)} />
              ))}
              {byCol[col.id].length === 0 && <div className="text-[11px] text-muted/60 px-2 py-6 text-center italic">Vacío</div>}
            </div>
          </div>
        ))}
      </div>

      <TaskEditor
        open={creating || !!editing}
        task={editing}
        team={team}
        me={me}
        onClose={() => { setEditing(null); setCreating(false); }}
        onSave={(t) => { if (t.id) dispatch({ type: 'TASK_UPDATE', t }); else dispatch({ type: 'TASK_ADD', t: { ...t, id: uid(), estado: t.estado || 'pending', comentarios: [] } }); setEditing(null); setCreating(false); }}
        onDelete={(id) => { dispatch({ type: 'TASK_DELETE', id }); setEditing(null); }}
        onComment={(id, texto) => { dispatch({ type: 'TASK_COMMENT', id, c: { id: uid(), autorId: me.id, ts: now(), texto } }); }}
      />
    </div>
  );
}

function TaskCard({ t, team, onClick }) {
  const overdue = t.deadline && t.deadline < now() && t.estado !== 'done';
  const asignados = (t.asignados || []).map(id => team.find(u => u.id === id)).filter(Boolean);
  const onDragStart = (e) => { e.dataTransfer.setData('text/plain', t.id); e.currentTarget.classList.add('dragging'); };
  const onDragEnd   = (e) => e.currentTarget.classList.remove('dragging');
  return (
    <div draggable onDragStart={onDragStart} onDragEnd={onDragEnd} onClick={onClick}
         className={`card-lift cursor-grab active:cursor-grabbing p-3 rounded-xl border bg-surface ${overdue ? 'border-bad/40' : 'border-line'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="text-[13px] font-semibold pr-1">{t.titulo}</div>
        <PriorityBadge value={t.prioridad} />
      </div>
      <div className="text-[12px] text-ink-2 line-clamp-2 mt-1">{t.descripcion}</div>
      <div className="flex items-center justify-between mt-2.5">
        <div className="flex -space-x-1.5">
          {asignados.slice(0,4).map(a => <Avatar key={a.id} user={a} size={20} />)}
          {asignados.length === 0 && <span className="text-[11px] text-muted">sin asignar</span>}
        </div>
        <div className="flex items-center gap-2 text-[11px] text-muted">
          {t.comentarios?.length > 0 && <span className="flex items-center gap-1"><Icon name="task" size={11} />{t.comentarios.length}</span>}
          {t.deadline && <span className={`flex items-center gap-1 ${deadlineColor(t.deadline, t.estado==='done')}`}><Icon name="clock" size={11} />{fmtDate(t.deadline)}</span>}
        </div>
      </div>
    </div>
  );
}

function TaskEditor({ open, task, team, me, onClose, onSave, onDelete, onComment }) {
  const isNew = !task;
  const blank = { titulo: '', descripcion: '', asignados: [me.id], prioridad: 'media', deadline: now() + 5*DAY, estado: 'pending' };
  const [form, setForm] = useState(task || blank);
  const [comment, setComment] = useState('');
  useEffect(() => { if (open) { setForm(task || blank); setComment(''); } }, [open, task]);
  if (!open) return null;

  const toggleUser = (id) => setForm(f => {
    const has = f.asignados.includes(id);
    return { ...f, asignados: has ? f.asignados.filter(x => x !== id) : [...f.asignados, id] };
  });

  return (
    <Modal open={open} onClose={onClose} title={isNew ? 'Nueva tarea' : 'Editar tarea'} width="max-w-2xl">
      <Field label="Título"><input value={form.titulo} onChange={e => setForm({...form, titulo: e.target.value })} /></Field>
      <Field label="Descripción"><textarea rows={3} value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value })} /></Field>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4">
        <Field label="Prioridad">
          <select value={form.prioridad} onChange={e => setForm({...form, prioridad: e.target.value })}>
            {PRIORIDADES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </Field>
        <Field label="Estado">
          <select value={form.estado} onChange={e => setForm({...form, estado: e.target.value })}>
            {TASK_COLS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </Field>
        <Field label="Deadline"><input type="date" value={form.deadline ? new Date(form.deadline).toISOString().slice(0,10) : ''} onChange={e => setForm({...form, deadline: e.target.value ? new Date(e.target.value).getTime() : null })} /></Field>
      </div>
      <Field label="Asignados" hint="Una tarea puede tener varios responsables. Click para alternar.">
        <div className="flex flex-wrap gap-2">
          {team.map(u => {
            const sel = form.asignados.includes(u.id);
            return (
              <button key={u.id} type="button" onClick={() => toggleUser(u.id)}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-sm ${sel ? 'bg-gold/15 border-gold/40 text-ink' : 'bg-surface-2 border-line text-ink-2 hover:bg-surface-3'}`}>
                <Avatar user={u} size={20} />
                {u.name}
              </button>
            );
          })}
        </div>
      </Field>

      {!isNew && (
        <div className="mt-2">
          <div className="text-[12px] font-medium text-muted mb-1.5">Comentarios</div>
          <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
            {(task.comentarios || []).length === 0 && <div className="text-[12px] text-muted">Sin comentarios.</div>}
            {(task.comentarios || []).map(c => {
              const autor = team.find(u => u.id === c.autorId);
              return (
                <div key={c.id} className="flex gap-2">
                  <Avatar user={autor} size={24} />
                  <div className="flex-1 bg-surface border border-line rounded-lg p-2">
                    <div className="text-[11px] text-muted">{autor?.name || '—'} · {fmtDateTime(c.ts)}</div>
                    <div className="text-sm">{c.texto}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex gap-2 mt-2">
            <input value={comment} onChange={e => setComment(e.target.value)} placeholder="Agregar comentario…" />
            <Btn onClick={() => { if (comment.trim()) { onComment(task.id, comment.trim()); setComment(''); } }}><Icon name="send" size={14} /></Btn>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-3">
        <div>{!isNew && <Btn variant="danger" onClick={() => onDelete(task.id)}><Icon name="trash" size={14} />Eliminar</Btn>}</div>
        <div className="flex gap-2">
          <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
          <Btn onClick={() => onSave({ ...form, id: task?.id })}><Icon name="check" size={14} />Guardar</Btn>
        </div>
      </div>
    </Modal>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Page header
   ───────────────────────────────────────────────────────────────────── */
function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="px-3 sm:px-6 py-4 sm:py-5 border-b border-line flex flex-col lg:flex-row lg:items-center gap-3">
      <div className="flex-1 min-w-0">
        <h1 className="text-xl sm:text-2xl font-bold leading-tight">{title}</h1>
        {subtitle && <p className="text-xs sm:text-sm text-muted mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Store: usa Supabase si window.SUPA?.enabled, sino localStorage
   ───────────────────────────────────────────────────────────────────── */
function useStore() {
  const [state, baseDispatch] = useReducer(reducer, null, initialState);
  const [supaReady, setSupaReady] = useState(() => !!window.SUPA?.enabled);

  useEffect(() => {
    if (!window.SUPA && window.SUPABASE_CFG) {
      const onReady = () => setSupaReady(!!window.SUPA?.enabled);
      window.addEventListener('supa-ready', onReady);
      return () => window.removeEventListener('supa-ready', onReady);
    }
  }, []);

  useEffect(() => {
    if (!supaReady) return;
    let unsub = null, alive = true;
    (async () => {
      try {
        const remote = await window.SUPA.fetchAll();
        if (alive && remote.team.length) baseDispatch({ type: 'RESET', state: remote });
      } catch (e) { console.error('Supabase fetch error', e); }
      if (!alive) return;
      unsub = window.SUPA.subscribe(async () => {
        try {
          const remote = await window.SUPA.fetchAll();
          if (alive) baseDispatch({ type: 'RESET', state: remote });
        } catch (e) {}
      });
    })();
    return () => { alive = false; if (unsub) unsub(); };
  }, [supaReady]);

  useEffect(() => { if (!supaReady) ls.set(STORAGE_KEY, state); }, [state, supaReady]);

  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  const dispatch = useCallback((action) => {
    baseDispatch(action);
    if (!supaReady) return;
    const SUPA = window.SUPA;
    const s = stateRef.current;
    try {
      switch (action.type) {
        case 'CONSULT_ADD':
        case 'CONSULT_UPDATE': SUPA.upsertCard({ ...s.consultora.cards.find(c => c.id === action.card.id), ...action.card }); break;
        case 'CONSULT_MOVE': {
          const card = s.consultora.cards.find(c => c.id === action.id);
          if (card) SUPA.upsertCard({ ...card, estado: action.estado, completedAt: action.estado === 'done' ? Date.now() : null });
          break;
        }
        case 'CONSULT_DELETE': SUPA.deleteCard(action.id); break;
        case 'CLIENT_UPSERT':  SUPA.upsertClient(action.client); break;
        case 'CLIENT_BULK':    Promise.all(action.clients.map(c => SUPA.upsertClient(c))); break;
        case 'CLIENT_DELETE':  SUPA.deleteClient(action.id); break;
        case 'PROS_ADD':
        case 'PROS_UPDATE':    SUPA.upsertProspect({ ...s.maximus.prospects.find(p => p.id === action.p.id), ...action.p }); break;
        case 'PROS_MOVE': {
          const p = s.maximus.prospects.find(x => x.id === action.id);
          if (p) SUPA.upsertProspect({ ...p, estado: action.estado });
          break;
        }
        case 'PROS_DELETE':    SUPA.deleteProspect(action.id); break;
        case 'TASK_ADD':
        case 'TASK_UPDATE':    SUPA.upsertTask({ ...s.maximus.tasks.find(t => t.id === action.t.id), ...action.t }); break;
        case 'TASK_MOVE': {
          const t = s.maximus.tasks.find(x => x.id === action.id);
          if (t) SUPA.upsertTask({ ...t, estado: action.estado });
          break;
        }
        case 'TASK_DELETE':    SUPA.deleteTask(action.id); break;
        case 'TASK_COMMENT':   SUPA.addComment(action.id, action.c); break;
        case 'ANALISIS_ADD':    SUPA.upsertAnalisis(action.a); break;
        case 'ANALISIS_DELETE': SUPA.deleteAnalisis(action.id); break;
        case 'ENVIO_ADD':       SUPA.addEnvio(action.e); break;
        case 'RESERVA_UPSERT':  SUPA.upsertReserva(action.r); break;
        case 'RESERVA_DELETE':  SUPA.deleteReserva(action.id); break;
      }
    } catch (e) { console.error('Supabase persist error', e); }
  }, [supaReady]);

  return [state, dispatch, supaReady];
}

/* ─────────────────────────────────────────────────────────────────────
   APP ROOT
   ───────────────────────────────────────────────────────────────────── */
function App() {
  const [state, dispatch, syncedRemote] = useStore();
  const [sessionId, setSessionId] = useState(() => ls.get(SESSION_KEY));
  const [route, setRoute] = useState(() => location.hash.replace('#','') || 'consult/kanban');
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { ls.set(SESSION_KEY, sessionId); }, [sessionId]);
  useEffect(() => { const onHash = () => setRoute(location.hash.replace('#','') || 'consult/kanban'); window.addEventListener('hashchange', onHash); return () => window.removeEventListener('hashchange', onHash); }, []);
  useEffect(() => { location.hash = route; }, [route]);

  const me = state.team.find(u => u.id === sessionId) || null;

  const counters = useMemo(() => ({
    'consult/kanban':   state.consultora.cards.filter(c => c.estado !== 'done').length,
    'consult/calendar': 0,
    'consult/metrics':  0,
    'max/usage':        state.maximus.clients.filter(c => clientScore(c).color === 'bad').length,
    'max/prospects':    state.maximus.prospects.filter(p => !['ganado','perdido'].includes(p.estado)).length,
    'max/tasks':        state.maximus.tasks.filter(t => t.estado !== 'done').length,
  }), [state]);

  if (!me) return <Login team={state.team} onLogin={setSessionId} />;

  // Guard: si la ruta no es accesible para este user, redirigir
  if (!canSee(me, route)) {
    const fallback = firstVisibleRoute(me);
    if (fallback !== route) { setRoute(fallback); return null; }
  }

  let view = null;
  switch (route) {
    case 'consult/kanban':   view = <ConsultoraKanban />;   break;
    case 'consult/calendar': view = <ConsultoraCalendar />; break;
    case 'consult/metrics':  view = <ConsultoraMetrics />;  break;
    case 'max/usage':        view = <MaximusUsage />;       break;
    case 'max/plan':         view = <MaximusPlanComercial />; break;
    case 'max/analisis':     view = <MaximusAnalisis />;    break;
    case 'max/prospects':    view = <MaximusProspects />;   break;
    case 'max/tasks':        view = <MaximusTasks />;       break;
    case 'max/sala':         view = <MaximusSala />;        break;
    default:                 view = <ConsultoraKanban />;
  }

  const currentLabel = (() => {
    for (const g of NAV) for (const it of g.items) if (it.id === route) return it.label;
    return '';
  })();

  return (
    <AppCtx.Provider value={{ state, dispatch, me }}>
      <div className="h-full flex">
        {/* Backdrop mobile */}
        {mobileOpen && <div className="mobile-backdrop lg:hidden" onClick={() => setMobileOpen(false)} />}
        <Sidebar route={route} setRoute={setRoute} me={me} counters={counters} synced={syncedRemote}
                 mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)}
                 onLogout={() => { setSessionId(null); setMobileOpen(false); }} />
        <main className="flex-1 min-w-0 flex flex-col">
          {/* Topbar mobile only */}
          <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-line bg-bg sticky top-0 z-30">
            <button onClick={() => setMobileOpen(true)} className="p-1.5 -ml-1 text-ink hover:text-gold">
              <Icon name="menu" size={20} />
            </button>
            <LatamLogo size="sm" />
            <div className="ml-auto text-xs text-muted truncate">{currentLabel}</div>
          </div>
          {view}
        </main>
      </div>
    </AppCtx.Provider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
