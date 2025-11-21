import React, { useState } from 'react';
import { Modal, Form, Input, Button, message } from 'antd';
import { useAuth } from '../context/AuthContext';

interface LoginPayload {
  email: string;
  password: string;
}

interface OptimizedLoginModalProps {
  open: boolean;
  onClose: () => void;
}

const OptimizedLoginModal: React.FC<OptimizedLoginModalProps> = ({ open, onClose }) => {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const BE_BASE_URL = import.meta.env.VITE_BE_BASE_URL;

  const handleLogin = async (values: LoginPayload) => {
    // console.time('🚀 [Frontend] Login Total Time');
    setLoading(true);
    
    try {
      console.time(' [Frontend] Login API Call');
      
      // Chỉ 1 API call duy nhất!
      const res = await fetch(`${BE_BASE_URL}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      
      console.timeEnd(' [Frontend] Login API Call');
      
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Login thất bại');

      console.time(' [Frontend] Set Auth State');
      
      // Login response đã chứa đầy đủ thông tin user
      // Không cần gọi thêm /users/me
      login(json.data, json.access_token);
      
      console.timeEnd('[Frontend] Login Total Time');

      message.success('Đăng nhập thành công!');
      onClose();
      
    } catch (err: any) {
      console.error('❌ [Frontend] Login Error:', err);
      message.error(err.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Đăng nhập"
      open={open}
      onCancel={onClose}
      footer={null}
      width={400}
    >
      <Form
        layout="vertical"
        onFinish={handleLogin}
        autoComplete="off"
      >
        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: 'Vui lòng nhập email!' },
            { type: 'email', message: 'Email không hợp lệ!' }
          ]}
        >
          <Input placeholder="Nhập email của bạn" />
        </Form.Item>

        <Form.Item
          label="Mật khẩu"
          name="password"
          rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
        >
          <Input.Password placeholder="Nhập mật khẩu" />
        </Form.Item>

        <Form.Item>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={loading}
            block
          >
            Đăng nhập
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default OptimizedLoginModal;
