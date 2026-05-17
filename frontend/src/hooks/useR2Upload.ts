import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';

interface PresignResponse {
  upload_url: string;
  public_url: string;
  expires_in: number;
  headers: Record<string, string>;
}

export type R2Bucket =
  | 'casos-fotos'
  | 'casos-videos'
  | 'casos-pdfs'
  | 'barrios-portadas'
  | 'solicitudes-multimedia'
  | 'padrinos-logos';

export interface UploadResult {
  url: string;
  filename: string;
  bytes: number;
  contentType: string;
}

const BYTE_CAPS: Record<R2Bucket, number> = {
  'casos-fotos': 5 * 1024 * 1024,
  'casos-videos': 30 * 1024 * 1024,
  'casos-pdfs': 10 * 1024 * 1024,
  'barrios-portadas': 5 * 1024 * 1024,
  'solicitudes-multimedia': 5 * 1024 * 1024,
  'padrinos-logos': 2 * 1024 * 1024,
};

async function presignAndPut(file: File, bucket: R2Bucket): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error('Necesitas iniciar sesión antes de subir archivos.');

  const cap = BYTE_CAPS[bucket];
  if (file.size > cap) {
    throw new Error(
      `Archivo "${file.name}" pesa más de ${Math.round(cap / 1024 / 1024)} MB.`,
    );
  }

  const { data, error } = await supabase.functions.invoke<PresignResponse>('r2-presign', {
    body: {
      bucket,
      filename: file.name,
      contentType: file.type || 'application/octet-stream',
      bytes: file.size,
    },
  });

  if (error || !data) {
    throw new Error('No pudimos firmar la subida. Vuelve a intentarlo.');
  }

  const res = await fetch(data.upload_url, {
    method: 'PUT',
    headers: data.headers,
    body: file,
  });
  if (!res.ok) {
    throw new Error(`R2 rechazó la subida (HTTP ${res.status}).`);
  }

  return data.public_url;
}

export function useR2Upload(bucket: R2Bucket) {
  const [progress, setProgress] = useState<{ done: number; total: number }>({ done: 0, total: 0 });
  const [uploading, setUploading] = useState(false);

  const upload = useCallback(
    async (files: File[]): Promise<UploadResult[]> => {
      if (files.length === 0) return [];
      setUploading(true);
      setProgress({ done: 0, total: files.length });
      const results: UploadResult[] = [];
      try {
        for (const file of files) {
          const url = await presignAndPut(file, bucket);
          results.push({
            url,
            filename: file.name,
            bytes: file.size,
            contentType: file.type,
          });
          setProgress((p) => ({ done: p.done + 1, total: p.total }));
        }
        return results;
      } finally {
        setUploading(false);
      }
    },
    [bucket],
  );

  return { upload, uploading, progress };
}
