import { notFound } from 'next/navigation';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { unwrapOne } from '@/lib/supabase/unwrap';
import RecordForm from '@/app/_components/RecordForm';

export const metadata = { title: '観戦記録を編集' };

export default async function EditRecordPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const recordId = Number(id);
  if (!Number.isInteger(recordId)) notFound();

  const { data, error } = await getSupabaseAdmin()
    .from('records')
    .select('id, game_id, memo, games:games!records_game_id_fkey(date)')
    .eq('id', recordId)
    .single<{ id: number; game_id: number | null; memo: string | null; games: { date: string } | { date: string }[] | null }>();

  if (error || !data) notFound();

  const game = unwrapOne(data.games);

  return (
    <RecordForm
      mode="edit"
      recordId={recordId}
      initialDate={game?.date}
      initialGameId={data.game_id ?? undefined}
      initialMemo={data.memo ?? ''}
    />
  );
}
