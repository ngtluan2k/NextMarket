// frontend/src/app/page/GroupOrderDetail.tsx
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import EveryMartHeader from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import dayjs from 'dayjs';

export default function GroupOrderDetail() {
  const { id } = useParams(); // group id
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [group, setGroup] = React.useState<any>(null);
  const groupId = Number(id);

  React.useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        const res = await axios.get(`http://localhost:3000/group-orders/${id}`);
        setGroup(res.data);
        setError(null);
      } catch (e: any) {
        setError('Không tải được thông tin nhóm');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);
  const refresh = async () => {
    const res = await axios.get(
      `http://localhost:3000/group-orders/${groupId}`
    );
    setGroup(res.data);
  };

  const onEditName = async () => {
    const name = prompt('Nhập tên nhóm mới:', group?.name ?? '');
    if (!name) return;
    await axios.patch(`http://localhost:3000/group-orders/${groupId}`, {
      name,
    });
    await refresh();
  };
  const onEditDeadline = async () => {
    const def = group?.expires_at
      ? dayjs(group.expires_at).format('YYYY-MM-DD HH:mm:ss')
      : '';
    const value = prompt(
      'Nhập thời hạn (YYYY-MM-DD HH:mm:ss, để trống = bỏ hạn):',
      def
    );
    const payload = value
      ? { expiresAt: dayjs(value).toISOString() }
      : { expiresAt: null };
    await axios.patch(`http://localhost:3000/group-orders/${groupId}`, payload);
    await refresh();
  };

  const onAddMember = async () => {
    const userId = Number(prompt('Nhập userId muốn thêm vào nhóm:'));
    if (!userId) return;
    await axios.post(`http://localhost:3000/group-orders/${groupId}/join`, {
      userId,
    });
    await refresh();
  };

  const onDeleteGroup = async () => {
    if (!confirm('Xóa nhóm? Hành động này không thể hoàn tác.')) return;
    await axios.delete(`http://localhost:3000/group-orders/${groupId}`);
    // quay lại cửa hàng
    if (group?.store?.slug) navigate(`/stores/slug/${group.store.slug}`);
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
            <button
              onClick={onEditName}
              className="px-3 py-2 rounded-lg border text-sm font-semibold hover:bg-slate-50"
            >
              Chỉnh sửa tên nhóm
            </button>
            <button
              onClick={onEditDeadline}
              className="px-3 py-2 rounded-lg border text-sm font-semibold hover:bg-slate-50"
            >
              Chỉnh sửa thời gian đặt hàng
            </button>
            <button
              onClick={onAddMember}
              className="px-3 py-2 rounded-lg border text-sm font-semibold hover:bg-slate-50"
            >
              Thêm thành viên
            </button>
            <button
              onClick={onDeleteGroup}
              className="px-3 py-2 rounded-lg border border-red-300 text-red-600 text-sm font-semibold hover:bg-red-50"
            >
              Xóa nhóm
            </button>
          </div>
          {group?.store?.slug ? (
            <button
              onClick={() =>
                navigate(`/stores/slug/${group.store.slug}?groupId=${group.id}`)
              }
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
                Trạng thái:{' '}
                <span className="font-semibold text-slate-800">
                  {group?.status}
                </span>
              </div>
              <div className="text-sm text-slate-600">
                Mã tham gia:{' '}
                <span className="font-mono">{group?.join_code ?? '—'}</span>
              </div>
              <div className="text-sm text-slate-600">
                Chủ nhóm:{' '}
                <span className="font-semibold">
                  {group?.user?.username ?? '—'}
                </span>
              </div>
              <div className="text-sm text-slate-600">
                Hết hạn:{' '}
                {group?.expires_at
                  ? new Date(group.expires_at).toLocaleString()
                  : '—'}
              </div>
            </section>

            {/* Cột giữa: Thành viên */}
            <section className="bg-white rounded-xl shadow border p-4">
              <h2 className="font-semibold mb-3">Thành viên</h2>
              <ul className="space-y-2">
                {(group?.members ?? []).map((m: any) => (
                  <li
                    key={m.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span>{m?.user?.username}</span>
                    <span className="text-slate-500">
                      {m.status}
                      {m.is_host ? ' • Host' : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Cột phải: Món đã chọn */}
            <section className="bg-white rounded-xl shadow border p-4 lg:col-span-2">
              <h2 className="font-semibold mb-3">Mọi người đã chọn</h2>
              {Array.isArray(group?.items) && group.items.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-600">
                        <th className="py-2 pr-3">Thành viên</th>
                        <th className="py-2 pr-3">Sản phẩm</th>
                        <th className="py-2 pr-3">SL</th>
                        <th className="py-2 pr-3">Giá</th>
                        <th className="py-2">Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.items.map((it: any) => (
                        <tr key={it.id} className="border-t">
                          <td className="py-2 pr-3">
                            {it?.member?.user?.email ?? `#${it?.member?.id}`}
                          </td>
                          <td className="py-2 pr-3">
                            {it?.product?.name ??
                              `Product #${it?.product?.id ?? ''}`}
                          </td>
                          <td className="py-2 pr-3">{it?.quantity}</td>
                          <td className="py-2 pr-3">
                            {Number(it?.price).toLocaleString()} đ
                          </td>
                          <td className="py-2">{it?.note ?? ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-slate-500 text-sm">
                  Chưa có món nào được chọn
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
