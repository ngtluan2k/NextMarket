import { CloseCircleOutlined, GiftOutlined, TagOutlined } from '@ant-design/icons';
import React from 'react';

interface GroupOrderVoucherProps {
    voucherCode: string;
    voucherDiscount: number;
    appliedVoucher: any;
    voucherError: string;
    isValidatingVoucher: boolean;
    onVoucherCodeChange: (code: string) => void;
    onApplyVoucher: () => void;
    onRemoveVoucher: () => void;
}

export const GroupOrderVoucher: React.FC<GroupOrderVoucherProps> = ({
    voucherCode,
    voucherDiscount,
    appliedVoucher,
    voucherError,
    isValidatingVoucher,
    onVoucherCodeChange,
    onApplyVoucher,
    onRemoveVoucher,
}) => {
    return (
        <div className="border-t border-green-300 pt-3 space-y-3">
            <div className="text-sm font-semibold text-slate-700">
                 <TagOutlined /> Mã giảm giá
            </div>

            {/* Input và button */}
            <div className="flex gap-2">
                <input
                    type="text"
                    placeholder="Nhập mã voucher"
                    value={voucherCode}
                    onChange={(e) => onVoucherCodeChange(e.target.value.toUpperCase())}
                    className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    disabled={isValidatingVoucher}
                />
                {appliedVoucher ? (
                    <button
                        onClick={onRemoveVoucher}
                        className="px-4 py-2 text-sm font-semibold bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                    >
                        Xóa
                    </button>
                ) : (
                    <button
                        onClick={onApplyVoucher}
                        disabled={!voucherCode.trim() || isValidatingVoucher}
                        className="px-4 py-2 text-sm font-semibold bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                    >
                        {isValidatingVoucher ? '...' : 'Áp dụng'}
                    </button>
                )}
            </div>

            {/* Hiển thị lỗi */}
            {voucherError && (
                <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
                    <CloseCircleOutlined /> {voucherError}
                </div>
            )}

            {/* Hiển thị voucher đã áp dụng */}
            {appliedVoucher && voucherDiscount > 0 && (
                <div className="p-3 bg-green-50 border border-green-200 rounded">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-semibold text-green-800">
                                {appliedVoucher.title}
                            </p>
                            <p className="text-xs text-green-600 mt-1">
                                Mã: {appliedVoucher.code}
                            </p>
                        </div>
                        <p className="text-sm font-bold text-green-600">
                         <GiftOutlined />{voucherDiscount.toLocaleString()}đ
                        </p>
                    </div>
                </div>
            )}

            <p className="text-xs text-slate-500">
                Chỉ áp dụng voucher PLATFORM hoặc STORE
            </p>
        </div>
    );
};
