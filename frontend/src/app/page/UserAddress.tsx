import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, message } from 'antd';
import { api } from '../config/api';
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

      // Tạo payload và loại bỏ các trường rỗng
      const payload = {
        user_id: userId,
        recipientName: values.name?.trim(),
        phone: values.phone?.trim(),
        street: values.street?.trim(),
        city: values.city?.trim(),
        province: values.province?.trim() || undefined, // Chuyển chuỗi rỗng thành undefined
        country: values.country?.trim() || undefined,   // Chuyển chuỗi rỗng thành undefined
        isDefault: true,
      };

      console.log('Sending payload:', payload); // Log để debug

      await api.post(`/users/${userId}/addresses`, payload);

      message.success('Thêm địa chỉ thành công!');
      navigate(-1);
    } catch (error: any) {
      console.error('❌ Lỗi lưu địa chỉ:', error);
      console.error('Response data:', error.response?.data); // Log chi tiết lỗi từ server
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
        <Form.Item name="province" label="Tỉnh/Thành" rules={[{ required: true, message: 'Vui lòng nhập tỉnh/thành' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="country" label="Quốc gia" rules={[{ required: true, message: 'Vui lòng nhập quốc gia' }]}>
          <Input />
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