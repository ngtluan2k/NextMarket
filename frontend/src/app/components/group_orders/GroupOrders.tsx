import React, { useState } from "react";
import { Pencil, Info, Users } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function GroupOrderCreate() {
    const navigate = useNavigate();
    const [groupName, setGroupName] = useState("Đơn hàng nhóm của Nguyễn");
    const [paymentType, setPaymentType] = useState("Mọi người tự thanh toán phần của mình");
    const [extraTime, setExtraTime] = useState("Không có");
    const handleCreate = async () => {
        try {
            // TODO: lấy đúng hostUserId và storeId từ context/screen trước đó
            const payload = {
                name: groupName,
                storeId: 46,         // <== thay bằng storeId thực tế
                hostUserId: 2,      // <== thay bằng userId thực tế
                // expiresAt: new Date(Date.now() + 2*60*60*1000).toISOString(),
            };
            const res = await axios.post('http://localhost:3000/group-orders', payload);
            const group = res.data;
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
                        <div className="absolute left-0 top-0 h-2 w-1/3 bg-sky-500 rounded-full transition-all" />
                    </div>

                    {/* Mốc số lượng */}
                    <div className="flex justify-between text-xs text-slate-600">
                        <div className="flex flex-col items-center">
                            <span className="font-semibold text-sky-600">2%</span>
                            <span>2 người</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="font-semibold text-sky-600">4%</span>
                            <span>3 người</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="font-semibold text-sky-600">6%</span>
                            <span>5 người</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="font-semibold text-sky-600">10%</span>
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
