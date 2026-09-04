'use client';

import { useEffect } from 'react';
import { Container, Alert, Button, Stack } from '@mui/material';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container sx={{ py: 4 }}>
      <Stack spacing={2}>
        <Alert severity="error">{error.message || '予期しないエラーが発生しました'}</Alert>
        <Button variant="contained" onClick={reset} sx={{ alignSelf: 'flex-start' }}>
          再読み込み
        </Button>
      </Stack>
    </Container>
  );
}
