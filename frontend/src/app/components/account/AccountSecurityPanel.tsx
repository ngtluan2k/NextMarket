import React from "react";
import { Phone, Mail, Lock, KeySquare, Trash2, Facebook, Shield} from "lucide-react";
import { getUserProfile, getCurrentUserId } from "../../../service/user-profile.service";
import { useEffect, useState } from "react";


type Props = {
  loading?: boolean;
  phone?: string | null;
  email?: string | null;
  passwordSet?: boolean;
  pinSet?: boolean;
  social?: { facebookLinked?: boolean; googleLinked?: boolean };
  onChangePhone?: () => void;
  onChangeEmail?: () => void;
  onChangePassword?: () => void;
  onSetupPin?: () => void;
  onRequestDelete?: () => void;
  onLinkFacebook?: () => void;
  onUnlinkFacebook?: () => void;
  onLinkGoogle?: () => void;
  onUnlinkGoogle?: () => void;
  framed?: boolean;           // <= cho phép bọc card hay không
  className?: string;     // <= chèn class bổ sung
  autoLoadProfile?: boolean;    
};

const Row = ({
  icon,
  title,
  subtitle,
  actionText,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  actionText: string;
  onClick?: () => void;
}) => (
  <div className="flex items-center justify-between py-3">
    <div className="flex items-center gap-3 min-w-0">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600">
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-sm font-medium text-slate-900 truncate">{title}</div>
        {subtitle && <div className="text-xs text-slate-500 truncate">{subtitle}</div>}
      </div>
    </div>
    <button
      onClick={onClick}
      className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
    >
      {actionText}
    </button>
  </div>
);

export default function AccountSecurityPanel({
  loading,
  phone,
  email,
  passwordSet,
  pinSet,
  social,
  onChangePhone,
  onChangeEmail,
  onChangePassword,
  onSetupPin,
  onRequestDelete,
  onLinkFacebook,
  onUnlinkFacebook,
  onLinkGoogle,
  onUnlinkGoogle,
  framed = true,
  className = "",
  autoLoadProfile= true,
}: Props) {
  const [localPhone, setLocalPhone] = useState<string | null | undefined>(undefined);
  const [localEmail, setLocalEmail] = useState<string | null | undefined>(undefined);
  const [internalLoading, setInternalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tự động tải phone/email từ API nếu không truyền qua props
  useEffect(() => {
    const load = async () => {
      if (!autoLoadProfile) return;
      // Nếu props đã có phone/email thì không cần gọi
      if (phone != null && email != null) return;

      const userId = getCurrentUserId();
      if (!userId) {
        setError("Không tìm thấy thông tin đăng nhập");
        return;
      }

      setInternalLoading(true);
      setError(null);
      try {
        const profile = await getUserProfile(userId);
        if (phone == null) setLocalPhone(profile.phone ?? null);
        if (email == null) setLocalEmail(profile.user?.email ?? null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Không thể tải thông tin bảo mật");
      } finally {
        setInternalLoading(false);
      }
    };

    load();
  }, [autoLoadProfile, phone, email]);

  const displayPhone = phone ?? localPhone ?? "—";
  const displayEmail = email ?? localEmail ?? "—";
  const isLoading = loading || internalLoading;
  const body = (
    <div className={className}>
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Số điện thoại và Email</h2>

      <div className="space-y-2">
        <Row
          icon={<Phone className="h-4 w-4" />}
          title={phone ? "Số điện thoại" : "Số điện thoại"}
          subtitle={displayPhone ?? "—"}
          actionText="Cập nhật"
          onClick={onChangePhone}
        />
        <Row
          icon={<Mail className="h-4 w-4" />}
          title="Địa chỉ email"
          subtitle={displayEmail ?? "—"}
          actionText="Cập nhật"
          onClick={onChangeEmail}
        />
      </div>

      <h3 className="text-sm font-semibold text-slate-900 mt-6 mb-2">Bảo mật</h3>
      <div className="space-y-2">
        <Row
          icon={<Lock className="h-4 w-4" />}
          title="Thiết lập mật khẩu"
          subtitle={passwordSet ? "Đã thiết lập" : "Chưa thiết lập"}
          actionText="Cập nhật"
          onClick={onChangePassword}
        />
        <Row
          icon={<KeySquare className="h-4 w-4" />}
          title="Thiết lập mã PIN"
          subtitle={pinSet ? "Đã thiết lập" : "Chưa thiết lập"}
          actionText={pinSet ? "Cập nhật" : "Thiết lập"}
          onClick={onSetupPin}
        />
        <Row
          icon={<Shield className="h-4 w-4" />}
          title="Yêu cầu xóa tài khoản"
          subtitle="Khi gửi yêu cầu, chúng tôi sẽ hướng dẫn bạn qua email"
          actionText="Yêu cầu"
          onClick={onRequestDelete}
        />
      </div>

      <h3 className="text-sm font-semibold text-slate-900 mt-6 mb-2">Liên kết mạng xã hội</h3>
      <div className="space-y-2">
        <Row
          icon={<Facebook className="h-4 w-4" />}
          title="Facebook"
          subtitle={social?.facebookLinked ? "Đã liên kết" : "Chưa liên kết"}
          actionText={social?.facebookLinked ? "Hủy liên kết" : "Liên kết"}
          onClick={social?.facebookLinked ? onUnlinkFacebook : onLinkFacebook}
        />
        <Row
          icon={<svg className="h-4 w-4" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.6 31.8 29.2 35 24 35c-6.6 0-12-5.4-12-12S17.4 11 24 11c3 0 5.7 1.1 7.8 2.9l5.7-5.7C33.8 5.4 29.1 3.5 24 3.5 12.1 3.5 2.5 13.1 2.5 25S12.1 46.5 24 46.5 45.5 36.9 45.5 25c0-1.5-.2-3-.6-4.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16.6 18.9 13 24 13c3 0 5.7 1.1 7.8 2.9l5.7-5.7C33.8 5.4 29.1 3.5 24 3.5c-7.9 0-14.9 4.6-17.7 11.2z"/><path fill="#4CAF50" d="M24 46.5c5 0 9.7-1.9 13.2-5.2l-6.1-5c-2 1.4-4.6 2.2-7.1 2.2-5.2 0-9.6-3.2-11.2-7.8l-6.6 5C9.1 41.9 16 46.5 24 46.5z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.6 3.8-5.4 6.5-9.3 6.5-5.2 0-9.6-3.2-11.2-7.8l-6.6 5C9.1 41.9 16 46.5 24 46.5c11.9 0 21.5-9.6 21.5-21.5 0-1.5-.2-3-.6-4.5z"/></svg>}
          title="Google"
          subtitle={social?.googleLinked ? "Đã liên kết" : "Chưa liên kết"}
          actionText={social?.googleLinked ? "Hủy liên kết" : "Liên kết"}
          onClick={social?.googleLinked ? onUnlinkGoogle : onLinkGoogle}
        />
      </div>
    </div>
  );

  return framed ? (
    <aside className="rounded-2xl bg-white ring-1 ring-slate-200 shadow p-5">{body}</aside>
  ) : (
    body
  );
}
