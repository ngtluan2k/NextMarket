import {
  Button,
  Col,
  DatePicker,
  Form,
  FormInstance,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
} from 'antd';
import { AffiliateProgram } from '../../../../service/afiliate/affiliate-programs.service';
import { CommissionRule } from '../../../../service/afiliate/affiliate-rules.service';
const { RangePicker } = DatePicker;

interface EditModalProps {
  isModalVisible: boolean;
  setIsModalVisible: (value: boolean) => void;
  loading: boolean;
  setEditingRule: React.Dispatch<React.SetStateAction<CommissionRule | null>>;
  editForm: FormInstance;
  onEdit: (values: any) => Promise<void>;
  affiliatePrograms: AffiliateProgram[];
}
const ModalEditRules = ({
  isModalVisible,
  setIsModalVisible,
  setEditingRule,
  editForm,
  onEdit,
  affiliatePrograms,
  loading,
}: EditModalProps) => {
  return (
    <Modal
      title="Chỉnh sửa Rule"
      open={isModalVisible}
      onCancel={() => {
        setIsModalVisible(false);
        setEditingRule(null);
        editForm.resetFields();
      }}
      footer={null}
      width={800}
    >
      <Form form={editForm} layout="vertical" onFinish={onEdit}>
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              label="Chương trình"
              name="program_id"
              tooltip="Để trống để áp dụng cho tất cả chương trình"
            >
              <Select
                placeholder="Chọn chương trình affiliate"
                allowClear
                options={[
                  { value: null, label: 'Tất cả chương trình' },
                  ...affiliatePrograms.map((program) => ({
                    value: program.id,
                    label: `${program.name} (ID: ${program.id})`,
                  })),
                ]}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={6}>
            <Form.Item
              label="Level"
              name="level"
              rules={[{ required: true, message: 'Bắt buộc' }]}
            >
              <InputNumber min={0} max={20} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={6}>
            <Form.Item
              label="Rate %"
              name="rate_percent"
              rules={[{ required: true, message: 'Bắt buộc' }]}
            >
              <InputNumber min={0} max={100} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item label="Thời gian hiệu lực" name="range">
              <RangePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={6}>
            <Form.Item label="Cap/Order" name="cap_per_order">
              <InputNumber
                min={0}
                style={{ width: '100%' }}
                placeholder="Không giới hạn"
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={6}>
            <Form.Item label="Cap/User" name="cap_per_user">
              <InputNumber
                min={0}
                style={{ width: '100%' }}
                placeholder="Không giới hạn"
              />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item style={{ marginTop: 24, textAlign: 'right' }}>
          <Space>
            <Button
              onClick={() => {
                setIsModalVisible(false);
                setEditingRule(null);
                editForm.resetFields();
              }}
            >
              Hủy
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              Cập nhật
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ModalEditRules;
