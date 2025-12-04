import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    groupOrdersApi,
    groupOrderItemsApi,
} from '../../../../service/groupOrderItems.service';
import EveryMartHeader from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import { useAuth } from '../../../hooks/useAuth';
import { useGroupOrderSocket } from './../../../hooks/useGroupOrderSocket';
import { GroupOrderCheckout } from './GroupOrderCheckout';
import { GroupDeadlineModal } from './GroupDeadlineModal';
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
    DeleteOutlined,
    LogoutOutlined,
    MessageOutlined,
    ShoppingCartOutlined,
    CreditCardOutlined,
    CheckCircleOutlined,
    ExclamationCircleOutlined,
    PhoneOutlined,
    CheckOutlined,
    SmileOutlined,
    GiftOutlined,
    UnlockOutlined,

} from '@ant-design/icons';
import AddressModal from './../../../page/AddressModal';
import { message } from 'antd';
import { GroupPaymentBox } from './GroupPaymentBox';
import { useState } from 'react';
import GroupChatModal from './GroupChatModal';
import { useChatSocket } from '../../../hooks/useChatSocket';
import { SenderType } from '../../../types/chat.types';
import { GroupExpiryCountdown } from './GroupExpiryCountdown';

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

    const [voucherCode, setVoucherCode] = React.useState<string>('');
    const [voucherError, setVoucherError] = React.useState<string>('');
    const [voucherDiscount, setVoucherDiscount] = React.useState<number>(0);
    const [isValidatingVoucher, setIsValidatingVoucher] = React.useState(false);
    const [appliedVoucher, setAppliedVoucher] = React.useState<any>(null);
    const [isChatOpen, setChatOpen] = useState(false);
    const [deadlineModalOpen, setDeadlineModalOpen] = useState(false);
    const [showInvite, setShowInvite] = useState(false);
    const inviteUrl =
        group?.invite_link ||
        `${window.location.origin}/group/${group?.uuid ?? ''}`;

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
                            (m) => m?.user?.userId === data.member?.user?.user_id
                        );
                        return exists ? prev : [data.member, ...prev];
                    });
                }
                refresh();
                break;
            case 'member-left':
                if (data?.userId) {
                    setMembers((prev) =>
                        prev.filter((m) => m?.user?.userId !== data.userId)
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
                        (m) => m?.user?.userId === data.userId
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
                message.success(
                    data?.message || '🔒 Nhóm đã tự động khóa!',
                    5
                );
                refresh();
                break;

            case 'group-manual-locked':
                message.success(
                    data?.message || '🔒 Host đã khóa nhóm!',
                    5
                );
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

        // Nếu có pricing_rule, sử dụng giá từ pricing rule
        if (item?.pricing_rule?.price) {
            const pricingRulePrice = Number(item.pricing_rule.price);
            const totalBeforeDiscount = pricingRulePrice * item.quantity;
            return totalBeforeDiscount;
        }

        // Nếu không có pricing rule, tính ngược từ giá đã giảm
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

    // Validate voucher function
    const validateVoucher = async (code: string) => {
        if (!code || !code.trim()) {
            setVoucherError('');
            setVoucherDiscount(0);
            setAppliedVoucher(null);
            return;
        }

        setIsValidatingVoucher(true);
        setVoucherError('');

        try {
            const orderItems = groupItems.map((item: any) => ({
                productId: item.product.id,
                quantity: item.quantity,
                price: Number(item.price),
            }));

            const storeId = groupItems[0]?.product?.store_id || 0;
            const token = localStorage.getItem('token');

            const response = await fetch(`${import.meta.env.VITE_BE_BASE_URL}/user/vouchers/apply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    code: code.trim(),
                    storeId: storeId,
                    orderItems: orderItems,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Voucher không hợp lệ');
            }

            const data = await response.json();
            const { voucher, discount } = data;

            // Chỉ cho phép PLATFORM (4) hoặc STORE (2)
            if (voucher.type !== 4 && voucher.type !== 2) {
                const typeNames: any = {
                    0: 'SHIPPING',
                    1: 'PRODUCT',
                    2: 'STORE',
                    3: 'CATEGORY',
                    4: 'PLATFORM',
                };
                throw new Error(
                    `Mua nhóm chỉ được áp dụng voucher PLATFORM hoặc STORE. Voucher này là loại ${typeNames[voucher.type] || 'UNKNOWN'}.`
                );
            }

            setAppliedVoucher(voucher);
            setVoucherDiscount(Number(discount));
            message.success(`Áp dụng voucher thành công! Giảm ${Number(discount).toLocaleString()}đ`);
        } catch (error: any) {
            const errorMsg = error?.message || 'Voucher không hợp lệ';
            setVoucherError(errorMsg);
            setVoucherDiscount(0);
            setAppliedVoucher(null);
            message.error(errorMsg);
        } finally {
            setIsValidatingVoucher(false);
        }
    };

    // Remove voucher function
    const removeVoucher = () => {
        setVoucherCode('');
        setVoucherError('');
        setVoucherDiscount(0);
        setAppliedVoucher(null);
        message.info('Đã xóa voucher');
    };

    const onEditName = async () => {
        const name = prompt('Nhập tên nhóm mới:', group?.name ?? '');
        if (!name) return;
        await groupOrdersApi.update(groupId, { name });
        await refresh();
        message.success('Đã cập nhật tên nhóm!');
    };

    // const onEditDeadline = async () => {
    //     const def = group?.expires_at
    //         ? dayjs(group.expires_at).format('YYYY-MM-DD HH:mm:ss')
    //         : '';
    //     const value = prompt(
    //         'Nhập thời hạn (YYYY-MM-DD HH:mm:ss, để trống = bỏ hạn):',
    //         def
    //     );
    //     const payload = value
    //         ? { expiresAt: dayjs(value).toISOString() }
    //         : { expiresAt: null };
    //     await groupOrdersApi.update(groupId, payload);
    //     await refresh();
    //     message.success('Đã cập nhật thời hạn!');
    // };

    const onSaveDeadline = async (expiresAtIso: string | null) => {
        try {
            await groupOrdersApi.update(groupId, { joinExpiresAt: expiresAtIso });
            await refresh();
            if (expiresAtIso) {
                message.success('Đã cập nhật thời hạn!');
            } else {
                message.success('Đã bỏ thời hạn của nhóm!');
            }
            setDeadlineModalOpen(false);
        } catch (error: any) {
            const errorMsg =
                error?.response?.data?.message || 'Không thể cập nhật thời hạn';
            message.error(errorMsg);
        }
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
        const targetMode = currentMode === 'member_address' ? 'host_address' : 'member_address';

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
                message.success('Đã đổi sang chế độ "Giao riêng từng người". Các thành viên hãy chọn địa chỉ giao hàng!');
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
        if (!window.confirm('🔓 Mở khóa nhóm?\n\nThành viên có thể tiếp tục thêm/bớt sản phẩm.')) {
            return;
        }

        try {
            await groupOrdersApi.unlockGroup(groupId);
            message.success('Đã mở khóa nhóm! Thành viên có thể chỉnh sửa.');
            await refresh();
        } catch (error: any) {
            const errorMsg = error?.response?.data?.message || 'Không thể mở khóa nhóm';
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
            item?.member?.user?.id === user.user_id ||
            item?.user_id === user.user_id
        );
    };

    const isHost = React.useMemo(() => {
        if (!user?.user_id) return false;

        // 1. So sánh trực tiếp với group owner
        if (group?.user?.id === user.user_id) return true;

        // 2. Hoặc tìm member host
        return group?.members?.some(
            (m: any) => m.is_host === true && m.user?.id === user.user_id
        );
    }, [user?.user_id, group]);

    console.log('isHost nha:', isHost);

    const myItems = React.useMemo(() => {
        if (!user?.user_id) return [];
        return groupItems.filter((it) => it.member?.user?.id === user.user_id);
    }, [groupItems, user?.user_id]);

    //  THÊM: Tính tổng tiền của member
    const myTotal = React.useMemo(() => {
        return myItems.reduce((sum, it) => sum + (Number(it.price) || 0), 0);
    }, [myItems]);



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
    const baseItems = React.useMemo(() => {
        if (Array.isArray(groupItems) && groupItems.length > 0) return groupItems;
        if (Array.isArray(group?.items)) return group.items;
        return [];
    }, [groupItems, group?.items]);

    // Tính tổng với logic mới
    const totals = React.useMemo(() => {
        const discountPercent = Number(group?.discount_percent || 0);
        return calcTotals(baseItems, discountPercent);
    }, [baseItems, group?.discount_percent]);

    const groupedItemsByMember = React.useMemo(() => {
        const map = new Map<number, { member: any; items: any[] }>();

        baseItems.forEach((it: any) => {
            const memberId = it?.member?.id ?? it?.member?.user?.id;
            if (!memberId) return;

            if (!map.has(memberId)) {
                map.set(memberId, { member: it.member, items: [] });
            }
            map.get(memberId)!.items.push(it);
        });

        return Array.from(map.values());
    }, [baseItems]);

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
        if (!window.confirm('⚠️ Bạn có chắc muốn rời nhóm? Tất cả sản phẩm bạn đã thêm sẽ bị xóa.')) {
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
                                        <EditOutlined />  Sửa tên nhóm
                                    </button>
                                    <button
                                        onClick={() => setDeadlineModalOpen(true)}
                                        className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm font-semibold hover:bg-slate-50 transition-colors"
                                    >
                                        <ClockCircleOutlined />  Sửa thời hạn tham gia
                                    </button>
                                    <button
                                        onClick={onEditTargetCount}
                                        className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm font-semibold hover:bg-slate-50 transition-colors"
                                    >
                                        <TeamOutlined />  Sửa giới hạn thành viên
                                    </button>
                                    <button
                                        onClick={() => setShowInvite(true)}
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
                                                <UnlockOutlined /> Mở khóa nhóm
                                            </button>
                                            <button
                                                onClick={onDeleteGroup}
                                                className="px-3 py-2 rounded-lg border border-red-300 bg-white text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors"
                                            >
                                                <DeleteOutlined /> Xóa nhóm
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
                                <LogoutOutlined /> Rời nhóm
                            </button>
                            <button
                                onClick={() => setChatOpen(true)}
                                className="px-4 py-2 bg-blue-600 text-white rounded"
                            >
                                <MessageOutlined />  Mở chat nhóm
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
                                        className={`font-semibold px-2 py-1 rounded ${group?.status === 'open'
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
                                    <span className="text-slate-600">Hết hạn tham gia nhóm:</span>
                                    <span className="font-medium">
                                        {group?.join_expires_at
                                            ? new Date(group.join_expires_at).toLocaleString('vi-VN')
                                            : '—'}
                                    </span>
                                </div>

                                <GroupExpiryCountdown
                                    status={group?.status}
                                    expiresAt={group?.expires_at}
                                    variant="full"
                                />


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
                                        </div> {group?.status === 'open' && (
                                            <>
                                                {members.length >= group.target_member_count ? (
                                                    <p className="text-xs text-green-600 font-medium">
                                                        Đã đủ số lượng! Nhóm sẽ tự động khóa khi tất cả chọn sản phẩm.
                                                    </p>
                                                ) : (
                                                    <p className="text-xs text-slate-500">
                                                        Cần thêm {group.target_member_count - members.length} người nữa để tự động khóa
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
                                                    <CheckCircleOutlined />  {myMember.address_id.recipientName}
                                                </div>
                                                <div className="text-green-700">
                                                    <PhoneOutlined />  {myMember.address_id.phone}
                                                </div>
                                                <div className="text-green-700">
                                                    <EnvironmentOutlined />{' '}
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
                                                <WarningOutlined /> Bạn chưa chọn địa chỉ giao hàng!
                                            </div>
                                        )}

                                        <button
                                            onClick={() => setShowMemberAddressModal(true)}
                                            className="w-full px-3 py-2 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 rounded transition-colors font-medium"
                                        >
                                            {myMember?.address_id ? (
                                                <>
                                                    <EditOutlined /> Thay đổi địa chỉ
                                                </>
                                            ) : (
                                                <>
                                                    <EnvironmentOutlined /> Chọn địa chỉ
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* PANEL 2: Thành viên */}
                        <section className="lg:col-span-4 bg-white rounded-xl shadow-sm border p-6">
                            <h2 className="font-bold text-lg mb-4">
                                <TeamOutlined />  Thành viên ({members.length})
                            </h2>

                            {membersWithoutAddress.length > 0 &&
                                group?.delivery_mode === 'member_address' && (
                                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-300 rounded-lg">
                                        <p className="text-xs font-semibold text-yellow-800 mb-1">
                                            <WarningOutlined />Thành viên chưa có địa chỉ:
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
                                                {m.is_host === true ? (
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
                                                        className={`ml-2 text-xs px-2 py-0.5 rounded inline-flex items-center gap-1 ${m.has_paid
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-yellow-100 text-yellow-700'
                                                            }`}
                                                    >
                                                        {m.has_paid ? (
                                                            <>
                                                                <CheckCircleOutlined /> Đã thanh toán
                                                            </>
                                                        ) : (
                                                            <>
                                                                <ClockCircleOutlined /> Chưa thanh toán
                                                            </>
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={`text-xs px-2 py-1 rounded ${m.status === 'joined'
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
                                                    <CheckCircleOutlined
                                                        className="text-green-600"
                                                        title="Đã có địa chỉ"
                                                    />
                                                ) : (
                                                    <WarningOutlined
                                                        className="text-yellow-600"
                                                        title="Chưa có địa chỉ"
                                                    />
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
                                voucherCode={voucherCode}
                                voucherDiscount={voucherDiscount}
                                appliedVoucher={appliedVoucher}
                                voucherError={voucherError}
                                isValidatingVoucher={isValidatingVoucher}
                                onVoucherCodeChange={(code) => {
                                    setVoucherCode(code);
                                    setVoucherError('');
                                }}
                                onApplyVoucher={() => validateVoucher(voucherCode)}
                                onRemoveVoucher={removeVoucher}
                            />
                        </section>

                        {/* PANEL 4: Sản phẩm đã chọn */}
                        {/* PANEL 4: Sản phẩm đã chọn */}
                        <section
                            className={`bg-white rounded-xl shadow-sm border p-6 ${group?.delivery_mode === 'member_address' ? 'lg:col-span-8' : 'lg:col-span-8'
                                }`}
                        >
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                                    <ShoppingCartOutlined className="text-slate-700" />
                                </div>
                                <h2 className="font-bold text-lg text-slate-900">Sản phẩm đã chọn</h2>
                            </div>

                            {Array.isArray(groupItems) && groupItems.length > 0 ? (
                                <div className="space-y-5">
                                    {/* Bảng sản phẩm */}
                                    <div className="overflow-x-auto rounded-xl border border-slate-100">
                                        <table className="min-w-full text-sm">
                                            <thead className="bg-slate-50">
                                                <tr className="text-left">
                                                    <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                                        Thành viên
                                                    </th>
                                                    <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                                        Sản phẩm
                                                    </th>
                                                    <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide text-center">
                                                        SL
                                                    </th>
                                                    <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">
                                                        Giá
                                                    </th>

                                                    {group?.delivery_mode === 'member_address' && (
                                                        <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                                            <div className="flex items-center gap-1">
                                                                <EnvironmentOutlined className="text-blue-600" />
                                                                <span>Địa chỉ giao hàng</span>
                                                            </div>
                                                        </th>
                                                    )}

                                                    <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                                        Ghi chú
                                                    </th>
                                                    <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide text-center">
                                                        Thao tác
                                                    </th>
                                                </tr>
                                            </thead>

                                            <tbody className="divide-y divide-slate-100">
                                                {groupedItemsByMember.map((memberGroup) =>
                                                    memberGroup.items.map((it: any, index: number) => {
                                                        const canEdit = canEditItem(it);
                                                        const memberAddress = it?.member?.address_id;
                                                        const rowSpanCount = memberGroup.items.length;

                                                        return (
                                                            <tr
                                                                key={it.id}
                                                                className="hover:bg-slate-50/70 transition-colors"
                                                            >
                                                                {/* Cột thành viên – gom theo group, chỉ hiện 1 lần */}
                                                                {index === 0 && (
                                                                    <td
                                                                        className="py-4 px-4 align-top bg-slate-50/60 border-r border-slate-100"
                                                                        rowSpan={rowSpanCount}
                                                                    >
                                                                        <div className="flex items-start gap-3">
                                                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                                                                                {(
                                                                                    (it?.member?.user?.profile?.full_name ||
                                                                                        it?.member?.user?.username ||
                                                                                        'U')[0] ?? 'U'
                                                                                )
                                                                                    .toString()
                                                                                    .toUpperCase()}
                                                                            </div>
                                                                            <div className="space-y-1">
                                                                                <div className="font-semibold text-slate-900">
                                                                                    {getDisplayName(it)}
                                                                                </div>
                                                                                <div className="text-xs text-slate-500">
                                                                                    {it?.member?.user?.email}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                )}

                                                                {/* Sản phẩm */}
                                                                <td className="py-4 px-4 align-top">
                                                                    <div className="space-y-1">
                                                                        <div className="font-medium text-slate-900">
                                                                            {it?.product?.name ?? `Product #${it?.product?.id ?? ''}`}
                                                                        </div>
                                                                        <div className="text-xs text-slate-500">
                                                                            Mã SP: {it?.product?.sku || it?.product?.id || '—'}
                                                                        </div>
                                                                    </div>
                                                                </td>

                                                                {/* SL */}
                                                                <td className="py-4 px-4 text-center align-top">
                                                                    <span className="font-semibold">{it?.quantity}</span>
                                                                </td>

                                                                {/* Giá */}
                                                                <td className="py-4 px-4 text-right align-top">
                                                                    <span className="font-semibold text-slate-900">
                                                                        {getItemPreGroupPrice(
                                                                            it,
                                                                            Number(group?.discount_percent || 0)
                                                                        ).toLocaleString()} đ
                                                                    </span>
                                                                </td>

                                                                {/* Địa chỉ – chỉ trong mode member_address, gộp theo member */}
                                                                {group?.delivery_mode === 'member_address' &&
                                                                    (index === 0 ? (
                                                                        <td
                                                                            className="py-4 px-4 align-top"
                                                                            rowSpan={rowSpanCount}
                                                                        >
                                                                            {memberAddress ? (
                                                                                <div className="text-xs space-y-1">
                                                                                    <div className="font-semibold text-green-700 flex items-center gap-1">
                                                                                        <CheckCircleOutlined />
                                                                                        <span>{memberAddress.recipientName}</span>
                                                                                    </div>
                                                                                    <div className="text-slate-600 flex items-center gap-1">
                                                                                        <PhoneOutlined />
                                                                                        <span>{memberAddress.phone}</span>
                                                                                    </div>
                                                                                    <div
                                                                                        className="text-slate-600 max-w-xs line-clamp-2 flex items-start gap-1"
                                                                                        title={[
                                                                                            memberAddress.street,
                                                                                            memberAddress.ward,
                                                                                            memberAddress.district,
                                                                                            memberAddress.province,
                                                                                        ]
                                                                                            .filter(Boolean)
                                                                                            .join(', ')}
                                                                                    >
                                                                                        <EnvironmentOutlined className="mt-0.5" />
                                                                                        <span>
                                                                                            {[
                                                                                                memberAddress.street,
                                                                                                memberAddress.ward,
                                                                                                memberAddress.district,
                                                                                            ]
                                                                                                .filter(Boolean)
                                                                                                .join(', ')}
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                            ) : (
                                                                                <div className="text-xs text-yellow-700 bg-yellow-50 px-2 py-1 rounded inline-flex items-center gap-1">
                                                                                    <WarningOutlined />
                                                                                    <span>Chưa có địa chỉ</span>
                                                                                </div>
                                                                            )}
                                                                        </td>
                                                                    ) : null)}

                                                                {/* Ghi chú */}
                                                                <td className="py-4 px-4 align-top">
                                                                    <span className="text-slate-600 text-xs italic">
                                                                        {it?.note || '—'}
                                                                    </span>
                                                                </td>

                                                                {/* Thao tác */}
                                                                <td className="py-4 px-4 align-top">
                                                                    {canEdit ? (
                                                                        <div className="flex gap-2 justify-center">
                                                                            <button
                                                                                onClick={() => onEditItemNote(it.id, it.note)}
                                                                                className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 border border-blue-100 transition-colors font-medium flex items-center gap-1"
                                                                            >
                                                                                <EditOutlined />
                                                                            </button>
                                                                            <button
                                                                                onClick={() =>
                                                                                    onDeleteItem(
                                                                                        it.id,
                                                                                        it?.product?.name || 'Sản phẩm'
                                                                                    )
                                                                                }
                                                                                className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100 border border-red-100 transition-colors font-medium flex items-center gap-1"
                                                                            >
                                                                                <DeleteOutlined />
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
                                                    })
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Card tổng tiền */}
                                    <div className="mt-2 p-5 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200 space-y-3">
                                        <div className="flex justify-between text-sm text-slate-700">
                                            <span>Tạm tính (chưa giảm):</span>
                                            <span >
                                                {totals.subtotalBefore.toLocaleString()} đ
                                            </span>
                                        </div>

                                        {group?.discount_percent > 0 && (
                                            <div className="flex justify-between text-sm text-green-600 font-medium">
                                                <span>
                                                    Giảm giá nhóm ({Number(group?.discount_percent || 0)}%):
                                                </span>
                                                <span className="font-bold font-mono">
                                                    -{totals.discountAmount.toLocaleString()} đ
                                                </span>
                                            </div>
                                        )}

                                        {voucherDiscount > 0 && (
                                            <div className="flex justify-between text-sm text-orange-600 font-medium">
                                                <span>Giảm từ voucher:</span>
                                                <span className="font-bold font-mono">
                                                    -{voucherDiscount.toLocaleString()} đ
                                                </span>
                                            </div>
                                        )}

                                        <div className="border-t border-green-200 pt-3 flex justify-between items-center">
                                            <span className="text-slate-900 font-semibold text-base">
                                                Thành tiền:
                                            </span>
                                            <span className="text-green-600 text-2xl ">
                                                {(totals.totalAfter - voucherDiscount).toLocaleString()} đ
                                            </span>
                                        </div>
                                    </div>

                                    {/* Các banner thông báo giữ nguyên như cũ */}
                                    {!isHost &&
                                        group?.delivery_mode === 'host_address' &&
                                        group?.status === 'open' &&
                                        myItems.length > 0 && (
                                            <div className="mt-2 p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                                                <p className="text-sm text-blue-700">
                                                    <ClockCircleOutlined /> Chờ host khóa nhóm và thanh toán
                                                </p>
                                            </div>
                                        )}

                                    {!isHost &&
                                        group?.delivery_mode === 'host_address' &&
                                        group?.status === 'locked' &&
                                        myItems.length > 0 && (
                                            <div className="mt-2 p-4 bg-orange-50 border border-orange-200 rounded-lg text-center">
                                                <p className="text-sm text-orange-700 font-medium">
                                                    <ClockCircleOutlined /> Chờ host thanh toán cho nhóm
                                                </p>
                                            </div>
                                        )}

                                    {!isHost &&
                                        group?.delivery_mode === 'member_address' &&
                                        group?.status === 'open' &&
                                        myItems.length > 0 && (
                                            <div className="mt-2 p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                                                <p className="text-sm text-blue-700">
                                                    <ClockCircleOutlined /> Chờ host khóa nhóm hoặc đủ{' '}
                                                    {group?.target_member_count} người để thanh toán
                                                </p>
                                            </div>
                                        )}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <ShoppingCartOutlined style={{ fontSize: 48 }} />
                                    <p className="text-slate-500 text-lg mt-3">
                                        Chưa có sản phẩm nào được chọn
                                    </p>
                                    <p className="text-slate-400 text-sm mt-1">
                                        Quay lại cửa hàng để thêm sản phẩm vào nhóm
                                    </p>
                                </div>
                            )}
                        </section>

                        {showInvite && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
                                <div className="w-full max-w-lg rounded-xl bg-white p-4 shadow-xl">
                                    <div className="mb-3 text-base font-semibold">
                                        Chia sẻ liên kết tham gia
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            readOnly
                                            value={inviteUrl}
                                            className="flex-1 rounded-lg border px-3 py-2 text-sm"
                                        />
                                        <button
                                            onClick={async () => {
                                                await navigator.clipboard.writeText(inviteUrl);
                                                message.success('Đã sao chép liên kết!');
                                            }}
                                            className="px-3 py-2 rounded-lg bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700"
                                        >
                                            Copy
                                        </button>
                                    </div>
                                    <div className="mt-3 flex justify-end">
                                        <button
                                            onClick={() => setShowInvite(false)}
                                            className="px-3 py-2 rounded-lg border text-sm font-semibold hover:bg-slate-50"
                                        >
                                            Đóng
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

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
                preAppliedVoucherCode={voucherCode}
                preAppliedVoucherDiscount={voucherDiscount}
                preAppliedVoucher={appliedVoucher}
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

            <GroupDeadlineModal
                open={deadlineModalOpen}
                initialExpiresAt={group?.join_expires_at}
                onSubmit={onSaveDeadline}
                onCancel={() => setDeadlineModalOpen(false)}
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