import React, { useState } from "react";
import AccountProfileForm, { ProfileFormValues } from "../../components/account/AccountProfileForm";
import AccountSecurityPanel from "../../components/account/AccountSecurityPanel";

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileFormValues | undefined>();
  const [loadingProfile, setLoadingProfile] = useState(false);

  const [security] = useState<{
    phone?: string | null;
    email?: string | null;
    passwordSet?: boolean;
    pinSet?: boolean;
    social?: { facebookLinked?: boolean; googleLinked?: boolean };
  }>();

  const handleSave = async (v: ProfileFormValues) => {
    setLoadingProfile(true);
    try {
      // await api.updateProfile(v)
      setProfile(v);
    } finally {
      setLoadingProfile(false);
    }
  };

  return (
    <>
      <h1 className="text-2xl font-semibold text-slate-900 mb-4">Thông tin tài khoản</h1>
      <div className="rounded-2xl bg-white ring-1 ring-slate-200 shadow p-5">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-6 lg:gap-8">
          <AccountProfileForm
            framed={false}
            className="pr-0 lg:pr-6"
            initial={profile}
            loading={loadingProfile}
            onSave={handleSave}
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
