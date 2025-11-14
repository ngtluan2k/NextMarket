import {
  Alert,
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

interface BulkFormProps {
  bulkCreateVisible: boolean;
  onBulkCreate: (value: any) => Promise<void>;
  setBulkCreateVisible: (value: boolean) => void;
  bulkForm: FormInstance;
  affiliatePrograms: AffiliateProgram[];
  loading: boolean;
}
const { RangePicker } = DatePicker;

const ModalBulkCreateRules = ({
  bulkCreateVisible,
  setBulkCreateVisible,
  bulkForm,
  onBulkCreate,
  affiliatePrograms,
  loading,
}: BulkFormProps) => {
  return (
    <Modal
      title="Tạo Rules Hàng Loạt"
      open={bulkCreateVisible}
      onCancel={() => {
        setBulkCreateVisible(false);
        bulkForm.resetFields();
      }}
      footer={null}
      width={600}
    >
      <Alert
        message="Tạo nhiều rules cùng lúc"
        description="Hệ thống sẽ tự động tạo rules từ level 0 đến level được chỉ định với tỷ lệ giảm dần."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />
      <Form form={bulkForm} layout="vertical" onFinish={onBulkCreate}>
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
          <Col xs={24} sm={12}>
            <Form.Item
              label="Số cấp tối đa"
              name="maxLevels"
              rules={[{ required: true, message: 'Bắt buộc' }]}
              initialValue={5}
            >
              <InputNumber min={1} max={20} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              label="Tỷ lệ cơ bản (%)"
              name="baseRate"
              rules={[{ required: true, message: 'Bắt buộc' }]}
              initialValue={10}
              tooltip="Tỷ lệ cho level 0"
            >
              <InputNumber min={0} max={100} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              label="Giảm dần mỗi cấp (%)"
              name="rateDecrease"
              rules={[{ required: true, message: 'Bắt buộc' }]}
              initialValue={1}
              tooltip="Số phần trăm giảm cho mỗi cấp tiếp theo"
            >
              <InputNumber min={0} max={10} style={{ width: '100%' }} />
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
                setBulkCreateVisible(false);
                bulkForm.resetFields();
              }}
            >
              Hủy
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              Tạo Hàng Loạt
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ModalBulkCreateRules;
