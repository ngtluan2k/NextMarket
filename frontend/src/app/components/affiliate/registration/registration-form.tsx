'use client';
import { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Button,
  Select,
  Checkbox,
  message,
  Card,
  Space,
  Typography,
} from 'antd';
import {
  CheckCircleOutlined,
  StarOutlined,
  PlusOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;

export function RegistrationForm() {
  const [form] = Form.useForm();
  const [platforms, setPlatforms] = useState<any[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  // ✅ Lấy danh sách platform từ API
  useEffect(() => {
    const fetchPlatforms = async () => {
      try {
        const res = await axios.get(
          'http://localhost:3000/affiliate-platforms'
        );
        setPlatforms(res.data);
      } catch (err) {
        console.error(err);
        message.error('Không thể tải danh sách nền tảng');
      }
    };
    fetchPlatforms();
  }, []);

  const togglePlatform = (platformId: number) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId)
        ? prev.filter((id) => id !== platformId)
        : [...prev, platformId]
    );
  };

  const sendVerificationCode = async () => {
    try {
      const email = form.getFieldValue('email');
      if (!email) {
        message.error('Vui lòng nhập email');
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setCodeSent(true);
      message.success('Mã xác nhận đã được gửi đến email của bạn');
    } catch (error) {
      message.error('Có lỗi xảy ra, vui lòng thử lại');
    }
  };

  const handleSubmit = async (values: any) => {
    if (selectedPlatforms.length === 0) {
      message.error('Vui lòng chọn ít nhất một nền tảng');
      return;
    }

    const token = localStorage.getItem('token');
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = userData?.id || userData?.user_id;

    if (!token || !userId) {
      message.error('Bạn cần đăng nhập trước khi đăng ký');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        userId,
        uuid: uuidv4(),
        description: values.intro,
        status: 'PENDING',
        platformIds: selectedPlatforms,
        phone: values.phone,
        email: values.email,
      };

      await axios.post(
        'http://localhost:3000/affiliate-registrations',
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      message.success('Đăng ký thành công');
      setVerificationSent(true);
    } catch (error) {
      console.error(error);
      message.error('Có lỗi khi gửi đăng ký');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (verificationSent) {
    return (
      <Card
        className="rounded-2xl shadow-2xl"
        style={{ borderColor: '#93C5FD', borderWidth: 2 }}
      >
        <div className="flex flex-col items-center text-center py-8">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-green-400 rounded-full blur-xl opacity-30 animate-pulse" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-green-600 shadow-lg">
              <CheckCircleOutlined style={{ fontSize: 40, color: 'white' }} />
            </div>
          </div>
          <StarOutlined
            style={{ fontSize: 24, color: '#3B82F6', marginBottom: 12 }}
            className="animate-pulse"
          />
          <Title level={3} style={{ marginBottom: 12 }}>
            Đăng ký thành công!
          </Title>
          <Paragraph style={{ marginBottom: 32, maxWidth: 500, fontSize: 15 }}>
            Cảm ơn bạn đã đăng ký chương trình tiếp thị liên kết. Đội ngũ của
            chúng tôi sẽ xem xét đơn đăng ký của bạn trong vòng 2-3 ngày làm
            việc.
          </Paragraph>
          <Button
            type="primary"
            size="large"
            style={{
              height: 48,
              paddingLeft: 32,
              paddingRight: 32,
              backgroundColor: '#3B82F6',
            }}
            onClick={() => (window.location.href = '/')}
          >
            Quay về Trang chủ
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className="rounded-2xl shadow-2xl"
      style={{ borderColor: '#93C5FD', borderWidth: 2 }}
      title={
        <div className="flex items-center gap-2 py-2">
          <StarOutlined style={{ fontSize: 24, color: '#3B82F6' }} />
          <span className="text-xl font-bold">
            Đăng ký Chương trình Tiếp thị Liên kết
          </span>
        </div>
      }
      headStyle={{
        backgroundColor: '#EFF6FF',
        borderBottom: '1px solid #E5E7EB',
      }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        className="space-y-6"
      >
        {/* Platform Selection */}
        <Form.Item label="Chọn Nền tảng Quảng bá của bạn" required>
          <div className="grid grid-cols-2 gap-3">
            {platforms.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`flex items-center justify-between py-3 px-4 rounded-lg border-2 transition-all hover:shadow-md ${
                  selectedPlatforms.includes(p.id)
                    ? 'border-blue-500 bg-blue-500 text-white'
                    : 'border-gray-200 bg-white hover:border-blue-300 text-gray-900'
                }`}
                onClick={() => togglePlatform(p.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-md shadow-sm bg-gray-300" />
                  <span className="font-medium">{p.name}</span>
                </div>
                {selectedPlatforms.includes(p.id) ? (
                  <CheckOutlined />
                ) : (
                  <PlusOutlined style={{ color: '#3B82F6' }} />
                )}
              </button>
            ))}
          </div>
        </Form.Item>
        <Form.Item
          label={
            <span className="text-base font-semibold">
              Số điện thoại liên hệ <span className="text-red-500">*</span>
            </span>
          }
          required
        >
          <Space.Compact style={{ width: '100%' }}>
            <Select defaultValue="+84" style={{ width: 120 }}>
              <Select.Option value="+84">+84</Select.Option>
              <Select.Option value="+1">+1</Select.Option>
              <Select.Option value="+44">+44</Select.Option>
              <Select.Option value="+86">+86</Select.Option>
            </Select>
            <Form.Item
              name="phone"
              noStyle
              rules={[
                { required: true, message: 'Vui lòng nhập số điện thoại' },
              ]}
            >
              <Input
                placeholder="Vui lòng nhập số điện thoại của bạn"
                style={{ flex: 1 }}
              />
            </Form.Item>
          </Space.Compact>
        </Form.Item>

        {/* Email */}
        <Form.Item
          label={
            <span className="text-base font-semibold">
              Email liên hệ <span className="text-red-500">*</span>
            </span>
          }
        >
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            <Space.Compact style={{ width: '100%' }}>
              <Form.Item
                name="email"
                noStyle
                rules={[
                  { required: true, message: 'Vui lòng nhập email' },
                  { type: 'email', message: 'Email không hợp lệ' },
                ]}
              >
                <Input placeholder="kajihusama@gmail.com" style={{ flex: 1 }} />
              </Form.Item>
              {/* <Button
                style={{
                  borderColor: '#EF4444',
                  color: '#EF4444',
                  fontWeight: 600,
                }}
                onClick={sendVerificationCode}
                disabled={codeSent}
              >
                {codeSent ? 'Đã gửi' : 'Gửi mã xác nhận'}
              </Button> */}
            </Space.Compact>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Khuyến nghị sử dụng hộp thư của Google. Nếu bạn sử dụng các hộp
              thư khác, vui lòng liên hệ với bộ phận dịch vụ khách hàng trong
              trường hợp bị thiếu hoặc bị chặn.
            </Text>
          </Space>
        </Form.Item>

        {/* Verification Code */}
        {/* <Form.Item
          name="code"
          label={
            <span className="text-base font-semibold">
              Mã xác minh email <span className="text-red-500">*</span>
            </span>
          }
          rules={[{ required: true, message: 'Vui lòng nhập mã xác thực' }]}
        >
          <Input placeholder="Vui lòng nhập mã xác thực của bạn" />
        </Form.Item> */}

        {/* Introduction */}
        <Form.Item
          name="intro"
          label={<span className="text-base font-semibold">Mô giới thiệu</span>}
        >
          <TextArea
            rows={4}
            placeholder="Nhập mô giới thiệu của người giới thiệu bạn"
          />
        </Form.Item>

        {/* Terms Agreement */}
        <Form.Item
          name="terms"
          valuePropName="checked"
          rules={[
            {
              validator: (_, value) =>
                value
                  ? Promise.resolve()
                  : Promise.reject(new Error('Bạn phải đồng ý với điều khoản')),
            },
          ]}
        >
          <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
            <Checkbox>
              <Text style={{ fontSize: 14 }}>
                Tôi cam kết rằng thông tin được gửi đi trên là đúng sự thật và
                tôi đồng ý với{' '}
                <a href="#" style={{ color: '#3B82F6', fontWeight: 500 }}>
                  Terms of Service &amp; Privacy Policy
                </a>
                , của chương trình Tiếp Thị Liên Kết của Shopee
              </Text>
            </Checkbox>
          </div>
        </Form.Item>

        {/* Submit Button */}
        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            block
            loading={isSubmitting}
            style={{
              height: 56,
              fontSize: 16,
              fontWeight: 600,
              backgroundColor: '#3B82F6',
            }}
          >
            Gửi đi
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
