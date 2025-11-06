import React, { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { groupOrdersApi, groupOrderItemsApi } from "../../../../service/groupOrderItems.service"
import EveryMartHeader from "../../../components/Navbar"
import Footer from "../../../components/Footer"
import dayjs from "dayjs"
import { useAuth } from "../../../hooks/useAuth"
import { useGroupOrderSocket } from "./../../../hooks/useGroupOrderSocket"
import { GroupOrderCheckout } from "./GroupOrderCheckout"
import AddressModal from "./../../../page/AddressModal"
import { message } from "antd"
import {
  Package,
  Users,
  Settings,
  MapPin,
  Edit2,
  Clock,
  UserPlus,
  Trash2,
  ChevronLeft,
  CheckCircle,
  AlertCircle,
  Home,
  User,
  ShoppingCart,
  CreditCard,
  Percent,
  Calendar,
  Zap,
  TrendingUp,
} from "lucide-react"
import EditNameModal from "./EditNameModal"
import EditDeadlineModal from "./EditDeadlineModal"
import AddMemberModal from "./AddMemberModal"

type ModalProps = {
  isVisible: boolean;
  onClose: () => void;
  onSave: (value: string) => void;
  defaultName?: string;
  defaultDeadline?: string;
};

export default function GroupOrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [group, setGroup] = React.useState<any>(null)
  const groupId = Number(id)
  const [groupItems, setGroupItems] = React.useState<any[]>([])
  const [members, setMembers] = React.useState<any[]>([])
  const [showCheckout, setShowCheckout] = React.useState(false)
  const [showMemberAddressModal, setShowMemberAddressModal] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState<"overview" | "products" | "members">("overview")

   // Trạng thái cho các modal

  // Trạng thái cho các modal
  const [isEditNameModalVisible, setIsEditNameModalVisible] = useState<boolean>(false);
  const [isEditDeadlineModalVisible, setIsEditDeadlineModalVisible] = useState<boolean>(false);
  const [isAddMemberModalVisible, setIsAddMemberModalVisible] = useState<boolean>(false);

  const { socketService } = useGroupOrderSocket(Number(id), (event, data) => {
    switch (event) {
      case "group-state":
        if (data?.group) setGroup(data.group)
        setGroupItems(Array.isArray(data?.items) ? data.items : [])
        if (Array.isArray(data?.members)) setMembers(data.members)
        break
      case "member-joined":
        if (data?.member) {
          setMembers((prev) => {
            const exists = prev.some((m) => m?.user?.id === data.member?.user?.id)
            return exists ? prev : [data.member, ...prev]
          })
        }
        refresh()
        break
      case "member-left":
        if (data?.userId) {
          setMembers((prev) => prev.filter((m) => m?.user?.id !== data.userId))
        }
        break
      case "item-added":
        if (data?.item) setGroupItems((prev) => [...prev, data.item])
        refresh()
        break
      case "item-updated":
        if (data?.item)
          setGroupItems((prev) => prev.map((it) => (Number(it.id) === Number(data.item.id) ? data.item : it)))
        break
      case "item-removed":
        if (data?.itemId != null) {
          const rmId = Number(data.itemId)
          setGroupItems((prev) => prev.filter((it) => Number(it.id) !== rmId))
        }
        break
      case "group-locked":
        setGroup((g: any) => (g ? { ...g, status: "locked" } : g))
        break
      case "group-updated":
        if (data?.group) setGroup(data.group)
        break
      case "group-deleted":
        navigate("/")
        break
      case "discount-updated":
        if (data?.discountPercent !== undefined) {
          setGroup((g: any) => (g ? { ...g, discount_percent: data.discountPercent } : g))
        }
        break
      case "member-address-updated":
        console.log(" Member address updated:", data)
        refresh()
        if (data?.userId && data.userId !== user?.id) {
          const updatedMember = members.find((m) => m?.user?.id === data.userId)
          const memberName =
            updatedMember?.user?.profile?.full_name || updatedMember?.user?.username || `User #${data.userId}`
          message.info(` ${memberName} đã cập nhật địa chỉ giao hàng`)
        }
        break
    }
  })

  React.useEffect(() => {
    if (!id) return
    ;(async () => {
      try {
        setLoading(true)
        const res = await groupOrdersApi.getById(Number(id))
        setGroup(res)
        setMembers(res?.members ?? [])
        const itemsRes = await groupOrderItemsApi.list(Number(id))
        setGroupItems(itemsRes || [])
        setError(null)
      } catch {
        setError("Không tải được thông tin nhóm")
      } finally {
        setLoading(false)
      }
    })()
  }, [id])


   // Hàm hiển thị/ẩn modal
   const handleShowEditNameModal = () => setIsEditNameModalVisible(true);
   const handleCloseEditNameModal = () => setIsEditNameModalVisible(false);
   
   const handleShowEditDeadlineModal = () => setIsEditDeadlineModalVisible(true);
   const handleCloseEditDeadlineModal = () => setIsEditDeadlineModalVisible(false);
   
   const handleShowAddMemberModal = () => setIsAddMemberModalVisible(true);
   const handleCloseAddMemberModal = () => setIsAddMemberModalVisible(false);

  const refresh = async () => {
    const res = await groupOrdersApi.getById(groupId)
    setGroup(res)
    setMembers(res?.members ?? [])
    const itemsRes = await groupOrderItemsApi.list(groupId)
    setGroupItems(itemsRes || [])
  }

  const getItemPreGroupPrice = (item: any, discountPercent: number) => {
    const p = Number(item?.price) || 0
    if (!discountPercent) return p
    const factor = 1 - discountPercent / 100
    return factor > 0 ? Math.round(p / factor) : p
  }

  const calcTotals = (items: any[], discountPercent: number) => {
    if (!Array.isArray(items) || items.length === 0) {
      return { subtotalBefore: 0, discountAmount: 0, totalAfter: 0 }
    }
    const totalAfter = items.reduce((sum, item) => sum + (Number(item?.price) || 0), 0)
    const subtotalBefore = items.reduce((sum, item) => sum + getItemPreGroupPrice(item, discountPercent), 0)
    const discountAmount = Math.max(subtotalBefore - totalAfter, 0)
    return { subtotalBefore, discountAmount, totalAfter }
  }

  const onEditName = async (newName: string) => {
    if (newName) {
      await groupOrdersApi.update(groupId, { name: newName });
      await refresh();
      message.success("Đã cập nhật tên nhóm!");
      setIsEditNameModalVisible(false); 
    } else {
      message.error("Tên không hợp lệ!");
    }
  };

  const onEditDeadline = async (newDeadline: string) => {
    const payload = newDeadline ? { expiresAt: dayjs(newDeadline).toISOString() } : { expiresAt: null };
    try {
      await groupOrdersApi.update(groupId, payload); 
      await refresh(); 
      message.success("Đã cập nhật thời hạn!");
      setIsEditDeadlineModalVisible(false); 
    } catch (error) {
      message.error("Không thể cập nhật thời hạn!");
    }
  };

  const onAddMember = async (userId: number) => {
    if (userId) {
      await groupOrdersApi.join(groupId, { userId });
      await refresh(); 
      message.success("Đã thêm thành viên!");
      setIsAddMemberModalVisible(false); 
    } else {
      message.error("User ID không hợp lệ!");
    }
  };

  const onEditDeliveryMode = async () => {
    const newMode = window.confirm(
      "Lựa chọn chế độ giao hàng:\n\n" +
        "OK: Giao đến từng thành viên (mỗi người nhận riêng)\n" +
        "Cancel: Giao về địa chỉ chủ nhóm (giao chung)\n\n" +
        'Lưu ý: Nếu chọn "Giao đến từng thành viên", tất cả thành viên phải chọn địa chỉ giao hàng!',
    )
      ? "member_address"
      : "host_address"

    try {
      
      await groupOrdersApi.update(groupId, { deliveryMode: newMode })
      await refresh()

      if (newMode === "member_address") {
        message.success(' Đã đổi sang chế độ "Giao riêng từng người". Các thành viên hãy chọn địa chỉ giao hàng!')
      } else {
        message.success('Đã đổi sang chế độ "Giao về chủ nhóm".')
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || "Không thể thay đổi"
      message.error(errorMsg)
    }
  }

  const onUpdateMemberAddress = async (address: any) => {
    try {
      const token = localStorage.getItem("token")
      await groupOrdersApi.updateMemberAddress(groupId, { addressId: address.id })
      await refresh()
      setShowMemberAddressModal(false)
      message.success(" Đã cập nhật địa chỉ giao hàng của bạn!")
    } catch (error: any) {
      message.error(error.response?.data?.message || "Không thể cập nhật địa chỉ")
    }
  }

  const onDeleteGroup = async () => {
    if (!window.confirm("Xóa nhóm? Hành động này không thể hoàn tác.")) return
    await groupOrdersApi.delete(groupId)
    message.success("Đã xóa nhóm")
    if (group?.store?.slug) navigate(`/stores/slug/${group.store.slug}`)
  }

  const onEditItemNote = async (itemId: number, currentNote: string) => {
    const newNote = prompt("Nhập ghi chú mới:", currentNote || "")
    if (newNote === null) return

    try {
      await groupOrderItemsApi.update(groupId, itemId, { note: newNote })
      await refresh()
      message.success("Cập nhật ghi chú thành công!")
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || "Không thể cập nhật ghi chú"
      message.error(errorMessage)
    }
  }

  const onDeleteItem = async (itemId: number, productName: string) => {
    if (!window.confirm(`Xóa sản phẩm "${productName}"? Hành động này không thể hoàn tác.`)) return

    try {
      await groupOrderItemsApi.remove(groupId, itemId)
      await refresh()
      message.success("Xóa sản phẩm thành công!")
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || "Không thể xóa sản phẩm"
      message.error(errorMessage)
    }
  }

  const canEditItem = (item: any) => {
    if (!user?.id) return false
    if (item?.member?.user?.id === user.id) return true
    if (item?.user_id === user.id) return true
    if (item?.member?.user_id === user.id) return true
    return false
  }

  const isHost = React.useMemo(() => {
    if (!user?.id) return false
    if (group?.user?.id === user.id) return true
    return Array.isArray(members) && members.some((m: any) => m?.user?.id === user.id && m?.is_host)
  }, [user?.id, group?.user?.id, members])

  const totals = React.useMemo(() => {
    const items =
      Array.isArray(groupItems) && groupItems.length > 0 ? groupItems : Array.isArray(group?.items) ? group.items : []
    const discountPercent = Number(group?.discount_percent || 0)
    return calcTotals(items, discountPercent)
  }, [groupItems, group?.items, group?.discount_percent])

  const getDisplayName = (item: any) => {
    const memberFromList = members.find((m) => m?.user?.id === item?.member?.user?.id)

    if (memberFromList?.user?.profile?.full_name) {
      return memberFromList.user.profile.full_name
    }

    if (item?.member?.user?.profile?.full_name) {
      return item.member.user.profile.full_name
    }

    if (item?.member?.user?.username) {
      return item.member.user.username
    }

    if (item?.member?.user?.email) {
      return item.member.user.email.split("@")[0]
    }

    return `Thành viên #${item?.member?.id}`
  }

  const membersWithoutAddress = React.useMemo(() => {
    if (group?.delivery_mode !== "member_address") return []
    return members.filter((m) => !m.address_id)
  }, [group?.delivery_mode, members])

  const myMember = React.useMemo(() => {
    return members.find((m: any) => m?.user?.id === user?.id)
  }, [members, user?.id])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <EveryMartHeader />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="relative rounded-2xl overflow-hidden bg-white shadow-md border border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 p-8 bg-gradient-to-r from-blue-50 via-white to-cyan-50">
              {/* Title Section */}
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg shadow-md">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900">{group?.user?.profile?.full_name ?? "Đơn hàng"}</h1>
                </div>
                <p className="text-cyan-600 text-sm font-semibold flex items-center gap-2 ml-12">
                  <Zap className="w-4 h-4" />
                  Quản lý đơn hàng nhóm
                </p>
              </div>

              {/* Back Button */}
              {group?.store?.slug && (
                <button
                  onClick={() => navigate(`/stores/slug/${group.store.slug}?groupId=${group.id}`)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gray-100 border border-gray-300 text-gray-700 font-semibold hover:bg-gray-200 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Quay lại
                </button>
              )}
            </div>
          </div>

          {/* Quick Action Buttons */}
          {isHost && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              {[{ icon: Edit2, label: "Sửa tên", onClick: handleShowEditNameModal, color: "blue" },
               { icon: Calendar, label: "Sửa hạn", onClick: handleShowEditDeadlineModal, color: "blue" },
               { icon: UserPlus, label: "Thêm thành viên", onClick: handleShowAddMemberModal, color: "blue" },
               { icon: Trash2, label: "Xóa nhóm", onClick: onDeleteGroup, color: "red" }]
              .map(({ icon: Icon, label, onClick, color }) => (
                <button
                  key={label}
                  onClick={onClick}
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-semibold transition-all text-sm ${color === "red" ? "bg-red-100 border border-red-300 text-red-700 hover:bg-red-200" : "bg-blue-100 border border-blue-300 text-blue-700 hover:bg-blue-200"}`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-500">Đang tải...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex gap-2 border-b border-gray-200 pb-0">
              {[
                { id: "overview", label: "Tổng quan", icon: TrendingUp },
                { id: "products", label: "Sản phẩm", icon: ShoppingCart },
                { id: "members", label: "Thành viên", icon: Users },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as any)}
                  className={`flex items-center gap-2 px-4 py-3 font-semibold text-sm transition-all border-b-2 -mb-px ${
                    activeTab === id
                      ? "text-cyan-600 border-cyan-500"
                      : "text-gray-600 border-transparent hover:text-gray-800"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>

            {/* OVERVIEW TAB */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    {
                      title: "Trạng thái",
                      value: group?.status === "open" ? "Mở" : "Khóa",
                      icon: Settings,
                      badge: group?.status === "open" ? "green" : "orange",
                    },
                    {
                      title: "Hết hạn",
                      value: group?.expires_at ? new Date(group.expires_at).toLocaleDateString("vi-VN") : "Không hạn",
                      icon: Clock,
                      badge: "blue",
                    },
                    {
                      title: "Thành viên",
                      value: members.length.toString(),
                      icon: Users,
                      badge: "purple",
                    },
                    {
                      title: "Giảm giá",
                      value: `${group?.discount_percent || 0}%`,
                      icon: Percent,
                      badge: "green",
                    },
                  ].map(({ title, value, icon: Icon, badge }, idx) => (
                    <div
                      key={idx}
                      className={`p-5 rounded-lg border bg-white shadow-sm hover:shadow-md transition-all ${
                        badge === "green"
                          ? "border-green-200 bg-green-50"
                          : badge === "orange"
                            ? "border-orange-200 bg-orange-50"
                            : badge === "purple"
                              ? "border-purple-200 bg-purple-50"
                              : "border-blue-200 bg-blue-50"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-gray-600 text-xs font-bold uppercase tracking-wide">{title}</p>
                          <p className="mt-3 font-bold text-2xl text-gray-900">{value}</p>
                        </div>
                        <div
                          className={`p-2.5 rounded-lg ${
                            badge === "green"
                              ? "bg-green-200"
                              : badge === "orange"
                                ? "bg-orange-200"
                                : badge === "purple"
                                  ? "bg-purple-200"
                                  : "bg-blue-200"
                          }`}
                        >
                          <Icon
                            className={`w-5 h-5 ${
                              badge === "green"
                                ? "text-green-700"
                                : badge === "orange"
                                  ? "text-orange-700"
                                  : badge === "purple"
                                    ? "text-purple-700"
                                    : "text-blue-700"
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pricing Summary */}
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-cyan-600" />
                    Tóm tắt thanh toán
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                      <p className="text-gray-600 text-sm font-semibold">Tạm tính</p>
                      <p className="text-2xl font-bold text-gray-900 mt-2">{totals.subtotalBefore.toLocaleString()}</p>
                      <p className="text-xs text-gray-500 mt-1">đ</p>
                    </div>
                    {group?.discount_percent > 0 && (
                      <div className="bg-green-50 rounded-lg p-5 border border-green-200">
                        <p className="text-green-700 text-sm font-semibold">Giảm giá ({group?.discount_percent}%)</p>
                        <p className="text-2xl font-bold text-green-600 mt-2">
                          -{totals.discountAmount.toLocaleString()}
                        </p>
                        <p className="text-xs text-green-600 mt-1">đ</p>
                      </div>
                    )}
                    <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-lg p-5 border border-cyan-300 shadow-sm">
                      <p className="text-cyan-700 text-sm font-bold">Thành tiền</p>
                      <p className="text-2xl font-bold text-cyan-700 mt-2">{totals.totalAfter.toLocaleString()}</p>
                      <p className="text-xs text-cyan-600 mt-1">đ</p>
                    </div>
                  </div>

                  {/* Checkout Button */}
                  {isHost && group?.status === "open" && groupItems.length > 0 && (
                    <div className="flex justify-center mt-6">
                      <button
                        onClick={() => setShowCheckout(true)}
                        disabled={group?.delivery_mode === "member_address" && membersWithoutAddress.length > 0}
                        className={`flex items-center gap-3 px-8 py-3 text-base font-bold rounded-lg transition-all ${
                          group?.delivery_mode === "member_address" && membersWithoutAddress.length > 0
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-md hover:shadow-lg"
                        }`}
                      >
                        <CreditCard className="w-5 h-5" />
                        Thanh toán ({totals.totalAfter.toLocaleString()} đ)
                      </button>
                    </div>
                  )}
                </div>

                {/* Delivery Mode */}
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <MapPin className="w-5 h-5 text-cyan-600" />
                    <h3 className="text-lg font-bold text-gray-900">Chế độ giao hàng</h3>
                  </div>
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-3 rounded-lg ${
                        group?.delivery_mode === "host_address" ? "bg-blue-100" : "bg-orange-100"
                      }`}
                    >
                      {group?.delivery_mode === "host_address" ? (
                        <Home className="w-5 h-5 text-blue-600" />
                      ) : (
                        <User className="w-5 h-5 text-orange-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">
                        {group?.delivery_mode === "host_address" ? "Giao về chủ nhóm" : "Giao riêng từng người"}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {group?.delivery_mode === "host_address"
                          ? "Tất cả sản phẩm sẽ giao đến địa chỉ chủ nhóm"
                          : "Mỗi thành viên sẽ nhận hàng tại địa chỉ của họ"}
                      </p>
                    </div>
                    {isHost && group?.status === "open" && (
                      <button
                        onClick={onEditDeliveryMode}
                        className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg font-semibold transition-all text-sm border border-blue-300"
                      >
                        Thay đổi
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* PRODUCTS TAB */}
            {activeTab === "products" && (
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-cyan-100 rounded-lg">
                    <ShoppingCart className="w-5 h-5 text-cyan-600" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">Sản phẩm đã chọn</h2>
                  {Array.isArray(groupItems) && groupItems.length > 0 && (
                    <span className="ml-auto bg-cyan-100 text-cyan-700 px-3 py-1 rounded-full text-sm font-bold border border-cyan-300">
                      {groupItems.length}
                    </span>
                  )}
                </div>

                {Array.isArray(groupItems) && groupItems.length > 0 ? (
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-100 border-b border-gray-200">
                          <th className="py-4 px-4 font-bold text-left text-gray-900">Thành viên</th>
                          <th className="py-4 px-4 font-bold text-left text-gray-900">Sản phẩm</th>
                          <th className="py-4 px-4 font-bold text-center text-gray-900">SL</th>
                          <th className="py-4 px-4 font-bold text-right text-gray-900">Giá</th>
                          {group?.delivery_mode === "member_address" && (
                            <th className="py-4 px-4 font-bold text-gray-900">Địa chỉ</th>
                          )}
                          <th className="py-4 px-4 font-bold text-gray-900">Ghi chú</th>
                          <th className="py-4 px-4 font-bold text-center text-gray-900">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {(Array.isArray(groupItems) && groupItems.length > 0
                          ? groupItems
                          : Array.isArray(group?.items)
                            ? group.items
                            : []
                        ).map((it: any) => {
                          const canEdit = canEditItem(it)
                          const memberAddress = it?.member?.address_id

                          return (
                            <tr key={it.id} className="hover:bg-gray-50 transition-colors">
                              <td className="py-4 px-4 font-semibold text-gray-900">{getDisplayName(it)}</td>
                              <td className="py-4 px-4 font-semibold text-gray-900">
                                {it?.product?.name ?? `Product #${it?.product?.id ?? ""}`}
                              </td>
                              <td className="py-4 px-4 text-center font-bold text-cyan-600">{it?.quantity}</td>
                              <td className="py-4 px-4 text-right font-bold text-gray-900">
                                {getItemPreGroupPrice(it, Number(group?.discount_percent || 0)).toLocaleString()} đ
                              </td>

                              {group?.delivery_mode === "member_address" && (
                                <td className="py-4 px-4">
                                  {memberAddress ? (
                                    <div className="text-xs space-y-1">
                                      <div className="font-bold text-green-700 flex items-center gap-1">
                                        <CheckCircle className="w-3 h-3" />
                                        {memberAddress.recipientName}
                                      </div>
                                      <div className="text-gray-600 text-xs">
                                        {memberAddress.street}, {memberAddress.ward}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-xs text-orange-700 bg-orange-100 px-2 py-1 rounded inline-flex items-center gap-1 border border-orange-300">
                                      <AlertCircle className="w-3 h-3" />
                                      Chưa có
                                    </div>
                                  )}
                                </td>
                              )}

                              <td className="py-4 px-4">
                                <span className="text-gray-600 text-xs italic max-w-xs truncate block">
                                  {it?.note || "—"}
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                {canEdit ? (
                                  <div className="flex gap-2 justify-center">
                                    <button
                                      onClick={() => onEditItemNote(it.id, it.note)}
                                      className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                                      title="Sửa ghi chú"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => onDeleteItem(it.id, it?.product?.name || "Sản phẩm")}
                                      className="inline-flex items-center justify-center w-8 h-8 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                                      title="Xóa sản phẩm"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-gray-400 text-xs text-center block">—</span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                      <ShoppingCart className="w-10 h-10 text-gray-400" />
                    </div>
                    <p className="text-gray-600 text-lg font-semibold">Chưa có sản phẩm nào</p>
                    <p className="text-gray-500 text-sm mt-2">Quay lại cửa hàng để thêm sản phẩm</p>
                  </div>
                )}
              </div>
            )}

            {/* MEMBERS TAB */}
            {activeTab === "members" && (
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Users className="w-5 h-5 text-purple-600" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">Thành viên ({members.length})</h2>
                </div>

                {membersWithoutAddress.length > 0 && group?.delivery_mode === "member_address" && (
                  <div className="mb-6 p-4 bg-orange-50 border border-orange-300 rounded-lg">
                    <p className="text-sm font-bold text-orange-700 mb-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Chưa có địa chỉ giao hàng:
                    </p>
                    <ul className="text-sm text-orange-700 space-y-1 ml-6">
                      {membersWithoutAddress.map((m) => (
                        <li key={m.id}>• {m?.user?.profile?.full_name || m?.user?.username}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Member Address Section */}
                {group?.delivery_mode === "member_address" && user?.id && (
                  <div className="mb-6 p-5 bg-cyan-50 border border-cyan-300 rounded-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <MapPin className="w-5 h-5 text-cyan-600" />
                      <h4 className="font-bold text-gray-900">Địa chỉ của bạn</h4>
                    </div>

                    {myMember?.address_id ? (
                      <div className="p-4 bg-green-50 border border-green-300 rounded-lg text-sm space-y-2">
                        <div className="font-semibold text-green-700 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          {myMember.address_id.recipientName}
                        </div>
                        <div className="text-green-700 font-medium">{myMember.address_id.phone}</div>
                        <div className="text-green-700 line-clamp-2">
                          {[myMember.address_id.street, myMember.address_id.ward, myMember.address_id.district]
                            .filter(Boolean)
                            .join(", ")}
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-yellow-50 border border-yellow-300 rounded-lg text-sm text-yellow-700 font-medium flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>Chưa chọn địa chỉ giao hàng</span>
                      </div>
                    )}

                    <button
                      onClick={() => setShowMemberAddressModal(true)}
                      className="w-full px-4 py-3 text-sm bg-cyan-100 hover:bg-cyan-200 text-cyan-700 rounded-lg transition-colors font-bold mt-4 border border-cyan-300"
                    >
                      {myMember?.address_id ? "Thay đổi địa chỉ" : "Chọn địa chỉ"}
                    </button>
                  </div>
                )}

                {/* Members Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from(new Map(members.map((m) => [m?.user?.id, m])).values()).map((m: any) => (
                    <div
                      key={m.user.id}
                      className="p-4 rounded-lg bg-gray-50 border border-gray-300 hover:border-cyan-400 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {(m?.user?.profile?.full_name || m?.user?.username || "U")[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 truncate">
                            {m?.user?.profile?.full_name || m?.user?.username}
                          </p>
                          {m.is_host && (
                            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded inline-block mt-1 border border-orange-300">
                              Chủ nhóm
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs px-3 py-1 rounded-full font-bold border ${
                            m.status === "joined"
                              ? "bg-green-100 text-green-700 border-green-300"
                              : m.status === "ordered"
                                ? "bg-blue-100 text-blue-700 border-blue-300"
                                : "bg-gray-200 text-gray-700 border-gray-400"
                          }`}
                        >
                          {m.status === "joined" ? "Tham gia" : m.status === "ordered" ? "Đã đặt" : m.status}
                        </span>
                      </div>
                    </div>
                  ))}
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
        deliveryMode={group?.delivery_mode || "host_address"}
        onSuccess={() => {
          setShowCheckout(false)
          refresh()
        }}
      />

      {/* Modal Components */}
      <EditNameModal
          isVisible={isEditNameModalVisible}
          onClose={handleCloseEditNameModal}
          onSave={onEditName}
          defaultName={group?.name}
        />
        <EditDeadlineModal
          isVisible={isEditDeadlineModalVisible}
          onClose={handleCloseEditDeadlineModal}
          onSave={onEditDeadline}
          defaultDeadline={group?.expires_at}
        />
        <AddMemberModal
          isVisible={isAddMemberModalVisible}
          onClose={handleCloseAddMemberModal}
          onAddMember={onAddMember}
        />
    </div>
  )
}