import dynamic from 'next/dynamic';
import { Box, CircularProgress } from '@mui/material';

// NewRecordFormを動的に、かつSSR（サーバーサイドレンダリング）を無効にしてインポート
const NewRecordForm = dynamic(
  () => import('./NewRecordForm'),
  {
    // SSRを無効にすることで、ハイドレーションエラーを完全に回避します
    ssr: false,
    // コンポーネントがロードされるまでの間、スピナーを表示します
    loading: () => (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    ),
  }
);

export default function NewRecordPage() {
  return <NewRecordForm />;
}
