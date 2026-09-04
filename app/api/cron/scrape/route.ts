import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { scrapeGamesForDate } from '@/lib/scrape';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Vercel Cron から呼ばれる。直近数日分をまとめて再取得して upsert する。
// （順延・再試合や、確定が遅れるスコア/勝敗投手を拾い直すため複数日を対象にする）
const DAYS_BACK = 4;

function jstToday(): Date {
  const now = new Date();
  return new Date(now.getTime() + 9 * 60 * 60 * 1000); // UTC+9
}

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getSupabaseAdmin();
  const base = jstToday();
  const dates = Array.from({ length: DAYS_BACK }, (_, i) => {
    const d = new Date(base);
    d.setUTCDate(d.getUTCDate() - i);
    return ymd(d);
  });

  const results: Record<string, number | string> = {};
  let total = 0;

  for (const date of dates) {
    try {
      const games = await scrapeGamesForDate(date);
      if (games.length > 0) {
        const { error } = await db.from('games').upsert(games, { onConflict: 'game_code' });
        if (error) throw new Error(error.message);
      }
      results[date] = games.length;
      total += games.length;
    } catch (e) {
      results[date] = e instanceof Error ? `error: ${e.message}` : 'error';
    }
  }

  return NextResponse.json({ ok: true, total, results });
}
