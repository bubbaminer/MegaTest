import { AppError } from '@/lib/errors/app-error';
import { catalogStatuses, type CatalogStatus } from '@/lib/catalog/types';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export interface GameAdminRecord {
  id: string; name: string; slug: string; shortDescription: string; description: string;
  logoMediaId: string; imageMediaId: string; bannerMediaId: string;
  status: CatalogStatus; sortOrder: number;
}
export interface CategoryAdminRecord {
  id: string; parentId: string; name: string; slug: string; description: string;
  imageMediaId: string; status: CatalogStatus; sortOrder: number;
}

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const text = (value: unknown): string => typeof value === 'string' ? value : '';
const contentText = (value: unknown): string => typeof value === 'object' && value !== null && 'content' in value ? text((value as { content?: unknown }).content) : '';
const mediaId = (value: string): string | null => value.trim() || null;

function baseInput(input: Record<string, string>) {
  const name = (input.name ?? '').trim();
  const slug = (input.slug ?? '').trim().toLowerCase();
  const status = input.status as CatalogStatus;
  const sortOrder = Number.parseInt(input.sortOrder ?? '0', 10);
  if (!name || !slugPattern.test(slug) || !catalogStatuses.includes(status) || !Number.isSafeInteger(sortOrder) || sortOrder < 0) throw new AppError('BAD_REQUEST', 'Invalid catalog data');
  return { name, slug, status, sort_order: sortOrder };
}

export async function listGames(accessToken: string): Promise<GameAdminRecord[]> {
  const { data, error } = await createServerSupabaseClient(accessToken).from('games').select('id,name,slug,short_description,description,logo_media_id,image_media_id,banner_media_id,status,sort_order').is('deleted_at', null).order('sort_order').order('name');
  if (error) throw new AppError('INTERNAL_ERROR', 'Unable to load games', { code: error.code });
  return (data ?? []).map((row) => ({ id: row.id, name: row.name, slug: row.slug, shortDescription: text(row.short_description), description: contentText(row.description), logoMediaId: text(row.logo_media_id), imageMediaId: text(row.image_media_id), bannerMediaId: text(row.banner_media_id), status: row.status, sortOrder: row.sort_order }));
}

export async function getGame(accessToken: string, id: string): Promise<GameAdminRecord | null> {
  return (await listGames(accessToken)).find((game) => game.id === id) ?? null;
}

export async function createGame(accessToken: string, input: Record<string, string>): Promise<string> {
  const base = baseInput({ ...input, status: 'draft', sortOrder: input.sortOrder ?? '0' });
  const { data, error } = await createServerSupabaseClient(accessToken).from('games').insert(base).select('id').single();
  if (error) throw new AppError(error.code === '23505' ? 'CONFLICT' : 'INTERNAL_ERROR', 'Unable to create game', { code: error.code });
  return data.id;
}

export async function updateGame(accessToken: string, id: string, input: Record<string, string>): Promise<void> {
  const base = baseInput(input);
  const { error } = await createServerSupabaseClient(accessToken).from('games').update({ ...base, short_description: (input.shortDescription ?? '').trim() || null, description: { content: input.description ?? '' }, logo_media_id: mediaId(input.logoMediaId ?? ''), image_media_id: mediaId(input.imageMediaId ?? ''), banner_media_id: mediaId(input.bannerMediaId ?? '') }).eq('id', id).is('deleted_at', null);
  if (error) throw new AppError(error.code === '23505' ? 'CONFLICT' : 'INTERNAL_ERROR', 'Unable to update game', { code: error.code });
}

export async function archiveGame(accessToken: string, id: string): Promise<void> {
  const { error } = await createServerSupabaseClient(accessToken).from('games').update({ status: 'archived' }).eq('id', id).is('deleted_at', null);
  if (error) throw new AppError('INTERNAL_ERROR', 'Unable to archive game', { code: error.code });
}

export async function listCategories(accessToken: string): Promise<CategoryAdminRecord[]> {
  const { data, error } = await createServerSupabaseClient(accessToken).from('categories').select('id,parent_id,name,slug,description,image_media_id,status,sort_order').is('deleted_at', null).order('sort_order').order('name');
  if (error) throw new AppError('INTERNAL_ERROR', 'Unable to load categories', { code: error.code });
  return (data ?? []).map((row) => ({ id: row.id, parentId: text(row.parent_id), name: row.name, slug: row.slug, description: contentText(row.description), imageMediaId: text(row.image_media_id), status: row.status, sortOrder: row.sort_order }));
}

export async function getCategory(accessToken: string, id: string): Promise<CategoryAdminRecord | null> {
  return (await listCategories(accessToken)).find((category) => category.id === id) ?? null;
}

export async function createCategory(accessToken: string, input: Record<string, string>): Promise<string> {
  const base = baseInput({ ...input, status: 'draft', sortOrder: input.sortOrder ?? '0' });
  const { data, error } = await createServerSupabaseClient(accessToken).from('categories').insert({ ...base, parent_id: mediaId(input.parentId ?? '') }).select('id').single();
  if (error) throw new AppError(error.code === '23505' ? 'CONFLICT' : 'INTERNAL_ERROR', 'Unable to create category', { code: error.code });
  return data.id;
}

export async function updateCategory(accessToken: string, id: string, input: Record<string, string>): Promise<void> {
  const base = baseInput(input);
  const parentId = mediaId(input.parentId ?? '');
  if (parentId === id) throw new AppError('BAD_REQUEST', 'Category cannot be its own parent');
  const { error } = await createServerSupabaseClient(accessToken).from('categories').update({ ...base, parent_id: parentId, description: { content: input.description ?? '' }, image_media_id: mediaId(input.imageMediaId ?? '') }).eq('id', id).is('deleted_at', null);
  if (error) throw new AppError(error.code === '23505' ? 'CONFLICT' : 'INTERNAL_ERROR', 'Unable to update category', { code: error.code });
}

export async function archiveCategory(accessToken: string, id: string): Promise<void> {
  const { error } = await createServerSupabaseClient(accessToken).from('categories').update({ status: 'archived' }).eq('id', id).is('deleted_at', null);
  if (error) throw new AppError('INTERNAL_ERROR', 'Unable to archive category', { code: error.code });
}
