import React, { useEffect, useState } from 'react';
import {
  Modal,
  List,
  Radio,
  Button,
  Form,
  Input,
  message,
  Select,
  Popconfirm,
} from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { api, provincesApi } from '../api/api';
import { UserAddress } from '../types/user';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (address: UserAddress) => void;
  currentAddressId?: number;
};

const AddressModal: React.FC<Props> = ({
  visible,
  onClose,
  onSelect,
  currentAddressId,
}) => {
  const { me } = useAuth();
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'v1' | 'v2'>('v1');
  const [provinces, setProvinces] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);
  const [form] = Form.useForm();

  // Load addresses khi modal mở hoặc user thay đổi
  useEffect(() => {
    if (!visible || !me?.id) return;

    const fetchAddresses = async () => {
      try {
        const res = await api.get(`/users/${me.id}/addresses`);
        setAddresses(res.data);
        const defaultAddress =
          res.data.find((a: UserAddress) => a.id === currentAddressId) ||
          res.data.find((a: UserAddress) => a.isDefault) ||
          res.data[0] ||
          null;

        if (defaultAddress) {
          setSelectedId(defaultAddress.id);

          if (currentAddressId) {
            onSelect(defaultAddress);
          }
        }
      } catch (err) {
        console.error('Lỗi tải địa chỉ:', err);
        message.error('Không thể tải địa chỉ');
      }
    };

    fetchAddresses();
  }, [visible, me?.id, currentAddressId]);

  // Load provinces
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const data =
          mode === 'v1'
            ? await provincesApi.getProvincesV1()
            : await provincesApi.getProvincesV2();
        setProvinces(data);
      } catch {
        message.error('Không thể tải tỉnh/thành phố');
      }
    };
    fetchProvinces();
  }, [mode]);

  const handleProvinceChange = (provinceCode: number) => {
    form.setFieldsValue({ district: undefined, ward: undefined });
    setDistricts([]);
    setWards([]);
    if (mode === 'v1') {
      provincesApi.getDistrictsV1(provinceCode).then(setDistricts);
    } else {
      provincesApi.getDistrictsV2(provinceCode).then(setWards);
    }
  };

  const handleDistrictChange = (districtCode: number) => {
    form.setFieldsValue({ ward: undefined });
    setWards([]);
    provincesApi.getWardsV1(districtCode).then(setWards);
  };

  const renderForm = () => (
    <>
      <Form.Item
        name="recipientName"
        label="Tên người nhận"
        rules={[{ required: true, message: 'Vui lòng nhập tên người nhận' }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="phone"
        label="Số điện thoại"
        rules={[
          { required: true, message: 'Vui lòng nhập số điện thoại' },
          {
            pattern: /^(0|\+84)[0-9]{9}$/,
            message: 'Số điện thoại không hợp lệ',
          },
        ]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="province"
        label="Tỉnh/Thành phố"
        rules={[{ required: true, message: 'Vui lòng chọn tỉnh/thành phố' }]}
      >
        <Select
          placeholder="Chọn Tỉnh/Thành phố"
          options={provinces.map((p) => ({ label: p.name, value: p.code }))}
          onChange={handleProvinceChange}
        />
      </Form.Item>
      {mode === 'v1' && (
        <>
          <Form.Item
            name="district"
            label="Quận/Huyện"
            rules={[{ required: true, message: 'Vui lòng chọn quận/huyện' }]}
          >
            <Select
              placeholder="Chọn Quận/Huyện"
              options={districts.map((d) => ({ label: d.name, value: d.code }))}
              onChange={handleDistrictChange}
              disabled={!districts.length}
            />
          </Form.Item>
          <Form.Item
            name="ward"
            label="Phường/Xã"
            rules={[{ required: true, message: 'Vui lòng chọn phường/xã' }]}
          >
            <Select
              placeholder="Chọn Phường/Xã"
              options={wards.map((w) => ({ label: w.name, value: w.code }))}
              disabled={!wards.length}
            />
          </Form.Item>
        </>
      )}
      {mode === 'v2' && (
        <Form.Item
          name="ward"
          label="Phường/Xã"
          rules={[{ required: true, message: 'Vui lòng chọn phường/xã' }]}
        >
          <Select
            placeholder="Chọn Phường/Xã"
            options={wards.map((w) => ({ label: w.name, value: w.code }))}
            disabled={!wards.length}
          />
        </Form.Item>
      )}
      <Form.Item
        name="addressLine"
        label="Địa chỉ cụ thể"
        rules={[{ required: true, message: 'Vui lòng nhập địa chỉ cụ thể' }]}
      >
        <Input />
      </Form.Item>
      <Form.Item name="isDefault" valuePropName="checked">
        <Radio>Đặt làm địa chỉ mặc định</Radio>
      </Form.Item>
    </>
  );

  const handleFinish = async (values: any) => {
    setLoading(true);
    try {
      const userId = me?.id || Number(localStorage.getItem('userId') || 0);
      if (!userId) {
        message.error('Vui lòng đăng nhập để thêm địa chỉ');
        setLoading(false);
        return;
      }

      const wardName = wards.find((w) => w.code === values.ward)?.name;
      const districtName =
        mode === 'v1'
          ? districts.find((d) => d.code === values.district)?.name
          : '';
      const provinceName = provinces.find(
        (p) => p.code === values.province
      )?.name;

      if (
        !values.recipientName ||
        !values.phone ||
        !values.addressLine ||
        !provinceName ||
        !wardName ||
        (mode === 'v1' && !districtName)
      ) {
        message.error('Vui lòng điền đầy đủ thông tin bắt buộc.');
        setLoading(false);
        return;
      }

      const payload = {
        user_id: userId,
        recipientName: values.recipientName,
        phone: values.phone,
        street: values.addressLine,
        ward: wardName,
        district: districtName,
        province: provinceName,
        country: 'Việt Nam',
        postalCode: values.postalCode || '',
        isDefault: values.isDefault || false,
      };

      let res: { data: UserAddress };

      if (editingId) {
        // Chế độ EDIT: cập nhật và tự động chọn địa chỉ đó
        res = await api.patch(
          `/users/${userId}/addresses/${editingId}`,
          payload
        );

        // ✅ Normalize userId về đúng format
        const normalizedAddress = {
          ...res.data,
          userId: userId,
          user_id: userId,
        };

        // Cập nhật trong danh sách
        setAddresses((prev) =>
          prev.map((addr) => (addr.id === editingId ? normalizedAddress : addr))
        );

        // ✅ Tự động chọn địa chỉ vừa cập nhật
        setSelectedId(normalizedAddress.id);
        onSelect(normalizedAddress);

        message.success('Đã cập nhật địa chỉ');
        setEditingId(null);
      } else {
        // Chế độ THÊM MỚI: tự động chọn địa chỉ vừa thêm
        res = await api.post(`/users/${userId}/addresses`, payload);

        // ✅ Normalize userId về đúng format
        const normalizedAddress = {
          ...res.data,
          userId: userId,
          user_id: userId,
        };

        setAddresses((prev) => [...prev, normalizedAddress]);
        setSelectedId(normalizedAddress.id);
        message.success('Đã thêm địa chỉ mới');
      }

      setAddingNew(false);
      form.resetFields();
    } catch (error: any) {
      console.error('❌ Address error:', error.response?.data || error);
      message.error(error.response?.data?.message || 'Không thể lưu địa chỉ');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (address: UserAddress) => {
    setEditingId(address.id);
    setAddingNew(true);

    // Load data để fill vào form
    try {
      // Load provinces first
      const provincesData =
        mode === 'v1'
          ? await provincesApi.getProvincesV1()
          : await provincesApi.getProvincesV2();
      setProvinces(provincesData);

      const provinceCode = provincesData.find(
        (p: any) => p.name === address.province
      )?.code;

      if (provinceCode) {
        if (mode === 'v1') {
          const districtsData = await provincesApi.getDistrictsV1(provinceCode);
          setDistricts(districtsData);

          const districtCode = districtsData.find(
            (d: any) => d.name === address.district
          )?.code;
          if (districtCode) {
            const wardsData = await provincesApi.getWardsV1(districtCode);
            setWards(wardsData);
            const wardCode = wardsData.find(
              (w: any) => w.name === address.ward
            )?.code;

            form.setFieldsValue({
              recipientName: address.recipientName,
              phone: address.phone,
              province: provinceCode,
              district: districtCode,
              ward: wardCode,
              addressLine: address.street,
              isDefault: address.isDefault,
            });
          }
        } else {
          const wardsData = await provincesApi.getDistrictsV2(provinceCode);
          setWards(wardsData);
          const wardCode = wardsData.find(
            (w: any) => w.name === address.ward
          )?.code;

          form.setFieldsValue({
            recipientName: address.recipientName,
            phone: address.phone,
            province: provinceCode,
            ward: wardCode,
            addressLine: address.street,
            isDefault: address.isDefault,
          });
        }
      }
    } catch (error) {
      console.error('Error loading address data:', error);
      message.error('Không thể tải dữ liệu địa chỉ');
    }
  };

  const handleSetDefault = async (addressId: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
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

      const res = await api.patch(
        `/users/${userId}/addresses/${addressId}`,
        payload
      );

      // ✅ Normalize userId
      const normalizedAddress = {
        ...res.data,
        userId: userId,
        user_id: userId,
      };

      setAddresses((prev) =>
        prev.map((addr) => ({
          ...addr,
          isDefault: addr.id === addressId,
          ...(addr.id === addressId ? { userId: userId, user_id: userId } : {}),
        }))
      );

      message.success('Đã đặt làm địa chỉ mặc định');
    } catch (error: any) {
      console.error('Error setting default:', error.response?.data || error);
      message.error(
        error.response?.data?.message || 'Không thể đặt địa chỉ mặc định'
      );
    }
  };

  const handleDelete = async (addressId: number) => {
    try {
      const userId = me?.id || Number(localStorage.getItem('userId') || 0);
      await api.delete(`/users/${userId}/addresses/${addressId}`);
      setAddresses((prev) => prev.filter((addr) => addr.id !== addressId));

      if (selectedId === addressId) {
        const remaining = addresses.filter((addr) => addr.id !== addressId);
        if (remaining.length > 0) {
          setSelectedId(remaining[0].id);
          onSelect(remaining[0]);
        } else {
          setSelectedId(null);
        }
      }

      message.success('Đã xóa địa chỉ');
    } catch (error: any) {
      console.error('Delete error:', error);
      message.error('Không thể xóa địa chỉ');
    }
  };

  const handleSelectAddress = (item: UserAddress) => {
    setSelectedId(item.id);
  };

  const handleConfirmSelection = async () => {
    const selected = addresses.find((a) => a.id === selectedId);
    if (!selected) {
      message.warning('Vui lòng chọn một địa chỉ');
      return;
    }

    const userId = me?.id || Number(localStorage.getItem('userId') || 0);

    if (!selected.isDefault) {
      try {
        const payload = {
          user_id: userId,
          recipientName: selected.recipientName,
          phone: selected.phone,
          street: selected.street,
          ward: selected.ward,
          district: selected.district || '',
          province: selected.province,
          country: selected.country || 'Việt Nam',
          postalCode: selected.postalCode || '',
          isDefault: true,
        };

        const res = await api.patch(
          `/users/${userId}/addresses/${selected.id}`,
          payload
        );

        // ✅ Normalize và cập nhật
        const normalizedAddress = {
          ...res.data,
          userId: userId,
          user_id: userId,
        };

        setAddresses((prev) =>
          prev.map((addr) => ({
            ...addr,
            isDefault: addr.id === selected.id,
            ...(addr.id === selected.id
              ? { userId: userId, user_id: userId }
              : {}),
          }))
        );

        // ✅ Pass normalized address
        onSelect(normalizedAddress);
        message.success('Đã đặt làm địa chỉ mặc định');
      } catch (error: any) {
        console.error('Error setting default:', error.response?.data || error);
        // Vẫn pass với userId được normalize
        const normalizedSelected = {
          ...selected,
          userId: userId,
          user_id: userId,
        };
        onSelect(normalizedSelected);
      }
    } else {
      // ✅ Đảm bảo địa chỉ đã có userId đúng
      const normalizedSelected = {
        ...selected,
        userId: userId,
        user_id: userId,
      };
      onSelect(normalizedSelected);
    }

    onClose();
  };

  return (
    <Modal
      title={
        addingNew
          ? editingId
            ? 'Chỉnh sửa địa chỉ'
            : 'Thêm địa chỉ mới'
          : 'Chọn địa chỉ giao hàng'
      }
      open={visible}
      onCancel={() => {
        onClose();
        setAddingNew(false);
        setEditingId(null);
        form.resetFields();
      }}
      width={650}
      footer={null}
    >
      {addingNew ? (
        <>
          <div style={{ marginBottom: 16 }}>
            <Radio.Group value={mode} onChange={(e) => setMode(e.target.value)}>
              <Radio.Button value="v1">
                Nhập theo Tỉnh → Huyện → Xã
              </Radio.Button>
              <Radio.Button value="v2">Nhập theo Tỉnh → Xã</Radio.Button>
            </Radio.Group>
          </div>
          <Form layout="vertical" form={form} onFinish={handleFinish}>
            {renderForm()}
            <div
              style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}
            >
              <Button
                onClick={() => {
                  setAddingNew(false);
                  setEditingId(null);
                  form.resetFields();
                }}
              >
                Hủy
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingId ? 'Cập nhật' : 'Lưu'}
              </Button>
            </div>
          </Form>
        </>
      ) : (
        <>
          <List
            dataSource={addresses}
            renderItem={(item) => (
              <List.Item
                style={{
                  border:
                    item.id === selectedId
                      ? '2px solid #1890ff'
                      : '1px solid #ddd',
                  borderRadius: 6,
                  marginBottom: 8,
                  padding: 12,
                  cursor: 'pointer',
                }}
                actions={[
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(item);
                    }}
                  />,
                  <Popconfirm
                    title="Xóa địa chỉ này?"
                    onConfirm={(e) => {
                      e?.stopPropagation();
                      handleDelete(item.id);
                    }}
                    okText="Xóa"
                    cancelText="Hủy"
                  >
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Popconfirm>,
                ]}
              >
                <div
                  style={{ display: 'flex', width: '100%', cursor: 'pointer' }}
                  onClick={() => handleSelectAddress(item)}
                >
                  <Radio checked={selectedId === item.id} />
                  <div style={{ marginLeft: 12, flex: 1 }}>
                    <p>
                      <strong>{item.recipientName}</strong> | {item.phone}
                    </p>
                    <p>
                      {item.fullAddress ??
                        [item.street, item.ward, item.district, item.province]
                          .filter(Boolean)
                          .join(', ')}
                    </p>
                    {item.isDefault && (
                      <span style={{ color: '#1890ff', fontSize: 12 }}>
                        [Mặc định]
                      </span>
                    )}
                  </div>
                </div>
              </List.Item>
            )}
          />
          <Button
            type="link"
            onClick={() => {
              setAddingNew(true);
              setEditingId(null);
              form.resetFields();
            }}
          >
            + Thêm địa chỉ mới
          </Button>
          {selectedId && (
            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <Button type="primary" onClick={handleConfirmSelection}>
                Xác nhận
              </Button>
            </div>
          )}
        </>
      )}
    </Modal>
  );
};

export default AddressModal;
