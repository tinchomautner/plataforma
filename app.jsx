/* =====================================================================
   Plataforma Interna — LATAM ConsultUs + MaximUs
   React 18 (UMD) + Tailwind (Play CDN) + localStorage
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
  { id: 'u-mm', username: 'mautner',  password: 'Martin2026',    perms: 'admin',      name: 'Martín Mautner',   initials: 'MM', role: 'Admin',              units: ['consultora','maximus'], color: '#0066CC' },
  { id: 'u-sh', username: 'dehaedo',  password: 'Santiago2026',  perms: 'admin',      name: 'Santiago de Haedo',initials: 'SH', role: 'Admin',              units: ['consultora','maximus'], color: '#004C99' },
  { id: 'u-ma', username: 'mati',     password: 'Mati2026',      perms: 'consultora', name: 'Matías Acevedo',   initials: 'MA', role: 'Analista Consultora',units: ['consultora'],           color: '#3b82f6' },
  { id: 'u-pm', username: 'pablo',    password: 'Pablo2026',     perms: 'consultora', name: 'Pablo Machado',    initials: 'PM', role: 'Analista Consultora',units: ['consultora'],           color: '#14b8a6' },
  { id: 'u-da', username: 'debo',     password: 'Debo2026',      perms: 'consultora', name: 'Deborah Amatti',   initials: 'DA', role: 'Analista Consultora',units: ['consultora'],           color: '#ec4899' },
  { id: 'u-em', username: 'emeterio', password: 'Emeterio2026',  perms: 'consultora', name: 'Emeterio Morales', initials: 'EM', role: 'Analista Consultora',units: ['consultora'],           color: '#a855f7' },
  { id: 'u-mn', username: 'nogues',   password: 'Nogues2026',    perms: 'consultora', name: 'Martín Nogués',    initials: 'MN', role: 'Analista Consultora',units: ['consultora'],           color: '#f97316' },
  { id: 'u-vr', username: 'vero',     password: 'Vero2026',      perms: 'consultora', name: 'Verónica Rey',     initials: 'VR', role: 'Analista Consultora',units: ['consultora'],           color: '#06b6d4' },
  { id: 'u-fh', username: 'hazan',    password: 'Federico2026',  perms: 'maximus',    name: 'Federico Hazan',   initials: 'FH', role: 'MaximUs',            units: ['maximus'],              color: '#22c55e' },
  { id: 'u-ax', username: 'araujo',   password: 'Max2026',       perms: 'maximus',    name: 'Max Araujo',       initials: 'MX', role: 'MaximUs',            units: ['maximus'],              color: '#eab308' },
];

/* Reglas de permisos por route */
const ROUTE_PERMS = {
  'consult/kanban':   ['admin','consultora'],
  'consult/calendar': ['admin','consultora'],
  'consult/metrics':  ['admin'],
  'max/usage':        ['admin','maximus'],
  'max/prospects':    ['admin','maximus'],
  'max/tasks':        ['admin','maximus'],
};
const canSee = (user, routeId) => {
  if (!user) return false;
  const allowed = ROUTE_PERMS[routeId];
  return allowed && allowed.includes(user.perms);
};
const firstVisibleRoute = (user) => Object.keys(ROUTE_PERMS).find(r => canSee(user, r)) || 'consult/kanban';

const CONSULTORA_COLS = [
  { id: 'backlog',    label: 'Backlog' },
  { id: 'in_progress',label: 'En progreso' },
  { id: 'in_review',  label: 'En revisión' },
  { id: 'done',       label: 'Listo' },
];

const PROSPECT_COLS = [
  { id: 'por_contactar', label: 'Por contactar' },
  { id: 'contactado',    label: 'Contactado' },
  { id: 'negociacion',   label: 'En negociación' },
  { id: 'propuesta',     label: 'Propuesta enviada' },
  { id: 'ganado',        label: 'Ganado' },
  { id: 'perdido',       label: 'Perdido' },
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

/* Regla auto-archive: si la card tiene > 7 días desde createdAt, queda fuera del Kanban por default.
   No se elimina ni se cambia su estado: solo se oculta. Métricas y archivo siguen viéndola. */
const ARCHIVE_DAYS = 7;
const isArchived = (card) => {
  if (!card.createdAt) return false;
  return (now() - card.createdAt) > ARCHIVE_DAYS * DAY;
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
    maximus:    { clients: seedClients(), prospects: seedProspects(), tasks: seedTasks() },
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
function LatamLogo({ size = 'md', tagline = false }) {
  const sizes = {
    sm: { container: 'text-sm',  tag: 'text-[9px]'  },
    md: { container: 'text-base',tag: 'text-[10px]' },
    lg: { container: 'text-2xl', tag: 'text-xs'     },
    xl: { container: 'text-3xl', tag: 'text-sm'     },
  };
  const s = sizes[size] || sizes.md;
  return (
    <div className="inline-flex flex-col">
      <div className={`font-display font-bold tracking-tight leading-none ${s.container}`}>
        <span className="text-ink">LATAM </span>
        <span className="text-gold">ConsultUs</span>
      </div>
      {tagline && (
        <div className={`${s.tag} text-muted tracking-[0.18em] uppercase mt-1.5`}>El valor de ser independiente</div>
      )}
    </div>
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
        <LatamLogo size="lg" tagline />
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
          <div className="lg:hidden mb-6"><LatamLogo size="md" tagline /></div>
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
    { id: 'max/prospects', label: 'Pipeline ventas', icon: 'pipeline' },
    { id: 'max/tasks',     label: 'Tareas equipo',   icon: 'task' },
  ]},
];

function Sidebar({ route, setRoute, me, onLogout, counters, synced }) {
  // Filtrar grupos e items según permisos del user
  const visibleNav = NAV
    .map(g => ({ ...g, items: g.items.filter(it => canSee(me, it.id)) }))
    .filter(g => g.items.length > 0);

  return (
    <aside className="shrink-0 border-r border-line bg-bg-2 flex flex-col" style={{ width: 230 }}>
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
                  <button key={it.id} onClick={() => setRoute(it.id)}
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
          <span className={`w-1.5 h-1.5 rounded-full ${synced ? 'bg-ok' : 'bg-muted'}`} />
          {synced ? 'Sincronizado con equipo' : 'Local (sin sync)'}
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
  const team = state.team.filter(u => u.units.includes('consultora'));
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
        subtitle={`Activos de los últimos ${ARCHIVE_DAYS} días. ${archivedCount > 0 ? `${archivedCount} en histórico.` : ''}`}
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
          <Btn variant={showArchived ? 'primary' : 'soft'} size="md" onClick={() => setShowArchived(s => !s)} title={`${archivedCount} pendings con +${ARCHIVE_DAYS}d`}>
            <Icon name="clock" size={14} />{showArchived ? 'Ocultando histórico' : `Ver histórico (${archivedCount})`}
          </Btn>
          <Btn onClick={() => setCreating(true)}><Icon name="plus" size={16} />Nuevo pedido</Btn>
        </>}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 px-6 pb-6 flex-1 overflow-y-auto">
        {CONSULTORA_COLS.map(col => (
          <div key={col.id}
               onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('drop-target'); }}
               onDragLeave={e => e.currentTarget.classList.remove('drop-target')}
               onDrop={e => onDrop(col.id, e)}
               className="rounded-2xl bg-bg-2/60 border border-line p-3 flex flex-col min-h-[300px]">
            <div className="flex items-center justify-between px-1 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{col.label}</span>
                <span className="text-[11px] text-muted px-1.5 py-0.5 rounded-md bg-surface">{byCol[col.id].length}</span>
              </div>
            </div>
            <div className="space-y-2 flex-1">
              {byCol[col.id].map(card => (
                <KanbanCard key={card.id} card={card} team={state.team} onClick={() => setEditing(card)} />
              ))}
              {byCol[col.id].length === 0 && (
                <div className="text-[12px] text-muted/70 px-2 py-6 text-center">Vacío</div>
              )}
            </div>
          </div>
        ))}
      </div>

      <CardEditor
        open={creating || !!editing}
        card={editing}
        team={team}
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
  const dColor = deadlineColor(card.deadline, card.estado === 'done');
  const overdue = card.deadline && card.deadline < now() && card.estado !== 'done';
  const onDragStart = (e) => {
    e.dataTransfer.setData('text/plain', card.id);
    e.currentTarget.classList.add('dragging');
  };
  const onDragEnd = (e) => e.currentTarget.classList.remove('dragging');
  return (
    <div draggable onDragStart={onDragStart} onDragEnd={onDragEnd} onClick={onClick}
         className={`card-lift cursor-grab active:cursor-grabbing p-3 rounded-xl border bg-surface ${overdue ? 'border-bad/40' : 'border-line'}`}>
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="min-w-0">
          <div className="text-[13px] font-semibold truncate">{card.cliente}</div>
          <div className="text-[12px] text-ink-2 line-clamp-2">{card.descripcion}</div>
        </div>
        <PriorityBadge value={card.prioridad} />
      </div>
      <div className="flex items-center justify-between mt-2.5">
        <div className="flex items-center gap-1.5 min-w-0">
          {analista
            ? <Avatar user={analista} size={20} />
            : card.aCargo
              ? <span className="text-[11px] text-muted truncate" title={card.aCargo}>a/c {card.aCargo}</span>
              : <span className="text-[11px] text-muted">sin asignar</span>}
        </div>
        <div className={`flex items-center gap-1 text-[11px] ${dColor} shrink-0`}>
          <Icon name="clock" size={12} />
          <span>{fmtTimeLeft(card.deadline)}</span>
        </div>
      </div>
    </div>
  );
}

function CardEditor({ open, card, team, isAdmin, onClose, onSave, onDelete }) {
  const isNew = !card;
  const [form, setForm] = useState(card || { cliente: '', descripcion: '', analistaId: isAdmin ? '' : team[0]?.id || '', prioridad: 'media', deadline: now() + 2*DAY, estado: 'backlog' });
  useEffect(() => { if (open) setForm(card || { cliente: '', descripcion: '', analistaId: '', prioridad: 'media', deadline: now() + 2*DAY, estado: 'backlog' }); }, [open, card]);

  const setPreset = (h) => setForm(f => ({ ...f, deadline: now() + h*HOUR }));

  if (!open) return null;
  return (
    <Modal open={open} onClose={onClose} title={isNew ? 'Nuevo pedido' : 'Editar pedido'}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
        <Field label="Cliente">
          <input value={form.cliente} onChange={e => setForm({ ...form, cliente: e.target.value })} placeholder="Ej: Cohen" />
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
          <Field label="Deadline" hint="Atajos: 24h / 48h / 72h desde ahora">
            <div className="flex gap-2 items-center">
              <input type="datetime-local" value={toInputDateTime(form.deadline)} onChange={e => setForm({ ...form, deadline: fromInputDateTime(e.target.value) })} className="flex-1" />
              <Btn variant="soft" size="sm" onClick={() => setPreset(24)}>+24h</Btn>
              <Btn variant="soft" size="sm" onClick={() => setPreset(48)}>+48h</Btn>
              <Btn variant="soft" size="sm" onClick={() => setPreset(72)}>+72h</Btn>
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
                  return (
                    <button key={ev.id} onClick={() => onPick(ev)}
                      className="w-full text-left text-[11px] px-1.5 py-1 rounded-md truncate hover:opacity-90"
                      style={{ background: (a?.color || '#0048FF') + '22', color: '#fff', borderLeft: `3px solid ${a?.color || '#0048FF'}` }}
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
                return (
                  <button key={ev.id} onClick={() => onPick(ev)} className="w-full text-left p-2 rounded-lg border border-line hover:border-gold/40 bg-surface-2/60">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="w-2 h-2 rounded-full" style={{ background: a?.color || '#0048FF' }} />
                      <span className="text-[12px] font-medium truncate">{ev.cliente}</span>
                    </div>
                    <div className="text-[11px] text-muted line-clamp-2">{ev.descripcion}</div>
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
  const [period, setPeriod] = useState('semana'); // dia / semana / mes
  const cards = state.consultora.cards;
  const team = state.team.filter(u => u.units.includes('consultora'));

  const periodMs = { dia: DAY, semana: 7*DAY, mes: 30*DAY }[period];
  const since = now() - periodMs;

  const completed = cards.filter(c => c.completedAt && c.completedAt >= since);
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

  // Tarjetas completadas por día en el período (chart bars)
  const days = Math.min(30, Math.round(periodMs / DAY));
  const series = Array.from({length: days}, (_, i) => {
    const dEnd = startOfDay(now() - (days - 1 - i) * DAY) + DAY;
    const dStart = dEnd - DAY;
    const n = cards.filter(c => c.completedAt && c.completedAt >= dStart && c.completedAt < dEnd).length;
    return { label: new Date(dStart).toLocaleDateString('es-UY', { day:'2-digit', month:'2-digit' }), n };
  });
  const maxN = Math.max(1, ...series.map(s => s.n));

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Métricas de Consultora"
        subtitle="Indicadores de productividad del equipo en el período seleccionado."
        actions={<>
          <div className="flex items-center gap-1 bg-surface p-1 rounded-lg border border-line">
            {['dia','semana','mes'].map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs rounded-md capitalize ${period === p ? 'bg-gold text-white' : 'text-muted'}`}>
                {p === 'dia' ? 'Hoy' : p === 'semana' ? '7 días' : '30 días'}
              </button>
            ))}
          </div>
        </>}
      />

      <div className="px-6 pb-6 flex-1 overflow-y-auto space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Tarjetas completadas" value={totalCompleted} hint={`En los últimos ${period === 'dia' ? '24h' : period === 'semana' ? '7 días' : '30 días'}`} />
          <StatCard title="Tiempo promedio" value={`${avgHoursOverall}h`} hint="Desde creación hasta done" />
          <StatCard title="Activas en el tablero" value={cards.filter(c => c.estado !== 'done').length} hint="Backlog + In progress + Review" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Panel title="Tarjetas completadas por día">
            {series.every(s => s.n === 0) ? <EmptyState title="Sin completas en el período" hint="Mové tarjetas a Listo para ver datos acá." /> : (
              <div className="flex items-end gap-1 h-48 px-1">
                {series.map((s, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full bg-gold/70 rounded-t-md" style={{ height: `${(s.n/maxN)*100}%`, minHeight: s.n>0 ? 4 : 0 }} title={`${s.label}: ${s.n}`} />
                    <div className="text-[9px] text-muted -rotate-45 origin-top-left whitespace-nowrap h-4">{s.label}</div>
                  </div>
                ))}
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
      </div>
    </div>
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

function Panel({ title, children, action }) {
  return (
    <div className="bg-bg-2/60 border border-line rounded-2xl p-4">
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

  const paises = useMemo(() => Array.from(new Set(clients.map(c => c.pais).filter(Boolean))).sort(), [clients]);
  const servicios = useMemo(() => Array.from(new Set(clients.map(c => c.servicio).filter(Boolean))).sort(), [clients]);

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return clients.filter(c =>
      (!s || `${c.cliente} ${c.contacto || ''} ${c.pais || ''}`.toLowerCase().includes(s)) &&
      (!filterPais || c.pais === filterPais) &&
      (!filterServicio || c.servicio === filterServicio) &&
      (!filterSemaforo || clientScore(c).color === filterSemaforo)
    );
  }, [clients, search, filterPais, filterServicio, filterSemaforo]);

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
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar…" className="!pl-8 !py-1.5 !text-xs" style={{ width: 180 }} />
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
                        <td className="pr-2 text-ink-2 max-w-[200px]"><div className="line-clamp-1">{c.accion || '—'}</div></td>
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
          const norm = arr.map(c => ({ id: c.id || uid(), ...c }));
          dispatch({ type: 'CLIENT_BULK', clients: norm });
          setImporting(false);
        }}
      />
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

      <Field label="Acción sugerida / próxima">
        <textarea rows={2} value={form.accion || ''} onChange={e => setForm({ ...form, accion: e.target.value })} placeholder="Ej: Armar Demo de MaximUs / Renovar contrato / etc." />
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
  const sample = JSON.stringify([
    { nombre: 'Cliente X', plan: 'Pro', loginsMes: 12, ultimoUso: new Date().toISOString(), featuresActivas: 4, totalFeatures: 8, comentario: 'opcional' }
  ], null, 2);
  return (
    <Modal open={open} onClose={onClose} title="Importar métricas de clientes" width="max-w-2xl">
      <p className="text-sm text-muted mb-3">Pegá un array JSON con los clientes. Reemplaza el listado actual.</p>
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

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return state.maximus.prospects.filter(p => !s || `${p.empresa} ${p.contacto} ${p.producto}`.toLowerCase().includes(s));
  }, [state.maximus.prospects, search]);

  const byCol = useMemo(() => {
    const m = Object.fromEntries(PROSPECT_COLS.map(c => [c.id, []]));
    filtered.forEach(p => { (m[p.estado] || m.por_contactar).push(p); });
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
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar…" className="!pl-8 !py-2 !text-sm" style={{ width: 220 }} />
          </div>
          <Btn onClick={() => setCreating(true)}><Icon name="plus" size={16} />Nuevo prospect</Btn>
        </>}
      />
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3 px-6 pb-6 flex-1 overflow-y-auto">
        {PROSPECT_COLS.map(col => (
          <div key={col.id}
            onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('drop-target'); }}
            onDragLeave={e => e.currentTarget.classList.remove('drop-target')}
            onDrop={e => onDrop(col.id, e)}
            className="rounded-2xl bg-bg-2/60 border border-line p-3 flex flex-col min-h-[300px]">
            <div className="flex items-center justify-between px-1 mb-2">
              <span className="text-sm font-semibold">{col.label}</span>
              <span className="text-[11px] text-muted px-1.5 py-0.5 rounded-md bg-surface">{byCol[col.id].length}</span>
            </div>
            <div className="space-y-2 flex-1">
              {byCol[col.id].map(p => (
                <ProspectCard key={p.id} p={p} onClick={() => setEditing(p)} />
              ))}
              {byCol[col.id].length === 0 && <div className="text-[11px] text-muted/70 px-2 py-6 text-center">Vacío</div>}
            </div>
          </div>
        ))}
      </div>

      <ProspectEditor
        open={creating || !!editing}
        prospect={editing}
        clientNames={clientNames}
        onClose={() => { setEditing(null); setCreating(false); }}
        onSave={(p) => { if (p.id) dispatch({ type: 'PROS_UPDATE', p }); else dispatch({ type: 'PROS_ADD', p: { ...p, id: uid(), estado: p.estado || 'por_contactar' } }); setEditing(null); setCreating(false); }}
        onDelete={(id) => { dispatch({ type: 'PROS_DELETE', id }); setEditing(null); }}
      />
    </div>
  );
}

function ProspectCard({ p, onClick }) {
  const onDragStart = (e) => { e.dataTransfer.setData('text/plain', p.id); e.currentTarget.classList.add('dragging'); };
  const onDragEnd = (e) => e.currentTarget.classList.remove('dragging');
  return (
    <div draggable onDragStart={onDragStart} onDragEnd={onDragEnd} onClick={onClick}
         className="card-lift cursor-grab active:cursor-grabbing p-3 rounded-xl border border-line bg-surface">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[13px] font-semibold truncate">{p.empresa}</div>
          <div className="text-[11px] text-muted truncate">{p.contacto}</div>
        </div>
        {p.clienteCompartido && <Badge className="bg-gold/15 text-gold border-gold/30"><Icon name="link" size={10} />{p.clienteCompartido}</Badge>}
      </div>
      <div className="mt-2 text-[12px] text-ink-2 line-clamp-2">{p.producto}</div>
      {p.proxSeguimiento && (
        <div className="mt-2 flex items-center gap-1 text-[11px] text-muted"><Icon name="clock" size={11} />Próx: {fmtDate(p.proxSeguimiento)}</div>
      )}
    </div>
  );
}

function ProspectEditor({ open, prospect, clientNames, onClose, onSave, onDelete }) {
  const isNew = !prospect;
  const blank = { empresa:'', contacto:'', producto:'MaximUs Pro', notas:'', proxSeguimiento: now() + 3*DAY, estado:'por_contactar', clienteCompartido:'' };
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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 px-6 pb-6 flex-1 overflow-y-auto">
        {TASK_COLS.map(col => (
          <div key={col.id}
            onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('drop-target'); }}
            onDragLeave={e => e.currentTarget.classList.remove('drop-target')}
            onDrop={e => onDrop(col.id, e)}
            className="rounded-2xl bg-bg-2/60 border border-line p-3 flex flex-col min-h-[300px]">
            <div className="flex items-center justify-between px-1 mb-2">
              <span className="text-sm font-semibold">{col.label}</span>
              <span className="text-[11px] text-muted px-1.5 py-0.5 rounded-md bg-surface">{byCol[col.id].length}</span>
            </div>
            <div className="space-y-2 flex-1">
              {byCol[col.id].map(t => (
                <TaskCard key={t.id} t={t} team={team} onClick={() => setEditing(t)} />
              ))}
              {byCol[col.id].length === 0 && <div className="text-[11px] text-muted/70 px-2 py-6 text-center">Vacío</div>}
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
    <div className="px-6 py-5 border-b border-line flex flex-wrap items-center gap-3">
      <div className="flex-1 min-w-0">
        <h1 className="text-2xl font-bold leading-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2 flex-wrap">{actions}</div>
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
    case 'max/prospects':    view = <MaximusProspects />;   break;
    case 'max/tasks':        view = <MaximusTasks />;       break;
    default:                 view = <ConsultoraKanban />;
  }

  return (
    <AppCtx.Provider value={{ state, dispatch, me }}>
      <div className="h-full flex">
        <Sidebar route={route} setRoute={setRoute} me={me} counters={counters} synced={syncedRemote} onLogout={() => setSessionId(null)} />
        <main className="flex-1 min-w-0 flex flex-col">{view}</main>
      </div>
    </AppCtx.Provider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
