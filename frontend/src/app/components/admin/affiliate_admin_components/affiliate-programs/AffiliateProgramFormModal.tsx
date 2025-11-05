'use client';

import { useEffect } from 'react';
import { Button, Col, Form, Input, InputNumber, Modal, Row, Select, Space } from 'antd';
import type { AffiliateProgram, AffiliateProgramFormData } from '../../../../types/affiliate';

interface Props {
  visible: boolean;
  editingProgram: AffiliateProgram | null;
  onCancel: () => void;
  onSubmit: (values: AffiliateProgramFormData) => void;
}

const AffiliateProgramFormModal = ({ visible, editingProgram, onCancel, onSubmit }: Props) => {
  const [form] = Form.useForm<AffiliateProgramFormData>();

  useEffect(() => {
    if (visible) {
      if (editingProgram) {
        form.setFieldsValue({
          name: editingProgram.name,
          cookie_days: editingProgram.cookie_days ?? undefined,
          commission_type: editingProgram.commission_type ?? undefined,
          commission_value: editingProgram.commission_value ?? undefined,
          status: editingProgram.status,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          status: 'active',
          commission_type: 'percentage',
        } as any);
      }
    }
  }, [visible, editingProgram, form]);

  const title = editingProgram ? 'Chỉnh sửa Chương trình' : 'Tạo Chương trình Mới';

  return (
    <Modal title={title} open={visible} onCancel={onCancel} footer={null} width={600} destroyOnClose>
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <Form.Item
          label="Tên Chương trình"
          name="name"
          rules={[{ required: true, message: 'Vui lòng nhập tên chương trình' }]}
        >
          <Input placeholder="Nhập tên chương trình" />
        </Form.Item>

        <Form.Item label="Số ngày lưu Cookie" name="cookie_days" tooltip="Số ngày cookie liên kết có hiệu lực">
          <InputNumber min={1} max={365} placeholder="Ví dụ: 30" className="w-full" />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Loại hoa hồng" name="commission_type" rules={[{ required: true }]}>
              <Select placeholder="Chọn loại">
                <Select.Option value="percentage">Phần trăm</Select.Option>
                <Select.Option value="fixed">Số tiền cố định</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Giá trị hoa hồng"
              name="commission_value"
              tooltip="Phần trăm (ví dụ: 10) hoặc số tiền cố định (ví dụ: 50000)"
              rules={[{ required: true, message: 'Vui lòng nhập giá trị hoa hồng' }]}
            >
              <InputNumber min={0} placeholder="Nhập giá trị" className="w-full" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="Trạng thái" name="status" rules={[{ required: true }]}>
          <Select>
            <Select.Option value="active">Hoạt động</Select.Option>
            <Select.Option value="inactive">Ngừng hoạt động</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item className="mb-0">
          <Space className="flex justify-end">
            <Button onClick={onCancel}>Hủy</Button>
            <Button type="primary" htmlType="submit">
              {editingProgram ? 'Cập nhật' : 'Tạo'}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AffiliateProgramFormModal;