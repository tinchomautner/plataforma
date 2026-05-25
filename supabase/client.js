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

  function init() {
    try {
      const sb = window.supabase.createClient(cfg.url, cfg.anonKey, {
        realtime: { params: { eventsPerSecond: 5 } }
      });
      window.SUPA = buildAPI(sb);
      window.dispatchEvent(new CustomEvent('supa-ready'));
      console.log('[plataforma] Supabase conectado ✓');
    } catch (e) {
      console.error('[plataforma] Supabase init failed:', e);
      window.SUPA = { enabled: false };
    }
  }

  let initialized = false;
  function tryInit() {
    if (initialized) return;
    if (window.supabase) { initialized = true; init(); }
  }

  // CDNs en orden de preferencia (si uno falla, prueba el siguiente)
  const CDNS = [
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js',
    'https://unpkg.com/@supabase/supabase-js@2/dist/umd/supabase.min.js',
    'https://cdn.skypack.dev/@supabase/supabase-js@2',
  ];

  function tryLoadCDN(idx) {
    if (idx >= CDNS.length) {
      console.error('[plataforma] Todos los CDN de supabase-js fallaron');
      if (!initialized) window.SUPA = { enabled: false };
      return;
    }
    const s = document.createElement('script');
    s.src = CDNS[idx];
    s.onload = () => { console.log('[plataforma] supabase-js cargado de', CDNS[idx]); tryInit(); };
    s.onerror = () => { console.warn('[plataforma] CDN falló:', CDNS[idx]); tryLoadCDN(idx + 1); };
    document.head.appendChild(s);
  }

  if (window.supabase) {
    tryInit();
  } else {
    tryLoadCDN(0);
    // Polling fallback (onload a veces no dispara)
    let polls = 0;
    const iv = setInterval(() => {
      polls++;
      if (window.supabase) { clearInterval(iv); tryInit(); }
      else if (polls > 75) { // 15 segundos
        clearInterval(iv);
        if (!initialized) {
          console.error('[plataforma] Timeout esperando supabase-js');
          window.SUPA = { enabled: false };
        }
      }
    }, 200);
  }

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
    /* Migración legacy → nuevos estados del Jira */
    const LEGACY_TO_NEW = {
      por_contactar: 'a_contactar',
      contactado:    'volver_a_contactar',
      negociacion:   'reunion_agendada',
      propuesta:     'reunion_agendada',
      ganado:        'cliente',
      perdido:       'no_les_interesa',
    };
    const mapProspect = (r) => ({
      id: r.id, empresa: r.empresa, contacto: r.contacto, producto: r.producto,
      pais: r.pais || '',
      notas: r.notas, proxSeguimiento: r.prox_seguimiento ? new Date(r.prox_seguimiento).getTime() : null,
      estado: LEGACY_TO_NEW[r.estado] || r.estado, clienteCompartido: r.cliente_compartido || '',
      asignado_a: r.asignado_a || null,
      jiraKey: r.jira_key || '',
      jiraEstado: r.jira_estado || '',
      nota_plan: r.nota_plan || '',
    });
    const mapProspectOut = (p) => ({
      id: p.id, empresa: p.empresa, contacto: p.contacto, producto: p.producto,
      pais: p.pais || null,
      notas: p.notas ?? '', prox_seguimiento: p.proxSeguimiento ? new Date(p.proxSeguimiento).toISOString() : null,
      estado: p.estado, cliente_compartido: p.clienteCompartido || null,
      asignado_a: p.asignado_a || null,
      jira_key: p.jiraKey || null,
      jira_estado: p.jiraEstado || null,
      nota_plan: p.nota_plan || null,
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

    /* Migra asignaciones del localStorage a Supabase si la columna
       asignado_a ya existe. Se ejecuta una vez por sesión. */
    let _migrated = false;
    async function migrateLocalAsignaciones() {
      if (_migrated) return;
      _migrated = true;
      let localAsig;
      try { localAsig = JSON.parse(localStorage.getItem('plataforma-asignaciones-v1') || '{}'); }
      catch { return; }
      if (!localAsig || Object.keys(localAsig).length === 0) return;
      // Probe: verificar si la columna asignado_a existe en la tabla
      const probe = await sb.from('maximus_clients').select('id, asignado_a').limit(1);
      if (probe.error) return; // error inesperado
      // Si la columna no existe, Supabase devuelve error PGRST204 o la key viene undefined
      const colExists = probe.data?.[0] && 'asignado_a' in probe.data[0];
      if (!colExists) return;
      // Migrar cada asignación
      const entries = Object.entries(localAsig);
      let ok = 0;
      for (const [clientId, userId] of entries) {
        const r = await sb.from('maximus_clients').update({ asignado_a: userId }).eq('id', clientId);
        if (!r.error) ok++;
      }
      if (ok === entries.length) {
        try { localStorage.removeItem('plataforma-asignaciones-v1'); } catch {}
        console.log(`[plataforma] ${ok} asignaciones migradas a Supabase y localStorage limpiado`);
      } else {
        console.warn(`[plataforma] Migradas ${ok}/${entries.length} asignaciones — localStorage queda como fallback`);
      }
    }

    async function fetchAll() {
      // Intentar migrar asignaciones locales antes de hidratar
      migrateLocalAsignaciones().catch(() => {});

      const [team, cards, clients, prospects, tasks, comments, analisis, envios] = await Promise.all([
        selectAll('team'),
        selectAll('consultora_cards'),
        selectAll('maximus_clients'),
        selectAll('maximus_prospects'),
        selectAll('maximus_tasks'),
        selectAll('maximus_task_comments'),
        selectAll('analisis').catch(() => []),
        selectAll('envios_whatsapp').catch(() => []),
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

      // Fallback asignaciones de prospects
      const localAsigProspects = (() => {
        try { return JSON.parse(localStorage.getItem('plataforma-asig-prospects-v1') || '{}'); }
        catch { return {}; }
      })();
      const prospectsMapped = (prospects.data || []).map(r => {
        const p = mapProspect(r);
        if (!p.asignado_a && localAsigProspects[p.id]) p.asignado_a = localAsigProspects[p.id];
        return p;
      });

      return {
        team: teamMapped,
        consultora: { cards: (cards.data || []).map(mapCard) },
        maximus: {
          clients: clientsMapped,
          prospects: prospectsMapped,
          tasks: tasksMapped,
          analisis: (analisis.data || []).map(a => ({
            id: a.id, ticker: a.ticker, titulo: a.titulo, pdfUrl: a.pdf_url, nota: a.nota || '',
            uploadedBy: a.uploaded_by, uploadedAt: a.uploaded_at ? new Date(a.uploaded_at).getTime() : null,
          })).sort((x,y) => (y.uploadedAt||0) - (x.uploadedAt||0)),
          envios: (envios.data || []).map(e => ({
            id: e.id, analisisId: e.analisis_id, clienteId: e.cliente_id,
            contacto: e.contacto, telefono: e.telefono, mensaje: e.mensaje,
            enviadoBy: e.enviado_by, enviadoAt: e.enviado_at ? new Date(e.enviado_at).getTime() : null,
          })),
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
      if (res.error && /asignado_a|nota_plan|fecha_renovacion|telefono|activos/.test(res.error.message || '')) {
        const { asignado_a, nota_plan, fecha_renovacion, telefono, activos, ...without } = rest;
        return sb.from('maximus_clients').upsert({ id, ...without });
      }
      return res;
    }
    async function deleteClient(id)   { return sb.from('maximus_clients').delete().eq('id', id); }
    async function upsertProspect(p)  {
      const out = mapProspectOut(p);
      // Persistir asignación en localStorage SIEMPRE como fallback
      if (out.asignado_a !== undefined) {
        try {
          const map = JSON.parse(localStorage.getItem('plataforma-asig-prospects-v1') || '{}');
          if (out.asignado_a) map[out.id] = out.asignado_a;
          else delete map[out.id];
          localStorage.setItem('plataforma-asig-prospects-v1', JSON.stringify(map));
        } catch {}
      }
      const res = await sb.from('maximus_prospects').upsert(out);
      // Si falla por columnas nuevas, reintentar sin ellas
      if (res.error && /asignado_a|jira_|pais|nota_plan/.test(res.error.message || '')) {
        const { asignado_a, jira_key, jira_estado, pais, nota_plan, ...without } = out;
        return sb.from('maximus_prospects').upsert(without);
      }
      return res;
    }
    async function deleteProspect(id) { return sb.from('maximus_prospects').delete().eq('id', id); }
    async function upsertTask(t)      { return sb.from('maximus_tasks').upsert(mapTaskOut(t)); }
    async function deleteTask(id)     { return sb.from('maximus_tasks').delete().eq('id', id); }
    async function addComment(taskId, c) { return sb.from('maximus_task_comments').insert(mapCmtOut(c, taskId)); }

    async function upsertAnalisis(a) {
      return sb.from('analisis').upsert({
        id: a.id, ticker: a.ticker, titulo: a.titulo, pdf_url: a.pdfUrl,
        nota: a.nota || '', uploaded_by: a.uploadedBy || null,
        uploaded_at: a.uploadedAt ? new Date(a.uploadedAt).toISOString() : new Date().toISOString(),
      });
    }
    async function deleteAnalisis(id) { return sb.from('analisis').delete().eq('id', id); }
    async function addEnvio(e) {
      return sb.from('envios_whatsapp').insert({
        id: e.id, analisis_id: e.analisisId, cliente_id: e.clienteId,
        contacto: e.contacto, telefono: e.telefono, mensaje: e.mensaje,
        enviado_by: e.enviadoBy || null,
        enviado_at: new Date().toISOString(),
      });
    }

    function subscribe(onChange) {
      const ch = sb.channel('plataforma-sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'consultora_cards'     }, () => onChange())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'maximus_clients'      }, () => onChange())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'maximus_prospects'    }, () => onChange())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'maximus_tasks'        }, () => onChange())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'maximus_task_comments'}, () => onChange())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'team'                 }, () => onChange())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'analisis'             }, () => onChange())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'envios_whatsapp'      }, () => onChange())
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
      upsertAnalisis, deleteAnalisis, addEnvio,
    };
  }
})();
