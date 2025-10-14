// import React from 'react';
// import { useNavigate } from 'react-router-dom';
// import AddressForm, {
//   AddressFormValues,
// } from '../../components/account/AddressForm';

// const API_BASE = '/api/addresses';

// async function request<T>(url: string, options?: RequestInit): Promise<T> {
//   const res = await fetch(url, {
//     headers: { 'Content-Type': 'application/json' },
//     credentials: 'include',
//     ...options,
//   });
//   if (!res.ok) throw new Error(await res.text());
//   return res.json();
// }

// export default function AddressCreatePage() {
//   const navigate = useNavigate();

//   const onSubmit = async (v: AddressFormValues) => {
//     await request(API_BASE, { method: 'POST', body: JSON.stringify(v) });
//     navigate('/account/addresses'); // quay lại danh sách
//   };

//   return (
//     <>
//       <h1 className="text-2xl font-semibold text-slate-900 mb-4">
//         Tạo sổ địa chỉ
//       </h1>
//       <div className="rounded-2xl bg-white ring-1 ring-slate-200 shadow p-5">
//         <AddressForm
//           initial={{
//             fullName: '',
//             company: '',
//             phone: '',
//             province: '',
//             district: '',
//             ward: '',
//             addressLine: '',
//             note: '',
//             kind: 'home',
//             isDefault: false,
//           }}
//           onSubmit={onSubmit}
//           onCancel={() => navigate('/account/addresses')}
//         />
//       </div>
//     </>
//   );
// }