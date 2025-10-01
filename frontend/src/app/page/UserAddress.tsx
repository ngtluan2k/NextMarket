import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Checkbox, message } from 'antd';
import { api } from '../api/api';
import { useAuth } from '../context/AuthContext';

const UserAddress: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { me } = useAuth();

  const handleFinish = async (values: any) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const userId = me?.id || parseInt(localStorage.getItem('userId') || '0');
      if (!token || !userId) {
        message.error('Bạn chưa đăng nhập!');
        navigate('/login');
        return;
      }

      const payload = {
        user_id: userId,
        recipientName: values.name?.trim(),
        phone: values.phone?.trim(),
        street: values.street?.trim(),
        city: values.city?.trim(),
        province: values.province?.trim() || undefined,
        country: values.country?.trim() || undefined,
        isDefault: values.isDefault || false,
      };

      console.log('Sending payload:', payload);

      await api.post(`/users/${userId}/addresses`, payload);

      message.success('Thêm địa chỉ thành công!');
      navigate(-1);
    } catch (error: any) {
      console.error('❌ Lỗi lưu địa chỉ:', error);
      message.error(error.response?.data?.message || 'Không thể lưu địa chỉ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '50px auto', padding: 20, background: '#fff', borderRadius: 8 }}>
      <h2>Thêm địa chỉ mới</h2>
      <Form layout="vertical" onFinish={handleFinish}>
        <Form.Item name="name" label="Tên người nhận" rules={[{ required: true, message: 'Vui lòng nhập tên' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="phone" label="Số điện thoại" rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="street" label="Địa chỉ" rules={[{ required: true, message: 'Vui lòng nhập địa chỉ' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="city" label="Thành phố" rules={[{ required: true, message: 'Vui lòng nhập thành phố' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="province" label="Tỉnh/Thành">
          <Input />
        </Form.Item>
        <Form.Item name="country" label="Quốc gia">
          <Input />
        </Form.Item>
        <Form.Item name="isDefault" valuePropName="checked">
          <Checkbox>Đặt làm địa chỉ mặc định</Checkbox>
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Lưu địa chỉ
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default UserAddress;
