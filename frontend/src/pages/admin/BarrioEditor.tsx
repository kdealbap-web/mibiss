import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import { Save, Trash2, ArrowLeft, Check, AlertTriangle } from 'lucide-react';

import { AdminLayout } from '../../components/layout/AdminLayout';
import { AdminTopbar } from '../../components/layout/AdminTopbar';
import { BarrioMapPicker } from '../../components/admin/BarrioMapPicker';
import { Select } from '../../components/ui';
import { useBarrios } from '../../hooks/useBarrios';
import { useZonas } from '../../hooks/useZonas';
import { useCasosPublicos } from '../../hooks/useCasos';
import { useCreateBarrio, useUpdateBarrio, useDeleteBarrio } from '../../hooks/useBarriosCrud';
import { SOLEDAD_BOUNDS } from '../../lib/config';
import type { Barrio } from '../../types/biss';

const SLUG_RE = /^[a-z0-9-]+$/;

const schema = z.object({
  nombre: z.string().min(2, 'Nombre mínimo 2 caracteres'),
  slug: z.string().regex(SLUG_RE, 'Solo minúsculas, números y guiones'),
  zona_id: z.number().int().positive('Selecciona una zona'),
  coord_lat: z.number().min(SOLEDAD_BOUNDS.lat[0]).max(SOLEDAD_BOUNDS.lat[1]).nullable(),
  coord_lng: z.number().min(SOLEDAD_BOUNDS.lng[0]).max(SOLEDAD_BOUNDS.lng[1]).nullable(),
  codigo_oficial: z.string().nullable(),
});

type FormData = z.infer<typeof schema>;

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function BarrioEditor() {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug?: string }>();
  const isNew = !slug;

  const { data: barrios = [] } = useBarrios();
  const { data: zonas = [] } = useZonas();
  const { data: casos = [] } = useCasosPublicos();
  const createMut = useCreateBarrio();
  const updateMut = useUpdateBarrio();
  const deleteMut = useDeleteBarrio();

  const existing: Barrio | undefined = useMemo(
    () => (slug ? barrios.find((b) => b.slug === slug) : undefined),
    [barrios, slug],
  );

  const [form, setForm] = useState<FormData>({
    nombre: '',
    slug: '',
    zona_id: 0,
    coord_lat: null,
    coord_lng: null,
    codigo_oficial: null,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [slugDirty, setSlugDirty] = useState(false);
  const [submitErr, setSubmitErr] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState('');

  useEffect(() => {
    if (existing) {
      setForm({
        nombre: existing.nombre,
        slug: existing.slug,
        zona_id: existing.zona_id,
        coord_lat: existing.coord_lat,
        coord_lng: existing.coord_lng,
        codigo_oficial: existing.codigo_oficial,
      });
      setSlugDirty(true);
    }
  }, [existing]);

  useEffect(() => {
    if (!slugDirty && form.nombre) {
      setForm((f) => ({ ...f, slug: slugify(f.nombre) }));
    }
  }, [form.nombre, slugDirty]);

  const casosCount = useMemo(
    () => (existing ? casos.filter((c) => c.barrio_id === existing.id).length : 0),
    [existing, casos],
  );

  const neighbors = useMemo(
    () =>
      barrios
        .filter((b) => b.id !== existing?.id && b.coord_lat != null && b.coord_lng != null)
        .map((b) => ({ nombre: b.nombre, lat: b.coord_lat as number, lng: b.coord_lng as number })),
    [barrios, existing],
  );

  const validateAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitErr(null);
    const result = schema.safeParse(form);
    if (!result.success) {
      const next: Partial<Record<keyof FormData, string>> = {};
      result.error.errors.forEach((er) => {
        next[er.path[0] as keyof FormData] = er.message;
      });
      setErrors(next);
      return;
    }
    setErrors({});
    try {
      if (isNew) {
        const created = await createMut.mutateAsync(result.data);
        navigate(`/admin/barrios/${created.slug}/editar`, { replace: true });
      } else if (existing) {
        await updateMut.mutateAsync({ id: existing.id, patch: result.data });
      }
    } catch (err: unknown) {
      const msg = String((err as { message?: string })?.message ?? err);
      if (/duplicate key/i.test(msg) && /slug/i.test(msg)) {
        setSubmitErr('Ese slug ya está en uso.');
      } else if (/row-level|policy/i.test(msg)) {
        setSubmitErr('No tienes permiso para guardar este barrio.');
      } else {
        setSubmitErr('No pudimos guardar. Vuelve a intentarlo.');
      }
    }
  };

  const eliminar = async () => {
    if (!existing) return;
    if (deleteConfirm !== 'ELIMINAR') return;
    try {
      await deleteMut.mutateAsync(existing.id);
      navigate('/admin/barrios', { replace: true });
    } catch (err: unknown) {
      const msg = String((err as { message?: string })?.message ?? err);
      if (/foreign key|violates/i.test(msg)) {
        setSubmitErr('No se puede eliminar: el barrio tiene casos/capítulos asociados. Archívalo en su lugar (pendiente).');
      } else {
        setSubmitErr('No pudimos eliminar. Vuelve a intentarlo.');
      }
    }
  };

  const saving = createMut.isPending || updateMut.isPending;

  return (
    <AdminLayout>
      <AdminTopbar
        crumbs={
          <>
            <Link to="/admin">Contenido</Link> /{' '}
            <Link to="/admin/barrios">Barrios</Link> /{' '}
            <span style={{ color: 'var(--ink-strong)', fontWeight: 600 }}>
              {isNew ? 'Nuevo' : existing?.nombre ?? '…'}
            </span>
          </>
        }
        title={isNew ? 'Nuevo barrio' : `Editar · ${existing?.nombre ?? ''}`}
        actions={
          <Link to="/admin/barrios" className="btn btn-ghost btn-sm">
            <ArrowLeft />Volver a la lista
          </Link>
        }
      />

      <div className="admin-page" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 360px', gap: 24, alignItems: 'start' }}>
        <form className="admin-card" onSubmit={validateAndSubmit}>
          <h2>Datos del barrio</h2>
          <div className="card-sub" style={{ marginBottom: 16 }}>
            Lo que cambies aquí afecta el mapa público y los capítulos asociados.
          </div>

          <div style={{ display: 'grid', gap: 14 }}>
            <div className="mini-field">
              <label htmlFor="b-nombre">Nombre</label>
              <input
                id="b-nombre"
                type="text"
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                aria-invalid={!!errors.nombre}
              />
              {errors.nombre && <span className="hint" style={{ color: 'var(--state-critical)' }}>{errors.nombre}</span>}
            </div>

            <div className="mini-field">
              <label htmlFor="b-slug">Slug</label>
              <input
                id="b-slug"
                type="text"
                value={form.slug}
                onChange={(e) => {
                  setSlugDirty(true);
                  setForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }));
                }}
                aria-invalid={!!errors.slug}
                className="mono"
              />
              <span className="hint">Auto-generado del nombre · usado en URLs públicas.</span>
              {errors.slug && <span className="hint" style={{ color: 'var(--state-critical)' }}>{errors.slug}</span>}
            </div>

            <div className="mini-field">
              <label htmlFor="b-zona">Zona</label>
              <Select
                id="b-zona"
                value={form.zona_id || ''}
                onChange={(e) => setForm((f) => ({ ...f, zona_id: Number(e.target.value) }))}
                aria-invalid={!!errors.zona_id}
                placeholder="Elige zona"
                options={zonas.map((z) => ({ value: z.id, label: z.nombre }))}
              />
              {errors.zona_id && <span className="hint" style={{ color: 'var(--state-critical)' }}>{errors.zona_id}</span>}
            </div>

            <div className="row row-2" style={{ gap: 10 }}>
              <div className="mini-field grow">
                <label htmlFor="b-lat">Latitud</label>
                <input
                  id="b-lat"
                  type="number"
                  step="0.00001"
                  min={SOLEDAD_BOUNDS.lat[0]}
                  max={SOLEDAD_BOUNDS.lat[1]}
                  value={form.coord_lat ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, coord_lat: e.target.value === '' ? null : Number(e.target.value) }))
                  }
                  aria-invalid={!!errors.coord_lat}
                  className="mono"
                />
                {errors.coord_lat && <span className="hint" style={{ color: 'var(--state-critical)' }}>{errors.coord_lat}</span>}
              </div>
              <div className="mini-field grow">
                <label htmlFor="b-lng">Longitud</label>
                <input
                  id="b-lng"
                  type="number"
                  step="0.00001"
                  min={SOLEDAD_BOUNDS.lng[0]}
                  max={SOLEDAD_BOUNDS.lng[1]}
                  value={form.coord_lng ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, coord_lng: e.target.value === '' ? null : Number(e.target.value) }))
                  }
                  aria-invalid={!!errors.coord_lng}
                  className="mono"
                />
                {errors.coord_lng && <span className="hint" style={{ color: 'var(--state-critical)' }}>{errors.coord_lng}</span>}
              </div>
            </div>

            <div className="mini-field">
              <label htmlFor="b-codigo">Código oficial (DANE / propio)</label>
              <input
                id="b-codigo"
                type="text"
                value={form.codigo_oficial ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, codigo_oficial: e.target.value || null }))}
                placeholder="Opcional"
                className="mono"
              />
            </div>

            {submitErr && (
              <div className="alert alert-critical" style={{ padding: '10px 12px' }} role="alert">
                <AlertTriangle className="alert-icon" style={{ width: 16, height: 16 }} />
                <div className="alert-body">
                  <div className="alert-text" style={{ fontSize: 12 }}>{submitErr}</div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Guardando…' : isNew ? 'Crear barrio' : 'Guardar cambios'}
                <Save size={16} />
              </button>
            </div>
          </div>

          {existing && (
            <div
              className="admin-card"
              style={{
                marginTop: 24,
                background: 'var(--state-critical-bg)',
                borderColor: 'var(--state-critical-border)',
              }}
            >
              <h2 style={{ color: '#991B1B' }}>Zona peligrosa</h2>
              <p style={{ fontSize: 13, color: '#991B1B', lineHeight: 1.5, marginBottom: 12 }}>
                Eliminar es definitivo. Este barrio tiene <strong>{casosCount}</strong> caso{casosCount === 1 ? '' : 's'} público{casosCount === 1 ? '' : 's'}.
                {casosCount > 0 && ' Considera archivarlo en su lugar (feature pendiente).'}
              </p>
              <div className="mini-field">
                <label htmlFor="b-confirm">Escribe ELIMINAR para confirmar</label>
                <input
                  id="b-confirm"
                  type="text"
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder="ELIMINAR"
                />
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ marginTop: 10, color: 'var(--state-critical)', borderColor: 'var(--state-critical)' }}
                disabled={deleteConfirm !== 'ELIMINAR' || deleteMut.isPending}
                onClick={eliminar}
              >
                <Trash2 size={14} />
                {deleteMut.isPending ? 'Eliminando…' : 'Eliminar definitivamente'}
              </button>
            </div>
          )}
        </form>

        <div className="admin-card" style={{ position: 'sticky', top: 80 }}>
          <h3 style={{ marginBottom: 4 }}>Ubicación en el mapa</h3>
          <div className="card-sub" style={{ marginBottom: 12 }}>
            Arrastra el pin o toca el mapa. Usa la búsqueda para localizar por nombre.
          </div>
          <BarrioMapPicker
            lat={form.coord_lat}
            lng={form.coord_lng}
            nombre={form.nombre}
            neighbors={neighbors}
            onChange={(lat, lng) => setForm((f) => ({ ...f, coord_lat: lat, coord_lng: lng }))}
          />
          {form.coord_lat != null && form.coord_lng != null && (
            <div className="row row-2" style={{ marginTop: 10 }}>
              <Check size={14} style={{ color: 'var(--state-resolved)' }} />
              <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                Coordenadas listas — guarda para aplicar al mapa público.
              </span>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
