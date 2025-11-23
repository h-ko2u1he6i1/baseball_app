'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  Stack,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  SelectChangeEvent,
  Avatar,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { Add as AddIcon, Delete as DeleteIcon, Cancel as CancelIcon } from '@mui/icons-material';

interface Record {
  id: number;
  place: string;
  memo: string | null;
  created_at: string;
  games: { // Joined game data
    date: string;
    home_team: string;
    away_team: string;
    home_score: number | null;
    away_score: number | null;
    stadium: string | null;
    winning_pitcher: string | null;
    losing_pitcher: string | null;
  } | null;
}

const NPB_TEAMS = [
  "巨人", "阪神", "中日", "DeNA", "広島", "ヤクルト", // Central League
  "オリックス", "ソフトバンク", "楽天", "ロッテ", "西武", "日本ハム" // Pacific League
];

// Mapping from Japanese team name to logo filename
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

// Helper function to get logo source
const getTeamLogoSrc = (teamName: string): string => {
  const filename = TEAM_LOGO_MAP[teamName];
  return filename ? `/assets/logos/${filename}` : ''; // Return empty string if no logo found
};

export default function Home() {
  const [records, setRecords] = useState<Record[]>([]);
  const [displayedRecords, setDisplayedRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecordIds, setSelectedRecordIds] = useState<Set<number>>(new Set());
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [favoriteTeam, setFavoriteTeam] = useState<string | null>(null);
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);
  const [winningPercentage, setWinningPercentage] = useState<string>('0.0');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [selectedOpponent, setSelectedOpponent] = useState<string>('');

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const router = useRouter();

  useEffect(() => {
    async function fetchRecords() {
      setLoading(true);
      const { data, error } = await supabase
        .from('records')
        .select(`id, place, memo, created_at, games:games!records_game_id_fkey(date, home_team, away_team, home_score, away_score, stadium, winning_pitcher, losing_pitcher)`);

      if (error) {
        setError('観戦記録の取得に失敗しました: ' + error.message);
      } else {
        const transformedData = (data || []).map(record => ({
          ...record,
          games: Array.isArray(record.games) ? (record.games[0] || null) : record.games,
        }));
        setRecords(transformedData);
      }
      setLoading(false);
    }
    fetchRecords();
  }, []);

  useEffect(() => {
    if (records.length > 0) {
      const years = new Set(records.map(r => r.games ? new Date(r.games.date).getFullYear() : 0).filter(y => y > 0));
      const sortedYears = Array.from(years).sort((a, b) => b - a);
      setAvailableYears(sortedYears);
      if (sortedYears.length > 0 && !sortedYears.includes(selectedYear)) {
        setSelectedYear(sortedYears[0]);
      }
    }
  }, [records]);

  useEffect(() => {
    let filteredRecords = records.filter(r => r.games && new Date(r.games.date).getFullYear() === selectedYear);

    if (favoriteTeam) {
      filteredRecords = filteredRecords.filter(r => r.games && (r.games.home_team === favoriteTeam || r.games.away_team === favoriteTeam));
    }

    if (selectedOpponent) {
      filteredRecords = filteredRecords.filter(r => r.games && (r.games.home_team === selectedOpponent || r.games.away_team === selectedOpponent));
    }
    
    let sortedRecords = [...filteredRecords];
    sortedRecords.sort((a, b) => {
      if (!a.games?.date || !b.games?.date) return 0;
      const dateA = new Date(a.games.date).getTime();
      const dateB = new Date(b.games.date).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
    setDisplayedRecords(sortedRecords);
  }, [records, sortOrder, selectedYear, selectedOpponent, favoriteTeam]);

  useEffect(() => {
    const storedTeam = localStorage.getItem('favoriteTeam');
    if (storedTeam && NPB_TEAMS.includes(storedTeam)) {
      setFavoriteTeam(storedTeam);
    }
  }, []);

  useEffect(() => {
    if (favoriteTeam) {
      localStorage.setItem('favoriteTeam', favoriteTeam);
    } else {
      localStorage.removeItem('favoriteTeam');
    }
  }, [favoriteTeam]);

  useEffect(() => {
    const recordsToCalculate = displayedRecords;
    if (favoriteTeam && recordsToCalculate.length > 0) {
      let currentWins = 0;
      let currentLosses = 0;
      recordsToCalculate.forEach(record => {
        if (record.games) {
          const { home_team, away_team, home_score, away_score } = record.games;
          if (home_score === null || away_score === null) {
            return;
          }
          if (favoriteTeam === home_team) {
            if (home_score > away_score) currentWins++;
            else if (home_score < away_score) currentLosses++;
          } else if (favoriteTeam === away_team) {
            if (away_score > home_score) currentWins++;
            else if (away_score < home_score) currentLosses++;
          }
        }
      });
      setWins(currentWins);
      setLosses(currentLosses);

      const totalGames = currentWins + currentLosses;
      if (totalGames > 0) {
        const percentage = (currentWins / totalGames);
        let formattedPercentage = percentage.toFixed(3);
        if (formattedPercentage.startsWith('0.')) {
          formattedPercentage = formattedPercentage.substring(1);
        }
        setWinningPercentage(formattedPercentage);
      } else {
        setWinningPercentage('.000');
      }

    } else {
      setWins(0);
      setLosses(0);
      setWinningPercentage('0.0');
    }
  }, [favoriteTeam, displayedRecords]);

  const getWinLossIndicator = (record: Record) => {
    if (!favoriteTeam || !record.games || record.games.home_score === null || record.games.away_score === null) {
      return null;
    }
    const { home_team, away_team, home_score, away_score } = record.games;
    if (favoriteTeam === home_team) {
      if (home_score > away_score) return <Typography component="span" color="green.500" fontWeight="bold">⚪</Typography>;
      if (home_score < away_score) return <Typography component="span" color="text.primary" fontWeight="bold">⚫</Typography>;
    } else if (favoriteTeam === away_team) {
      if (away_score > home_score) return <Typography component="span" color="green.500" fontWeight="bold">⚪</Typography>;
      if (away_score < home_score) return <Typography component="span" color="text.primary" fontWeight="bold">⚫</Typography>;
    }
    return null;
  };

  const handleCheckboxChange = (recordId: number, isChecked: boolean) => {
    setSelectedRecordIds(prev => {
      const newSet = new Set(prev);
      if (isChecked) newSet.add(recordId);
      else newSet.delete(recordId);
      return newSet;
    });
  };

  const handleDeleteSelected = async () => {
    if (selectedRecordIds.size === 0) {
      return;
    }
    setLoading(true);
    const { error } = await supabase.from('records').delete().in('id', Array.from(selectedRecordIds));
    if (error) {
      setError('記録の削除に失敗しました: ' + error.message);
    } else {
      setRecords(prevRecords => prevRecords.filter(record => !selectedRecordIds.has(record.id)));
      setSelectedRecordIds(new Set());
      setIsDeleteMode(false);
    }
    setLoading(false);
  };

  const toggleDeleteMode = () => {
    setIsDeleteMode(prev => !prev);
    setSelectedRecordIds(new Set());
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}><CircularProgress /></Box>;
  }

  if (error) {
    return <Container sx={{ py: 4 }}><Alert severity="error">{error}</Alert></Container>;
  }

  const renderRecordList = () => {
    if (isMobile) {
      return (
        <Grid container spacing={0} sx={{ width: '100%' }}>
          {displayedRecords.map((record) => (
            <Grid key={record.id} sx={{ width: '100%' }}>
              <Link href={`/edit/${record.id}`} passHref style={{ textDecoration: 'none', color: 'inherit' }}>
                <Card sx={{ width: '100%', mb: 2, cursor: 'pointer' }}>
                  <CardContent>
                    {isDeleteMode && (
                      <Checkbox
                        color="primary"
                        checked={selectedRecordIds.has(record.id)}
                        onChange={(e) => {
                          e.preventDefault();
                          handleCheckboxChange(record.id, e.target.checked)
                        }}
                        sx={{ position: 'absolute', top: 8, right: 8 }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                    {record.games ? (
                      <>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(record.games.date).toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                        </Typography>
                        <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} sx={{ my: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {getTeamLogoSrc(record.games.home_team) && <Avatar src={getTeamLogoSrc(record.games.home_team)} alt={record.games.home_team} sx={{ width: 24, height: 24 }} />}
                            <Typography variant="subtitle1" component="span">{record.games.home_team}</Typography>
                          </Box>
                          <Typography variant="subtitle1" component="span">vs</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {getTeamLogoSrc(record.games.away_team) && <Avatar src={getTeamLogoSrc(record.games.away_team)} alt={record.games.away_team} sx={{ width: 24, height: 24 }} />}
                            <Typography variant="subtitle1" component="span">{record.games.away_team}</Typography>
                          </Box>
                        </Stack>
                        <Typography variant="h5" align="center" sx={{ my: 1, fontFamily: 'Noto Sans JP', fontWeight: 'bold' }}>
                          {record.games.home_score} - {record.games.away_score}
                          <Box component="span" ml={1.5}>{getWinLossIndicator(record)}</Box>
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {record.place}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          勝: {record.games.winning_pitcher} 敗: {record.games.losing_pitcher}
                        </Typography>
                        <Typography sx={{ whiteSpace: 'pre-wrap', mt: 1 }}>{record.memo || ''}</Typography>
                      </>
                    ) : (
                      <Typography>試合情報がありません</Typography>
                    )}
                  </CardContent>
                </Card>
              </Link>
            </Grid>
          ))}
        </Grid>
      );
    }

    return (
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650, tableLayout: 'fixed' }} aria-label="simple table">
          <TableHead>
            <TableRow>
              {isDeleteMode && <TableCell padding="checkbox" sx={{ width: '48px' }}></TableCell>}
              <TableCell sx={{ width: '120px' }}>日付</TableCell>
              <TableCell sx={{ width: '300px' }}>対戦</TableCell>
              <TableCell sx={{ width: '120px', textAlign: 'center' }}>スコア</TableCell>
              <TableCell sx={{ width: '150px' }}>球場</TableCell>
              <TableCell sx={{ width: '120px' }}>勝ち投手</TableCell>
              <TableCell sx={{ width: '120px' }}>負け投手</TableCell>
              <TableCell sx={{ width: '200px' }}>メモ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {displayedRecords.map((record) => (
              <TableRow 
                key={record.id} 
                hover 
                onClick={() => !isDeleteMode && router.push(`/edit/${record.id}`)}
                sx={{ cursor: isDeleteMode ? 'default' : 'pointer' }}
              >
                {isDeleteMode && (
                  <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      color="primary"
                      checked={selectedRecordIds.has(record.id)}
                      onChange={(e) => handleCheckboxChange(record.id, e.target.checked)}
                    />
                  </TableCell>
                )}
                {record.games ? (
                  <> 
                    <TableCell component="th" scope="row">
                      {new Date(record.games.date).toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getTeamLogoSrc(record.games.home_team) && <Avatar src={getTeamLogoSrc(record.games.home_team)} alt={record.games.home_team} sx={{ width: 32, height: 32 }} />}
                          {record.games.home_team}
                        </Box>
                        vs
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getTeamLogoSrc(record.games.away_team) && <Avatar src={getTeamLogoSrc(record.games.away_team)} alt={record.games.away_team} sx={{ width: 32, height: 32 }} />}
                          {record.games.away_team}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {record.games.home_score} - {record.games.away_score}
                        <Box component="span" ml={1.5}>{getWinLossIndicator(record)}</Box>
                      </Box>
                    </TableCell>
                    <TableCell>{record.place}</TableCell>
                    <TableCell>{record.games.winning_pitcher}</TableCell>
                    <TableCell>{record.games.losing_pitcher}</TableCell>
                    <TableCell sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{record.memo || ''}</TableCell>
                  </>
                ) : (
                  <TableCell colSpan={isDeleteMode ? 8 : 7}>試合情報がありません</TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Container maxWidth="lg" disableGutters sx={{ py: 4, px: isMobile ? 2.5 : 0 }}>
      <Typography variant="h3" component="h1" gutterBottom align="center" fontWeight="bold">
        Baseball Game Record
      </Typography>

      <Paper elevation={2} sx={{ p: 2, mb: 4 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={2} alignItems="center">
            <FormControl sx={{ minWidth: 240 }}>
              <InputLabel id="favorite-team-label">応援球団</InputLabel>
              <Select
                labelId="favorite-team-label"
                value={favoriteTeam || ''}
                label="応援球団"
                onChange={(e) => setFavoriteTeam(e.target.value || null)}
              >
                <MenuItem value=""><em>選択してください</em></MenuItem>
                {NPB_TEAMS.map(team => (
                  <MenuItem key={team} value={team}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getTeamLogoSrc(team) && <Avatar src={getTeamLogoSrc(team)} alt={team} sx={{ width: 32, height: 32 }} />}
                      {team}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel id="year-select-label">年</InputLabel>
              <Select
                labelId="year-select-label"
                value={selectedYear}
                label="年"
                onChange={(e) => setSelectedYear(e.target.value as number)}
              >
                {availableYears.map(year => (
                  <MenuItem key={year} value={year}>{year}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', justifyContent: { xs: 'center', sm: 'flex-end' } }}>
            {favoriteTeam && getTeamLogoSrc(favoriteTeam) && <Avatar src={getTeamLogoSrc(favoriteTeam)} alt={favoriteTeam} sx={{ width: 40, height: 40 }} />}
            {favoriteTeam ? (
              <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'center', sm: 'baseline' }} spacing={{ xs: 0, sm: 1 }}>
                <Typography variant="h6">{`${selectedYear}年 ${favoriteTeam}の観戦成績: `}</Typography>
                <Typography variant="h6">
                  <Box component="span" sx={{ fontSize: '1.7em' }}>{wins}</Box>勝
                  <Box component="span" sx={{ fontSize: '1.7em', ml: 1 }}>{losses}</Box>敗
                  <Box component="span" sx={{ ml: 2 }}>{`勝率: `}</Box>
                  <Box component="span" sx={{ fontSize: '1.7em' }}>{winningPercentage}</Box>
                </Typography>
              </Stack>
            ) : '応援球団を選択してください'}
          </Box>
        </Stack>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 2, flexDirection: isMobile ? 'column' : 'row' }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <FormControl sx={{ minWidth: 120 }} size="small">
            <InputLabel id="sort-order-label">日付順</InputLabel>
            <Select
              labelId="sort-order-label"
              value={sortOrder}
              label="日付順"
              onChange={(e: SelectChangeEvent) => setSortOrder(e.target.value)}
            >
              <MenuItem value="asc">古い順</MenuItem>
              <MenuItem value="desc">新しい順</MenuItem>
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 150 }} size="small">
            <InputLabel id="opponent-select-label">対戦相手</InputLabel>
            <Select
              labelId="opponent-select-label"
              value={selectedOpponent}
              label="対戦相手"
              onChange={(e) => setSelectedOpponent(e.target.value as string)}
            >
              <MenuItem value=""><em>全チーム</em></MenuItem>
              {NPB_TEAMS.map(team => (
                <MenuItem key={team} value={team}>{team}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        <Stack direction="row" spacing={2}>
          {!isDeleteMode ? (
            <>
              <Button component={Link} href="/new" variant="contained" color="primary" startIcon={<AddIcon />}>
                新しい記録を追加
              </Button>
              <Button variant="outlined" color="error" onClick={toggleDeleteMode} startIcon={<DeleteIcon />}>
                削除
              </Button>
            </>
          ) : (
            <>
              <Button variant="contained" color="error" onClick={handleDeleteSelected} disabled={selectedRecordIds.size === 0}>
                選択した記録を削除 ({selectedRecordIds.size})
              </Button>
              <Button variant="outlined" onClick={toggleDeleteMode} startIcon={<CancelIcon />}>
                キャンセル
              </Button>
            </>
          )}
        </Stack>
      </Box>

      {displayedRecords.length === 0 ? (
        <Typography align="center" color="text.secondary" sx={{ mt: 8 }}>
          まだ観戦記録がありません。新しい記録を追加しましょう！
        </Typography>
      ) : (
        renderRecordList()
      )}
    </Container>
  );
}