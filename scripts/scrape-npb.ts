require('dotenv').config({ path: './.env.local' });

import { File } from 'node:buffer';
(global as any).File = File;

import * as cheerio from 'cheerio';
import axios from 'axios';
import { supabase } from '../utils/supabase';

interface GameData {
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

async function scrapeNpbGames(year: number, month?: number, targetDateString?: string) {
  const monthsToScrape: number[] = month ? [month] : Array.from({ length: 12 }, (_, i) => i + 1);

  for (const currentMonth of monthsToScrape) {
    const formattedMonth = String(currentMonth).padStart(2, '0');
    const url = `https://npb.jp/games/${year}/schedule_${formattedMonth}_detail.html`;
    console.log(`Scraping data from: ${url}`);
    if (targetDateString) {
      console.log(`Filtering for games on: ${targetDateString}`);
    }

    try {
      const { data } = await axios.get(url);
      const $ = cheerio.load(data);
      let games: GameData[] = [];

      $('tr[id^="date"]').each((i, gameRow) => {
        const dateId = $(gameRow).attr('id');
        if (!dateId) return;

        const day = dateId.substring(dateId.length - 2);
        const monthFromId = dateId.substring(dateId.length - 4, dateId.length - 2);
        const fullDate = `${year}-${monthFromId}-${day}`;

        const homeTeam = $(gameRow).find('.team1').text().trim();
        if (!homeTeam) return;

        const homeScoreText = $(gameRow).find('.score1').text().trim();
        const awayTeam = $(gameRow).find('.team2').text().trim();
        const awayScoreText = $(gameRow).find('.score2').text().trim();
        const stadium = $(gameRow).find('.place').text().trim();

        const winningPitcherText = $(gameRow).find('.pit:contains("勝")').text().trim();
        const losingPitcherText = $(gameRow).find('.pit:contains("敗")').text().trim();

        const winningPitcher = winningPitcherText.replace('勝：', '');
        const losingPitcher = losingPitcherText.replace('敗：', '');

        const homeScore = homeScoreText ? parseInt(homeScoreText, 10) : null;
        const awayScore = awayScoreText ? parseInt(awayScoreText, 10) : null;

        const game_code = `${fullDate}-${homeTeam}-${awayTeam}`;

        if (fullDate && homeTeam && awayTeam) {
          games.push({
            game_code,
            date: fullDate,
            home_team: homeTeam,
            away_team: awayTeam,
            home_score: homeScore,
            away_score: awayScore,
            stadium: stadium || null,
            winning_pitcher: winningPitcher || null,
            losing_pitcher: losingPitcher || null,
          });
        }
      });

      if (targetDateString) {
        games = games.filter(game => game.date === targetDateString);
        if (games.length === 0) {
          console.warn(`No games found for ${targetDateString} in month ${formattedMonth}. Please check the date format (YYYY-MM-DD) and if games exist on that date.`);
        }
      }

      if (games.length === 0) {
        console.warn(`No games found after scraping/filtering for month ${formattedMonth}. Please check the scraping selectors in scripts/scrape-npb.ts or the provided date.`);
      } else {
        console.log(`Found ${games.length} games for month ${formattedMonth}. Upserting to Supabase...`);
        const { data: upsertedData, error } = await supabase
          .from('games')
          .upsert(games, { onConflict: 'game_code' });

        if (error) {
          console.error(`Error upserting games for month ${formattedMonth}:`, error);
        } else {
          console.log(`Games for month ${formattedMonth} upserted successfully.`);
        }
      }

    } catch (error: any) {
      console.error(`Failed to scrape data from ${url}:`, error.message);
    }
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
const yearArg = args[0] ? parseInt(args[0], 10) : new Date().getFullYear();
const monthArg = args[1] ? parseInt(args[1], 10) : undefined;
const dateArg = args[2] || undefined;

scrapeNpbGames(yearArg, monthArg, dateArg);
