'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';
import { useRouter } from 'next/navigation';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Paper,
  Stack,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Avatar
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/ja';

interface Game {
  id: number;
  date: string;
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
  stadium: string | null;
  winning_pitcher: string | null;
  losing_pitcher: string | null;
}

const TEAM_LOGO_MAP: { [key: string]: string } = {
  "オリックス": "logo_b_m.gif",
  "広島": "logo_c_m.gif",
  "中日": "logo_d_m.gif",
  "DeNA": "logo_db_m.gif",
  "楽天": "logo_e_m.gif",
  "日本ハム": "logo_f_m.gif",
  "巨人": "logo_g_m.gif",
  "ソフトバンク": "logo_h_m.gif",
  "西武": "logo_l_m.gif",
  "ロッテ": "logo_m_m.gif",
  "ヤクルト": "logo_s_m.gif",
  "阪神": "logo_t_m.gif",
};

const getTeamLogoSrc = (teamName: string): string => {
  const filename = TEAM_LOGO_MAP[teamName];
  return filename ? `/assets/logos/${filename}` : '';
};

export default function NewRecordPage() {
  const [allGames, setAllGames] = useState<Game[]>([]);
  const [filteredGames, setFilteredGames] = useState<Game[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string>('');
  const [memo, setMemo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs());
  const [displayStadium, setDisplayStadium] = useState<string>('');
  const [displayWinningPitcher, setDisplayWinningPitcher] = useState<string>('');
  const [displayLosingPitcher, setDisplayLosingPitcher] = useState<string>('');
  const router = useRouter();
  const [isScraping, setIsScraping] = useState(false);

  const fetchGames = async () => {
    const { data, error } = await supabase
      .from('games')
      .select('id, date, home_team, away_team, home_score, away_score, stadium, winning_pitcher, losing_pitcher')
      .order('date', { ascending: false });

    if (error) {
      setError('試合データの取得に失敗しました: ' + error.message);
    } else {
      setAllGames(data || []);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchGames().finally(() => setLoading(false));
  }, []);

  const handleDateChange = async (newValue: Dayjs | null) => {
    setSelectedDate(newValue);
    if (newValue) {
      const formattedDate = newValue.format('YYYY-MM-DD');
      const gamesOnDate = allGames.filter(game => game.date === formattedDate);
      
      if (gamesOnDate.length === 0) {
        setIsScraping(true);
        try {
          const response = await fetch('/api/scrape', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ date: formattedDate }),
          });
          if (response.ok) {
            await fetchGames();
          } else {
            const data = await response.json();
            setError(data.error || 'スクレイピングに失敗しました。');
          }
        } catch (e: any) {
          setError('スクレイピングリクエストに失敗しました: ' + e.message);
        } finally {
          setIsScraping(false);
        }
      }
    }
  };

  useEffect(() => {
    let currentGames = allGames;
    if (selectedDate) {
      const formattedDate = selectedDate.format('YYYY-MM-DD');
      currentGames = allGames.filter(game => game.date === formattedDate);
    }
    setFilteredGames(currentGames);
    setSelectedGameId('');
  }, [allGames, selectedDate]);

  useEffect(() => {
    if (selectedGameId) {
      const game = allGames.find(g => g.id === Number(selectedGameId));
      setDisplayStadium(game?.stadium || '');
      setDisplayWinningPitcher(game?.winning_pitcher || '');
      setDisplayLosingPitcher(game?.losing_pitcher || '');
    } else {
      setDisplayStadium('');
      setDisplayWinningPitcher('');
      setDisplayLosingPitcher('');
    }
  }, [selectedGameId, allGames]);

  const handleGameChange = (event: SelectChangeEvent) => {
    setSelectedGameId(event.target.value as string);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGameId) {
      return;
    }

    const selectedGame = allGames.find(g => g.id === Number(selectedGameId));
    if (!selectedGame || !selectedGame.stadium) {
      return;
    }

    const { error } = await supabase.from('records').insert({
      game_id: selectedGameId,
      place: selectedGame.stadium,
      memo,
    });

    if (error) {
      setError('記録の保存に失敗しました: ' + error.message);
    } else {
      router.refresh();
      router.push('/');
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}><CircularProgress /></Box>;
  }

  if (error) {
    return <Container sx={{ py: 4 }}><Alert severity="error">{error}</Alert></Container>;
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" fontWeight="bold">
          New Games
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Stack spacing={3} mt={4}>
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ja">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <DatePicker
                  label="日付"
                  value={selectedDate}
                  onChange={handleDateChange}
                  openOnFieldClick={true}
                  renderInput={(params) => <TextField {...params} fullWidth onClick={params.onClick} />}
                />
                {isScraping && <CircularProgress size={24} />}
              </Box>
            </LocalizationProvider>
            <FormControl fullWidth required disabled={filteredGames.length === 0}>
              <InputLabel id="game-select-label">試合を選択</InputLabel>
              <Select
                labelId="game-select-label"
                value={selectedGameId}
                label="試合を選択"
                onChange={handleGameChange}
                renderValue={(selectedId) => {
                  const game = allGames.find(g => g.id === Number(selectedId));
                  if (!game) return "";
                  return (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getTeamLogoSrc(game.home_team) && <Avatar src={getTeamLogoSrc(game.home_team)} alt={game.home_team} sx={{ width: 24, height: 24 }} />}
                        {game.home_team}
                      </Box>
                      vs
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getTeamLogoSrc(game.away_team) && <Avatar src={getTeamLogoSrc(game.away_team)} alt={game.away_team} sx={{ width: 24, height: 24 }} />}
                        {game.away_team}
                      </Box>
                      {` (${game.home_score}-${game.away_score})`}
                    </Box>
                  );
                }}
              >
                {filteredGames.length === 0 ? (
                  <MenuItem value="" disabled>選択できる試合がありません</MenuItem>
                ) : (
                  [
                    <MenuItem key="placeholder" value=""><em>試合を選択してください</em></MenuItem>,
                    ...filteredGames.map((game) => (
                      <MenuItem key={game.id} value={game.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getTeamLogoSrc(game.home_team) && <Avatar src={getTeamLogoSrc(game.home_team)} alt={game.home_team} sx={{ width: 24, height: 24 }} />}
                          {game.home_team}
                        </Box>
                        vs
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getTeamLogoSrc(game.away_team) && <Avatar src={getTeamLogoSrc(game.away_team)} alt={game.away_team} sx={{ width: 24, height: 24 }} />}
                          {game.away_team}
                        </Box>
                        {` (${game.home_score}-${game.away_score})`}
                      </MenuItem>
                    ))
                  ]
                )}
              </Select>
            </FormControl>
            <TextField
              label="球場"
              value={displayStadium}
              InputProps={{
                readOnly: true,
              }}
              fullWidth
              disabled={!displayStadium}
            />
            <TextField
              label="勝ち投手"
              value={displayWinningPitcher}
              InputProps={{
                readOnly: true,
              }}
              fullWidth
              disabled={!displayWinningPitcher}
            />
            <TextField
              label="負け投手"
              value={displayLosingPitcher}
              InputProps={{
                readOnly: true,
              }}
              fullWidth
              disabled={!displayLosingPitcher}
            />
            <TextField
              label="メモ"
              multiline
              rows={4}
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="観戦の感想や詳細を記入"
              fullWidth
            />
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button variant="outlined" onClick={() => router.push('/')}>
                キャンセル
              </Button>
              <Button type="submit" variant="contained" disabled={!selectedGameId}>
                記録を保存
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Paper>
    </Container>
  );
}