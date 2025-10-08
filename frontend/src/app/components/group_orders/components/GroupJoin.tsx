import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import EveryMartHeader from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import { useAuth } from '../../../hooks/useAuth';

export default function GroupJoin() {
    const { uuid = '' } = useParams();
    const navigate = useNavigate();
    const { user, loading } = useAuth();
    const [msg, setMsg] = React.useState('Đang xử lý tham gia nhóm...');

    React.useEffect(() => {
        (async () => {
            if (!uuid || loading) return;

            if (!user?.id) {
                navigate(`/login?next=/group/${uuid}`, { replace: true });
                return;
            }

            try {
                const token = localStorage.getItem('token') || '';
                // JOIN TRỰC TIẾP BẰNG UUID
                await axios.post(
                    `http://localhost:3000/group-orders/join/${uuid}`,
                    { userId: user.id },
                    { headers: token ? { Authorization: `Bearer ${token}` } : {} }
                );

                // Lấy group để điều hướng về cửa hàng (nếu cần)
                const g = await axios.get(
                    `http://localhost:3000/group-orders/uuid/${uuid}`,
                    { headers: token ? { Authorization: `Bearer ${token}` } : {} }
                );
                const group = g.data;
                navigate(`/stores/slug/${group.store.slug}?groupId=${group.id}`, { replace: true });
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