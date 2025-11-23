require('dotenv').config({ path: './.env.local' });
import { supabase } from '../utils/supabase';

async function cleanupGames() {
  try {
    // 1. Fetch all game_ids from the records table
    const { data: records, error: recordsError } = await supabase
      .from('records')
      .select('game_id');

    if (recordsError) {
      throw recordsError;
    }

    const usedGameIds = new Set(records.map(r => r.game_id).filter(id => id !== null));

    // 2. Fetch all ids from the games table
    const { data: games, error: gamesError } = await supabase
      .from('games')
      .select('id');

    if (gamesError) {
      throw gamesError;
    }

    const allGameIds = games.map(g => g.id);

    // 3. Determine which game_ids are unused
    const unusedGameIds = allGameIds.filter(id => !usedGameIds.has(id));

    if (unusedGameIds.length === 0) {
      console.log('No unused games to delete.');
      return;
    }

    console.log(`Found ${unusedGameIds.length} unused games. Deleting...`);

    // 4. Delete the unused games
    const { error: deleteError } = await supabase
      .from('games')
      .delete()
      .in('id', unusedGameIds);

    if (deleteError) {
      throw deleteError;
    }

    console.log(`Successfully deleted ${unusedGameIds.length} unused games.`);

  } catch (error: any) {
    console.error('Error cleaning up games:', error.message);
  }
}

cleanupGames();
