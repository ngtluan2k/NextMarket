// frontend/src/app/page/GroupOrderDetail.tsx
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../../api/api';
import EveryMartHeader from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import dayjs from 'dayjs';
import { useAuth } from '../../../hooks/useAuth';
import { useGroupOrderSocket } from './../../../hooks/useGroupOrderSocket';

export default function GroupOrderDetail() {
    const { id } = useParams(); // group id
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [group, setGroup] = React.useState<any>(null);
    const groupId = Number(id);
    const [groupItems, setGroupItems] = React.useState<any[]>([]);
    const [members, setMembers] = React.useState<any[]>([]);
    const { socketService } = useGroupOrderSocket(Number(id), (event, data) => {
        switch (event) {
            case 'group-state':
                if (data?.group) setGroup(data.group);
                setGroupItems(Array.isArray(data?.items) ? data.items : []);
                if (Array.isArray(data?.members)) setMembers(data.members);
                break;

            case 'member-joined':
                if (data?.member) {
                    setMembers((prev) => {
                        const exists = prev.some(m => m?.user?.id === data.member?.user?.id);
                        return exists ? prev : [data.member, ...prev];
                    });
                }
                break;

            case 'member-left':
                if (data?.userId) {
                    setMembers((prev) => prev.filter((m) => m?.user?.id !== data.userId));
                }
                break;
            case 'item-added':
                if (data?.item) setGroupItems((prev) => [...prev, data.item]);
                break;
            case 'item-updated':
                if (data?.item) setGroupItems((prev) =>
                    prev.map((it) => Number(it.id) === Number(data.item.id) ? data.item : it)
                );
                break;
            case 'item-removed':
                if (data?.itemId != null) {
                    const rmId = Number(data.itemId);
                    setGroupItems((prev) => prev.filter((it) => Number(it.id) !== rmId));
                }
                break;
            case 'group-locked':
                setGroup((g: any) => (g ? { ...g, status: 'locked' } : g));
                break;
            case 'group-updated':
                if (data?.group) setGroup(data.group);
                break;
            case 'group-deleted':
                navigate('/');
                break;
        }
    });




    React.useEffect(() => {
        if (!id) return;
        (async () => {
            try {
                setLoading(true);
                const res = await api.get(`http://localhost:3000/group-orders/${id}`);
                setGroup(res.data);
                setMembers(res.data?.members ?? []);
                const itemsRes = await api.get(`http://localhost:3000/group-orders/${id}/items`);
                setGroupItems(itemsRes.data || []);
                setError(null);
            } catch {
                setError('Không tải được thông tin nhóm');
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);
    console.log('GroupOrderDetail render', { group, members, groupItems, loading, error });
    const refresh = async () => {
        const res = await api.get(`http://localhost:3000/group-orders/${groupId}`);
        setGroup(res.data);
        setMembers(res.data?.members ?? []);
        const itemsRes = await api.get(`http://localhost:3000/group-orders/${groupId}/items`);
        setGroupItems(itemsRes.data || []);
    };



    const onEditName = async () => {
        const name = prompt('Nhập tên nhóm mới:', group?.name ?? '');
        if (!name) return;
        await api.patch(`http://localhost:3000/group-orders/${groupId}`, { name });
        await refresh();
    };
    const onEditDeadline = async () => {
        const def = group?.expires_at ? dayjs(group.expires_at).format('YYYY-MM-DD HH:mm:ss') : '';
        const value = prompt('Nhập thời hạn (YYYY-MM-DD HH:mm:ss, để trống = bỏ hạn):', def);
        const payload = value ? { expiresAt: dayjs(value).toISOString() } : { expiresAt: null };
        await api.patch(`http://localhost:3000/group-orders/${groupId}`, payload);
        await refresh();
    };

    const onAddMember = async () => {
        const userId = Number(prompt('Nhập userId muốn thêm vào nhóm:'));
        if (!userId) return;
        await api.post(`http://localhost:3000/group-orders/${groupId}/join`, { userId });
        await refresh();
    };

    const onDeleteGroup = async () => {
        if (!confirm('Xóa nhóm? Hành động này không thể hoàn tác.')) return;
        await api.delete(`http://localhost:3000/group-orders/${groupId}`);
        // quay lại cửa hàng
        if (group?.store?.slug) navigate(`/stores/slug/${group.store.slug}`);
    };
    //  THÊM: thêm note
    const onEditItemNote = async (itemId: number, currentNote: string) => {
        const newNote = prompt('Nhập ghi chú mới:', currentNote || '');
        if (newNote === null) return; // User cancelled

        try {
            await api.patch(`/group-orders/${groupId}/items/${itemId}`, { note: newNote });
            await refresh();
            alert('Cập nhật ghi chú thành công!');
        } catch (error: any) {
            const errorMessage = error?.response?.data?.message || 'Không thể cập nhật ghi chú';
            alert(errorMessage);
        }
    };

    //  THÊM: Xóa item
    const onDeleteItem = async (itemId: number, productName: string) => {
        if (!confirm(`Xóa sản phẩm "${productName}"? Hành động này không thể hoàn tác.`)) return;

        try {
            await api.delete(`/group-orders/${groupId}/items/${itemId}`);
            await refresh();
            alert('Xóa sản phẩm thành công!');
        } catch (error: any) {
            const errorMessage = error?.response?.data?.message || 'Không thể xóa sản phẩm';
            alert(errorMessage);
        }
    };

    const canEditItem = (item: any) => {
        if (!user?.id) return false;

        // Kiểm tra qua member.user.id
        if (item?.member?.user?.id === user.id) return true;

        // Kiểm tra qua user_id trực tiếp trong item
        if (item?.user_id === user.id) return true;

        // Kiểm tra qua member.user_id
        if (item?.member?.user_id === user.id) return true;

        return false;
    };


    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <EveryMartHeader />

            <main className="flex-1 mx-auto w-full max-w-screen-2xl px-4 py-6">
                <div className="mb-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-between sm:items-center">
                    <h1 className="text-xl font-semibold text-slate-900">
                        Đơn hàng nhóm: {group?.name ?? '—'}
                    </h1>

                    <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                        <button onClick={onEditName} className="px-3 py-2 rounded-lg border text-sm font-semibold hover:bg-slate-50">
                            Chỉnh sửa tên nhóm
                        </button>
                        <button onClick={onEditDeadline} className="px-3 py-2 rounded-lg border text-sm font-semibold hover:bg-slate-50">
                            Chỉnh sửa thời gian đặt hàng
                        </button>
                        <button onClick={onAddMember} className="px-3 py-2 rounded-lg border text-sm font-semibold hover:bg-slate-50">
                            Thêm thành viên
                        </button>
                        <button onClick={onDeleteGroup} className="px-3 py-2 rounded-lg border border-red-300 text-red-600 text-sm font-semibold hover:bg-red-50">
                            Xóa nhóm
                        </button>
                    </div>
                    {group?.store?.slug ? (
                        <button
                            onClick={() => navigate(`/stores/slug/${group.store.slug}?groupId=${group.id}`)}
                            className="px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 sm:self-auto self-center"
                        >
                            Quay lại cửa hàng
                        </button>
                    ) : null}
                </div>

                {loading ? (
                    <div>Đang tải...</div>
                ) : error ? (
                    <div className="text-red-600">{error}</div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Cột trái: Thông tin nhóm */}
                        <section className="bg-white rounded-xl shadow border p-4">
                            <div className="text-sm text-slate-600">
                                Trạng thái: <span className="font-semibold text-slate-800">{group?.status}</span>
                            </div>
                            <div className="text-sm text-slate-600">
                                Mã tham gia: <span className="font-mono">{group?.join_code ?? '—'}</span>
                            </div>
                            <div className="text-sm text-slate-600">
                                Chủ nhóm: <span className="font-semibold">{group?.user.profile?.full_name ?? '—'}</span>
                            </div>
                            <div className="text-sm text-slate-600">
                                Hết hạn: {group?.expires_at ? new Date(group.expires_at).toLocaleString() : '—'}
                            </div>
                        </section>

                        {/* Cột giữa: Thành viên */}
                        <section className="bg-white rounded-xl shadow border p-4">
                            <h2 className="font-semibold mb-3">Thành viên</h2>
                            <ul className="space-y-2">
                                {Array.from(
                                    new Map(members.map(m => [m?.user?.id, m])).values()
                                ).map((m: any) => (
                                    <li key={m.user.id} className="flex items-center justify-between text-sm">
                                        <span>{m?.user?.profile?.full_name}</span>
                                        <span className="text-slate-500">{m.status}{m.is_host ? ' • Host' : ''}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>

                        {/* Cột phải: Món đã chọn */}
                        <section className="bg-white rounded-xl shadow border p-4 lg:col-span-2">
                            <h2 className="font-semibold mb-3">Mọi người đã chọn</h2>
                            {Array.isArray(groupItems) && groupItems.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-sm">
                                        <thead>
                                            <tr className="text-left text-slate-600">
                                                <th className="py-2 pr-3">Thành viên</th>
                                                <th className="py-2 pr-3">Sản phẩm</th>
                                                <th className="py-2 pr-3">SL</th>
                                                <th className="py-2 pr-3">Giá</th>
                                                <th className="py-2">Ghi chú</th>
                                                <th className="py-2">Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(Array.isArray(groupItems) && groupItems.length > 0
                                                ? groupItems
                                                : (Array.isArray(group?.items) ? group.items : [])
                                            ).map((it: any) => {
                                                const canEdit = canEditItem(it);
                                                return (
                                                    <tr key={it.id} className="border-t">
                                                        <td className="py-2 pr-3">
                                                            {it?.member?.user?.profile?.full_name
                                                                ?? it?.member?.user?.email
                                                                ?? `Thành viên #${it?.member?.id ?? ''}`}
                                                        </td>
                                                        <td className="py-2 pr-3">
                                                            {it?.product?.name ?? `Product #${it?.product?.id ?? ''}`}
                                                        </td>
                                                        <td className="py-2 pr-3">{it?.quantity}</td>
                                                        <td className="py-2 pr-3">{Number(it?.price).toLocaleString()} đ</td>
                                                        <td className="py-2">{it?.note ?? ''}</td>
                                                        <td className="py-2">
                                                            {canEdit ? (
                                                                <div className="flex gap-2">
                                                                    <button
                                                                        onClick={() => onEditItemNote(it.id, it.note)}
                                                                        className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                                                    >
                                                                        Thêm ghi chú
                                                                    </button>
                                                                    <button
                                                                        onClick={() => onDeleteItem(it.id, it?.product?.name || 'Sản phẩm')}
                                                                        className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                                                                    >
                                                                        Xóa sản phẩm
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <span className="text-slate-400 text-xs">—</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>

                                    </table>
                                </div>
                            ) : (
                                <div className="text-slate-500 text-sm">Chưa có món nào được chọn</div>
                            )}
                        </section>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}