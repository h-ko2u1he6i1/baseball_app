// NPB 12球団の共通定義（複数ファイルからの重複を集約）

export const NPB_TEAMS = [
  // セ・リーグ
  '巨人', '阪神', '中日', 'DeNA', '広島', 'ヤクルト',
  // パ・リーグ
  'オリックス', 'ソフトバンク', '楽天', 'ロッテ', '西武', '日本ハム',
] as const;

export type NpbTeam = (typeof NPB_TEAMS)[number];

// チーム名 -> ロゴファイル名
const TEAM_LOGO_MAP: Record<string, string> = {
  オリックス: 'logo_b_m.gif',
  広島: 'logo_c_m.gif',
  中日: 'logo_d_m.gif',
  DeNA: 'logo_db_m.gif',
  楽天: 'logo_e_m.gif',
  日本ハム: 'logo_f_m.gif',
  巨人: 'logo_g_m.gif',
  ソフトバンク: 'logo_h_m.gif',
  西武: 'logo_l_m.gif',
  ロッテ: 'logo_m_m.gif',
  ヤクルト: 'logo_s_m.gif',
  阪神: 'logo_t_m.gif',
};

/** ロゴのパスを返す。無ければ空文字。 */
export const getTeamLogoSrc = (teamName: string): string => {
  const filename = TEAM_LOGO_MAP[teamName];
  return filename ? `/assets/logos/${filename}` : '';
};

// 球団のチームカラー（アクセントに使う代表色 1 つ）。
// ライト/ダーク両方で視認できる中間トーンに調整している。
// MUI が light / dark / contrastText を自動計算するので main のみ持つ。
const TEAM_COLOR_MAP: Record<string, string> = {
  巨人: '#f97316', // オレンジ
  阪神: '#f5b301', // イエロー
  中日: '#2563eb', // ドラゴンズブルー
  DeNA: '#2f6fe4', // ベイブルー
  広島: '#ef2b2d', // カープレッド
  ヤクルト: '#1e63c9', // スワローズブルー
  オリックス: '#b8892b', // バファローズゴールド
  ソフトバンク: '#f2c200', // イエロー
  楽天: '#c1122e', // クリムゾン
  ロッテ: '#5b6472', // マリーンズ（黒×シルバー）
  西武: '#1a52d4', // ライオンズブルー
  日本ハム: '#1a5cad', // ファイターズブルー
};

/** 既定のアクセント色（応援球団未選択時） */
export const DEFAULT_ACCENT = '#2f6feb';

/** チームのアクセント色を返す。未選択・不明なら既定色。 */
export const getTeamColor = (teamName: string | null | undefined): string =>
  (teamName && TEAM_COLOR_MAP[teamName]) || DEFAULT_ACCENT;
