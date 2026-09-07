'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
  Card,
  CardActionArea,
  Avatar,
  Chip,
  LinearProgress,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  Add as AddIcon,
  DeleteOutline as DeleteIcon,
  Close as CloseIcon,
  SportsBaseball as BallIcon,
} from '@mui/icons-material';

import { NPB_TEAMS, getTeamLogoSrc, getTeamColor } from '@/lib/teams';
import { formatIsoDate } from '@/lib/date';
import { gameYear, winLoss, formatWinPct, tallyWinLoss } from '@/lib/stats';
import type { RecordWithGame } from '@/lib/types';
import { deleteRecords } from '@/app/actions';
import { useApp } from './AppProviders';
import ThemeModeToggle from './ThemeModeToggle';

type SortOrder = 'asc' | 'desc';

const FLASH_MESSAGES: Record<string, string> = {
  created: '記録を追加しました',
  updated: '記録を更新しました',
  deleted: '記録を削除しました',
};

export default function RecordsView({ initialRecords }: { initialRecords: RecordWithGame[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { favoriteTeam, setFavoriteTeam } = useApp();

  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedOpponent, setSelectedOpponent] = useState<string>('');

  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const key = searchParams.get('flash');
    if (key && FLASH_MESSAGES[key]) {
      setFlash(FLASH_MESSAGES[key]);
      router.replace('/', { scroll: false });
    }
  }, [searchParams, router]);

  const availableYears = useMemo(() => {
    const set = new Set<number>();
    for (const r of initialRecords) {
      const y = gameYear(r);
      if (y) set.add(y);
    }
    return [...set].sort((a, b) => b - a);
  }, [initialRecords]);

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
  const totalDecided = wins + losses;
  const winPct = formatWinPct(wins, losses);

  const toggleId = (id: number) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const exitDeleteMode = () => {
    setIsDeleteMode(false);
    setSelectedIds(new Set());
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    setError(null);
    startTransition(async () => {
      try {
        await deleteRecords([...selectedIds]);
        exitDeleteMode();
        setFlash(FLASH_MESSAGES.deleted);
        router.refresh();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : '削除に失敗しました');
      }
    });
  };

  return (
    <>
      <HeroHeader />

      <Container
        maxWidth="md"
        sx={{
          pb: { xs: 3, sm: 4 },
          px: { xs: 1.5, sm: 3 },
          mt: { xs: -4, sm: -6 },
          position: 'relative',
        }}
      >
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

        <StatHero
          favoriteTeam={favoriteTeam}
          onChangeFavorite={setFavoriteTeam}
          year={effectiveYear}
          years={availableYears}
          onChangeYear={setSelectedYear}
          wins={wins}
          losses={losses}
          totalDecided={totalDecided}
          winPct={winPct}
        />

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          justifyContent="space-between"
          sx={{ mt: 3, mb: 2 }}
        >
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <ToggleButtonGroup
              size="small"
              exclusive
              value={sortOrder}
              onChange={(_, v: SortOrder | null) => v && setSortOrder(v)}
            >
              <ToggleButton value="desc">新しい順</ToggleButton>
              <ToggleButton value="asc">古い順</ToggleButton>
            </ToggleButtonGroup>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel id="opp">対戦相手</InputLabel>
              <Select
                labelId="opp"
                label="対戦相手"
                value={selectedOpponent}
                onChange={(e) => setSelectedOpponent(e.target.value)}
              >
                <MenuItem value="">
                  <em>全チーム</em>
                </MenuItem>
                {NPB_TEAMS.map((t) => (
                  <MenuItem key={t} value={t}>
                    {t}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          {!isDeleteMode ? (
            <Stack direction="row" spacing={1}>
              <Button
                component={Link}
                href="/new"
                variant="contained"
                startIcon={<AddIcon />}
                sx={{ flexGrow: { xs: 1, sm: 0 }, whiteSpace: 'nowrap' }}
              >
                記録を追加
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                onClick={() => setIsDeleteMode(true)}
                startIcon={<DeleteIcon />}
                sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}
              >
                削除
              </Button>
            </Stack>
          ) : (
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                color="error"
                onClick={handleDeleteSelected}
                disabled={selectedIds.size === 0 || isPending}
                sx={{ flexGrow: { xs: 1, sm: 0 }, whiteSpace: 'nowrap' }}
              >
                {selectedIds.size} 件を削除
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                onClick={exitDeleteMode}
                startIcon={<CloseIcon />}
                sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}
              >
                キャンセル
              </Button>
            </Stack>
          )}
        </Stack>

        {displayedRecords.length === 0 ? (
          <EmptyState />
        ) : (
          <Stack spacing={1.5}>
            {displayedRecords.map((record) => (
              <ScoreboardCard
                key={record.id}
                record={record}
                favoriteTeam={favoriteTeam}
                deleteMode={isDeleteMode}
                selected={selectedIds.has(record.id)}
                onToggle={() => toggleId(record.id)}
              />
            ))}
          </Stack>
        )}
      </Container>
    </>
  );
}

/* ------------------------------------------------------------------ */

function HeroHeader() {
  return (
    <Box
      component="header"
      sx={{ position: 'relative', height: { xs: 168, sm: 232 }, color: '#fff', overflow: 'hidden' }}
    >
      <Image
        src="/assets/ph.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        style={{ objectFit: 'cover', objectPosition: 'center 52%' }}
      />
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          backgroundImage: (t) =>
            `linear-gradient(180deg, rgba(2,6,12,0.5) 0%, rgba(2,6,12,0.05) 28%, rgba(2,6,12,0) 52%, ${
              t.vars?.palette.background.default ?? t.palette.background.default
            } 100%)`,
        }}
      />
      <Container
        maxWidth="md"
        sx={{ position: 'relative', px: { xs: 2, sm: 3 }, pt: { xs: 1.5, sm: 2 } }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <BallIcon />
          <Typography
            variant="h5"
            component="h1"
            sx={{
              flexGrow: 1,
              fontFamily: 'var(--font-tektur), sans-serif',
              letterSpacing: '-0.01em',
              textShadow: '0 2px 12px rgba(0,0,0,0.55)',
            }}
          >
            Baseball Record
          </Typography>
          <ThemeModeToggle />
        </Stack>
      </Container>
    </Box>
  );
}

/* ------------------------------------------------------------------ */

function StatHero(props: {
  favoriteTeam: string | null;
  onChangeFavorite: (t: string | null) => void;
  year: number;
  years: number[];
  onChangeYear: (y: number) => void;
  wins: number;
  losses: number;
  totalDecided: number;
  winPct: string;
}) {
  const { favoriteTeam, onChangeFavorite, year, years, onChangeYear } = props;
  const logo = favoriteTeam ? getTeamLogoSrc(favoriteTeam) : '';
  const accent = getTeamColor(favoriteTeam);
  const ratio = props.totalDecided > 0 ? (props.wins / props.totalDecided) * 100 : 0;

  return (
    <Paper
      sx={{
        p: { xs: 2, sm: 3 },
        borderRadius: 3,
        position: 'relative',
        overflow: 'hidden',
        border: 1,
        borderColor: 'divider',
        backgroundImage: `linear-gradient(135deg, ${accent}22, transparent 58%)`,
      }}
    >
      <Stack direction="row" spacing={1.5} sx={{ mb: favoriteTeam ? 2.5 : 0 }} flexWrap="wrap" useFlexGap>
        <FormControl size="small" sx={{ minWidth: 168 }}>
          <InputLabel id="fav">応援球団</InputLabel>
          <Select
            labelId="fav"
            label="応援球団"
            value={favoriteTeam ?? ''}
            onChange={(e) => onChangeFavorite(e.target.value || null)}
          >
            <MenuItem value="">
              <em>未選択</em>
            </MenuItem>
            {NPB_TEAMS.map((t) => (
              <MenuItem key={t} value={t}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Avatar src={getTeamLogoSrc(t)} alt="" sx={{ width: 22, height: 22 }} />
                  <span>{t}</span>
                </Stack>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 104 }}>
          <InputLabel id="year">年</InputLabel>
          <Select
            labelId="year"
            label="年"
            value={years.includes(year) ? year : ''}
            onChange={(e) => onChangeYear(Number(e.target.value))}
          >
            {years.length === 0 && (
              <MenuItem value={year} disabled>
                {year}
              </MenuItem>
            )}
            {years.map((y) => (
              <MenuItem key={y} value={y}>
                {y}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {favoriteTeam ? (
        <>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar src={logo} alt={favoriteTeam} sx={{ width: 52, height: 52 }} />
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {year}年 {favoriteTeam} の観戦成績
              </Typography>
              <Stack direction="row" spacing={2.5} alignItems="baseline" sx={{ mt: 0.5 }}>
                <Stat label="勝" value={props.wins} />
                <Stat label="敗" value={props.losses} />
                <Stat label="勝率" value={props.winPct} accent />
              </Stack>
            </Box>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={ratio}
            sx={{ mt: 2, height: 8, borderRadius: 999 }}
          />
        </>
      ) : (
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          応援球団を選ぶと、その年の観戦成績（勝敗・勝率）が表示されます。
        </Typography>
      )}
    </Paper>
  );
}

function Stat({ label, value, accent }: { label: string; value: number | string; accent?: boolean }) {
  return (
    <Box>
      <Typography
        component="span"
        sx={{
          fontFamily: 'var(--font-tektur), sans-serif',
          fontWeight: 700,
          fontSize: { xs: '1.7rem', sm: '2rem' },
          lineHeight: 1,
          color: accent ? 'primary.main' : 'text.primary',
        }}
      >
        {value}
      </Typography>
      <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
        {label}
      </Typography>
    </Box>
  );
}

/* ------------------------------------------------------------------ */

function ScoreboardCard({
  record,
  favoriteTeam,
  deleteMode,
  selected,
  onToggle,
}: {
  record: RecordWithGame;
  favoriteTeam: string | null;
  deleteMode: boolean;
  selected: boolean;
  onToggle: () => void;
}) {
  const g = record.games;
  const result = favoriteTeam && g ? winLoss(record, favoriteTeam) : null;

  const inner = (
    <Box sx={{ p: { xs: 1.75, sm: 2.25 } }}>
      {g ? (
        <>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.25 }}>
            <Chip size="small" label={formatIsoDate(g.date)} variant="outlined" />
            {g.stadium && (
              <Typography variant="caption" color="text.secondary" noWrap>
                {g.stadium}
              </Typography>
            )}
            <Box sx={{ flexGrow: 1 }} />
            {result && (
              <Chip
                size="small"
                label={result === 'win' ? '勝ち' : '負け'}
                color={result === 'win' ? 'success' : 'default'}
                variant={result === 'win' ? 'filled' : 'outlined'}
              />
            )}
          </Stack>

          <ScoreLine
            team={g.home_team}
            score={g.home_score}
            win={g.home_score != null && g.away_score != null && g.home_score > g.away_score}
            highlight={g.home_team === favoriteTeam}
          />
          <ScoreLine
            team={g.away_team}
            score={g.away_score}
            win={g.home_score != null && g.away_score != null && g.away_score > g.home_score}
            highlight={g.away_team === favoriteTeam}
          />

          {(g.winning_pitcher || g.losing_pitcher || record.memo) && (
            <Box sx={{ mt: 1.25, pt: 1.25, borderTop: 1, borderColor: 'divider' }}>
              {(g.winning_pitcher || g.losing_pitcher) && (
                <Typography variant="caption" color="text.secondary">
                  勝 {g.winning_pitcher ?? '-'} ／ 敗 {g.losing_pitcher ?? '-'}
                </Typography>
              )}
              {record.memo && (
                <Typography
                  variant="body2"
                  sx={{
                    mt: 0.5,
                    whiteSpace: 'pre-wrap',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {record.memo}
                </Typography>
              )}
            </Box>
          )}
        </>
      ) : (
        <Typography color="text.secondary">試合情報がありません</Typography>
      )}
    </Box>
  );

  return (
    <Card
      sx={{
        position: 'relative',
        ...(selected && { borderColor: 'primary.main', boxShadow: (t) => `0 0 0 1px ${t.palette.primary.main}` }),
        '&:hover': deleteMode ? {} : { transform: 'translateY(-2px)', borderColor: 'primary.main' },
      }}
    >
      {deleteMode ? (
        <CardActionArea onClick={onToggle} aria-label="削除対象の選択">
          {inner}
          <Checkbox
            checked={selected}
            tabIndex={-1}
            sx={{ position: 'absolute', top: 6, right: 6, pointerEvents: 'none' }}
          />
        </CardActionArea>
      ) : (
        <CardActionArea component={Link} href={`/edit/${record.id}`}>
          {inner}
        </CardActionArea>
      )}
    </Card>
  );
}

function ScoreLine({
  team,
  score,
  win,
  highlight,
}: {
  team: string;
  score: number | null;
  win: boolean;
  highlight: boolean;
}) {
  const logo = getTeamLogoSrc(team);
  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1.25}
      sx={{ py: 0.5, opacity: score != null && !win ? 0.72 : 1 }}
    >
      <Avatar src={logo} alt="" sx={{ width: 28, height: 28 }} />
      <Typography sx={{ flexGrow: 1, fontWeight: highlight ? 700 : 500 }} noWrap>
        {team}
        {highlight && (
          <Box
            component="span"
            sx={{
              ml: 0.75,
              px: 0.6,
              py: 0.1,
              fontSize: '0.65rem',
              borderRadius: 1,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              verticalAlign: 'middle',
            }}
          >
            応援
          </Box>
        )}
      </Typography>
      <Typography
        sx={{
          fontFamily: 'var(--font-tektur), sans-serif',
          fontWeight: 700,
          fontSize: '1.5rem',
          lineHeight: 1,
          minWidth: 28,
          textAlign: 'right',
          color: win ? 'primary.main' : 'text.primary',
        }}
      >
        {score ?? '-'}
      </Typography>
    </Stack>
  );
}

/* ------------------------------------------------------------------ */

function EmptyState() {
  return (
    <Paper
      variant="outlined"
      sx={{ py: 8, px: 3, textAlign: 'center', borderRadius: 3, borderStyle: 'dashed' }}
    >
      <BallIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
      <Typography color="text.secondary" sx={{ mt: 1 }}>
        この条件の観戦記録はまだありません。
      </Typography>
      <Button component={Link} href="/new" variant="contained" startIcon={<AddIcon />} sx={{ mt: 2 }}>
        記録を追加
      </Button>
    </Paper>
  );
}
