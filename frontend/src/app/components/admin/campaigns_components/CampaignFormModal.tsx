import React, { useState } from 'react';
import { Modal, Form, Input, DatePicker, Upload, Button, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { createCampaign } from '../../../../service/campaign.service';

const { TextArea } = Input;

interface CampaignFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CampaignFormModal({ visible, onClose, onSuccess }: CampaignFormModalProps) {
  const [banner, setBanner] = useState<File | null>(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (publish: boolean) => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      const formData = new FormData();
      formData.append('name', values.name);
      formData.append('description', values.description || '');
      formData.append('startsAt', values.startsAt.toISOString());
      formData.append('endsAt', values.endsAt.toISOString());
      formData.append('publish', publish ? 'true' : 'false');
      if (banner) formData.append('banner', banner);

      await createCampaign(formData);
      message.success(publish ? 'Đăng campaign thành công!' : 'Lưu nháp thành công!');
      form.resetFields();
      setBanner(null);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      message.error('Lỗi tạo campaign');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Tạo Campaign"
      open={visible}
      onCancel={onClose}
      footer={null}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="Tên Campaign"
          name="name"
          rules={[{ required: true, message: 'Vui lòng nhập tên campaign' }]}
        >
          <Input placeholder="Nhập tên campaign" />
        </Form.Item>

        <Form.Item label="Mô tả" name="description">
          <TextArea rows={3} placeholder="Mô tả (không bắt buộc)" />
        </Form.Item>

        <Form.Item
          label="Bắt đầu"
          name="startsAt"
          rules={[{ required: true, message: 'Vui lòng chọn ngày bắt đầu' }]}
        >
          <DatePicker showTime style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          label="Kết thúc"
          name="endsAt"
          rules={[{ required: true, message: 'Vui lòng chọn ngày kết thúc' }]}
        >
          <DatePicker showTime style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item label="Banner">
          <Upload
            beforeUpload={file => {
              setBanner(file);
              return false;
            }}
            onRemove={() => setBanner(null)}
            maxCount={1}
            listType="picture"
          >
            <Button icon={<UploadOutlined />}>Chọn ảnh banner</Button>
          </Upload>
        </Form.Item>

        <div style={{ textAlign: 'right' }}>
          <Button onClick={onClose} style={{ marginRight: 8 }}>
            Hủy
          </Button>
          <Button type="default" onClick={() => handleSubmit(false)} loading={loading}>
            Lưu nháp
          </Button>
          <Button type="primary" onClick={() => handleSubmit(true)} style={{ marginLeft: 8 }} loading={loading}>
            Đăng Campaign
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
