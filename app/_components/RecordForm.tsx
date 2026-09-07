'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AppBar,
  Toolbar,
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
  Avatar,
  IconButton,
} from '@mui/material';
import { ArrowBack as BackIcon, DeleteOutline as DeleteIcon } from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/ja';

import { getTeamLogoSrc } from '@/lib/teams';
import { formatIsoDate } from '@/lib/date';
import type { Game } from '@/lib/types';
import { ensureGamesForDate, createRecord, updateRecord, deleteRecords } from '@/app/actions';

interface Props {
  mode: 'new' | 'edit';
  recordId?: number;
  initialDate?: string;
  initialGameId?: number;
  initialMemo?: string;
}

function GameOption({ game }: { game: Game }) {
  return (
    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ minWidth: 0 }}>
      <Avatar src={getTeamLogoSrc(game.home_team)} alt="" sx={{ width: 20, height: 20 }} />
      <Typography component="span" noWrap>
        {game.home_team}
      </Typography>
      <Typography component="span" color="text.secondary">
        {game.home_score ?? '-'}–{game.away_score ?? '-'}
      </Typography>
      <Avatar src={getTeamLogoSrc(game.away_team)} alt="" sx={{ width: 20, height: 20 }} />
      <Typography component="span" noWrap>
        {game.away_team}
      </Typography>
    </Stack>
  );
}

export default function RecordForm({
  mode,
  recordId,
  initialDate,
  initialGameId,
  initialMemo = '',
}: Props) {
  const router = useRouter();

  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(
    initialDate ? dayjs(initialDate) : null,
  );
  const [gamesOnDate, setGamesOnDate] = useState<Game[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string>(
    initialGameId != null ? String(initialGameId) : '',
  );
  const [memo, setMemo] = useState(initialMemo);

  const [loadingGames, setLoadingGames] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!selectedDate) setSelectedDate(dayjs());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedDate) return;
    const date = selectedDate.format('YYYY-MM-DD');
    let cancelled = false;

    setLoadingGames(true);
    setError(null);
    ensureGamesForDate(date)
      .then((games) => {
        if (cancelled) return;
        setGamesOnDate(games);
        setSelectedGameId((prev) => (games.some((g) => String(g.id) === prev) ? prev : ''));
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : '試合データの取得に失敗しました');
      })
      .finally(() => {
        if (!cancelled) setLoadingGames(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedDate]);

  const selectedGame = gamesOnDate.find((g) => String(g.id) === selectedGameId) ?? null;
  const handleGameChange = (e: SelectChangeEvent) => setSelectedGameId(e.target.value);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGame) return;
    setError(null);
    startTransition(async () => {
      try {
        if (mode === 'new') {
          await createRecord({ gameId: selectedGame.id, memo });
          router.push('/?flash=created');
        } else {
          await updateRecord(recordId!, { gameId: selectedGame.id, memo });
          router.push('/?flash=updated');
        }
        router.refresh();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : '保存に失敗しました');
      }
    });
  };

  const handleDelete = () => {
    if (mode !== 'edit' || recordId == null) return;
    if (!window.confirm('この記録を削除しますか？')) return;
    setError(null);
    startTransition(async () => {
      try {
        await deleteRecords([recordId]);
        router.push('/?flash=deleted');
        router.refresh();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : '削除に失敗しました');
      }
    });
  };

  const busy = isPending || loadingGames;

  return (
    <>
      <AppBar position="sticky">
        <Container maxWidth="sm" disableGutters>
          <Toolbar sx={{ gap: 1 }}>
            <IconButton edge="start" component={Link} href="/" aria-label="戻る" color="inherit">
              <BackIcon />
            </IconButton>
            <Typography variant="h6" component="h1" sx={{ flexGrow: 1 }}>
              {mode === 'new' ? '観戦記録を追加' : '観戦記録を編集'}
            </Typography>
            {mode === 'edit' && (
              <IconButton onClick={handleDelete} disabled={busy} aria-label="削除" color="inherit">
                <DeleteIcon />
              </IconButton>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      <Container maxWidth="sm" sx={{ py: 3, px: { xs: 1.5, sm: 3 } }}>
        <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Stack spacing={2.5}>
              <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ja">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <DatePicker
                    label="観戦日"
                    value={selectedDate}
                    onChange={(v) => setSelectedDate(v)}
                    slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                  />
                  {loadingGames && <CircularProgress size={22} />}
                </Box>
              </LocalizationProvider>

              <FormControl fullWidth required size="small" disabled={busy || gamesOnDate.length === 0}>
                <InputLabel id="game-select-label">試合</InputLabel>
                <Select
                  labelId="game-select-label"
                  value={selectedGameId}
                  label="試合"
                  onChange={handleGameChange}
                  renderValue={(id) => {
                    const g = gamesOnDate.find((x) => String(x.id) === id);
                    return g ? <GameOption game={g} /> : '';
                  }}
                >
                  {gamesOnDate.length === 0 ? (
                    <MenuItem value="" disabled>
                      この日の試合はありません
                    </MenuItem>
                  ) : (
                    [
                      <MenuItem key="placeholder" value="">
                        <em>試合を選択</em>
                      </MenuItem>,
                      ...gamesOnDate.map((game) => (
                        <MenuItem key={game.id} value={String(game.id)}>
                          <GameOption game={game} />
                        </MenuItem>
                      )),
                    ]
                  )}
                </Select>
              </FormControl>

              {selectedGame && <GamePreview game={selectedGame} />}

              <TextField
                label="メモ"
                multiline
                rows={5}
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="観戦の感想や詳細"
                fullWidth
                size="small"
              />

              <Stack direction="row" spacing={1.5} justifyContent="flex-end">
                <Button component={Link} href="/" variant="text" color="inherit" disabled={busy}>
                  キャンセル
                </Button>
                <Button type="submit" variant="contained" disabled={busy || !selectedGame}>
                  {mode === 'new' ? '保存' : '更新'}
                </Button>
              </Stack>
            </Stack>
          </Box>
        </Paper>
      </Container>
    </>
  );
}

function GamePreview({ game }: { game: Game }) {
  const row = (team: string, score: number | null, win: boolean) => (
    <Stack direction="row" alignItems="center" spacing={1.25} sx={{ py: 0.5, opacity: score != null && !win ? 0.7 : 1 }}>
      <Avatar src={getTeamLogoSrc(team)} alt="" sx={{ width: 26, height: 26 }} />
      <Typography sx={{ flexGrow: 1, fontWeight: win ? 700 : 500 }}>{team}</Typography>
      <Typography
        sx={{
          fontFamily: 'var(--font-tektur), sans-serif',
          fontWeight: 700,
          fontSize: '1.35rem',
          color: win ? 'primary.main' : 'text.primary',
        }}
      >
        {score ?? '-'}
      </Typography>
    </Stack>
  );
  const decided = game.home_score != null && game.away_score != null;
  return (
    <Paper
      variant="outlined"
      sx={{ p: 1.75, borderRadius: 2, bgcolor: 'action.hover', borderStyle: 'dashed' }}
    >
      <Typography variant="caption" color="text.secondary">
        {formatIsoDate(game.date)}
        {game.stadium ? ` ・ ${game.stadium}` : ''}
      </Typography>
      {row(game.home_team, game.home_score, decided && game.home_score! > game.away_score!)}
      {row(game.away_team, game.away_score, decided && game.away_score! > game.home_score!)}
      {(game.winning_pitcher || game.losing_pitcher) && (
        <Typography variant="caption" color="text.secondary">
          勝 {game.winning_pitcher ?? '-'} ／ 敗 {game.losing_pitcher ?? '-'}
        </Typography>
      )}
    </Paper>
  );
}
