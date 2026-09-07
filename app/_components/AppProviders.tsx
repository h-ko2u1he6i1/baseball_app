'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';

import { makeTheme } from '@/lib/theme';
import { getTeamColor, NPB_TEAMS } from '@/lib/teams';

interface AppContextValue {
  favoriteTeam: string | null;
  setFavoriteTeam: (team: string | null) => void;
}

const AppContext = createContext<AppContextValue>({
  favoriteTeam: null,
  setFavoriteTeam: () => {},
});

export const useApp = () => useContext(AppContext);

export default function AppProviders({ children }: { children: React.ReactNode }) {
  const [favoriteTeam, setFavoriteTeamState] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('favoriteTeam');
      if (stored && (NPB_TEAMS as readonly string[]).includes(stored)) {
        setFavoriteTeamState(stored);
      }
    } catch {
      /* localStorage 不可 */
    }
  }, []);

  const setFavoriteTeam = useCallback((team: string | null) => {
    setFavoriteTeamState(team);
    try {
      if (team) localStorage.setItem('favoriteTeam', team);
      else localStorage.removeItem('favoriteTeam');
    } catch {
      /* no-op */
    }
  }, []);

  const theme = useMemo(() => makeTheme(getTeamColor(favoriteTeam)), [favoriteTeam]);

  return (
    <ThemeProvider theme={theme} defaultMode="system">
      <CssBaseline />
      <AppContext.Provider value={{ favoriteTeam, setFavoriteTeam }}>
        <Box sx={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>{children}</Box>
      </AppContext.Provider>
    </ThemeProvider>
  );
}
