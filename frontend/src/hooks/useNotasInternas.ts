import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface NotaInterna {
  id: string;
  caso_id: string;
  autor_cms_id: string;
  texto: string;
  creado_en: string;
  autor_nombre: string;
}

interface RawNota {
  id: string;
  caso_id: string;
  autor_cms_id: string;
  texto: string;
  creado_en: string;
}

interface RawUsuario {
  id: string;
  nombre: string;
}

export function useNotasInternas(casoId: string | null) {
  return useQuery<NotaInterna[]>({
    queryKey: ['notas-internas', casoId],
    enabled: Boolean(casoId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('caso_notas_internas')
        .select('id, caso_id, autor_cms_id, texto, creado_en')
        .eq('caso_id', casoId!)
        .order('creado_en', { ascending: false });
      if (error) throw error;
      const rows = (data ?? []) as RawNota[];
      if (rows.length === 0) return [];
      const autorIds = Array.from(new Set(rows.map((r) => r.autor_cms_id)));
      const { data: usuarios } = await supabase
        .from('usuarios_cms')
        .select('id, nombre')
        .in('id', autorIds);
      const nombreById = new Map<string, string>();
      ((usuarios ?? []) as RawUsuario[]).forEach((u) => nombreById.set(u.id, u.nombre));
      return rows.map((r): NotaInterna => ({
        ...r,
        autor_nombre: nombreById.get(r.autor_cms_id) ?? 'Editor',
      }));
    },
    staleTime: 15_000,
  });
}

export function useAgregarNota() {
  const qc = useQueryClient();
  return useMutation<NotaInterna, Error, { caso_id: string; texto: string }>({
    mutationFn: async ({ caso_id, texto }) => {
      const { data: { user }, error: uErr } = await supabase.auth.getUser();
      if (uErr || !user) throw new Error('Sesión no válida.');
      const { data, error } = await supabase
        .from('caso_notas_internas')
        .insert({ caso_id, autor_cms_id: user.id, texto: texto.trim() })
        .select('id, caso_id, autor_cms_id, texto, creado_en')
        .single();
      if (error) throw error;
      return { ...(data as RawNota), autor_nombre: '' };
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['notas-internas', vars.caso_id] });
    },
  });
}

export function useEliminarNota() {
  const qc = useQueryClient();
  return useMutation<void, Error, { id: string; caso_id: string }>({
    mutationFn: async ({ id }) => {
      const { error } = await supabase.from('caso_notas_internas').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['notas-internas', vars.caso_id] });
    },
  });
}

export function useReabrirCaso() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (casoId) => {
      const { error } = await supabase.rpc('reabrir_caso', { p_caso_id: casoId });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['casos-admin'] });
      qc.invalidateQueries({ queryKey: ['caso'] });
      qc.invalidateQueries({ queryKey: ['caso-por-id'] });
      qc.invalidateQueries({ queryKey: ['actualizaciones'] });
    },
  });
}
