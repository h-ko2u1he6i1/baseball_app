'use client';

import { useEffect, useState, useTransition } from 'react';
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
  Avatar,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/ja';

import { getTeamLogoSrc } from '@/lib/teams';
import type { Game } from '@/lib/types';
import { ensureGamesForDate, createRecord, updateRecord, deleteRecords } from '@/app/actions';

interface Props {
  mode: 'new' | 'edit';
  recordId?: number;
  initialDate?: string; // YYYY-MM-DD
  initialGameId?: number;
  initialMemo?: string;
}

function TeamLabel({ name, size = 24 }: { name: string; size?: number }) {
  const src = getTeamLogoSrc(name);
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {src && <Avatar src={src} alt={name} sx={{ width: size, height: size }} />}
      {name}
    </Box>
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

  // 初回マウント時、日付未指定なら今日をセット（SSR とのハイドレーション不整合回避のため effect 内で）
  useEffect(() => {
    if (!selectedDate) setSelectedDate(dayjs());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 日付が変わるたびに、その日の試合を取得（DB に無ければサーバー側でスクレイピング）
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
        // 現在の選択がその日の試合に無ければクリア
        setSelectedGameId((prev) =>
          games.some((g) => String(g.id) === prev) ? prev : '',
        );
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
        } else {
          await updateRecord(recordId!, { gameId: selectedGame.id, memo });
        }
        router.push('/');
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
        router.push('/');
        router.refresh();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : '削除に失敗しました');
      }
    });
  };

  const renderGameItem = (game: Game) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <TeamLabel name={game.home_team} />
      vs
      <TeamLabel name={game.away_team} />
      {` (${game.home_score ?? '-'}-${game.away_score ?? '-'})`}
    </Box>
  );

  const busy = isPending || loadingGames;

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" fontWeight="bold">
          {mode === 'new' ? 'New Games' : '記録を編集'}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Stack spacing={3} mt={2}>
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ja">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <DatePicker
                  label="日付"
                  value={selectedDate}
                  onChange={(v) => setSelectedDate(v)}
                  slotProps={{ textField: { fullWidth: true } }}
                />
                {loadingGames && <CircularProgress size={24} />}
              </Box>
            </LocalizationProvider>

            <FormControl fullWidth required disabled={busy || gamesOnDate.length === 0}>
              <InputLabel id="game-select-label">試合を選択</InputLabel>
              <Select
                labelId="game-select-label"
                value={selectedGameId}
                label="試合を選択"
                onChange={handleGameChange}
                renderValue={(id) => {
                  const g = gamesOnDate.find((x) => String(x.id) === id);
                  return g ? renderGameItem(g) : '';
                }}
              >
                {gamesOnDate.length === 0 ? (
                  <MenuItem value="" disabled>
                    選択できる試合がありません
                  </MenuItem>
                ) : (
                  [
                    <MenuItem key="placeholder" value="">
                      <em>試合を選択してください</em>
                    </MenuItem>,
                    ...gamesOnDate.map((game) => (
                      <MenuItem key={game.id} value={String(game.id)}>
                        {renderGameItem(game)}
                      </MenuItem>
                    )),
                  ]
                )}
              </Select>
            </FormControl>

            <TextField
              label="球場"
              value={selectedGame?.stadium ?? ''}
              InputProps={{ readOnly: true }}
              fullWidth
              disabled={!selectedGame?.stadium}
            />
            <TextField
              label="勝ち投手"
              value={selectedGame?.winning_pitcher ?? ''}
              InputProps={{ readOnly: true }}
              fullWidth
              disabled={!selectedGame?.winning_pitcher}
            />
            <TextField
              label="負け投手"
              value={selectedGame?.losing_pitcher ?? ''}
              InputProps={{ readOnly: true }}
              fullWidth
              disabled={!selectedGame?.losing_pitcher}
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

            <Stack direction="row" spacing={2} justifyContent="space-between">
              {mode === 'edit' ? (
                <Button color="error" variant="outlined" onClick={handleDelete} disabled={busy}>
                  削除
                </Button>
              ) : (
                <span />
              )}
              <Stack direction="row" spacing={2}>
                <Button variant="outlined" onClick={() => router.push('/')} disabled={busy}>
                  キャンセル
                </Button>
                <Button type="submit" variant="contained" disabled={busy || !selectedGame}>
                  {mode === 'new' ? '記録を保存' : '記録を更新'}
                </Button>
              </Stack>
            </Stack>
          </Stack>
        </Box>
      </Paper>
    </Container>
  );
}
