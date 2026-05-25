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

    /* Paginación manual: Supabase corta a 1000 por default.
       Range explícito en bloques de 1000 hasta agotar. */
    async function selectAll(table) {
      const PAGE = 1000;
      let from = 0, out = [];
      while (true) {
        const res = await sb.from(table).select('*').range(from, from + PAGE - 1);
        if (res.error) throw res.error;
        if (!res.data?.length) break;
        out = out.concat(res.data);
        if (res.data.length < PAGE) break;
        from += PAGE;
        if (from > 50000) break; // guardrail
      }
      return out;
    }

    async function fetchAll() {
      const [team, cards, clients, prospects, tasks, comments] = await Promise.all([
        selectAll('team'),
        selectAll('consultora_cards'),
        selectAll('maximus_clients'),
        selectAll('maximus_prospects'),
        selectAll('maximus_tasks'),
        selectAll('maximus_task_comments'),
      ]).then(arr => arr.map(data => ({ data, error: null })));
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

      // Fallback: si la columna asignado_a no existe en Supabase aún,
      // usar el override de localStorage para no perder las asignaciones.
      const localAsig = (() => {
        try { return JSON.parse(localStorage.getItem('plataforma-asignaciones-v1') || '{}'); }
        catch { return {}; }
      })();
      const clientsMapped = (clients.data || []).map(c => ({
        ...c,
        asignado_a: c.asignado_a !== undefined && c.asignado_a !== null
          ? c.asignado_a
          : (localAsig[c.id] || null),
      }));

      return {
        team: teamMapped,
        consultora: { cards: (cards.data || []).map(mapCard) },
        maximus: {
          clients: clientsMapped,
          prospects: (prospects.data || []).map(mapProspect),
          tasks: tasksMapped,
        }
      };
    }

    /* upsert / delete por tabla canónica */
    async function upsertCard(c)      { return sb.from('consultora_cards').upsert(mapCardOut(c)); }
    async function deleteCard(id)     { return sb.from('consultora_cards').delete().eq('id', id); }
    async function upsertClient(c)    {
      const { id, ...rest } = c;
      delete rest._cat;
      // Persistir asignación en localStorage SIEMPRE (fallback si la columna no existe)
      if (rest.asignado_a !== undefined) {
        try {
          const map = JSON.parse(localStorage.getItem('plataforma-asignaciones-v1') || '{}');
          if (rest.asignado_a) map[id] = rest.asignado_a;
          else delete map[id];
          localStorage.setItem('plataforma-asignaciones-v1', JSON.stringify(map));
        } catch {}
      }
      const res = await sb.from('maximus_clients').upsert({ id, ...rest });
      // Si falla por columna 'asignado_a' inexistente, reintentar sin ella
      if (res.error && /asignado_a/.test(res.error.message || '')) {
        const { asignado_a, ...without } = rest;
        return sb.from('maximus_clients').upsert({ id, ...without });
      }
      return res;
    }
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
