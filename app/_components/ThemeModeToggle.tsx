'use client';

import { useColorScheme } from '@mui/material/styles';
import { IconButton, Tooltip } from '@mui/material';
import {
  LightMode as LightIcon,
  DarkMode as DarkIcon,
  SettingsBrightness as SystemIcon,
} from '@mui/icons-material';

const ORDER = ['system', 'light', 'dark'] as const;
const ICON = { system: SystemIcon, light: LightIcon, dark: DarkIcon };
const LABEL = { system: '端末設定に追従', light: 'ライト', dark: 'ダーク' };

export default function ThemeModeToggle() {
  const { mode, setMode } = useColorScheme();
  if (!mode) return <IconButton disabled size="small" />; // マウント前

  const Icon = ICON[mode];
  const next = ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length];

  return (
    <Tooltip title={`テーマ: ${LABEL[mode]}（クリックで切替）`}>
      <IconButton onClick={() => setMode(next)} size="small" color="inherit" aria-label="テーマ切替">
        <Icon fontSize="small" />
      </IconButton>
    </Tooltip>
  );
}
