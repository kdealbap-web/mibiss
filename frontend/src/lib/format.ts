export function formatFolio(folio: string | null | undefined): string {
  if (!folio) return '—';
  return folio.toUpperCase();
}

export function formatNumber(n: number | null | undefined): string {
  if (n == null) return '0';
  return new Intl.NumberFormat('es-CO').format(n);
}

const RTF = new Intl.RelativeTimeFormat('es-CO', { numeric: 'auto' });

export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffSec = Math.round((then - now) / 1000);
  const abs = Math.abs(diffSec);
  if (abs < 60) return RTF.format(diffSec, 'second');
  if (abs < 3600) return RTF.format(Math.round(diffSec / 60), 'minute');
  if (abs < 86_400) return RTF.format(Math.round(diffSec / 3600), 'hour');
  if (abs < 30 * 86_400) return RTF.format(Math.round(diffSec / 86_400), 'day');
  if (abs < 365 * 86_400) return RTF.format(Math.round(diffSec / (30 * 86_400)), 'month');
  return RTF.format(Math.round(diffSec / (365 * 86_400)), 'year');
}

export function initials(nombre: string | null | undefined): string {
  if (!nombre) return '··';
  const parts = nombre.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '··';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

export function slugBarrio(nombre: string): string {
  return nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
