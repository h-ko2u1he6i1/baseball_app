import RecordForm from '@/app/_components/RecordForm';

export const metadata = { title: '新しい観戦記録' };

export default function NewRecordPage() {
  return <RecordForm mode="new" />;
}
