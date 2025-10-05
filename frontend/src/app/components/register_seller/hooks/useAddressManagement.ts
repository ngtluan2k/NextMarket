import { useState, useEffect } from 'react';

interface Address {
  id: number;
  recipient_name: string;
  phone: string;
  street: string;
  district: string;
  province: string;
  ward: string;
  country: string;
  postal_code: string;
  type: string;
  detail: string;
  is_default: boolean;
}

interface AddressFormData {
  recipient_name: string;
  phone: string;
  street: string;
  district: string;
  province: string;
  ward: string;
  country: string;
  postal_code: string;
  type: string;
  detail: string;
  is_default: boolean;
}

export const useAddressManagement = () => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showSelectAddressModal, setShowSelectAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addressFormData, setAddressFormData] = useState<AddressFormData>({
    recipient_name: '',
    phone: '',
    street: '',
    district: '',
    province: '',
    ward: '',
    country: 'Vietnam',
    postal_code: '',
    type: 'pickup',
    detail: '',
    is_default: true,
  });

  const ADDRESSES_KEY = 'seller_registration_addresses';

  // Auto-save addresses
  useEffect(() => {
    try {
      localStorage.setItem(ADDRESSES_KEY, JSON.stringify(addresses));
    } catch (error) {
      console.error('Error saving addresses:', error);
    }
  }, [addresses]);

  const handleAddressInputChange = (field: string, value: any) => {
    setAddressFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddAddress = (
    onMessage: (msg: string, type: string) => void,
    version: 'v1' | 'v2' = 'v2'
  ) => {
    // Validate required fields
    const missingCommon =
      !addressFormData.recipient_name ||
      !addressFormData.phone ||
      !addressFormData.street ||
      !addressFormData.province ||
      !addressFormData.postal_code;

    // V1 cần đủ district + ward; V2 chỉ cần ward (district được bỏ trống)
    const needDistrict = version === 'v1';
    const missingLocation = needDistrict
      ? !addressFormData.district || !addressFormData.ward
      : !addressFormData.ward;

    if (missingCommon || missingLocation) {
      onMessage('❌ Vui lòng điền đầy đủ thông tin địa chỉ', 'error');
      return;
    }

    if (editingAddress) {
      // Update existing address
      setAddresses((prev) =>
        prev.map((addr) =>
          addr.id === editingAddress.id
            ? {
              ...addressFormData,
              id: editingAddress.id,
              is_default: editingAddress.is_default,
            }
            : addr
        )
      );
      onMessage('✅ Địa chỉ đã được cập nhật thành công', 'success');
    } else {
      // Add new address
      const isFirstAddress = addresses.length === 0;
      const newAddress = {
        ...addressFormData,
        // Nếu V2: đảm bảo district rỗng để không lưu sai
        district: version === 'v2' ? '' : addressFormData.district,
        id: Date.now(),
        is_default: isFirstAddress,
      };
      setAddresses((prev) => [...prev, newAddress]);
      onMessage('✅ Địa chỉ đã được thêm thành công', 'success');
    }

    // Reset form and close modal
    setAddressFormData({
      recipient_name: '',
      phone: '',
      street: '',
        district: '',
      province: '',
      ward: '',
      country: 'Vietnam',
      postal_code: '',
      type: 'pickup',
      detail: '',
      is_default: true,
    });
    setEditingAddress(null);
    setShowAddressModal(false);
  };

  const handleSetDefaultAddress = (addressId: number) => {
    setAddresses((prev) =>
      prev.map((addr) => ({
        ...addr,
        is_default: addr.id === addressId,
      }))
    );
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    setAddressFormData({
      recipient_name: address.recipient_name,
      phone: address.phone,
      street: address.street,
      district: address.district,
      province: address.province,
      ward: address.ward || '',
      country: address.country,
      postal_code: address.postal_code,
      type: address.type,
      detail: address.detail || '',
      is_default: address.is_default,
    });
    setShowAddressModal(true);
  };

  const handleDeleteAddress = (addressId: number) => {
    const filteredAddresses = addresses.filter((addr) => addr.id !== addressId);
    setAddresses(filteredAddresses);

    if (filteredAddresses.length > 0) {
      // Set first remaining address as default
      const newDefault = {
        ...filteredAddresses[0],
        is_default: true,
      };
      setAddresses((prev) =>
        prev.map((addr) =>
          addr.id === newDefault.id
            ? newDefault
            : { ...addr, is_default: false }
        )
      );
    }
  };

  return {
    addresses,
    setAddresses,
    showAddressModal,
    setShowAddressModal,
    showSelectAddressModal,
    setShowSelectAddressModal,
    editingAddress,
    setEditingAddress,
    addressFormData,
    setAddressFormData,
    handleAddressInputChange,
    handleAddAddress,
    handleSetDefaultAddress,
    handleEditAddress,
    handleDeleteAddress,
  };
};
