import 'server-only';
import * as cheerio from 'cheerio';
import { isValidDateString } from './date';

export interface ScrapedGame {
  game_code: string;
  date: string;
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
  stadium: string | null;
  winning_pitcher: string | null;
  losing_pitcher: string | null;
}

/**
 * npb.jp の月次スケジュールページから指定日の試合を抽出する。
 * ネットワーク I/O はここに閉じ込め、DB 書き込みは呼び出し側の責務とする。
 */
export async function scrapeGamesForDate(targetDateString: string): Promise<ScrapedGame[]> {
  if (!isValidDateString(targetDateString)) {
    throw new Error(`Invalid date: ${targetDateString}`);
  }

  const [year, month] = targetDateString.split('-');
  const url = `https://npb.jp/games/${year}/schedule_${month}_detail.html`;

  const res = await fetch(url, {
    headers: { 'User-Agent': 'baseball-app/1.0 (personal use)' },
    // 同じページを何度も取りに行かないよう 1 時間キャッシュ
    next: { revalidate: 3600 },
  });
  if (!res.ok) {
    throw new Error(`npb.jp fetch failed: ${res.status}`);
  }
  const html = await res.text();
  const $ = cheerio.load(html);

  const games: ScrapedGame[] = [];
  const seenCodes = new Set<string>();

  $('tr[id^="date"]').each((_i, gameRow) => {
    const dateId = $(gameRow).attr('id');
    if (!dateId) return;

    const day = dateId.slice(-2);
    const monthFromId = dateId.slice(-4, -2);
    const fullDate = `${year}-${monthFromId}-${day}`;
    if (fullDate !== targetDateString) return;

    const homeTeam = $(gameRow).find('.team1').text().trim();
    const awayTeam = $(gameRow).find('.team2').text().trim();
    if (!homeTeam || !awayTeam) return;

    const homeScoreText = $(gameRow).find('.score1').text().trim();
    const awayScoreText = $(gameRow).find('.score2').text().trim();
    const stadium = $(gameRow).find('.place').text().trim();

    const winningPitcher = $(gameRow).find('.pit:contains("勝")').text().trim().replace('勝：', '');
    const losingPitcher = $(gameRow).find('.pit:contains("敗")').text().trim().replace('敗：', '');

    const homeScore = homeScoreText ? Number.parseInt(homeScoreText, 10) : null;
    const awayScore = awayScoreText ? Number.parseInt(awayScoreText, 10) : null;

    // ダブルヘッダー対策: 同カードが同日に複数ある場合に連番を付与
    let game_code = `${fullDate}-${homeTeam}-${awayTeam}`;
    if (seenCodes.has(game_code)) {
      let n = 2;
      while (seenCodes.has(`${game_code}-${n}`)) n++;
      game_code = `${game_code}-${n}`;
    }
    seenCodes.add(game_code);

    games.push({
      game_code,
      date: fullDate,
      home_team: homeTeam,
      away_team: awayTeam,
      home_score: Number.isNaN(homeScore as number) ? null : homeScore,
      away_score: Number.isNaN(awayScore as number) ? null : awayScore,
      stadium: stadium || null,
      winning_pitcher: winningPitcher || null,
      losing_pitcher: losingPitcher || null,
    });
  });

  return games;
}
