import React from "react";
import AccountNotifications, { NotifyCategory, NotificationItem } from "../../components/account/AccountNotifications";

export default function NotificationsPage() {
  // Không dùng dữ liệu mẫu; gọi API theo tab
  const fetchNotifications = async (category: NotifyCategory): Promise<NotificationItem[]> => {
    const res = await fetch(`/api/notifications?category=${category}`, { credentials: "include" });
    if (!res.ok) return [];
    const data = await res.json();
    // đảm bảo dữ liệu đúng shape NotificationItem[]
    return Array.isArray(data) ? data : [];
  };

  const onOpenItem = (n: NotificationItem) => {
    // Ví dụ: đánh dấu đã đọc + điều hướng
    if (n.link) window.location.href = n.link;
  };

  return (
    <>
      <h1 className="text-2xl font-semibold text-slate-900 mb-4">Thông báo của tôi</h1>
      <AccountNotifications
        fetchNotifications={fetchNotifications}
        onOpenItem={onOpenItem}
        onContinue={() => (window.location.href = "/")}
      />
    </>
  );
}
