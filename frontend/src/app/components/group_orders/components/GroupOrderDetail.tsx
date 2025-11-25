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
  EditOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  UsergroupAddOutlined,
  LockOutlined,
  RestOutlined,
  WarningOutlined,
  CrownOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import AddressModal from './../../../page/AddressModal';
import { message } from 'antd';
import { GroupPaymentBox } from './GroupPaymentBox';
import { useState } from 'react';
import GroupChatModal from './GroupChatModal';
import { useChatSocket } from '../../../hooks/useChatSocket';
import { SenderType } from '../../../types/chat.types';

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
  const [showMemberCheckout, setShowMemberCheckout] = React.useState(false);
  const [isChatOpen, setChatOpen] = useState(false);

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
          setMembers((prev) => prev.filter((m) => m?.user?.id !== data.userId));
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
            (m) => m?.user?.id === data.userId
          );
          const memberName =
            updatedMember?.user?.profile?.full_name ||
            updatedMember?.user?.username ||
            `User #${data.userId}`;
          message.info(` ${memberName} đã cập nhật địa chỉ giao hàng`);
        }
        break;

      case 'target-reached-warning':
        message.warning(data?.message || 'Đã đủ số lượng thành viên!', 5);
        refresh();
        break;

      case 'group-auto-locked':
        message.success(data?.message || '🔒 Nhóm đã tự động khóa!', 5);
        refresh();
        break;

      case 'group-manual-locked':
        message.success(data?.message || '🔒 Host đã khóa nhóm!', 5);
        refresh();
        break;

      case 'member-paid':
        if (data?.userId && data.userId !== user?.user_id) {
          message.info(`💳 ${data?.memberName} đã thanh toán!`);
        }
        refresh();
        break;

      case 'payment-progress':
        if (data?.paidMembers && data?.totalMembers) {
          message.info(
            `💳 Tiến độ thanh toán: ${data.paidMembers}/${data.totalMembers} (${data.progress}%)`,
            3
          );
        }
        refresh();
        break;

      case 'group-completed':
        message.success(
          data?.message || '🎉 Tất cả đã thanh toán! Đơn hoàn thành.',
          5
        );
        refresh();
        break;
      case 'group-unlocked':
        message.info(data?.message || '🔓 Nhóm đã được mở khóa');
        refresh();
        break;
    }
  });

 const {
  conversations,
  setConversations,
  messages,
  setMessages,
  selectedConversationId,
  setSelectedConversationId,
  sendMessage,
  startGroupConversation,
  markAsRead,
  joinConversationRoom,
} = useChatSocket(user?.user_id ?? 0, SenderType.USER);


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
        console.log('Loaded group order detail:', itemsRes);
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

  const onEditTargetCount = async () => {
    if (!group) return;

    const currentTarget = group.target_member_count || 2;
    const input = prompt(
      `Nhập số lượng thành viên mục tiêu (2-20):\n\nHiện tại: ${currentTarget} người`,
      currentTarget.toString()
    );

    if (!input) return;

    const newTarget = parseInt(input);
    if (isNaN(newTarget) || newTarget < 2 || newTarget > 20) {
      message.error('Số lượng phải từ 2 đến 20 người');
      return;
    }

    try {
      await groupOrdersApi.update(groupId, { targetMemberCount: newTarget });
      await refresh();
      message.success(`Đã cập nhật mục tiêu: ${newTarget} người`);
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || 'Không thể cập nhật';
      message.error(errorMsg);
    }
  };

  const onAddMember = async () => {
    const userId = Number(prompt('Nhập userId muốn thêm vào nhóm:'));
    if (!userId) return;
    await groupOrdersApi.join(groupId, { userId });
    await refresh();
    message.success('Đã thêm thành viên!');
  };

  const onEditDeliveryMode = async () => {
    if (!group) return;

    const currentMode = group.delivery_mode || 'host_address';
    const targetMode =
      currentMode === 'member_address' ? 'host_address' : 'member_address';

    const confirmMsg =
      targetMode === 'member_address'
        ? '🚚 CHUYỂN SANG “Giao riêng từng người”? \n\nLưu ý: Tất cả thành viên phải chọn địa chỉ giao hàng!'
        : '🏠 CHUYỂN SANG “Giao về chủ nhóm”?';

    const ok = window.confirm(confirmMsg);
    if (!ok) return;

    try {
      await groupOrdersApi.update(groupId, { delivery_mode: targetMode });
      await refresh();

      if (targetMode === 'member_address') {
        message.success(
          'Đã đổi sang chế độ "Giao riêng từng người". Các thành viên hãy chọn địa chỉ giao hàng!'
        );
      } else {
        message.success('Đã đổi sang chế độ "Giao về chủ nhóm".');
      }
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || 'Không thể thay đổi';
      message.error(errorMsg);
    }
  };

  const onManualLockGroup = async () => {
    const currentMembers = members.length;
    const target = group?.target_member_count || 0;

    let confirmMsg = '🔒 Khóa nhóm thủ công?\n\n';

    if (target && currentMembers < target) {
      confirmMsg += `⚠️ Nhóm hiện có ${currentMembers}/${target} người.\n`;
      confirmMsg += 'Bạn có muốn khóa sớm không?\n\n';
    } else {
      confirmMsg += `Nhóm có ${currentMembers} thành viên.\n\n`;
    }

    confirmMsg += 'Sau khi khóa, mỗi người sẽ thanh toán riêng phần của mình.';

    if (!window.confirm(confirmMsg)) return;

    try {
      await groupOrdersApi.lockGroup(groupId);
      message.success('Đã khóa nhóm! Các thành viên có thể thanh toán.');
      await refresh();
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || 'Không thể khóa nhóm';
      message.error(errorMsg);
    }
  };

  const onUnlockGroup = async () => {
    if (
      !window.confirm(
        '🔓 Mở khóa nhóm?\n\nThành viên có thể tiếp tục thêm/bớt sản phẩm.'
      )
    ) {
      return;
    }

    try {
      await groupOrdersApi.unlockGroup(groupId);
      message.success('Đã mở khóa nhóm! Thành viên có thể chỉnh sửa.');
      await refresh();
    } catch (error: any) {
      const errorMsg =
        error?.response?.data?.message || 'Không thể mở khóa nhóm';
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
      item?.member?.user?.id === user.user_id || item?.user_id === user.user_id
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

  const myItems = React.useMemo(() => {
    if (!user?.user_id) return [];
    return groupItems.filter((it) => it.member?.user?.id === user.user_id);
  }, [groupItems, user?.user_id]);

  //  THÊM: Tính tổng tiền của member
  const myTotal = React.useMemo(() => {
    return myItems.reduce((sum, it) => sum + (Number(it.price) || 0), 0);
  }, [myItems]);

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
      (m) => m?.user?.id === item?.member?.user?.user_id
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
    return members.find((m: any) => m?.user?.id === user?.user_id);
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

  const onLeaveGroup = async () => {
    if (
      !window.confirm(
        '⚠️ Bạn có chắc muốn rời nhóm? Tất cả sản phẩm bạn đã thêm sẽ bị xóa.'
      )
    ) {
      return;
    }

    try {
      await groupOrdersApi.leave(groupId);
      message.success('Đã rời nhóm thành công');

      // Điều hướng về trang cửa hàng hoặc trang chủ
      if (group?.store?.slug) {
        navigate(`/stores/slug/${group.store.slug}`);
      } else {
        navigate('/');
      }
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || 'Không thể rời nhóm';
      message.error(errorMsg);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <EveryMartHeader />

      <main className="flex-1 mx-auto w-full max-w-screen-2xl px-4 py-6">
        {/* Header với các nút action */}
        <div className="mb-6 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h1 className="text-2xl font-bold text-slate-900">
              <TeamOutlined /> 
              {group?.name ?? '—'}
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
            <div className="space-y-3">
              {/* ===== NÚT KHI NHÓM ĐANG MỞ ===== */}
              {group?.status === 'open' && (
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={onEditName}
                    className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm font-semibold hover:bg-slate-50 transition-colors"
                  >
                    <EditOutlined /> Sửa tên nhóm
                  </button>
                  <button
                    onClick={onEditDeadline}
                    className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm font-semibold hover:bg-slate-50 transition-colors"
                  >
                    <ClockCircleOutlined /> Sửa thời hạn
                  </button>
                  <button
                    onClick={onEditTargetCount}
                    className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm font-semibold hover:bg-slate-50 transition-colors"
                  >
                    <TeamOutlined /> Giới hạn thành viên
                  </button>
                  <button
                    onClick={onAddMember}
                    className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm font-semibold hover:bg-slate-50 transition-colors"
                  >
                    <UsergroupAddOutlined /> Thêm thành viên
                  </button>
                  <button
                    onClick={() => setChatOpen(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded"
                  >
                    Mở chat nhóm
                  </button>
                  <button
                    onClick={onManualLockGroup}
                    className="px-3 py-2 rounded-lg border border-orange-300 bg-orange-50 text-orange-700 text-sm font-semibold hover:bg-orange-100 transition-colors"
                  >
                    <LockOutlined /> Khóa nhóm ngay
                  </button>
                  <button
                    onClick={onDeleteGroup}
                    className="px-3 py-2 rounded-lg border border-red-300 bg-white text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors"
                  >
                    <RestOutlined /> Xóa nhóm
                  </button>
                </div>
              )}

              {/* ===== NÚT KHI NHÓM ĐÃ KHÓA ===== */}
              {group?.status === 'locked' && (
                <div className="flex flex-wrap gap-2">
                  {/*  NÚT MỞ KHÓA - Chỉ hiện nếu chưa ai thanh toán */}
                  {!members.some((m) => m.has_paid) ? (
                    <>
                      <button
                        onClick={onUnlockGroup}
                        className="px-3 py-2 rounded-lg border border-orange-300 bg-orange-50 text-orange-700 text-sm font-semibold hover:bg-orange-100 transition-colors"
                      >
                        🔓 Mở khóa nhóm
                      </button>
                      <button
                        onClick={onDeleteGroup}
                        className="px-3 py-2 rounded-lg border border-red-300 bg-white text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors"
                      >
                        🗑️ Xóa nhóm
                      </button>
                    </>
                  ) : (
                    /* Thông báo nếu đã có người thanh toán */
                    <div className="text-sm text-blue-700 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
                      Nhóm đang trong quá trình thanh toán. Chờ tất cả hoàn tất.
                    </div>
                  )}
                </div>
              )}

              {/* ===== THÔNG BÁO KHI ĐÃ HOÀN THÀNH ===== */}
              {group?.status === 'completed' && (
                <div className="text-sm text-green-700 bg-green-50 px-4 py-2 rounded-lg border border-green-200">
                  Nhóm đã hoàn thành! Tất cả đã thanh toán.
                </div>
              )}
            </div>
          )}

          {!isHost && myMember && group?.status === 'open' && (
            <div className="flex flex-wrap gap-2 mt-4">
              <button
                onClick={onLeaveGroup}
                className="px-4 py-2 rounded-lg border border-red-300 bg-white text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors"
              >
                🚪 Rời nhóm
              </button>

              <button
                    onClick={() => setChatOpen(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded"
                  >
                    Mở chat nhóm
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* PANEL 1: Thông tin nhóm */}
            <section className="lg:col-span-4 bg-white rounded-xl shadow-sm border p-6 space-y-4">
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

                {group?.target_member_count && (
                  <div className="pt-3 border-t space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 text-sm">Mục tiêu:</span>
                      <span className="font-semibold text-blue-600">
                        {members.length} / {group.target_member_count} người
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="relative w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all duration-500"
                        style={{
                          width: `${Math.min(
                            (members.length / group.target_member_count) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>{' '}
                    {group?.status === 'open' && (
                      <>
                        {members.length >= group.target_member_count ? (
                          <p className="text-xs text-green-600 font-medium">
                            Đã đủ số lượng! Nhóm sẽ tự động khóa khi tất cả chọn
                            sản phẩm.
                          </p>
                        ) : (
                          <p className="text-xs text-slate-500">
                            Cần thêm{' '}
                            {group.target_member_count - members.length} người
                            nữa để tự động khóa
                            {isHost && ' (hoặc host có thể khóa thủ công)'}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                )}

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
                      <SwapOutlined /> Thay đổi chế độ giao hàng
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
            <section className="lg:col-span-4 bg-white rounded-xl shadow-sm border p-6">
              <h2 className="font-bold text-lg mb-4">
                <TeamOutlined /> Thành viên ({members.length})
              </h2>

              {membersWithoutAddress.length > 0 &&
                group?.delivery_mode === 'member_address' && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-300 rounded-lg">
                    <p className="text-xs font-semibold text-yellow-800 mb-1">
                      <WarningOutlined /> Thành viên chưa có địa chỉ:
                    </p>
                    <ul className="text-xs text-yellow-700 space-y-0.5">
                      {membersWithoutAddress.map((m) => (
                        <li key={m.id}>
                          •{' '}
                          {m?.user?.profile?.full_name ||
                            m?.user?.username ||
                            `User #${m?.user?.id}`}
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
                        {m.is_host === 1 ? (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                            <CrownOutlined /> Host
                          </span>
                        ) : (
                          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                            Thành viên
                          </span>
                        )}

                        {group?.status === 'locked' && (
                          <span
                            className={`ml-2 text-xs px-2 py-0.5 rounded ${
                              m.has_paid
                                ? 'bg-green-100 text-green-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {m.has_paid
                              ? '✅ Đã thanh toán'
                              : '⏳ Chưa thanh toán'}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          m.status === 'joined'
                            ? 'bg-green-100 text-green-700'
                            : m.status === 'paid'
                            ? 'bg-blue-100 text-blue-700'
                            : m.status === 'ordered'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {m.status === 'paid' ? ' Đã thanh toán' : m.status}
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
            {/*  PANEL 3: THANH TOÁN - HIỆN CHO CẢ 2 MODE - 4 cột (STICKY) */}
            <section className="lg:col-span-4 sticky top-6 self-start">
              <GroupPaymentBox
                isHost={isHost}
                myMember={myMember}
                myItems={myItems}
                myTotal={myTotal}
                group={group}
                groupTotal={totals.totalAfter}
                onCheckout={() => setShowMemberCheckout(true)}
                onHostCheckout={() => setShowCheckout(true)}
              />
            </section>

            {/* PANEL 4: Sản phẩm đã chọn */}
            <section
              className={`bg-white rounded-xl shadow-sm border p-6 ${
                group?.delivery_mode === 'member_address'
                  ? 'lg:col-span-8'
                  : 'lg:col-span-8'
              }`}
            >
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

                  {/* ========== THÔNG BÁO CHO MEMBER - MODE host_address & OPEN ========== */}
                  {!isHost &&
                    group?.delivery_mode === 'host_address' &&
                    group?.status === 'open' &&
                    myItems.length > 0 && (
                      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                        <p className="text-sm text-blue-700">
                          ⏳ Chờ host khóa nhóm và thanh toán
                        </p>
                      </div>
                    )}
                  {/* ========== THÔNG BÁO CHO MEMBER - MODE host_address & LOCKED ========== */}
                  {!isHost &&
                    group?.delivery_mode === 'host_address' &&
                    group?.status === 'locked' &&
                    myItems.length > 0 && (
                      <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg text-center">
                        <p className="text-sm text-orange-700 font-medium">
                          ⏳ Chờ host thanh toán cho nhóm
                        </p>
                      </div>
                    )}

                  {/* ========== THÔNG BÁO CHO MEMBER - MODE member_address & OPEN ========== */}
                  {!isHost &&
                    group?.delivery_mode === 'member_address' &&
                    group?.status === 'open' &&
                    myItems.length > 0 && (
                      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                        <p className="text-sm text-blue-700">
                          ⏳ Chờ host khóa nhóm hoặc đủ{' '}
                          {group?.target_member_count} người để thanh toán
                        </p>
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

      <GroupOrderCheckout
        open={showMemberCheckout}
        onClose={() => setShowMemberCheckout(false)}
        groupId={groupId}
        groupItems={myItems}
        totalAmount={myTotal}
        discountPercent={0}
        deliveryMode={group?.delivery_mode || 'host_address'}
        isMemberCheckout={true}
        onSuccess={() => {
          setShowMemberCheckout(false);
          refresh();
        }}
      />
      <GroupChatModal
        isOpen={isChatOpen}
        onClose={() => setChatOpen(false)}
        groupId={groupId}
        userId={user?.user_id}
        startGroupConversation={startGroupConversation}
        sendMessage={sendMessage}
        selectedConversationId={selectedConversationId}
        setSelectedConversationId={setSelectedConversationId}
        messages={messages}
        setMessages={setMessages}
        joinConversationRoom={joinConversationRoom}
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
