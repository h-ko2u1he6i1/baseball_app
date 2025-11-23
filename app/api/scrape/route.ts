import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import axios from 'axios';
import { supabase } from '../../../utils/supabase';

// Polyfill for Vercel's Node.js environment
import { File } from 'node:buffer';
(global as any).File = File;

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

export async function POST(request: Request) {
  try {
    const { date: targetDateString } = await request.json();
    if (!targetDateString || typeof targetDateString !== 'string') {
      return NextResponse.json({ error: 'Date is required and must be a string' }, { status: 400 });
    }

    const dateParts = targetDateString.split('-');
    if (dateParts.length !== 3) {
        return NextResponse.json({ error: 'Invalid date format. Expected YYYY-MM-DD' }, { status: 400 });
    }
    
    const year = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10);

    if (isNaN(year) || isNaN(month)) {
        return NextResponse.json({ error: 'Invalid year or month in date' }, { status: 400 });
    }

    const formattedMonth = String(month).padStart(2, '0');
    const url = `https://npb.jp/games/${year}/schedule_${formattedMonth}_detail.html`;
    console.log(`Scraping data from: ${url} for date: ${targetDateString}`);

    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    let games: GameData[] = [];

    $('tr[id^="date"]').each((i, gameRow) => {
      const dateId = $(gameRow).attr('id');
      if (!dateId) return;

      const day = dateId.substring(dateId.length - 2);
      const monthFromId = dateId.substring(dateId.length - 4, dateId.length - 2);
      const fullDate = `${year}-${monthFromId}-${day}`;

      // Only process rows that match the target date
      if (fullDate !== targetDateString) return;

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

    if (games.length === 0) {
      const message = `No games found for ${targetDateString}.`;
      console.warn(message);
      return NextResponse.json({ message });
    } 
      
    console.log(`Found ${games.length} games for ${targetDateString}. Upserting to Supabase...`);
    const { error } = await supabase
      .from('games')
      .upsert(games, { onConflict: 'game_code' });

    if (error) {
      console.error(`Error upserting games for ${targetDateString}:`, error);
      return NextResponse.json({ error: `Supabase error: ${error.message}` }, { status: 500 });
    }

    const successMessage = `Successfully scraped and saved ${games.length} games for ${targetDateString}.`;
    console.log(successMessage);
    return NextResponse.json({ message: successMessage, count: games.length });

  } catch (error: any) {
    console.error('Error in scrape API route:', error);
    // Differentiate between axios errors and other errors
    if (axios.isAxiosError(error)) {
        return NextResponse.json({ error: `Failed to fetch data: ${error.message}` }, { status: 502 });
    }
    return NextResponse.json({ error: `An unexpected error occurred: ${error.message}` }, { status: 500 });
  }
}