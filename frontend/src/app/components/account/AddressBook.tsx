import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Star, X, Check, Phone, User, Home } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api, provincesApi } from '../../api/api';
interface UserAddress {
  id: number;
  userId: number;
  recipientName: string;
  phone: string;
  street: string;
  ward: string;
  district: string;
  province: string;
  country: string;
  postalCode?: string;
  isDefault: boolean;
  fullAddress?: string;
}

interface Province {
  code: number;
  name: string;
}

interface District {
  code: number;
  name: string;
}

interface Ward {
  code: number;
  name: string;
}

export default function AddressBook() {
  const { me } = useAuth();
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'v1' | 'v2'>('v1');
  
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  
  const [recipientName, setRecipientName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedProvince, setSelectedProvince] = useState<number | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<number | null>(null);
  const [selectedWard, setSelectedWard] = useState<number | null>(null);
  const [addressLine, setAddressLine] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  useEffect(() => {
    if (me?.id) {
      fetchAddresses();
    }
  }, [me?.id]);

  useEffect(() => {
    loadProvinces();
  }, [mode]);

  const fetchAddresses = async () => {
    try {
      const res = await api.get(`/users/${me?.id}/addresses`);
      setAddresses(res.data);
      const defaultAddress =
        res.data.find((a: UserAddress) => a.isDefault) || res.data[0] || null;
      if (defaultAddress) {
        setSelectedId(defaultAddress.id);
      }
    } catch (err) {
      console.error('Lỗi tải địa chỉ:', err);
    }
  };

  const loadProvinces = async () => {
    try {
      const data = mode === 'v1'
        ? await provincesApi.getProvincesV1()
        : await provincesApi.getProvincesV2();
      setProvinces(data);
    } catch (err) {
      console.error('Error loading provinces:', err);
    }
  };

  const handleProvinceChange = async (provinceCode: number) => {
    setSelectedProvince(provinceCode);
    setSelectedDistrict(null);
    setSelectedWard(null);
    setDistricts([]);
    setWards([]);

    try {
      if (mode === 'v1') {
        const data = await provincesApi.getDistrictsV1(provinceCode);
        setDistricts(data);
      } else {
        const data = await provincesApi.getDistrictsV2(provinceCode);
        setWards(data);
      }
    } catch (err) {
      console.error('Error loading districts/wards:', err);
    }
  };

  const handleDistrictChange = async (districtCode: number) => {
    setSelectedDistrict(districtCode);
    setSelectedWard(null);
    setWards([]);

    if (mode === 'v1') {
      try {
        const data = await provincesApi.getWardsV1(districtCode);
        setWards(data);
      } catch (err) {
        console.error('Error loading wards:', err);
      }
    }
  };

  const resetForm = () => {
    setRecipientName('');
    setPhone('');
    setSelectedProvince(null);
    setSelectedDistrict(null);
    setSelectedWard(null);
    setAddressLine('');
    setIsDefault(false);
    setEditingId(null);
    setAddingNew(false);
  };

  const handleEdit = async (address: UserAddress) => {
    setEditingId(address.id);
    setAddingNew(true);
    setRecipientName(address.recipientName);
    setPhone(address.phone);
    setAddressLine(address.street);
    setIsDefault(address.isDefault);

    try {
      const provincesData = mode === 'v1'
        ? await provincesApi.getProvincesV1()
        : await provincesApi.getProvincesV2();
      setProvinces(provincesData);

      const provinceCode = provincesData.find(
        (p: Province) => p.name === address.province
      )?.code;

      if (provinceCode) {
        setSelectedProvince(provinceCode);

        if (mode === 'v1') {
          const districtsData = await provincesApi.getDistrictsV1(provinceCode);
          setDistricts(districtsData);

          const districtCode = districtsData.find(
            (d: District) => d.name === address.district
          )?.code;
          if (districtCode) {
            setSelectedDistrict(districtCode);

            const wardsData = await provincesApi.getWardsV1(districtCode);
            setWards(wardsData);

            const wardCode = wardsData.find(
              (w: Ward) => w.name === address.ward
            )?.code;
            if (wardCode) setSelectedWard(wardCode);
          }
        } else {
          const wardsData = await provincesApi.getDistrictsV2(provinceCode);
          setWards(wardsData);

          const wardCode = wardsData.find(
            (w: Ward) => w.name === address.ward
          )?.code;
          if (wardCode) setSelectedWard(wardCode);
        }
      }
    } catch (error) {
      console.error('Error loading address data:', error);
    }
  };

  const handleFinish = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userId = me?.user_id || me?.id || Number(localStorage.getItem('user_id') || 0);

      if (!userId) {
        alert('Vui lòng đăng nhập để thêm địa chỉ');
        setLoading(false);
        return;
      }

      const wardName = wards.find((w) => w.code === selectedWard)?.name;
      const districtName = mode === 'v1'
        ? districts.find((d) => d.code === selectedDistrict)?.name
        : '';
      const provinceName = provinces.find(
        (p) => p.code === selectedProvince
      )?.name;

      if (
        !recipientName ||
        !phone ||
        !addressLine ||
        !provinceName ||
        !wardName ||
        (mode === 'v1' && !districtName)
      ) {
        alert('Vui lòng điền đầy đủ thông tin bắt buộc.');
        setLoading(false);
        return;
      }

      const payload = {
        user_id: userId,
        recipientName,
        phone,
        street: addressLine,
        ward: wardName,
        district: districtName,
        province: provinceName,
        country: 'Việt Nam',
        postalCode: '',
        isDefault: isDefault || false,
      };

      if (editingId) {
        await api.patch(`/users/${userId}/addresses/${editingId}`, payload);
      } else {
        await api.post(`/users/${userId}/addresses`, payload);
      }

      await fetchAddresses();
      resetForm();
    } catch (error: any) {
      console.error('❌ Address error:', error.response?.data || error);
      alert(error.response?.data?.message || 'Không thể lưu địa chỉ');
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (addressId: number) => {
    try {
      const userId = me?.id || Number(localStorage.getItem('userId') || 0);
      const address = addresses.find((a) => a.id === addressId);

      if (!address) return;

      const payload = {
        user_id: userId,
        recipientName: address.recipientName,
        phone: address.phone,
        street: address.street,
        ward: address.ward,
        district: address.district || '',
        province: address.province,
        country: address.country || 'Việt Nam',
        postalCode: address.postalCode || '',
        isDefault: true,
      };

      await api.patch(`/users/${userId}/addresses/${addressId}`, payload);
      await fetchAddresses();
    } catch (error: any) {
      console.error('Error setting default:', error.response?.data || error);
      alert(error.response?.data?.message || 'Không thể đặt địa chỉ mặc định');
    }
  };

  const handleDelete = async (addressId: number) => {
    if (!confirm('Xóa địa chỉ này?')) return;

    try {
      const userId = me?.id || Number(localStorage.getItem('userId') || 0);
      await api.delete(`/users/${userId}/addresses/${addressId}`);
      await fetchAddresses();

      if (selectedId === addressId) {
        const remaining = addresses.filter((addr) => addr.id !== addressId);
        if (remaining.length > 0) {
          setSelectedId(remaining[0].id);
        } else {
          setSelectedId(null);
        }
      }
    } catch (error: any) {
      console.error('Delete error:', error);
      alert('Không thể xóa địa chỉ');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="mx-auto max-w-4xl px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Sổ địa chỉ</h1>
          <p className="mt-1 text-sm text-slate-600">
            Quản lý địa chỉ giao hàng của bạn
          </p>
        </div>

        {addingNew ? (
          <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingId ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ mới'}
              </h2>
              <button
                onClick={resetForm}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4 flex gap-2">
              <button
                type="button"
                onClick={() => setMode('v1')}
                className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
                  mode === 'v1'
                    ? 'bg-sky-100 text-sky-700 ring-1 ring-sky-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Nhập theo Tỉnh → Huyện → Xã
              </button>
              <button
                type="button"
                onClick={() => setMode('v2')}
                className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
                  mode === 'v2'
                    ? 'bg-sky-100 text-sky-700 ring-1 ring-sky-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Nhập theo Tỉnh → Xã
              </button>
            </div>

            <div onSubmit={handleFinish} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Tên người nhận <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-600 focus:outline-none focus:ring-1 focus:ring-sky-600"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Số điện thoại <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    pattern="^(0|\+84)[0-9]{9}$"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-600 focus:outline-none focus:ring-1 focus:ring-sky-600"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Tỉnh/Thành phố <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedProvince || ''}
                  onChange={(e) => handleProvinceChange(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-600 focus:outline-none focus:ring-1 focus:ring-sky-600"
                  required
                >
                  <option value="">Chọn Tỉnh/Thành phố</option>
                  {provinces.map((p) => (
                    <option key={p.code} value={p.code}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {mode === 'v1' && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Quận/Huyện <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedDistrict || ''}
                    onChange={(e) => handleDistrictChange(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-600 focus:outline-none focus:ring-1 focus:ring-sky-600"
                    disabled={!districts.length}
                    required
                  >
                    <option value="">Chọn Quận/Huyện</option>
                    {districts.map((d) => (
                      <option key={d.code} value={d.code}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Phường/Xã <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedWard || ''}
                  onChange={(e) => setSelectedWard(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-600 focus:outline-none focus:ring-1 focus:ring-sky-600"
                  disabled={!wards.length}
                  required
                >
                  <option value="">Chọn Phường/Xã</option>
                  {wards.map((w) => (
                    <option key={w.code} value={w.code}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Địa chỉ cụ thể <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  placeholder="Số nhà, tên đường..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-600 focus:outline-none focus:ring-1 focus:ring-sky-600"
                  required
                />
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-600"
                />
                <span className="text-sm text-slate-700">
                  Đặt làm địa chỉ mặc định
                </span>
              </label>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 rounded-lg border border-slate-300 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleFinish}
                  disabled={loading}
                  className="flex-1 rounded-lg bg-sky-600 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
                >
                  {loading ? 'Đang lưu...' : editingId ? 'Cập nhật' : 'Lưu'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAddingNew(true)}
            className="mb-6 w-full rounded-2xl border-2 border-dashed border-slate-300 bg-white py-8 text-sky-600 transition hover:border-sky-400 hover:bg-sky-50"
          >
            <div className="flex flex-col items-center gap-2">
              <Plus className="h-6 w-6" />
              <span className="font-medium underline">Thêm địa chỉ mới</span>
            </div>
          </button>
        )}

        <div className="space-y-3">
          {addresses.length === 0 ? (
            <div className="rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-200">
              <Home className="mx-auto mb-3 h-12 w-12 text-slate-300" />
              <p className="text-slate-600">Chưa có địa chỉ nào</p>
            </div>
          ) : (
            addresses.map((item) => (
              <div
                key={item.id}
                className={`rounded-2xl bg-white p-5 shadow-sm transition ${
                  item.id === selectedId
                    ? 'ring-2 ring-sky-500'
                    : 'ring-1 ring-slate-200 hover:ring-slate-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => setSelectedId(item.id)}
                  >
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-slate-400" />
                        <span className="font-semibold text-slate-900">
                          {item.recipientName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Phone className="h-4 w-4" />
                        <span className="text-sm">{item.phone}</span>
                      </div>
                      {item.isDefault && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">
                          <Star className="h-3 w-3 fill-sky-700" />
                          Mặc định
                        </span>
                      )}
                    </div>

                    <div className="flex items-start gap-2 text-sm text-slate-600">
                      <Home className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                      <span>
                        {item.fullAddress ||
                          [item.street, item.ward, item.district, item.province]
                            .filter(Boolean)
                            .join(', ')}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {!item.isDefault && (
                      <button
                        type="button"
                        onClick={() => handleSetDefault(item.id)}
                        className="rounded-lg border border-slate-300 p-2 text-slate-600 transition hover:bg-slate-50"
                        title="Đặt làm mặc định"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleEdit(item)}
                      className="rounded-lg border border-slate-300 p-2 text-slate-600 transition hover:bg-slate-50"
                      title="Chỉnh sửa"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="rounded-lg border border-rose-300 p-2 text-rose-600 transition hover:bg-rose-50"
                      title="Xóa"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}