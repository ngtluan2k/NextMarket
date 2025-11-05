import {
  PlusOutlined,
  ReloadOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import {
  Badge,
  Button,
  Card,
  Col,
  Collapse,
  DatePicker,
  Dropdown,
  Form,
  FormInstance,
  InputNumber,
  MenuProps,
  Modal,
  Row,
  Select,
  Space,
} from 'antd';
import {
  CalculateMethod,
  CommissionRule,
} from '../../../../../service/afiliate/affiliate-rules.service';
import { AffiliateProgram } from '../../../../../service/afiliate/affiliate-programs.service';
import { MessageInstance } from 'antd/es/message/interface';
const { Panel } = Collapse;
const { RangePicker } = DatePicker;
type FetchRulesFunction = () => Promise<void>;

interface CreateRuleProps {
  rules: CommissionRule[];
  setBulkCreateVisible: (value: boolean) => void;
  affiliatePrograms: AffiliateProgram[];
  handleCreateDefaultRules: (value: any) => void;
  fetchRules: FetchRulesFunction;
  loading: boolean;
  form: FormInstance;
  msg: MessageInstance;
  onCreate: (values: any) => Promise<void>;
  method: CalculateMethod[];
}

const CreateRuleCard = ({
  rules,
  setBulkCreateVisible,
  affiliatePrograms,
  handleCreateDefaultRules,
  fetchRules,
  loading,
  form,
  msg,
  onCreate,
  method,
}: CreateRuleProps) => {
  const menuItems: MenuProps['items'] = method.map((item) => ({
    key: item.uuid,
    label: item.name,
  }));

  const handleMenuClick: MenuProps['onClick'] = (e) => {
    console.log('Selected:', e.key);
    const selected = method.find((m) => m.uuid === e.key);
    console.log('Selected method:', selected);
  };
  return (
    <Card
      title={
        <Space>
          <SettingOutlined />
          <span>Quản trị Affiliate Rules</span>
          <Badge count={rules.length} style={{ backgroundColor: '#52c41a' }} />
        </Space>
      }
      style={{ marginBottom: 16 }}
      extra={
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setBulkCreateVisible(true)}
          >
            Tạo hàng loạt
          </Button>
          <Button
            type="default"
            icon={<SettingOutlined />}
            onClick={() => {
              const activePrograms = affiliatePrograms.filter(
                (p) => p.status === 'active'
              );
              if (activePrograms.length === 0) {
                msg.warning(
                  'Không có chương trình affiliate nào đang hoạt động'
                );
                return;
              }

              Modal.confirm({
                title: 'Tạo Rule Mặc Định',
                content: (
                  <div>
                    <p>Chọn chương trình để tạo các rule mặc định:</p>
                    <Select
                      style={{ width: '100%', marginTop: 8 }}
                      placeholder="Chọn chương trình"
                      options={activePrograms.map((program) => ({
                        value: program.id,
                        label: `${program.name} (ID: ${program.id})`,
                      }))}
                      onChange={(value) => {
                        Modal.destroyAll();
                        handleCreateDefaultRules(value);
                      }}
                    />
                  </div>
                ),
                onCancel: () => Modal.destroyAll(),
              });
            }}
          >
            Tạo Rule Mặc Định
          </Button>
          <Button
            onClick={fetchRules}
            loading={loading}
            icon={<ReloadOutlined />}
          >
            Refresh
          </Button>
        </Space>
      }
    >
      <Collapse defaultActiveKey={['create']} ghost>
        <Panel header="Tạo Rule Mới" key="create">
          <Form form={form} layout="vertical" onFinish={onCreate}>
            <Row gutter={16}>
              <Col xs={24} sm={12} md={8}>
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
              <Col xs={24} sm={12} md={4}>
                <Form.Item
                  label="Level"
                  name="level"
                  rules={[{ required: true, message: 'Bắt buộc' }]}
                  tooltip="Cấp độ affiliate (0 = người mua trực tiếp)"
                >
                  <InputNumber min={0} max={20} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={4}>
                <Form.Item
                  label="Rate %"
                  name="rate_percent"
                  rules={[{ required: true, message: 'Bắt buộc' }]}
                  tooltip="Tỷ lệ hoa hồng tính theo phần trăm"
                >
                  <InputNumber min={0} max={100} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Form.Item label="Thời gian hiệu lực" name="range">
                  <RangePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col xs={24} sm={12} md={6}>
                <Form.Item
                  label="Cap/Order"
                  name="cap_per_order"
                  tooltip="Giới hạn hoa hồng tối đa cho mỗi đơn hàng"
                >
                  <InputNumber
                    min={0}
                    style={{ width: '100%' }}
                    placeholder="Không giới hạn"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Form.Item
                  label="Cap/User"
                  name="cap_per_user"
                  tooltip="Giới hạn hoa hồng tối đa cho mỗi user"
                >
                  <InputNumber
                    min={0}
                    style={{ width: '100%' }}
                    placeholder="Không giới hạn"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Form.Item
                  label="Phương thức tính toán"
                  name="calculate_method"
                  tooltip="Phương thức tính toán hoa hồng tự động"
                >
                  <Dropdown
                    menu={{
                      items: menuItems, // Use 'items', not 'menuItems'
                      onClick: handleMenuClick,
                    }}
                    placement="bottomLeft"
                  >
                    <Button>Select Method</Button>
                  </Dropdown>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={12}>
                <Form.Item style={{ marginTop: 32 }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    icon={<PlusOutlined />}
                  >
                    Tạo Rule
                  </Button>
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Panel>
      </Collapse>
    </Card>
  );
};

export default CreateRuleCard;
