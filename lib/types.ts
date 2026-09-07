// DB 行の型。
// 本来は `npx supabase gen types typescript` で生成するのが理想だが、
// スキーマが小さく安定しているため手書きで保持している。カラムを追加したら直すこと。

export interface Game {
  id: number;
  game_code: string;
  date: string; // YYYY-MM-DD
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
  stadium: string | null;
  winning_pitcher: string | null;
  losing_pitcher: string | null;
  created_at?: string;
}

export interface RecordRow {
  id: number;
  game_id: number;
  place: string;
  memo: string | null;
  created_at: string;
}

// games を join した観戦記録（一覧・編集で使う）
export interface RecordWithGame {
  id: number;
  place: string;
  memo: string | null;
  created_at: string;
  games: Pick<
    Game,
    | 'date'
    | 'home_team'
    | 'away_team'
    | 'home_score'
    | 'away_score'
    | 'stadium'
    | 'winning_pitcher'
    | 'losing_pitcher'
  > | null;
}
