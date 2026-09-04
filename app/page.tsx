import { getSupabaseAdmin } from '@/lib/supabase/admin';
import type { RecordWithGame } from '@/lib/types';
import RecordsView from '@/app/_components/RecordsView';

export const dynamic = 'force-dynamic';

const SELECT = `id, place, memo, created_at, games:games!records_game_id_fkey(date, home_team, away_team, home_score, away_score, stadium, winning_pitcher, losing_pitcher)`;

export default async function Home() {
  const { data, error } = await getSupabaseAdmin()
    .from('records')
    .select(SELECT)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`観戦記録の取得に失敗しました: ${error.message}`);

  const records: RecordWithGame[] = (data ?? []).map((r) => ({
    ...r,
    games: Array.isArray(r.games) ? (r.games[0] ?? null) : r.games,
  })) as RecordWithGame[];

  return <RecordsView initialRecords={records} />;
}
