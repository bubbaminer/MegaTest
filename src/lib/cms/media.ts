import { AppError } from '@/lib/errors/app-error';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const allowedTypes = new Map([
  ['image/jpeg', 'jpg'], ['image/png', 'png'], ['image/webp', 'webp'],
  ['image/gif', 'gif'], ['image/avif', 'avif'],
]);
const maxImageSize = 10 * 1024 * 1024;

export interface MediaAsset {
  id: string;
  filename: string;
  url: string;
  alt: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}

export function validateImageUploadMetadata(mimeType: string, size: number): string {
  const extension = allowedTypes.get(mimeType);
  if (!extension) throw new AppError('BAD_REQUEST', 'Unsupported image type');
  if (!Number.isFinite(size) || size <= 0 || size > maxImageSize) throw new AppError('BAD_REQUEST', 'Image must be between 1 byte and 10 MB');
  return extension;
}

export async function listMediaAssets(accessToken: string): Promise<MediaAsset[]> {
  const supabase = createServerSupabaseClient(accessToken);
  const { data, error } = await supabase.from('media_assets')
    .select('id,filename,storage_bucket,storage_path,alt,mime_type,size_bytes,created_at')
    .is('deleted_at', null).order('created_at', { ascending: false });
  if (error) throw new AppError('INTERNAL_ERROR', 'Unable to load media library', { code: error.code });
  return (data ?? []).map((row) => ({
    id: row.id,
    filename: row.filename,
    url: supabase.storage.from(row.storage_bucket).getPublicUrl(row.storage_path).data.publicUrl,
    alt: row.alt ?? '',
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    createdAt: row.created_at,
  }));
}

export async function uploadMediaAsset(accessToken: string, actorId: string, file: File, alt: string): Promise<string> {
  const extension = validateImageUploadMetadata(file.type, file.size);
  const supabase = createServerSupabaseClient(accessToken);
  const path = `${new Date().getUTCFullYear()}/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage.from('media').upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) throw new AppError('INTERNAL_ERROR', 'Unable to upload image', { message: uploadError.message });

  const { data, error: metadataError } = await supabase.from('media_assets').insert({
    storage_bucket: 'media', storage_path: path, filename: file.name, alt: alt.trim() || null,
    mime_type: file.type, size_bytes: file.size, created_by: actorId,
  }).select('id').single();
  if (metadataError) {
    await supabase.storage.from('media').remove([path]);
    throw new AppError('INTERNAL_ERROR', 'Unable to save media metadata', { code: metadataError.code });
  }
  return data.id;
}

export async function updateMediaAlt(accessToken: string, id: string, alt: string): Promise<void> {
  const { error } = await createServerSupabaseClient(accessToken).from('media_assets').update({ alt: alt.trim() || null }).eq('id', id).is('deleted_at', null);
  if (error) throw new AppError('INTERNAL_ERROR', 'Unable to update media metadata', { code: error.code });
}

export async function archiveMediaAsset(accessToken: string, id: string): Promise<void> {
  const { error } = await createServerSupabaseClient(accessToken).from('media_assets').update({ deleted_at: new Date().toISOString() }).eq('id', id).is('deleted_at', null);
  if (error) throw new AppError('INTERNAL_ERROR', 'Unable to archive media asset', { code: error.code });
}
