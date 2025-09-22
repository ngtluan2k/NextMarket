// // src/page/Account.tsx
// import React, { useEffect, useState } from "react";
// // Sửa đường dẫn cho đúng với dự án của bạn
//  // hoặc "../components/Navbar"
// import Footer from "../components/Footer";
// import AccountSidebar from "../components/account/AccountSidebar";
// import EveryMartHeader from "../components/Navbar";
// import { Breadcrumb } from "antd";
// import AccountSecurityPanel from "../components/account/AccountSecurityPanel";
// import AccountProfileForm, { ProfileFormValues } from "../components/account/AccountProfileForm";
// import AccountNotifications from "../components/account/AccountNotifications";

// const Account: React.FC = () => {
//     const [profile, setProfile] = useState<ProfileFormValues | undefined>(undefined);
//     const [security, setSecurity] = useState<
//       | {
//           phone?: string | null;
//           email?: string | null;
//           passwordSet?: boolean;
//           pinSet?: boolean;
//           social?: { facebookLinked?: boolean; googleLinked?: boolean };
//         }
//       | undefined
//     >(undefined);
  
//     const [loadingProfile, setLoadingProfile] = useState(false);
//     const [loadingSecurity] = useState(false);
  
//     const handleSave = async (v: ProfileFormValues) => {
//       setLoadingProfile(true);
//       try {
//         // await api.updateProfile(v)
//         setProfile(v);
//       } finally {
//         setLoadingProfile(false);
//       }
//     };
  
//   return (
//     <div className="min-h-screen bg-slate-50 flex flex-col">
//       {/* Header */}
//       <EveryMartHeader />
//       <main className="flex-1 mx-auto w-full max-w-screen-2xl px-4 py-6">
//       <Breadcrumb
//           className="mb-4"/>
//        <div className="grid grid-cols-12 gap-6">
//           {/* Sidebar */}
//           <div className="col-span-12 md:col-span-3">
//             <AccountSidebar />
//           </div>

//           {/* Nội dung */}
//           <section className="col-span-12 md:col-span-9">
//             <h1 className="text-2xl font-semibold text-slate-900 mb-4">Thông tin tài khoản</h1>

//             {/* Card lớn chứa 2 cột */}
//             <div className="rounded-2xl bg-white ring-1 ring-slate-200 shadow p-5">
//               <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-6 lg:gap-8">
//                 <AccountProfileForm
//                   framed={false}
//                   className="pr-0 lg:pr-6"
//                   initial={profile}
//                   loading={loadingProfile}
//                   onSave={handleSave}
//                 />

//                 <AccountSecurityPanel
//                   framed={false}
//                   className="lg:border-l lg:border-slate-200 lg:pl-6"
//                   loading={loadingSecurity}
//                   phone={security?.phone}
//                   email={security?.email}
//                   passwordSet={security?.passwordSet}
//                   pinSet={security?.pinSet}
//                   social={security?.social}
//                   onChangePhone={() => {}}
//                   onChangeEmail={() => {}}
//                   onChangePassword={() => {}}
//                   onSetupPin={() => {}}
//                   onRequestDelete={() => {}}
//                   onLinkFacebook={() => {}}
//                   onUnlinkFacebook={() => {}}
//                   onLinkGoogle={() => {}}
//                   onUnlinkGoogle={() => {}}
//                 />
                
//               </div>
//             </div>
//           </section>
//         </div>
//       </main>

//       <Footer />
//     </div>
//   );
// };

// export default Account;