import { AppError } from '@/lib/errors/app-error';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export interface PublicGame {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  logoUrl: string | undefined;
  imageUrl: string | undefined;
  bannerUrl: string | undefined;
}

type GameRow = {
  id: string; name: string; slug: string; short_description: string | null;
  description: unknown; logo_media_id: string | null; image_media_id: string | null; banner_media_id: string | null;
};

const descriptionText = (value: unknown): string => typeof value === 'object' && value !== null && 'content' in value && typeof (value as { content?: unknown }).content === 'string' ? (value as { content: string }).content : '';

async function mediaUrlMap(ids: string[]): Promise<Map<string, string>> {
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  const urls = new Map<string, string>();
  if (uniqueIds.length === 0) return urls;
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.from('media_assets').select('id,storage_bucket,storage_path').in('id', uniqueIds).is('deleted_at', null);
  if (error) throw new AppError('INTERNAL_ERROR', 'Unable to load catalog media', { code: error.code });
  for (const asset of data ?? []) urls.set(asset.id, supabase.storage.from(asset.storage_bucket).getPublicUrl(asset.storage_path).data.publicUrl);
  return urls;
}

function mapGame(row: GameRow, media: Map<string, string>): PublicGame {
  return {
    id: row.id, name: row.name, slug: row.slug,
    shortDescription: row.short_description ?? '', description: descriptionText(row.description),
    logoUrl: row.logo_media_id ? media.get(row.logo_media_id) : undefined,
    imageUrl: row.image_media_id ? media.get(row.image_media_id) : undefined,
    bannerUrl: row.banner_media_id ? media.get(row.banner_media_id) : undefined,
  };
}

export async function listPublicGames(): Promise<PublicGame[]> {
  const { data, error } = await createServerSupabaseClient().from('games').select('id,name,slug,short_description,description,logo_media_id,image_media_id,banner_media_id').order('sort_order').order('name');
  if (error) throw new AppError('INTERNAL_ERROR', 'Unable to load game catalog', { code: error.code });
  const rows = (data ?? []) as GameRow[];
  const media = await mediaUrlMap(rows.flatMap((row) => [row.logo_media_id, row.image_media_id, row.banner_media_id].filter((id): id is string => Boolean(id))));
  return rows.map((row) => mapGame(row, media));
}

export async function getPublicGame(slug: string): Promise<PublicGame | null> {
  const { data, error } = await createServerSupabaseClient().from('games').select('id,name,slug,short_description,description,logo_media_id,image_media_id,banner_media_id').eq('slug', slug).maybeSingle();
  if (error) throw new AppError('INTERNAL_ERROR', 'Unable to load game', { code: error.code });
  if (!data) return null;
  const row = data as GameRow;
  const media = await mediaUrlMap([row.logo_media_id, row.image_media_id, row.banner_media_id].filter((id): id is string => Boolean(id)));
  return mapGame(row, media);
}
