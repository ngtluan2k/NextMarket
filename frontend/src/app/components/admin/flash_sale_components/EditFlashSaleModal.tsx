import React, { useEffect } from 'react';
import { Modal, Form, Input, DatePicker, message } from 'antd';
import { updateFlashSaleSchedule } from '../../../../service/flash_sale.service';
import { FlashSale } from '../FlashSaleManager';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  flashSale: FlashSale; // flash sale cần chỉnh sửa
}

export default function EditFlashSaleModal({
  visible,
  onClose,
  onSuccess,
  flashSale,
}: Props) {
  const [form] = Form.useForm();
  const token = localStorage.getItem('token') || '';

  // Khi flashSale thay đổi, điền dữ liệu vào form
  useEffect(() => {
    if (flashSale) {
      form.setFieldsValue({
        name: flashSale.name,
        description: flashSale.description,
        timeRange: [
          flashSale.starts_at ? dayjs(flashSale.starts_at) : null,
          flashSale.ends_at ? dayjs(flashSale.ends_at) : null,
        ],
      });
    }
  }, [flashSale]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const [start, end] = values.timeRange;
      await updateFlashSaleSchedule(
        flashSale.id,
        {
          name: values.name,
          description: values.description,
          starts_at: start.toISOString(),
          ends_at: end.toISOString(),
        },
        token
      );
      message.success('Cập nhật Flash Sale thành công');
      form.resetFields();
      onClose();
      onSuccess();
    } catch (err: any) {
      message.error(
        err?.response?.data?.message || 'Không thể cập nhật Flash Sale'
      );
    }
  };

  return (
    <Modal
      title="Chỉnh sửa Flash Sale"
      open={visible}
      onCancel={onClose}
      onOk={handleOk}
      okText="Cập nhật"
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
          rules={[
            { required: true, message: 'Chọn thời gian bắt đầu và kết thúc' },
          ]}
        >
          <RangePicker showTime />
        </Form.Item>
      </Form>
    </Modal>
  );
}
