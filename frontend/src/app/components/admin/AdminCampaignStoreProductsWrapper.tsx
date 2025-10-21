import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { message, Spin } from 'antd';
import AdminCampaignStoreProducts from './campaigns_components/AdminCampaignStoreProducts';
import { getCampaignStoreDetail } from '../../../service/campaign.service';

interface WrapperProps {
  campaignId: number;
  storeId: number;
  onBack: () => void;
}

export default function AdminCampaignStoreProductsWrapper({
  campaignId,
  storeId,
  onBack,
}: WrapperProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await getCampaignStoreDetail(campaignId, storeId);
        setProducts(res.products || []);
      } catch (err) {
        console.error(err);
        message.error('Không lấy được danh sách sản phẩm');
      } finally {
        setLoading(false);
      }
    })();
  }, [campaignId, storeId]);

  if (loading) return <Spin tip="Đang tải..." />;

  return (
    <AdminCampaignStoreProducts
      campaignId={campaignId}
      storeId={storeId}
      onBack={onBack}
    />
  );
}
