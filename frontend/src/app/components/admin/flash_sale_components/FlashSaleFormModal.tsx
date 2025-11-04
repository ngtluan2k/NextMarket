import React from 'react';
import { Modal, Form, Input, DatePicker, message } from 'antd';
import { createFlashSaleSchedule } from '../../../../service/flash_sale.service';

const { RangePicker } = DatePicker;

export default function FlashSaleFormModal({
  visible,
  onClose,
  onSuccess,
}: {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form] = Form.useForm();
  const token = localStorage.getItem('token') || '';

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const [start, end] = values.timeRange;
      await createFlashSaleSchedule(
        {
          name: values.name,
          description: values.description,
          starts_at: start.toISOString(),
          ends_at: end.toISOString(),
        },
        token
      );
      message.success('Tạo flash sale thành công');
      form.resetFields();
      onClose();
      onSuccess();
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Không thể tạo flash sale');
    }
  };

  return (
    <Modal
      title="Tạo Flash Sale mới"
      open={visible}
      onCancel={onClose}
      onOk={handleOk}
      okText="Tạo"
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="Tên Flash Sale"
          name="name"
          rules={[{ required: true, message: 'Nhập tên Flash Sale' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item label="Mô tả" name="description">
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item
          label="Thời gian diễn ra"
          name="timeRange"
          rules={[{ required: true, message: 'Chọn thời gian bắt đầu và kết thúc' }]}
        >
          <RangePicker showTime />
        </Form.Item>
      </Form>
    </Modal>
  );
}
