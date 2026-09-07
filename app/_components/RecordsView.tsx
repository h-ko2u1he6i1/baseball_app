'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Container,
  Typography,
  Box,
  Alert,
  Snackbar,
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
  Avatar,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  CardActionArea,
  SelectChangeEvent,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { Add as AddIcon, Delete as DeleteIcon, Cancel as CancelIcon } from '@mui/icons-material';

import { NPB_TEAMS, getTeamLogoSrc } from '@/lib/teams';
import { formatIsoDate } from '@/lib/date';
import { gameYear, winLoss, formatWinPct, tallyWinLoss } from '@/lib/stats';
import type { RecordWithGame } from '@/lib/types';
import { deleteRecords } from '@/app/actions';

type SortOrder = 'asc' | 'desc';

const FLASH_MESSAGES: Record<string, string> = {
  created: '記録を追加しました',
  updated: '記録を更新しました',
  deleted: '記録を削除しました',
};

export default function RecordsView({ initialRecords }: { initialRecords: RecordWithGame[] }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'), { noSsr: true });
  const router = useRouter();
  const searchParams = useSearchParams();

  const [favoriteTeam, setFavoriteTeam] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedOpponent, setSelectedOpponent] = useState<string>('');

  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // 追加/更新/削除後のトースト（?flash= を読んで URL は消す）
  useEffect(() => {
    const key = searchParams.get('flash');
    if (key && FLASH_MESSAGES[key]) {
      setFlash(FLASH_MESSAGES[key]);
      router.replace('/', { scroll: false });
    }
  }, [searchParams, router]);

  // 応援球団の永続化
  useEffect(() => {
    const stored = localStorage.getItem('favoriteTeam');
    if (stored && (NPB_TEAMS as readonly string[]).includes(stored)) setFavoriteTeam(stored);
  }, []);
  useEffect(() => {
    if (favoriteTeam) localStorage.setItem('favoriteTeam', favoriteTeam);
    else localStorage.removeItem('favoriteTeam');
  }, [favoriteTeam]);

  const availableYears = useMemo(() => {
    const set = new Set<number>();
    for (const r of initialRecords) {
      const y = gameYear(r);
      if (y) set.add(y);
    }
    return [...set].sort((a, b) => b - a);
  }, [initialRecords]);

  // 選択中の年が候補に無ければ最新年を使う（state は書き換えず派生値で吸収）
  const effectiveYear =
    availableYears.length > 0 && !availableYears.includes(selectedYear)
      ? availableYears[0]
      : selectedYear;

  const displayedRecords = useMemo(() => {
    let rows = initialRecords.filter((r) => gameYear(r) === effectiveYear);
    if (favoriteTeam) {
      rows = rows.filter(
        (r) => r.games && (r.games.home_team === favoriteTeam || r.games.away_team === favoriteTeam),
      );
    }
    if (selectedOpponent) {
      rows = rows.filter(
        (r) =>
          r.games &&
          (r.games.home_team === selectedOpponent || r.games.away_team === selectedOpponent),
      );
    }
    return [...rows].sort((a, b) => {
      const da = a.games?.date ?? '';
      const db = b.games?.date ?? '';
      return sortOrder === 'asc' ? da.localeCompare(db) : db.localeCompare(da);
    });
  }, [initialRecords, effectiveYear, favoriteTeam, selectedOpponent, sortOrder]);

  const { wins, losses } = useMemo(
    () => tallyWinLoss(displayedRecords, favoriteTeam),
    [displayedRecords, favoriteTeam],
  );
  const winningPercentage = formatWinPct(wins, losses);

  const toggleId = (id: number, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const toggleDeleteMode = () => {
    setIsDeleteMode((v) => !v);
    setSelectedIds(new Set());
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    setError(null);
    startTransition(async () => {
      try {
        await deleteRecords([...selectedIds]);
        setSelectedIds(new Set());
        setIsDeleteMode(false);
        setFlash(FLASH_MESSAGES.deleted);
        router.refresh();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : '削除に失敗しました');
      }
    });
  };

  const winLossMark = (r: RecordWithGame) => {
    if (!favoriteTeam) return null;
    const res = winLoss(r, favoriteTeam);
    if (res === 'win')
      return (
        <Typography component="span" sx={{ color: 'success.main' }} fontWeight="bold" aria-label="勝ち">
          ⚪
        </Typography>
      );
    if (res === 'loss')
      return (
        <Typography component="span" color="text.primary" fontWeight="bold" aria-label="負け">
          ⚫
        </Typography>
      );
    return null;
  };

  const renderMobile = () => (
    <Grid container spacing={0} sx={{ width: '100%' }}>
      {displayedRecords.map((record) => {
        const body = record.games ? (
          <>
            <Typography variant="body2" color="text.secondary">
              {formatIsoDate(record.games.date)}
            </Typography>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="center"
              spacing={1}
              sx={{ my: 1 }}
            >
              <TeamChip name={record.games.home_team} />
              <Typography component="span">vs</Typography>
              <TeamChip name={record.games.away_team} />
            </Stack>
            <Typography variant="h5" align="center" sx={{ my: 1, fontWeight: 'bold' }}>
              {record.games.home_score} - {record.games.away_score}
              <Box component="span" ml={1.5}>
                {winLossMark(record)}
              </Box>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {record.place}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              勝: {record.games.winning_pitcher ?? '-'} 敗: {record.games.losing_pitcher ?? '-'}
            </Typography>
            <Typography sx={{ whiteSpace: 'pre-wrap', mt: 1 }}>{record.memo || ''}</Typography>
          </>
        ) : (
          <Typography>試合情報がありません</Typography>
        );

        return (
          <Grid key={record.id} sx={{ width: '100%' }}>
            <Card sx={{ width: '100%', mb: 2, position: 'relative' }}>
              {isDeleteMode ? (
                <CardActionArea
                  onClick={() => toggleId(record.id, !selectedIds.has(record.id))}
                  aria-label="削除対象として選択"
                >
                  <CardContent>
                    <Checkbox
                      color="primary"
                      checked={selectedIds.has(record.id)}
                      tabIndex={-1}
                      sx={{ position: 'absolute', top: 8, right: 8, pointerEvents: 'none' }}
                    />
                    {body}
                  </CardContent>
                </CardActionArea>
              ) : (
                <CardActionArea component={Link} href={`/edit/${record.id}`}>
                  <CardContent>{body}</CardContent>
                </CardActionArea>
              )}
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );

  const renderDesktop = () => (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 650, tableLayout: 'fixed' }}>
        <TableHead>
          <TableRow>
            {isDeleteMode && <TableCell padding="checkbox" sx={{ width: 48 }} />}
            <TableCell sx={{ width: 120 }}>日付</TableCell>
            <TableCell sx={{ width: 300 }}>対戦</TableCell>
            <TableCell sx={{ width: 120, textAlign: 'center' }}>スコア</TableCell>
            <TableCell sx={{ width: 150 }}>球場</TableCell>
            <TableCell sx={{ width: 120 }}>勝ち投手</TableCell>
            <TableCell sx={{ width: 120 }}>負け投手</TableCell>
            <TableCell sx={{ width: 200 }}>メモ</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {displayedRecords.map((record) => {
            const open = () => router.push(`/edit/${record.id}`);
            return (
              <TableRow
                key={record.id}
                hover
                tabIndex={isDeleteMode ? -1 : 0}
                role={isDeleteMode ? undefined : 'link'}
                onClick={() => !isDeleteMode && open()}
                onKeyDown={(e) => {
                  if (!isDeleteMode && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    open();
                  }
                }}
                sx={{ cursor: isDeleteMode ? 'default' : 'pointer' }}
              >
                {isDeleteMode && (
                  <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      color="primary"
                      checked={selectedIds.has(record.id)}
                      onChange={(e) => toggleId(record.id, e.target.checked)}
                    />
                  </TableCell>
                )}
                {record.games ? (
                  <>
                    <TableCell>{formatIsoDate(record.games.date)}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TeamChip name={record.games.home_team} size={32} />
                        vs
                        <TeamChip name={record.games.away_team} size={32} />
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      {record.games.home_score} - {record.games.away_score}
                      <Box component="span" ml={1.5}>
                        {winLossMark(record)}
                      </Box>
                    </TableCell>
                    <TableCell>{record.place}</TableCell>
                    <TableCell>{record.games.winning_pitcher ?? '-'}</TableCell>
                    <TableCell>{record.games.losing_pitcher ?? '-'}</TableCell>
                    <TableCell sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {record.memo || ''}
                    </TableCell>
                  </>
                ) : (
                  <TableCell colSpan={isDeleteMode ? 8 : 7}>試合情報がありません</TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Container maxWidth="lg" disableGutters sx={{ py: 4, px: isMobile ? 2.5 : 0 }}>
      <Typography variant="h3" component="h1" gutterBottom align="center" fontWeight="bold">
        Baseball Game Record
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Snackbar
        open={flash != null}
        autoHideDuration={3000}
        onClose={() => setFlash(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled" onClose={() => setFlash(null)}>
          {flash}
        </Alert>
      </Snackbar>

      <Paper elevation={2} sx={{ p: 2, mb: 4 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          justifyContent="space-between"
          alignItems="center"
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel id="favorite-team-label">応援球団</InputLabel>
              <Select
                labelId="favorite-team-label"
                value={favoriteTeam ?? ''}
                label="応援球団"
                onChange={(e) => setFavoriteTeam(e.target.value || null)}
              >
                <MenuItem value="">
                  <em>選択してください</em>
                </MenuItem>
                {NPB_TEAMS.map((team) => (
                  <MenuItem key={team} value={team}>
                    <TeamChip name={team} size={28} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 110 }}>
              <InputLabel id="year-select-label">年</InputLabel>
              <Select
                labelId="year-select-label"
                value={availableYears.includes(effectiveYear) ? effectiveYear : ''}
                label="年"
                onChange={(e) => setSelectedYear(Number(e.target.value))}
              >
                {availableYears.map((year) => (
                  <MenuItem key={year} value={year}>
                    {year}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          <Box sx={{ textAlign: { xs: 'center', sm: 'right' } }}>
            {favoriteTeam ? (
              <Typography variant="h6">
                {`${effectiveYear}年 ${favoriteTeam}の観戦成績: `}
                <Box component="span" sx={{ fontSize: '1.5em' }}>
                  {wins}
                </Box>
                勝
                <Box component="span" sx={{ fontSize: '1.5em', ml: 1 }}>
                  {losses}
                </Box>
                敗
                <Box component="span" sx={{ ml: 2 }}>
                  勝率:{' '}
                </Box>
                <Box component="span" sx={{ fontSize: '1.5em' }}>
                  {winningPercentage}
                </Box>
              </Typography>
            ) : (
              '応援球団を選択してください'
            )}
          </Box>
        </Stack>
      </Paper>

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
          gap: 2,
          flexDirection: isMobile ? 'column' : 'row',
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <FormControl sx={{ minWidth: 120 }} size="small">
            <InputLabel id="sort-order-label">日付順</InputLabel>
            <Select
              labelId="sort-order-label"
              value={sortOrder}
              label="日付順"
              onChange={(e: SelectChangeEvent) => setSortOrder(e.target.value as SortOrder)}
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
              onChange={(e) => setSelectedOpponent(e.target.value)}
            >
              <MenuItem value="">
                <em>全チーム</em>
              </MenuItem>
              {NPB_TEAMS.map((team) => (
                <MenuItem key={team} value={team}>
                  {team}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        <Stack direction="row" spacing={2}>
          {!isDeleteMode ? (
            <>
              <Button
                component={Link}
                href="/new"
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
              >
                新しい記録を追加
              </Button>
              <Button
                variant="outlined"
                color="error"
                onClick={toggleDeleteMode}
                startIcon={<DeleteIcon />}
              >
                削除
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="contained"
                color="error"
                onClick={handleDeleteSelected}
                disabled={selectedIds.size === 0 || isPending}
              >
                選択した記録を削除 ({selectedIds.size})
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
      ) : isMobile ? (
        renderMobile()
      ) : (
        renderDesktop()
      )}
    </Container>
  );
}

function TeamChip({ name, size = 24 }: { name: string; size?: number }) {
  const src = getTeamLogoSrc(name);
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      {src && <Avatar src={src} alt={name} sx={{ width: size, height: size }} />}
      <Typography component="span" variant="subtitle1">
        {name}
      </Typography>
    </Box>
  );
}
