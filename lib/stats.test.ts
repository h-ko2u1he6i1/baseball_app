import { describe, it, expect } from 'vitest';
import { gameYear, winLoss, formatWinPct, tallyWinLoss } from './stats';
import type { RecordWithGame } from './types';

function rec(g: Partial<NonNullable<RecordWithGame['games']>> | null): RecordWithGame {
  return {
    id: 1,
    place: '東京ドーム',
    memo: null,
    created_at: '2026-09-07T00:00:00Z',
    games: g
      ? {
          date: '2026-09-07',
          home_team: '巨人',
          away_team: '阪神',
          home_score: null,
          away_score: null,
          stadium: '東京ドーム',
          winning_pitcher: null,
          losing_pitcher: null,
          ...g,
        }
      : null,
  };
}

describe('gameYear', () => {
  it('extracts the year', () => {
    expect(gameYear(rec({ date: '2025-04-01' }))).toBe(2025);
  });
  it('returns null when no game', () => {
    expect(gameYear(rec(null))).toBeNull();
  });
});

describe('winLoss', () => {
  it('home team win', () => {
    expect(winLoss(rec({ home_team: '巨人', away_team: '阪神', home_score: 5, away_score: 2 }), '巨人')).toBe('win');
  });
  it('away team win', () => {
    expect(winLoss(rec({ home_team: '巨人', away_team: '阪神', home_score: 1, away_score: 3 }), '阪神')).toBe('win');
  });
  it('loss', () => {
    expect(winLoss(rec({ home_team: '巨人', away_team: '阪神', home_score: 1, away_score: 3 }), '巨人')).toBe('loss');
  });
  it('draw -> null', () => {
    expect(winLoss(rec({ home_score: 2, away_score: 2 }), '巨人')).toBeNull();
  });
  it('unfinished (null score) -> null', () => {
    expect(winLoss(rec({ home_score: null, away_score: null }), '巨人')).toBeNull();
  });
  it('team not in the game -> null', () => {
    expect(winLoss(rec({ home_team: '巨人', away_team: '阪神', home_score: 5, away_score: 2 }), '中日')).toBeNull();
  });
});

describe('formatWinPct', () => {
  it('baseball-style notation', () => {
    expect(formatWinPct(0, 0)).toBe('.000');
    expect(formatWinPct(1, 1)).toBe('.500');
    expect(formatWinPct(3, 1)).toBe('.750');
    expect(formatWinPct(1, 0)).toBe('1.000');
  });
});

describe('tallyWinLoss', () => {
  const records = [
    rec({ home_team: '巨人', away_team: '阪神', home_score: 5, away_score: 2 }), // 巨人 win
    rec({ home_team: '阪神', away_team: '巨人', home_score: 4, away_score: 1 }), // 巨人 loss
    rec({ home_team: '巨人', away_team: '中日', home_score: 3, away_score: 3 }), // draw
  ];
  it('counts wins and losses for the favorite team', () => {
    expect(tallyWinLoss(records, '巨人')).toEqual({ wins: 1, losses: 1 });
  });
  it('no team -> zeros', () => {
    expect(tallyWinLoss(records, null)).toEqual({ wins: 0, losses: 0 });
  });
});
