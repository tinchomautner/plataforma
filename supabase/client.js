/* =====================================================================
   Supabase client + sync layer
   Se activa solo si window.SUPABASE_CFG = { url, anonKey } está seteado
   en index.html ANTES de cargar este archivo.
   =====================================================================
   La app sigue funcionando con localStorage si no hay config.
   Cuando hay config, este módulo expone:
     window.SUPA = {
       enabled: true,
       fetchAll(): Promise<state>,
       upsert(table, row): Promise,
       remove(table, id): Promise,
       subscribe(onChange): unsubscribe,
     }
   El app.jsx detecta window.SUPA?.enabled y usa Supabase en vez de
   localStorage para persistir + sincronizar.
   ===================================================================== */
(function () {
  const cfg = window.SUPABASE_CFG;
  if (!cfg || !cfg.url || !cfg.anonKey) {
    window.SUPA = { enabled: false };
    return;
  }

  // Carga lazy de supabase-js
  const s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
  s.onload = () => {
    const sb = window.supabase.createClient(cfg.url, cfg.anonKey, {
      realtime: { params: { eventsPerSecond: 5 } }
    });
    window.SUPA = buildAPI(sb);
    window.dispatchEvent(new CustomEvent('supa-ready'));
  };
  document.head.appendChild(s);

  /* === API === */
  function buildAPI(sb) {
    /* Mappers: server row → client object (camelCase para id refs en consultora_cards) */
    const mapCard = (r) => ({
      id: r.id, cliente: r.cliente, descripcion: r.descripcion, analistaId: r.analista_id,
      aCargo: r.a_cargo || '', comentariosTexto: r.comentarios || '',
      prioridad: r.prioridad, deadline: r.deadline ? new Date(r.deadline).getTime() : null,
      estado: r.estado, createdAt: r.created_at ? new Date(r.created_at).getTime() : null,
      completedAt: r.completed_at ? new Date(r.completed_at).getTime() : null,
    });
    const mapCardOut = (c) => ({
      id: c.id, cliente: c.cliente, descripcion: c.descripcion ?? '', analista_id: c.analistaId || null,
      a_cargo: c.aCargo || '', comentarios: c.comentariosTexto || '',
      prioridad: c.prioridad, deadline: c.deadline ? new Date(c.deadline).toISOString() : null,
      estado: c.estado, created_at: c.createdAt ? new Date(c.createdAt).toISOString() : new Date().toISOString(),
      completed_at: c.completedAt ? new Date(c.completedAt).toISOString() : null,
    });
    const mapProspect = (r) => ({
      id: r.id, empresa: r.empresa, contacto: r.contacto, producto: r.producto,
      notas: r.notas, proxSeguimiento: r.prox_seguimiento ? new Date(r.prox_seguimiento).getTime() : null,
      estado: r.estado, clienteCompartido: r.cliente_compartido || '',
    });
    const mapProspectOut = (p) => ({
      id: p.id, empresa: p.empresa, contacto: p.contacto, producto: p.producto,
      notas: p.notas ?? '', prox_seguimiento: p.proxSeguimiento ? new Date(p.proxSeguimiento).toISOString() : null,
      estado: p.estado, cliente_compartido: p.clienteCompartido || null,
    });
    const mapTask = (r) => ({
      id: r.id, titulo: r.titulo, descripcion: r.descripcion, asignados: r.asignados || [],
      prioridad: r.prioridad, deadline: r.deadline ? new Date(r.deadline).getTime() : null,
      estado: r.estado, comentarios: [],
    });
    const mapTaskOut = (t) => ({
      id: t.id, titulo: t.titulo, descripcion: t.descripcion ?? '',
      asignados: t.asignados || [], prioridad: t.prioridad,
      deadline: t.deadline ? new Date(t.deadline).toISOString() : null,
      estado: t.estado,
    });
    const mapCmt = (r) => ({ id: r.id, autorId: r.autor_id, ts: new Date(r.ts).getTime(), texto: r.texto });
    const mapCmtOut = (c, taskId) => ({ id: c.id, task_id: taskId, autor_id: c.autorId, ts: new Date(c.ts).toISOString(), texto: c.texto });

    async function fetchAll() {
      const [team, cards, clients, prospects, tasks, comments] = await Promise.all([
        sb.from('team').select('*'),
        sb.from('consultora_cards').select('*'),
        sb.from('maximus_clients').select('*'),
        sb.from('maximus_prospects').select('*'),
        sb.from('maximus_tasks').select('*'),
        sb.from('maximus_task_comments').select('*'),
      ]);
      const err = [team, cards, clients, prospects, tasks, comments].find(r => r.error);
      if (err) throw err.error;

      const tasksMapped = (tasks.data || []).map(mapTask);
      const byTask = {};
      (comments.data || []).forEach(c => { (byTask[c.task_id] = byTask[c.task_id] || []).push(mapCmt(c)); });
      tasksMapped.forEach(t => { t.comentarios = (byTask[t.id] || []).sort((a,b) => a.ts - b.ts); });

      // Map team: non_assignable (DB) → nonAssignable (cliente)
      // Fallback hardcoded en caso de que la columna no exista todavía
      const NON_ASSIGNABLE_DEFAULT = ['u-mm','u-sh','u-vr','u-fd','u-pl'];
      const teamMapped = (team.data || []).map(t => ({
        ...t,
        nonAssignable: t.non_assignable != null ? !!t.non_assignable : NON_ASSIGNABLE_DEFAULT.includes(t.id),
      }));

      return {
        team: teamMapped,
        consultora: { cards: (cards.data || []).map(mapCard) },
        maximus: {
          clients: clients.data || [],
          prospects: (prospects.data || []).map(mapProspect),
          tasks: tasksMapped,
        }
      };
    }

    /* upsert / delete por tabla canónica */
    async function upsertCard(c)      { return sb.from('consultora_cards').upsert(mapCardOut(c)); }
    async function deleteCard(id)     { return sb.from('consultora_cards').delete().eq('id', id); }
    async function upsertClient(c)    { const { id, ...rest } = c; return sb.from('maximus_clients').upsert({ id, ...rest }); }
    async function deleteClient(id)   { return sb.from('maximus_clients').delete().eq('id', id); }
    async function upsertProspect(p)  { return sb.from('maximus_prospects').upsert(mapProspectOut(p)); }
    async function deleteProspect(id) { return sb.from('maximus_prospects').delete().eq('id', id); }
    async function upsertTask(t)      { return sb.from('maximus_tasks').upsert(mapTaskOut(t)); }
    async function deleteTask(id)     { return sb.from('maximus_tasks').delete().eq('id', id); }
    async function addComment(taskId, c) { return sb.from('maximus_task_comments').insert(mapCmtOut(c, taskId)); }

    function subscribe(onChange) {
      const ch = sb.channel('plataforma-sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'consultora_cards'     }, () => onChange())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'maximus_clients'      }, () => onChange())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'maximus_prospects'    }, () => onChange())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'maximus_tasks'        }, () => onChange())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'maximus_task_comments'}, () => onChange())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'team'                 }, () => onChange())
        .subscribe();
      return () => sb.removeChannel(ch);
    }

    return {
      enabled: true,
      fetchAll, subscribe,
      upsertCard, deleteCard,
      upsertClient, deleteClient,
      upsertProspect, deleteProspect,
      upsertTask, deleteTask, addComment,
    };
  }
})();
