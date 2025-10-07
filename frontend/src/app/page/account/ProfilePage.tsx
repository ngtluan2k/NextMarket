import { useState } from 'react';
import AccountProfileForm, {
  ProfileFormValues,
} from '../../components/account/AccountProfileForm';
import AccountSecurityPanel from '../../components/account/AccountSecurityPanel';
import {
  updateUserProfile,
  getCurrentUserId,
  updateUsername,
} from '../../../service/user-profile.service';

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileFormValues | undefined>();
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [security] = useState<{
    phone?: string | null;
    email?: string | null;
    passwordSet?: boolean;
    pinSet?: boolean;
    social?: { facebookLinked?: boolean; googleLinked?: boolean };
  }>();

  const handleSave = async (v: ProfileFormValues) => {
    const userId = getCurrentUserId();
    if (!userId) {
      setMessage({ type: 'error', text: 'Không tìm thấy thông tin đăng nhập' });
      return;
    }

    setLoadingProfile(true);
    setMessage(null);

    try {
      // Convert form values to API format
      const dobString =
        v.dob?.day && v.dob?.month && v.dob?.year
          ? `${v.dob.year}-${String(v.dob.month).padStart(2, '0')}-${String(
              v.dob.day
            ).padStart(2, '0')}`
          : null;

      // 1️⃣ Update profile table
      const updateData = {
        full_name: v.fullName || null,
        dob: dobString,
        gender: v.gender || null,
        country: v.country || null,
        avatar_url: v.avatarUrl || null,
      };
      await updateUserProfile(userId, updateData);

      // 2️⃣ Update username table
      if (v.nickname) {
        await updateUsername(userId, { username: v.nickname });
      }

      setProfile(v);
      setMessage({ type: 'success', text: 'Cập nhật thông tin thành công!' });
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Lỗi cập nhật thông tin',
      });
    } finally {
      setLoadingProfile(false);
    }
  };
  return (
    <>
      <h1 className="text-2xl font-semibold text-slate-900 mb-4">
        Thông tin tài khoản
      </h1>

      {/* Message display */}
      {message && (
        <div
          className={`mb-4 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="rounded-2xl bg-white ring-1 ring-slate-200 shadow p-5">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-6 lg:gap-8">
          <AccountProfileForm
            framed={false}
            className="pr-0 lg:pr-6"
            initial={profile}
            loading={loadingProfile}
            onSave={handleSave}
            autoLoadProfile={true}
          />
          <AccountSecurityPanel
            framed={false}
            className="lg:border-l lg:border-slate-200 lg:pl-6"
            loading={false}
            phone={security?.phone}
            email={security?.email}
            passwordSet={security?.passwordSet}
            pinSet={security?.pinSet}
            social={security?.social}
          />
        </div>
      </div>
    </>
  );
}
