import React, { useEffect, useState } from 'react';
import { Modal } from 'antd';
import { useNavigate } from 'react-router-dom';
import { getActiveCampaigns } from '../../service/campaign.service';

interface Campaign {
  id: number;
  banner_url: string;
}

export default function CampaignAdPopup() {
  const [visible, setVisible] = useState(false);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const navigate = useNavigate();
  const BE_BASE_URL = import.meta.env.VITE_BE_BASE_URL;


  useEffect(() => {
    const checkAndShowPopup = async () => {
      const lastShown = localStorage.getItem('popupLastShown');
      const now = Date.now();

      // Nếu chưa từng hiển thị hoặc đã hơn 5 phút
      if (!lastShown || now - Number(lastShown) > 5 * 60 * 1000) {
        try {
          const data = await getActiveCampaigns();
          if (data.length > 0) {
            const random = data[Math.floor(Math.random() * data.length)];
            setCampaign(random);
            setVisible(true);
            localStorage.setItem('popupLastShown', now.toString());
          }
        } catch (err) {
          console.error('Lỗi khi tải campaign:', err);
        }
      }
    };

    checkAndShowPopup();

    // Kiểm tra lại mỗi 1 phút để xem đã đủ 5p chưa
    const interval = setInterval(checkAndShowPopup, 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const handleClick = () => {
    if (campaign) {
      navigate(`/campaign/${campaign.id}`);
      setVisible(false);
    }
  };

  return (
    <Modal
      open={visible && !!campaign}
      footer={null}
      centered
      closable
      onCancel={() => setVisible(false)}
      bodyStyle={{
        padding: 0,
        textAlign: 'center',
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      {campaign && (
        <img
          src={
            campaign.banner_url?.startsWith('http')
              ? campaign.banner_url
              : `${BE_BASE_URL}${campaign.banner_url}`
          }
          alt="Promotion"
          style={{
            width: '100%',
            height: 'auto',
            cursor: 'pointer',
            objectFit: 'cover',
          }}
          onClick={handleClick}
        />
      )}
    </Modal>
  );
}