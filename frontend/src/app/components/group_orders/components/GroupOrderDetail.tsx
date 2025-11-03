// frontend/src/app/components/group_orders/components/GroupOrderDetail.tsx
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  groupOrdersApi,
  groupOrderItemsApi,
} from '../../../../service/groupOrderItems.service';
import EveryMartHeader from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import dayjs from 'dayjs';
import { useAuth } from '../../../hooks/useAuth';
import { useGroupOrderSocket } from './../../../hooks/useGroupOrderSocket';
import { GroupOrderCheckout } from './GroupOrderCheckout';
import {
  HomeOutlined,
  UserOutlined,
  InfoCircleOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import AddressModal from './../../../page/AddressModal';
import { message } from 'antd';

export default function GroupOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [group, setGroup] = React.useState<any>(null);
  const groupId = Number(id);
  const [groupItems, setGroupItems] = React.useState<any[]>([]);
  const [members, setMembers] = React.useState<any[]>([]);
  const [showCheckout, setShowCheckout] = React.useState(false);
  const [showMemberAddressModal, setShowMemberAddressModal] =
    React.useState(false);

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
            const exists = prev.some(
              (m) => m?.user?.user_id === data.member?.user?.user_id
            );
            return exists ? prev : [data.member, ...prev];
          });
        }
        refresh();
        break;
      case 'member-left':
        if (data?.userId) {
          setMembers((prev) =>
            prev.filter((m) => m?.user?.user_id !== data.userId)
          );
        }
        break;
      case 'item-added':
        if (data?.item) setGroupItems((prev) => [...prev, data.item]);
        refresh();
        break;
      case 'item-updated':
        if (data?.item)
          setGroupItems((prev) =>
            prev.map((it) =>
              Number(it.id) === Number(data.item.id) ? data.item : it
            )
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
      case 'discount-updated':
        if (data?.discountPercent !== undefined) {
          setGroup((g: any) =>
            g ? { ...g, discount_percent: data.discountPercent } : g
          );
        }
        break;
      case 'member-address-updated':
        console.log(' Member address updated:', data);
        refresh();

        // Hiển thị notification
        if (data?.userId && data.userId !== user?.user_id) {
          const updatedMember = members.find(
            (m) => m?.user?.user_id === data.userId
          );
          const memberName =
            updatedMember?.user?.profile?.full_name ||
            updatedMember?.user?.username ||
            `User #${data.userId}`;
          message.info(` ${memberName} đã cập nhật địa chỉ giao hàng`);
        }
        break;
    }
  });

  React.useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        const res = await groupOrdersApi.getById(Number(id));
        setGroup(res);
        setMembers(res?.members ?? []);
        const itemsRes = await groupOrderItemsApi.list(Number(id));
        setGroupItems(itemsRes || []);
        setError(null);
      } catch {
        setError('Không tải được thông tin nhóm');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const refresh = async () => {
    const res = await groupOrdersApi.getById(groupId);
    setGroup(res);
    setMembers(res?.members ?? []);
    const itemsRes = await groupOrderItemsApi.list(groupId);
    setGroupItems(itemsRes || []);
  };

  // Helper tính giá trước giảm nhóm
  const getItemPreGroupPrice = (item: any, discountPercent: number) => {
    const p = Number(item?.price) || 0;
    if (!discountPercent) return p;
    const factor = 1 - discountPercent / 100;
    return factor > 0 ? Math.round(p / factor) : p;
  };

  // Tính tổng với tách rõ tạm tính/giảm giá/thành tiền
  const calcTotals = (items: any[], discountPercent: number) => {
    if (!Array.isArray(items) || items.length === 0) {
      return { subtotalBefore: 0, discountAmount: 0, totalAfter: 0 };
    }
    const totalAfter = items.reduce(
      (sum, item) => sum + (Number(item?.price) || 0),
      0
    );
    const subtotalBefore = items.reduce(
      (sum, item) => sum + getItemPreGroupPrice(item, discountPercent),
      0
    );
    const discountAmount = Math.max(subtotalBefore - totalAfter, 0);
    return { subtotalBefore, discountAmount, totalAfter };
  };

  const onEditName = async () => {
    const name = prompt('Nhập tên nhóm mới:', group?.name ?? '');
    if (!name) return;
    await groupOrdersApi.update(groupId, { name });
    await refresh();
    message.success('Đã cập nhật tên nhóm!');
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
    await groupOrdersApi.update(groupId, payload);
    await refresh();
    message.success('Đã cập nhật thời hạn!');
  };

  const onAddMember = async () => {
    const userId = Number(prompt('Nhập userId muốn thêm vào nhóm:'));
    if (!userId) return;
    await groupOrdersApi.join(groupId, { userId });
    await refresh();
    message.success('Đã thêm thành viên!');
  };

  const onEditDeliveryMode = async () => {
    const newMode = window.confirm(
      '🚚 CHỌN CHẾ ĐỘ GIAO HÀNG:\n\n' +
        ' Nhấn OK: Giao đến từng thành viên (mỗi người nhận riêng)\n' +
        ' Nhấn Cancel: Giao về địa chỉ chủ nhóm (giao chung)\n\n' +
        'Lưu ý: Nếu chọn "Giao đến từng thành viên", tất cả thành viên phải chọn địa chỉ giao hàng!'
    )
      ? 'member_address'
      : 'host_address';

    try {
      const token = localStorage.getItem('token');
      await groupOrdersApi.update(groupId, { delivery_mode: newMode });
      await refresh();

      if (newMode === 'member_address') {
        message.success(
          ' Đã đổi sang chế độ "Giao riêng từng người". Các thành viên hãy chọn địa chỉ giao hàng!'
        );
      } else {
        message.success('Đã đổi sang chế độ "Giao về chủ nhóm".');
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Không thể thay đổi';
      message.error(errorMsg);
    }
  };

  const onUpdateMemberAddress = async (address: any) => {
    try {
      const token = localStorage.getItem('token');
      await groupOrdersApi.updateMemberAddress(groupId, {
        addressId: address.id,
      });
      await refresh();
      setShowMemberAddressModal(false);
      message.success(' Đã cập nhật địa chỉ giao hàng của bạn!');
    } catch (error: any) {
      message.error(
        error.response?.data?.message || 'Không thể cập nhật địa chỉ'
      );
    }
  };

  const onDeleteGroup = async () => {
    if (!window.confirm('⚠️ Xóa nhóm? Hành động này không thể hoàn tác.'))
      return;
    await groupOrdersApi.delete(groupId);
    message.success('Đã xóa nhóm');
    if (group?.store?.slug) navigate(`/stores/slug/${group.store.slug}`);
  };

  const onEditItemNote = async (itemId: number, currentNote: string) => {
    const newNote = prompt('Nhập ghi chú mới:', currentNote || '');
    if (newNote === null) return;

    try {
      await groupOrderItemsApi.update(groupId, itemId, { note: newNote });
      await refresh();
      message.success('Cập nhật ghi chú thành công!');
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || 'Không thể cập nhật ghi chú';
      message.error(errorMessage);
    }
  };

  const onDeleteItem = async (itemId: number, productName: string) => {
    if (
      !window.confirm(
        `Xóa sản phẩm "${productName}"? Hành động này không thể hoàn tác.`
      )
    )
      return;

    try {
      await groupOrderItemsApi.remove(groupId, itemId);
      await refresh();
      message.success('Xóa sản phẩm thành công!');
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || 'Không thể xóa sản phẩm';
      message.error(errorMessage);
    }
  };

  const canEditItem = (item: any) => {
    if (!user?.user_id) return false;
    return (
      item?.member?.user?.user_id === user.user_id ||
      item?.user_id === user.user_id
    );
  };

const isHost = React.useMemo(() => {
  if (!user?.user_id) return false;

  // 1. So sánh trực tiếp với group owner
  if (group?.user?.id === user.user_id) return true;

  // 2. Hoặc tìm member host
  return group?.members?.some(
    (m: any) => m.is_host === 1 && m.user?.id === user.user_id
  );
}, [user?.user_id, group]);

console.log('isHost:', isHost);

  // Tính tổng với logic mới
  const totals = React.useMemo(() => {
    const items =
      Array.isArray(groupItems) && groupItems.length > 0
        ? groupItems
        : Array.isArray(group?.items)
        ? group.items
        : [];
    const discountPercent = Number(group?.discount_percent || 0);
    return calcTotals(items, discountPercent);
  }, [groupItems, group?.items, group?.discount_percent]);

  const getDisplayName = (item: any) => {
    // Thử lấy từ members array trước
    const memberFromList = members.find(
      (m) => m?.user?.user_id === item?.member?.user?.user_id
    );

    if (memberFromList?.user?.profile?.full_name) {
      return memberFromList.user.profile.full_name;
    }

    // Fallback logic
    if (item?.member?.user?.profile?.full_name) {
      return item.member.user.profile.full_name;
    }

    if (item?.member?.user?.username) {
      return item.member.user.username;
    }

    if (item?.member?.user?.email) {
      return item.member.user.email.split('@')[0];
    }

    return `Thành viên #${item?.member?.id}`;
  };

  // Check nếu có member nào chưa có địa chỉ khi delivery_mode = member_address
  const membersWithoutAddress = React.useMemo(() => {
    if (group?.delivery_mode !== 'member_address') return [];
    return members.filter((m) => !m.address_id);
  }, [group?.delivery_mode, members]);
  const myMember = React.useMemo(() => {
    return members.find((m: any) => m?.user?.user_id === user?.user_id);
  }, [members, user?.user_id]);

  console.log('🧾 Render GroupOrderDetail', {
    group,
    members,
    groupItems: groupItems.map((it) => ({
      id: it.id,
      product: it?.product?.name,
      memberUserId: it?.member?.user?.user_id,
      fullName: it?.member?.user?.profile?.full_name,
      username: it?.member?.user?.username,
      email: it?.member?.user?.email,
    })),
    totals,
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <EveryMartHeader />

      <main className="flex-1 mx-auto w-full max-w-screen-2xl px-4 py-6">
        {/* Header với các nút action */}
        <div className="mb-6 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h1 className="text-2xl font-bold text-slate-900">
              📦 Đơn hàng nhóm: {group?.user?.profile?.full_name ?? '—'}
            </h1>

            {group?.store?.slug && (
              <button
                onClick={() =>
                  navigate(
                    `/stores/slug/${group.store.slug}?groupId=${group.id}`
                  )
                }
                className="px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                ← Quay lại cửa hàng
              </button>
            )}
          </div>

          {/* Action buttons cho host */}
          {isHost && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={onEditName}
                className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                ✏️ Sửa tên nhóm
              </button>
              <button
                onClick={onEditDeadline}
                className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                ⏰ Sửa thời hạn
              </button>
              <button
                onClick={onAddMember}
                className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                👥 Thêm thành viên
              </button>
              <button
                onClick={onDeleteGroup}
                className="px-3 py-2 rounded-lg border border-red-300 bg-white text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors"
              >
                🗑️ Xóa nhóm
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-slate-600">Đang tải...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* PANEL 1: Thông tin nhóm */}
            <section className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                <InfoCircleOutlined className="text-blue-600" />
                Thông tin nhóm
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Trạng thái:</span>
                  <span
                    className={`font-semibold px-2 py-1 rounded ${
                      group?.status === 'open'
                        ? 'bg-green-100 text-green-700'
                        : group?.status === 'locked'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {group?.status}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-600">Mã tham gia:</span>
                  <span className="font-mono font-semibold">
                    {group?.join_code ?? '—'}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-600">Chủ nhóm:</span>
                  <span className="font-semibold">
                    {group?.user?.profile?.full_name ??
                      group?.user?.username ??
                      '—'}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-600">Hết hạn:</span>
                  <span className="font-medium">
                    {group?.expires_at
                      ? new Date(group.expires_at).toLocaleString('vi-VN')
                      : '—'}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Giảm giá:</span>
                  <span className="font-bold text-green-600 text-lg">
                    {group?.discount_percent || 0}%
                  </span>
                </div>

                {/* DELIVERY MODE */}
                <div className="pt-3 border-t">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-600 font-medium">
                      Giao hàng:
                    </span>
                    <div className="flex items-center gap-2">
                      {group?.delivery_mode === 'host_address' ? (
                        <>
                          <HomeOutlined className="text-blue-600" />
                          <span className="font-semibold text-blue-600 text-sm">
                            Về chủ nhóm
                          </span>
                        </>
                      ) : (
                        <>
                          <UserOutlined className="text-orange-600" />
                          <span className="font-semibold text-orange-600 text-sm">
                            Riêng từng người
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {isHost && group?.status === 'open' && (
                    <button
                      onClick={onEditDeliveryMode}
                      className="w-full px-3 py-2 text-xs bg-slate-100 hover:bg-slate-200 rounded transition-colors font-medium"
                    >
                      🔄 Thay đổi chế độ giao hàng
                    </button>
                  )}
                </div>

                {/* ĐỊA CHỈ MEMBER (nếu là member_address mode) */}
                {group?.delivery_mode === 'member_address' && user?.user_id && (
                  <div className="pt-3 border-t space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <EnvironmentOutlined className="text-blue-600" />
                      <span>Địa chỉ giao hàng của bạn:</span>
                    </div>

                    {myMember?.address_id ? (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-xs space-y-1">
                        <div className="font-semibold text-green-900">
                          ✅ {myMember.address_id.recipientName}
                        </div>
                        <div className="text-green-700">
                          📞 {myMember.address_id.phone}
                        </div>
                        <div className="text-green-700">
                          📍{' '}
                          {[
                            myMember.address_id.street,
                            myMember.address_id.ward,
                            myMember.address_id.district,
                            myMember.address_id.province,
                          ]
                            .filter(Boolean)
                            .join(', ')}
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-yellow-50 border border-yellow-300 rounded-lg text-xs text-yellow-800 font-medium">
                        ⚠️ Bạn chưa chọn địa chỉ giao hàng!
                      </div>
                    )}

                    <button
                      onClick={() => setShowMemberAddressModal(true)}
                      className="w-full px-3 py-2 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 rounded transition-colors font-medium"
                    >
                      {myMember?.address_id
                        ? '📝 Thay đổi địa chỉ'
                        : '📍 Chọn địa chỉ'}
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* PANEL 2: Thành viên */}
            <section className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="font-bold text-lg mb-4">
                👥 Thành viên ({members.length})
              </h2>

              {membersWithoutAddress.length > 0 &&
                group?.delivery_mode === 'member_address' && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-300 rounded-lg">
                    <p className="text-xs font-semibold text-yellow-800 mb-1">
                      ⚠️ Thành viên chưa có địa chỉ:
                    </p>
                    <ul className="text-xs text-yellow-700 space-y-0.5">
                      {membersWithoutAddress.map((m) => (
                        <li key={m.id}>
                          •{' '}
                          {m?.user?.profile?.full_name ||
                            m?.user?.username ||
                            `User #${m?.user?.user_id}`}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              <ul className="space-y-2">
                {members.map((m: any) => (
                  <li
                    key={m.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                        {(m?.user?.profile?.full_name ||
                          m?.user?.username ||
                          'U')[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-sm">
                          {m?.user?.profile?.full_name || m?.user?.username}
                        </div>
                        {m.is_host && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                            👑 Host
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          m.status === 'joined'
                            ? 'bg-green-100 text-green-700'
                            : m.status === 'ordered'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {m.status}
                      </span>
                      {group?.delivery_mode === 'member_address' &&
                        (m.address_id ? (
                          <span
                            className="text-green-600"
                            title="Đã có địa chỉ"
                          >
                            ✅
                          </span>
                        ) : (
                          <span
                            className="text-yellow-600"
                            title="Chưa có địa chỉ"
                          >
                            ⚠️
                          </span>
                        ))}
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            {/* PANEL 3: Sản phẩm đã chọn */}
            <section className="bg-white rounded-xl shadow-sm border p-6 lg:col-span-2">
              <h2 className="font-bold text-lg mb-4">🛒 Sản phẩm đã chọn</h2>

              {Array.isArray(groupItems) && groupItems.length > 0 ? (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr className="text-left text-slate-700">
                          <th className="py-3 px-4 font-semibold">
                            Thành viên
                          </th>
                          <th className="py-3 px-4 font-semibold">Sản phẩm</th>
                          <th className="py-3 px-4 font-semibold text-center">
                            SL
                          </th>
                          <th className="py-3 px-4 font-semibold text-right">
                            Giá
                          </th>

                          {/* THÊM CỘT MỚI: ĐỊA CHỈ */}
                          {group?.delivery_mode === 'member_address' && (
                            <th className="py-3 px-4 font-semibold">
                              <div className="flex items-center gap-1">
                                <EnvironmentOutlined className="text-blue-600" />
                                <span>Địa chỉ giao hàng</span>
                              </div>
                            </th>
                          )}

                          <th className="py-3 px-4 font-semibold">Ghi chú</th>
                          <th className="py-3 px-4 font-semibold text-center">
                            Thao tác
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(Array.isArray(groupItems) && groupItems.length > 0
                          ? groupItems
                          : Array.isArray(group?.items)
                          ? group.items
                          : []
                        ).map((it: any) => {
                          const canEdit = canEditItem(it);

                          // ✅ Lấy địa chỉ của member
                          const memberAddress = it?.member?.address_id;

                          return (
                            <tr
                              key={it.id}
                              className="hover:bg-slate-50 transition-colors"
                            >
                              <td className="py-3 px-4">
                                <span className="font-medium text-slate-900">
                                  {getDisplayName(it)}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className="font-medium">
                                  {it?.product?.name ??
                                    `Product #${it?.product?.id ?? ''}`}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className="font-semibold">
                                  {it?.quantity}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <span className="font-semibold text-slate-900">
                                  {getItemPreGroupPrice(
                                    it,
                                    Number(group?.discount_percent || 0)
                                  ).toLocaleString()}{' '}
                                  đ
                                </span>
                              </td>

                              {/*  CỘT ĐỊA CHỈ MỚI */}
                              {group?.delivery_mode === 'member_address' && (
                                <td className="py-3 px-4">
                                  {memberAddress ? (
                                    <div className="text-xs space-y-0.5">
                                      <div className="font-semibold text-green-700 flex items-center gap-1">
                                        <span className="text-green-600">
                                          ✓
                                        </span>
                                        {memberAddress.recipientName}
                                      </div>
                                      <div className="text-slate-600">
                                        {memberAddress.phone}
                                      </div>
                                      <div
                                        className="text-slate-600 max-w-xs line-clamp-2"
                                        title={[
                                          memberAddress.street,
                                          memberAddress.ward,
                                          memberAddress.district,
                                          memberAddress.province,
                                        ]
                                          .filter(Boolean)
                                          .join(', ')}
                                      >
                                        {[
                                          memberAddress.street,
                                          memberAddress.ward,
                                          memberAddress.district,
                                        ]
                                          .filter(Boolean)
                                          .join(', ')}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-xs text-yellow-700 bg-yellow-50 px-2 py-1 rounded inline-flex items-center gap-1">
                                      <span>⚠️</span>
                                      <span>Chưa có địa chỉ</span>
                                    </div>
                                  )}
                                </td>
                              )}

                              <td className="py-3 px-4">
                                <span className="text-slate-600 text-xs italic">
                                  {it?.note || '—'}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                {canEdit ? (
                                  <div className="flex gap-1 justify-center">
                                    <button
                                      onClick={() =>
                                        onEditItemNote(it.id, it.note)
                                      }
                                      className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors font-medium"
                                    >
                                      📝
                                    </button>
                                    <button
                                      onClick={() =>
                                        onDeleteItem(
                                          it.id,
                                          it?.product?.name || 'Sản phẩm'
                                        )
                                      }
                                      className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors font-medium"
                                    >
                                      🗑️
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-slate-300 text-xs text-center block">
                                    —
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Tổng tiền */}
                  <div className="mt-6 p-5 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200 space-y-3">
                    <div className="flex justify-between text-sm text-slate-700">
                      <span>Tạm tính (chưa giảm):</span>
                      <span className="font-semibold">
                        {totals.subtotalBefore.toLocaleString()} đ
                      </span>
                    </div>

                    {group?.discount_percent > 0 && (
                      <div className="flex justify-between text-sm text-green-600 font-medium">
                        <span>
                          🎉 Giảm giá nhóm (
                          {Number(group?.discount_percent || 0)}%):
                        </span>
                        <span className="font-bold">
                          -{totals.discountAmount.toLocaleString()} đ
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-center text-xl font-bold border-t pt-3 border-green-300">
                      <span className="text-slate-900">Thành tiền:</span>
                      <span className="text-green-600">
                        {totals.totalAfter.toLocaleString()} đ
                      </span>
                    </div>
                  </div>

                  {/* Nút thanh toán */}
                  {isHost &&
                    group?.status === 'open' &&
                    groupItems.length > 0 && (
                      <div className="mt-6 flex justify-center">
                        <button
                          onClick={() => setShowCheckout(true)}
                          disabled={
                            group?.delivery_mode === 'member_address' &&
                            membersWithoutAddress.length > 0
                          }
                          className={`px-8 py-4 text-lg font-bold rounded-xl shadow-lg transition-all ${
                            group?.delivery_mode === 'member_address' &&
                            membersWithoutAddress.length > 0
                              ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                              : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 hover:shadow-xl transform hover:scale-105'
                          }`}
                        >
                          💳 Thanh toán cho nhóm (
                          {totals.totalAfter.toLocaleString()} đ)
                        </button>
                      </div>
                    )}

                  {group?.delivery_mode === 'member_address' &&
                    membersWithoutAddress.length > 0 &&
                    isHost && (
                      <div className="mt-2 text-center text-sm text-yellow-700 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                        ⚠️ Không thể thanh toán: Có{' '}
                        {membersWithoutAddress.length} thành viên chưa chọn địa
                        chỉ giao hàng
                      </div>
                    )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🛒</div>
                  <p className="text-slate-500 text-lg">
                    Chưa có sản phẩm nào được chọn
                  </p>
                  <p className="text-slate-400 text-sm mt-2">
                    Quay lại cửa hàng để thêm sản phẩm vào nhóm
                  </p>
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      <Footer />

      {/* Modal thanh toán */}
      <GroupOrderCheckout
        open={showCheckout}
        onClose={() => setShowCheckout(false)}
        groupId={groupId}
        groupItems={groupItems}
        totalAmount={totals.totalAfter}
        discountPercent={group?.discount_percent || 0}
        deliveryMode={group?.delivery_mode || 'host_address'}
        onSuccess={() => {
          setShowCheckout(false);
          refresh();
        }}
      />

      {/* Modal chọn địa chỉ cho member */}
      <AddressModal
        visible={showMemberAddressModal}
        onClose={() => setShowMemberAddressModal(false)}
        onSelect={onUpdateMemberAddress}
        currentAddressId={myMember?.address_id?.id}
      />
    </div>
  );
}
