// DB 行の共通型

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
}

export interface RecordRow {
  id: number;
  game_id: number;
  place: string;
  memo: string | null;
  created_at: string;
}

// 一覧で使う games を join した観戦記録
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
