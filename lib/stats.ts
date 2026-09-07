// 観戦成績の計算（純関数・React 非依存なのでユニットテスト可能）

import type { RecordWithGame } from './types';

export function gameYear(r: RecordWithGame): number | null {
  if (!r.games?.date) return null;
  const y = Number(r.games.date.slice(0, 4));
  return Number.isFinite(y) ? y : null;
}

export type WinLoss = 'win' | 'loss' | null;

/** 応援球団 team から見た勝敗。引き分け・スコア未確定は null */
export function winLoss(r: RecordWithGame, team: string): WinLoss {
  const g = r.games;
  if (!g || g.home_score == null || g.away_score == null) return null;
  if (team === g.home_team) {
    if (g.home_score > g.away_score) return 'win';
    if (g.home_score < g.away_score) return 'loss';
  } else if (team === g.away_team) {
    if (g.away_score > g.home_score) return 'win';
    if (g.away_score < g.home_score) return 'loss';
  }
  return null;
}

/** 勝率を野球式の ".XXX" 表記で返す（0 試合なら ".000"） */
export function formatWinPct(wins: number, losses: number): string {
  const total = wins + losses;
  if (total === 0) return '.000';
  return (wins / total).toFixed(3).replace(/^0/, '');
}

/** レコード配列と応援球団から勝敗数を集計 */
export function tallyWinLoss(
  records: RecordWithGame[],
  team: string | null,
): { wins: number; losses: number } {
  if (!team) return { wins: 0, losses: 0 };
  let wins = 0;
  let losses = 0;
  for (const r of records) {
    const res = winLoss(r, team);
    if (res === 'win') wins++;
    else if (res === 'loss') losses++;
  }
  return { wins, losses };
}
