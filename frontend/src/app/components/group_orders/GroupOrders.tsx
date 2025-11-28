import React, { useState } from "react";
import { Pencil, Info, Users } from "lucide-react";
import { useNavigate, useParams, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { groupOrdersApi } from '../../../service/groupOrderItems.service';
import { getAffiliateDataForOrder } from '../../../utils/affiliate-tracking';

export default function GroupOrderCreate() {
    const navigate = useNavigate();
    const { storeId } = useParams();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const { me } = useAuth();

    const storeIdFromRoute = Number(storeId);
    const storeIdFromQuery = Number(searchParams.get("storeId"));
    const storeIdFromState = (location.state as any)?.storeId;
    const resolvedStoreId =
        (Number.isFinite(storeIdFromRoute) && storeIdFromRoute) ||
        (Number.isFinite(storeIdFromQuery) && storeIdFromQuery) ||
        (Number.isFinite(Number(storeIdFromState)) && Number(storeIdFromState)) ||
        null;

    const [groupName, setGroupName] = useState("Đơn hàng nhóm của");
    const [paymentType, setPaymentType] = useState("Mọi người tự thanh toán phần của mình");
    const [extraTime, setExtraTime] = useState("Không có");
    const [discountPercent, setDiscountPercent] = useState(0);
    const [targetMemberCount, setTargetMemberCount] = useState(2);

    const handleCreate = async () => {
        try {
            const hostUserId = me?.user_id ?? null;

            if (!resolvedStoreId || !hostUserId) {
                alert("Thiếu storeId hoặc thông tin người dùng. Vui lòng kiểm tra lại.");
                return;
            }
            const affiliateData = getAffiliateDataForOrder();
            console.log('🔍 Creating group with affiliate data:', affiliateData);

            const payload = {
                name: groupName,
                storeId: resolvedStoreId,
                hostUserId,
                targetMemberCount,
                ...(affiliateData.affiliateCode && { affiliateCode: affiliateData.affiliateCode }),
            };

            console.log(' Group creation payload:', payload);
            const group = await groupOrdersApi.create(payload);
            const storeSlug = group?.store?.slug; // service trả về group kèm relations

            if (!group?.id || !storeSlug) {
                alert("Tạo nhóm thành công nhưng thiếu dữ liệu điều hướng.");
                return;
            }

            // Điều hướng sang trang cửa hàng với query groupId để show InfoBar
            navigate(`/stores/slug/${storeSlug}?groupId=${group.id}`);
        } catch (e: any) {
            console.error(e);
            alert(e?.response?.data?.message ?? "Tạo nhóm thất bại");
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex justify-center py-10">
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg overflow-hidden">
                {/* Banner */}
                <div className="relative h-56 bg-gradient-to-b from-sky-500 to-sky-400 flex items-center justify-center">
                    <img
                        src="https://cdn-icons-png.flaticon.com/512/3845/3845829.png"
                        alt="Group order"
                        className="h-40 object-contain drop-shadow-lg"
                    />
                </div>

                {/* Ưu đãi */}
                <div className="bg-white mx-6 -mt-10 rounded-xl shadow p-5">
                    <h2 className="font-semibold text-lg mb-2 text-center text-slate-800">
                        Nhận ưu đãi lên đến 10%!
                    </h2>
                    <p className="text-sm text-slate-600 text-center mb-4">
                        Hãy mời thêm thành viên và đảm bảo mọi người đều đặt ít nhất 1 món.
                    </p>

                    {/* Thanh phần trăm */}
                    <div className="relative w-full h-2 bg-slate-200 rounded-full mb-2">
                        <div className="absolute left-0 top-0 h-2 w-1/3 bg-sky-500 rounded-full transition-all"
                            style={{ width: `${(discountPercent / 10) * 100}%` }} />
                    </div>
                    {/* 🎯 THÊM: Hiển thị discount hiện tại */}
                    <div className="text-center mb-4">
                        <span className="text-2xl font-bold text-sky-600">{discountPercent}%</span>
                        <span className="text-sm text-slate-600 ml-2">giảm giá hiện tại</span>
                    </div>

                    {/* Mốc số lượng */}
                    <div className="flex justify-between text-xs text-slate-600">
                        <div className="flex flex-col items-center">
                            <span className={`font-semibold ${discountPercent >= 2 ? 'text-sky-600' : 'text-slate-400'}`}>2%</span>
                            <span>2 người</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className={`font-semibold ${discountPercent >= 4 ? 'text-sky-600' : 'text-slate-400'}`}>4%</span>
                            <span>3 người</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className={`font-semibold ${discountPercent >= 6 ? 'text-sky-600' : 'text-slate-400'}`}>6%</span>
                            <span>5 người</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className={`font-semibold ${discountPercent >= 10 ? 'text-sky-600' : 'text-slate-400'}`}>10%</span>
                            <span>8 người</span>
                        </div>
                    </div>
                </div>

                {/* Thông tin nhóm */}
                <div className="px-6 py-5 space-y-5">
                    {/* Thanh toán */}
                    <div className="flex items-start justify-between border-b pb-4">
                        <div className="flex gap-3">
                            <div className="w-10 h-10 bg-sky-50 text-sky-600 flex items-center justify-center rounded-lg">
                                <Info size={20} />
                            </div>
                            <div>
                                <div className="font-semibold text-slate-800">
                                    Thanh toán hoá đơn
                                </div>
                                <div className="text-sm text-slate-500">{paymentType}</div>
                                <a href="#" className="text-xs text-sky-500 underline">
                                    Tìm hiểu thêm
                                </a>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                const type = prompt("Nhập phương thức thanh toán:", paymentType);
                                if (type) setPaymentType(type);
                            }}
                            className="text-slate-400 hover:text-sky-600 transition"
                        >
                            <Pencil size={18} />
                        </button>
                    </div>

                    {/* Thời hạn thêm món */}
                    <div className="flex items-center justify-between border-b pb-4">
                        <div className="flex gap-3 items-center">
                            <div className="w-10 h-10 bg-sky-50 text-sky-600 flex items-center justify-center rounded-lg">
                                <Users size={20} />
                            </div>
                            <div>
                                <div className="font-semibold text-slate-800">
                                    Thời hạn thêm món
                                </div>
                                <div className="text-sm text-slate-500">{extraTime}</div>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                const time = prompt("Nhập thời hạn thêm món:", extraTime);
                                if (time) setExtraTime(time);
                            }}
                            className="text-slate-400 hover:text-sky-600 transition"
                        >
                            <Pencil size={18} />
                        </button>
                    </div>

                    {/* Tên nhóm */}
                    <div className="flex items-center justify-between">
                        <div className="flex gap-3 items-center">
                            <div className="w-10 h-10 bg-sky-50 text-sky-600 flex items-center justify-center rounded-lg">
                                <Users size={20} />
                            </div>
                            <div>
                                <div className="font-semibold text-slate-800">Tên nhóm</div>
                                <div className="text-sm text-slate-500">{groupName}</div>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                const name = prompt("Nhập tên nhóm:", groupName);
                                if (name) setGroupName(name);
                            }}
                            className="text-slate-400 hover:text-sky-600 transition"
                        >
                            <Pencil size={18} />
                        </button>
                    </div>
                    {/* ✅ THÊM: Số lượng thành viên mục tiêu */}
                    <div className="flex items-center justify-between border-t pt-4">
                        <div className="flex gap-3 items-center">
                            <div className="w-10 h-10 bg-sky-50 text-sky-600 flex items-center justify-center rounded-lg">
                                <Users size={20} />
                            </div>
                            <div>
                                <div className="font-semibold text-slate-800">Số lượng mục tiêu</div>
                                <div className="text-sm text-slate-500">{targetMemberCount} người</div>
                                <p className="text-xs text-slate-400 mt-1">
                                    Nhóm tự động khóa khi đủ số lượng
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                const num = prompt("Nhập số lượng thành viên (2-20):", targetMemberCount.toString());
                                if (num) {
                                    const count = parseInt(num);
                                    if (count >= 2 && count <= 20) {
                                        setTargetMemberCount(count);
                                    } else {
                                        alert("Số lượng phải từ 2 đến 20 người");
                                    }
                                }
                            }}
                            className="text-slate-400 hover:text-sky-600 transition"
                        >
                            <Pencil size={18} />
                        </button>
                    </div>
                </div>

                {/* Nút tạo nhóm */}
                <div className="px-6 py-5 border-t bg-slate-50">
                    <button
                        onClick={handleCreate}
                        className="w-full bg-sky-500 hover:bg-sky-600 text-white font-semibold py-3 rounded-xl text-lg transition"
                    >
                        Tạo Đơn Hàng Nhóm
                    </button>
                </div>
            </div>
        </div>
    );
}
