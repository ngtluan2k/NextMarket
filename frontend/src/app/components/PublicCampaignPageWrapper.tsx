import { useParams } from 'react-router-dom';
import PublicCampaignPage from './PublicCampaignPage';

export default function PublicCampaignPageWrapper() {
  const { id } = useParams<{ id: string }>();
  if (!id) return <p>Không tìm thấy chiến dịch</p>;
  return <PublicCampaignPage campaignId={parseInt(id, 10)} />;
}
