import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { groupOrdersApi } from '../../../../service/groupOrderItems.service';
import EveryMartHeader from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import { useAuth } from '../../../hooks/useAuth';
import { getAffiliateDataForOrder } from '../../../../utils/affiliate-tracking';

export default function GroupJoin() {
  const { uuid = '' } = useParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [msg, setMsg] = React.useState('Đang xử lý tham gia nhóm...');

  React.useEffect(() => {
    (async () => {
      if (!uuid || loading) return;

      if (!user?.user_id) {
        navigate(`/login?next=/group/${uuid}`, { replace: true });
        return;
      }

      try {
        // 🎯 NEW: Get affiliate code from localStorage
        const affiliateData = getAffiliateDataForOrder();
        console.log('🔍 Joining group with affiliate data:', affiliateData);

        const payload = { 
          userId: user.user_id, 
          addressId: undefined,
          // 🎯 NEW: Pass affiliate code
          ...(affiliateData.affiliateCode && { affiliateCode: affiliateData.affiliateCode }),
        };

        console.log('📤 Join group payload:', payload);
        await groupOrdersApi.joinByUuid(uuid, payload);
        const g = await groupOrdersApi.getByUuid(uuid);

        navigate(`/stores/slug/${g.store.slug}?groupId=${g.id}`, { replace: true });
      } catch (e: any) {
        setMsg(e?.response?.data?.message ?? 'Không thể tham gia nhóm');
      }
    })();
  }, [uuid, user, loading, navigate]);
  
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <EveryMartHeader />
      <main className="flex-1 mx-auto w-full max-w-screen-sm px-4 py-10 text-center">
        <div className="rounded-xl bg-white p-6 shadow border">{msg}</div>
      </main>
      <Footer />
    </div>
  );
}
