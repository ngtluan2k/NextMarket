import React from 'react';
import { GroupOrderVoucher } from './GroupOrderVoucher';


interface GroupPaymentBoxProps {
    isHost: boolean;
    myMember: any;
    myItems: any[];
    myTotal: number;
    group: any;
    groupTotal?: number; // Tổng tiền cả nhóm (cho host)
    onCheckout: () => void; // Member checkout
    onHostCheckout?: () => void; // Host checkout
    voucherCode?: string;
    voucherDiscount?: number;
    appliedVoucher?: any;
    voucherError?: string;
    isValidatingVoucher?: boolean;
    onVoucherCodeChange?: (code: string) => void;
    onApplyVoucher?: () => void;
    onRemoveVoucher?: () => void;
}

export const GroupPaymentBox: React.FC<GroupPaymentBoxProps> = ({
    isHost,
    myMember,
    myItems,
    myTotal,
    group,
    groupTotal,
    onCheckout,
    onHostCheckout,
    voucherCode,
    voucherDiscount,
    appliedVoucher,
    voucherError,
    isValidatingVoucher,
    onVoucherCodeChange,
    onApplyVoucher,
    onRemoveVoucher,
}) => {
    // ========== MODE: host_address ==========
    if (group?.delivery_mode === 'host_address') {
        // HOST xem
        if (isHost) {
            // Nhóm OPEN
            if (group?.status === 'open') {
                return (
                    <div className="bg-white rounded-xl shadow-sm border p-6 sticky top-6">
                        <h3 className="text-lg font-bold mb-4">💰 Thanh toán</h3>
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                            <p className="text-sm text-blue-700 font-medium">
                                💡 Vui lòng khóa nhóm trước để thanh toán
                            </p>
                        </div>
                    </div>
                );
            }

            // Nhóm LOCKED - Hiện nút thanh toán cho nhóm
            if (group?.status === 'locked') {
                const finalTotal = (groupTotal || 0) - (voucherDiscount || 0);

                return (
                    <div className="bg-white rounded-xl shadow-sm border p-6 sticky top-6">
                        <h3 className="text-lg font-bold mb-4 text-slate-800">
                            💰 Thanh toán cho nhóm
                        </h3>
                        {/* Tổng tiền với breakdown */}
                        <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg mb-4 space-y-2">
                            <div className="flex justify-between text-sm text-slate-700">
                                <span>Tạm tính:</span>
                                <span className="font-semibold">
                                    {(groupTotal || 0).toLocaleString()} đ
                                </span>
                            </div>

                            {voucherDiscount && voucherDiscount > 0 && (
                                <div className="flex justify-between text-sm text-orange-600">
                                    <span>🎟️ Giảm từ voucher:</span>
                                    <span className="font-semibold">
                                        -{voucherDiscount.toLocaleString()} đ
                                    </span>
                                </div>
                            )}

                            <div className="flex justify-between items-center text-xl font-bold pt-2 border-t border-green-200">
                                <span className="text-slate-900">Tổng cộng:</span>
                                <span className="text-green-600">
                                    {finalTotal.toLocaleString()} đ
                                </span>
                            </div>
                        </div>
                        <div className="mb-4 p-4 bg-slate-50 rounded-lg">
                            <GroupOrderVoucher
                                voucherCode={voucherCode || ''}
                                voucherDiscount={voucherDiscount || 0}
                                appliedVoucher={appliedVoucher}
                                voucherError={voucherError || ''}
                                isValidatingVoucher={isValidatingVoucher || false}
                                onVoucherCodeChange={onVoucherCodeChange || (() => { })}
                                onApplyVoucher={onApplyVoucher || (() => { })}
                                onRemoveVoucher={onRemoveVoucher || (() => { })}
                            />
                        </div>

                        <button
                            onClick={onHostCheckout}
                            className="w-full px-6 py-4 text-lg font-bold rounded-xl shadow-lg bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 transform hover:scale-105 transition-all"
                        >
                            💳 Thanh toán {finalTotal.toLocaleString()} đ
                        </button>

                        <p className="text-xs text-slate-500 mt-3 text-center">
                            Bạn sẽ thanh toán cho tất cả thành viên
                        </p>
                    </div>
                );
            }

            // Nhóm COMPLETED
            if (group?.status === 'completed') {
                return (
                    <div className="bg-white rounded-xl shadow-sm border p-6 sticky top-6">
                        <h3 className="text-lg font-bold mb-4">💰 Thanh toán</h3>
                        <div className="p-6 bg-green-100 border-2 border-green-500 rounded-xl text-center">
                            <div className="text-6xl mb-3">✅</div>
                            <h3 className="text-xl font-bold text-green-800">Đã hoàn thành!</h3>
                            <p className="text-sm text-green-700 mt-2">
                                Đơn hàng đã được thanh toán
                            </p>
                        </div>
                    </div>
                );
            }
        }

        // MEMBER xem
        if (!isHost && myItems.length > 0) {
            // Nhóm OPEN
            if (group?.status === 'open') {
                return (
                    <div className="bg-white rounded-xl shadow-sm border p-6 sticky top-6">
                        <h3 className="text-lg font-bold mb-4">💰 Thanh toán</h3>
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                            <p className="text-sm text-blue-700">
                                ⏳ Chờ host khóa nhóm và thanh toán
                            </p>
                        </div>
                    </div>
                );
            }

            // Nhóm LOCKED
            if (group?.status === 'locked') {
                return (
                    <div className="bg-white rounded-xl shadow-sm border p-6 sticky top-6">
                        <h3 className="text-lg font-bold mb-4">💰 Thanh toán</h3>
                        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg text-center">
                            <p className="text-sm text-orange-700 font-medium">
                                ⏳ Chờ host thanh toán cho nhóm
                            </p>
                        </div>
                    </div>
                );
            }

            // Nhóm COMPLETED
            if (group?.status === 'completed') {
                return (
                    <div className="bg-white rounded-xl shadow-sm border p-6 sticky top-6">
                        <h3 className="text-lg font-bold mb-4">💰 Thanh toán</h3>
                        <div className="p-6 bg-green-100 border-2 border-green-500 rounded-xl text-center">
                            <div className="text-6xl mb-3">✅</div>
                            <h3 className="text-xl font-bold text-green-800">Đã hoàn thành!</h3>
                            <p className="text-sm text-green-700 mt-2">
                                Host đã thanh toán cho nhóm
                            </p>
                        </div>
                    </div>
                );
            }
        }

        return null;
    }

    // ========== MODE: member_address ==========
    if (group?.delivery_mode === 'member_address') {
        // Nếu chưa có sản phẩm
        if (!myItems || myItems.length === 0) {
            return null;
        }

        // Nếu đã thanh toán
        if (myMember?.has_paid) {
            return (
                <div className="bg-white rounded-xl shadow-sm border p-6 sticky top-6">
                    <h3 className="text-lg font-bold mb-4">💰 Thanh toán</h3>
                    <div className="p-6 bg-green-100 border-2 border-green-500 rounded-xl text-center">
                        <div className="text-6xl mb-3">✅</div>
                        <h3 className="text-xl font-bold text-green-800">Đã thanh toán!</h3>
                        <p className="text-sm text-green-700 mt-2">
                            Bạn đã thanh toán {myTotal.toLocaleString()} đ
                        </p>
                    </div>
                </div>
            );
        }

        // Nếu nhóm chưa lock
        if (group?.status === 'open') {
            return (
                <div className="bg-white rounded-xl shadow-sm border p-6 sticky top-6">
                    <h3 className="text-lg font-bold mb-4">💰 Thanh toán</h3>
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                        <p className="text-sm text-blue-700">
                            ⏳ Chờ host khóa nhóm hoặc đủ {group?.target_member_count} người để
                            thanh toán
                        </p>
                    </div>
                </div>
            );
        }

        // Nếu locked và chưa thanh toán
        if (group?.status === 'locked') {
            return (
                <div className="bg-white rounded-xl shadow-sm border p-6 sticky top-6">
                    <h3 className="text-lg font-bold mb-4 text-slate-800">
                        💰 Phần thanh toán của bạn
                    </h3>

                    {/* Danh sách sản phẩm */}
                    <div className="space-y-2 mb-4 p-4 bg-slate-50 rounded-lg">
                        {myItems.map((it) => (
                            <div key={it.id} className="flex justify-between text-sm">
                                <span className="text-slate-700">
                                    {it.product?.name} x{it.quantity}
                                </span>
                                <span className="font-semibold text-slate-900">
                                    {Number(it.price).toLocaleString()} đ
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Tổng tiền */}
                    <div className="flex justify-between items-center text-xl font-bold mb-4 pt-3 border-t">
                        <span className="text-slate-900">Tổng của bạn:</span>
                        <span className="text-green-600">{myTotal.toLocaleString()} đ</span>
                    </div>

                    {/* Nút thanh toán */}
                    <button
                        onClick={onCheckout}
                        className="w-full px-6 py-4 text-lg font-bold rounded-xl shadow-lg bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 transform hover:scale-105 transition-all"
                    >
                        💳 Thanh toán phần của tôi
                    </button>
                </div>
            );
        }
    }

    return null;
};