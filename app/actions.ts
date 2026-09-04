'use server';

import { revalidatePath } from 'next/cache';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { scrapeGamesForDate, isValidDateString } from '@/lib/scrape';
import type { Game } from '@/lib/types';

const GAME_COLUMNS =
  'id, game_code, date, home_team, away_team, home_score, away_score, stadium, winning_pitcher, losing_pitcher';

/**
 * 指定日の試合が DB に無ければ npb.jp からスクレイピングして保存し、
 * その日の試合一覧を返す。
 */
export async function ensureGamesForDate(date: string): Promise<Game[]> {
  if (!isValidDateString(date)) throw new Error('日付の形式が不正です');
  const db = getSupabaseAdmin();

  const existing = await db
    .from('games')
    .select(GAME_COLUMNS)
    .eq('date', date)
    .order('id', { ascending: true });
  if (existing.error) throw new Error(existing.error.message);
  if (existing.data && existing.data.length > 0) return existing.data as Game[];

  const scraped = await scrapeGamesForDate(date);
  if (scraped.length > 0) {
    const { error } = await db.from('games').upsert(scraped, { onConflict: 'game_code' });
    if (error) throw new Error(error.message);
  }

  const refreshed = await db
    .from('games')
    .select(GAME_COLUMNS)
    .eq('date', date)
    .order('id', { ascending: true });
  if (refreshed.error) throw new Error(refreshed.error.message);
  return (refreshed.data ?? []) as Game[];
}

async function resolveGamePlace(gameId: number): Promise<string> {
  const db = getSupabaseAdmin();
  const { data, error } = await db.from('games').select('stadium').eq('id', gameId).single();
  if (error) throw new Error(error.message);
  return data?.stadium ?? '';
}

export async function createRecord(input: { gameId: number; memo: string }): Promise<void> {
  if (!Number.isInteger(input.gameId)) throw new Error('試合が選択されていません');
  const db = getSupabaseAdmin();
  const place = await resolveGamePlace(input.gameId);

  const { error } = await db.from('records').insert({
    game_id: input.gameId,
    place,
    memo: input.memo.trim() || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath('/');
}

export async function updateRecord(
  id: number,
  input: { gameId: number; memo: string },
): Promise<void> {
  if (!Number.isInteger(id)) throw new Error('記録 ID が不正です');
  if (!Number.isInteger(input.gameId)) throw new Error('試合が選択されていません');
  const db = getSupabaseAdmin();
  const place = await resolveGamePlace(input.gameId);

  const { error } = await db
    .from('records')
    .update({ game_id: input.gameId, place, memo: input.memo.trim() || null })
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/');
  revalidatePath(`/edit/${id}`);
}

export async function deleteRecords(ids: number[]): Promise<void> {
  const clean = ids.filter((n) => Number.isInteger(n));
  if (clean.length === 0) return;
  const db = getSupabaseAdmin();

  const { error } = await db.from('records').delete().in('id', clean);
  if (error) throw new Error(error.message);
  revalidatePath('/');
}
