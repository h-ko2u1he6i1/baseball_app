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
