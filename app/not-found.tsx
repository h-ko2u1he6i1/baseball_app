import { Container, Typography, Button, Stack } from '@mui/material';

export default function NotFound() {
  return (
    <Container sx={{ py: 8 }}>
      <Stack spacing={2} alignItems="center">
        <Typography variant="h5">ページが見つかりませんでした</Typography>
        <Button href="/" variant="contained">
          一覧へ戻る
        </Button>
      </Stack>
    </Container>
  );
}
