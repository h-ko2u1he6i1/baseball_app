import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { unwrapOne } from '@/lib/supabase/unwrap';
import type { RecordWithGame } from '@/lib/types';
import RecordsView from '@/app/_components/RecordsView';

export const dynamic = 'force-dynamic';

const SELECT =
  'id, place, memo, created_at, games:games!records_game_id_fkey(date, home_team, away_team, home_score, away_score, stadium, winning_pitcher, losing_pitcher)';

// 個人利用の想定。念のため上限を付けておく（数年分は十分カバーできる）
const MAX_RECORDS = 2000;

type RawRecord = Omit<RecordWithGame, 'games'> & {
  games: RecordWithGame['games'] | RecordWithGame['games'][];
};

export default async function Home() {
  const { data, error } = await getSupabaseAdmin()
    .from('records')
    .select(SELECT)
    .order('created_at', { ascending: false })
    .limit(MAX_RECORDS)
    .returns<RawRecord[]>();

  if (error) throw new Error(`観戦記録の取得に失敗しました: ${error.message}`);

  const records: RecordWithGame[] = (data ?? []).map((r) => ({
    id: r.id,
    place: r.place,
    memo: r.memo,
    created_at: r.created_at,
    games: unwrapOne(r.games),
  }));

  return <RecordsView initialRecords={records} />;
}
