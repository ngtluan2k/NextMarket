import React, { useState } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Table,
  Alert,
  Typography,
  Divider,
  InputNumber,
  Row,
  Col,
  Tag,
  message,
  Space,
  Collapse,
  Switch,
} from 'antd';
import {
  PlusOutlined,
  CalculatorOutlined,
  WarningOutlined,
  BulbOutlined,
  SettingOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import {
  CalculationMethod,
  PreviewRuleResponse,
  previewRuleCalculation,
} from '../../../../../service/afiliate/affiliate-rules.service';
import { AffiliateProgram } from '../../../../../service/afiliate/affiliate-programs.service';

const { Title, Text } = Typography;
const { Option } = Select;
const { Panel } = Collapse;

// WeightedCustomInput component for level-by-level weight configuration
interface WeightedCustomInputProps {
  form: any;
  numLevels: number;
}

const WeightedCustomInput: React.FC<WeightedCustomInputProps> = ({ form, numLevels }) => {
  const [levelStates, setLevelStates] = useState<{ [key: number]: { enabled: boolean; weight: number } }>({});

  // Initialize level states
  React.useEffect(() => {
    const initialStates: { [key: number]: { enabled: boolean; weight: number } } = {};
    for (let i = 1; i <= numLevels; i++) {
      initialStates[i] = { enabled: i <= 3, weight: i === 1 ? 50 : i === 2 ? 30 : i === 3 ? 20 : 0 };
    }
    setLevelStates(initialStates);
    updateFormWeights(initialStates);
  }, [numLevels]);

  const updateFormWeights = (states: { [key: number]: { enabled: boolean; weight: number } }) => {
    const weights: number[] = [];
    for (let i = 1; i <= numLevels; i++) {
      if (states[i]?.enabled && states[i]?.weight > 0) {
        weights.push(states[i].weight);
      }
    }
    console.log('WeightedCustomInput updating form weights:', weights);
    // Use setTimeout to ensure form update happens after render
    setTimeout(() => {
      form.setFieldsValue({ weights: weights });
      console.log('Form weights set, current value:', form.getFieldValue('weights'));
    }, 0);
  };

  const handleToggleLevel = (level: number, enabled: boolean) => {
    const newStates = {
      ...levelStates,
      [level]: { ...levelStates[level], enabled }
    };
    setLevelStates(newStates);
    updateFormWeights(newStates);
  };

  const handleWeightChange = (level: number, weight: number) => {
    const newStates = {
      ...levelStates,
      [level]: { ...levelStates[level], weight: weight || 0 }
    };
    setLevelStates(newStates);
    updateFormWeights(newStates);
  };

  const getTotalWeight = () => {
    return Object.values(levelStates)
      .filter(state => state.enabled)
      .reduce((sum, state) => sum + state.weight, 0);
  };

  return (
    <div style={{ border: '1px solid #d9d9d9', borderRadius: '6px', padding: '12px' }}>
      <div style={{ marginBottom: '12px' }}>
        <Text strong>Cấu hình trọng số cho từng cấp:</Text>
        <Text type="secondary" style={{ marginLeft: '8px' }}>
          (Tổng: {getTotalWeight()}%)
        </Text>
      </div>
      
      <Row gutter={[8, 8]}>
        {Array.from({ length: numLevels }, (_, index) => {
          const level = index + 1;
          const state = levelStates[level] || { enabled: false, weight: 0 };
          
          return (
            <Col span={24} key={level}>
              <Row align="middle" gutter={8}>
                <Col span={4}>
                  <Switch
                    checked={state.enabled}
                    onChange={(checked) => handleToggleLevel(level, checked)}
                    size="small"
                  />
                </Col>
                <Col span={6}>
                  <Text strong>Cấp {level}:</Text>
                </Col>
                <Col span={10}>
                  <InputNumber
                    value={state.weight}
                    onChange={(value) => handleWeightChange(level, value || 0)}
                    disabled={!state.enabled}
                    min={0}
                    max={100}
                    step={0.1}
                    addonAfter="%"
                    style={{ width: '100%' }}
                    placeholder="0"
                  />
                </Col>
                <Col span={4}>
                  {state.enabled && (
                    <Tag color={state.weight > 0 ? 'green' : 'orange'}>
                      {state.weight > 0 ? 'Có hiệu lực' : 'Chưa có trọng số'}
                    </Tag>
                  )}
                </Col>
              </Row>
            </Col>
          );
        })}
      </Row>
      
      {getTotalWeight() !== 100 && (
        <Alert
          message={`Tổng trọng số hiện tại: ${getTotalWeight()}%. Khuyến nghị tổng trọng số nên bằng 100%.`}
          type="warning"
          showIcon
          style={{ marginTop: '12px' }}
        />
      )}
    </div>
  );
};

interface CreateRuleCardWithPreviewProps {
  affiliatePrograms: AffiliateProgram[];
  onCreateRule: (values: any) => Promise<void>;
  loading: boolean;
}

interface CreateRuleFormData {
  program_id?: string;
  manual_budget?: number;
  num_levels: number;
  calculation_method: CalculationMethod;
  decay_rate?: number;
  starting_index?: number;
  weights?: number[];
  cap_order?: number;
  cap_user?: number;
  time_limit_days?: number;
  round_to?: number;
}

const CreateRuleCardWithPreview: React.FC<CreateRuleCardWithPreviewProps> = ({
  affiliatePrograms,
  onCreateRule,
  loading,
}) => {
  const [form] = Form.useForm<CreateRuleFormData>();
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewResult, setPreviewResult] = useState<PreviewRuleResponse | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<CalculationMethod>(
    CalculationMethod.GEOMETRIC_DECAY
  );
  const [showPreview, setShowPreview] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<AffiliateProgram | null>(null);

  const handlePreview = async () => {
    let request: any = {};
    try {
      const values = await form.validateFields();
      
      // Get selected program from form values
      const programId = values.program_id;
      if (!programId) {
        message.error('Vui lòng chọn chương trình affiliate');
        return;
      }

      const selectedProgram = affiliatePrograms.find(p => p.id.toString() === programId);
      if (!selectedProgram) {
        message.error('Không tìm thấy chương trình affiliate đã chọn');
        return;
      }

      // Determine which budget to use
      let totalBudget = parseFloat(selectedProgram.commission_value.toString());
      const isInvalidProgramBudget = !selectedProgram.commission_value || isNaN(totalBudget) || totalBudget < 0.01 || totalBudget > 100;
      
      if (isInvalidProgramBudget) {
        // Use manual budget if program budget is invalid
        const manualBudget = values.manual_budget;
        if (!manualBudget || isNaN(manualBudget) || manualBudget < 0.01 || manualBudget > 100) {
          message.error('Vui lòng nhập ngân sách hợp lệ từ 0.01% đến 100%');
          return;
        }
        totalBudget = manualBudget;
      }
      
      // Validate method-specific required fields
      if (values.calculation_method === CalculationMethod.GEOMETRIC_DECAY && !values.decay_rate) {
        message.error('Vui lòng nhập tỷ lệ suy giảm cho phương pháp Geometric Decay');
        return;
      }
      
      if (values.calculation_method === CalculationMethod.WEIGHTED_CUSTOM) {
        const weights = values.weights;
        console.log('Validating weights for WEIGHTED_CUSTOM:', weights);
        console.log('All form values:', values);
        console.log('Direct form getFieldValue weights:', form.getFieldValue('weights'));
        if (!weights || !Array.isArray(weights) || weights.length === 0 || weights.every(w => w === 0)) {
          message.error('Vui lòng cấu hình trọng số cho phương pháp Weighted Custom');
          return;
        }
      }
      
      setPreviewLoading(true);

      // Build request object with only defined values
      request = {
        total_budget: parseFloat(totalBudget.toString()),
        num_levels: values.num_levels,
        method: values.calculation_method,
        round_to: values.round_to || 2,
      };

      // Add method-specific fields only if they have values
      if (values.calculation_method === CalculationMethod.GEOMETRIC_DECAY && values.decay_rate !== undefined) {
        request.decay_rate = values.decay_rate;
      }
      
      if (values.calculation_method === CalculationMethod.FIBONACCI_RATIO && values.starting_index !== undefined) {
        request.starting_index = values.starting_index;
      }
      
      if (values.calculation_method === CalculationMethod.WEIGHTED_CUSTOM) {
        // Handle weights - it might be a string or array
        let weights: any = values.weights;
        if (typeof weights === 'string') {
          weights = weights.split(',').map((w: string) => parseFloat(w.trim())).filter((w: number) => !isNaN(w));
        }
        if (weights && weights.length > 0) {
          request.weights = weights;
        }
      }

      console.log('Preview request payload:', request);
      console.log('Selected program:', selectedProgram);
      console.log('Form values:', values);

      const result = await previewRuleCalculation(request);
      setPreviewResult(result);
      setShowPreview(true);
      message.success('Preview tính toán thành công!');
    } catch (error: any) {
      console.error('Full error object:', error);
      if (error.errorFields) {
        message.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      } else {
        // Show more detailed error message
        const errorMessage = error.message || 'Lỗi khi tính toán preview';
        message.error(`Lỗi API: ${errorMessage}`);
        console.error('Preview calculation error:', error);
        
        // Log the exact request that failed
        console.error('Failed request was:', request);
      }
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      
      // Get selected program from form values (same logic as preview)
      const programId = values.program_id;
      if (!programId) {
        message.error('Vui lòng chọn chương trình affiliate');
        return;
      }

      const selectedProgram = affiliatePrograms.find(p => p.id.toString() === programId);
      if (!selectedProgram) {
        message.error('Không tìm thấy chương trình affiliate đã chọn');
        return;
      }

      // Determine which budget to use (same logic as preview)
      let totalBudget = parseFloat(selectedProgram.commission_value.toString());
      const isInvalidProgramBudget = !selectedProgram.commission_value || isNaN(totalBudget) || totalBudget < 0.01 || totalBudget > 100;
      
      if (isInvalidProgramBudget) {
        const manualBudget = values.manual_budget;
        if (!manualBudget || isNaN(manualBudget) || manualBudget < 0.01 || manualBudget > 100) {
          message.error('Vui lòng nhập ngân sách hợp lệ từ 0.01% đến 100%');
          return;
        }
        totalBudget = manualBudget;
      }
      
      // Include the calculated rates from preview if available
      const ruleData = {
        ...values,
        name: `${selectedProgram.name} - Rule ${new Date().toISOString().split('T')[0]}`,
        total_budget: totalBudget,
        calculated_rates: previewResult?.levels || [],
      };

      await onCreateRule(ruleData);
      form.resetFields();
      setPreviewResult(null);
      setShowPreview(false);
      setSelectedProgram(null);
      message.success('Tạo rule thành công!');
    } catch (error: any) {
      if (error.errorFields) {
        message.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      } else {
        message.error(error.message || 'Lỗi khi tạo rule');
      }
    }
  };

  const handleProgramChange = (programId: string) => {
    const program = affiliatePrograms.find(p => p.id.toString() === programId);
    console.log('Program changed:', programId, program);
    console.log('Program commission_value:', program?.commission_value, typeof program?.commission_value);
    setSelectedProgram(program || null);
    // Reset preview when program changes
    setPreviewResult(null);
    setShowPreview(false);
  };

  const handleMethodChange = (method: CalculationMethod) => {
    setSelectedMethod(method);
    setPreviewResult(null);
    setShowPreview(false);
    // Reset method-specific fields
    form.setFieldsValue({
      decay_rate: undefined,
      starting_index: undefined,
      weights: undefined,
    });
  };

  const renderMethodSpecificFields = () => {
    switch (selectedMethod) {
      case CalculationMethod.GEOMETRIC_DECAY:
        return (
          <Col span={8}>
            <Form.Item
              name="decay_rate"
              label={
                <Space>
                  Tỷ lệ suy giảm
                  <QuestionCircleOutlined title="Tỷ lệ suy giảm giữa các cấp (0.1 - 0.95). Ví dụ: 0.6 nghĩa là cấp sau sẽ có 60% hoa hồng của cấp trước" />
                </Space>
              }
              rules={[
                { required: true, message: 'Vui lòng nhập tỷ lệ suy giảm' },
                { type: 'number', min: 0.1, max: 0.95, message: 'Tỷ lệ từ 0.1 đến 0.95' },
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="Ví dụ: 0.6"
                step={0.1}
                min={0.1}
                max={0.95}
              />
            </Form.Item>
          </Col>
        );

      case CalculationMethod.FIBONACCI_RATIO:
        return (
          <Col span={8}>
            <Form.Item
              name="starting_index"
              label={
                <Space>
                  Chỉ số bắt đầu
                  <QuestionCircleOutlined title="Chỉ số bắt đầu trong dãy Fibonacci (tùy chọn). Dãy Fibonacci: 1,1,2,3,5,8,13..." />
                </Space>
              }
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="Ví dụ: 3"
                min={0}
                max={20}
              />
            </Form.Item>
          </Col>
        );

      case CalculationMethod.WEIGHTED_CUSTOM:
        return (
          <Col span={16}>
            <Form.Item
              label={
                <Space>
                  Trọng số tùy chỉnh
                  <QuestionCircleOutlined title="Bật/tắt từng cấp và thiết lập trọng số cho mỗi cấp. Tổng trọng số sẽ được tự động chuẩn hóa thành 100%" />
                </Space>
              }
            >
              {/* Hidden form item to properly register weights field */}
              <Form.Item name="weights" hidden>
                <Input />
              </Form.Item>
              
              <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.num_levels !== currentValues.num_levels}>
                {({ getFieldValue }) => {
                  const numLevels = getFieldValue('num_levels') || 5;
                  return (
                    <WeightedCustomInput 
                      key={numLevels} // Force re-render when numLevels changes
                      form={form}
                      numLevels={numLevels}
                    />
                  );
                }}
              </Form.Item>
            </Form.Item>
          </Col>
        );

      default:
        return null;
    }
  };

  const previewColumns = [
    {
      title: 'Cấp',
      dataIndex: 'level',
      key: 'level',
      width: 80,
      render: (level: number) => (
        <Tag color="blue">Cấp {level}</Tag>
      ),
    },
    {
      title: 'Tỷ lệ hoa hồng (%)',
      dataIndex: 'rate',
      key: 'rate',
      render: (rate: number) => (
        <Text strong style={{ color: '#1890ff' }}>
          {rate.toFixed(2)}%
        </Text>
      ),
    },
    {
      title: 'Trọng số',
      dataIndex: 'weight',
      key: 'weight',
      render: (weight?: number) => weight ? weight.toString() : '-',
    },
  ];

  return (
    <Card
      title={
        <Space>
          <SettingOutlined />
          <span>Tạo Affiliate Rule Mới</span>
        </Space>
      }
      style={{ marginBottom: 16 }}
    >
      <Collapse defaultActiveKey={['create']} ghost>
        <Panel header="Thông tin Rule" key="create">
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              num_levels: 5,
              calculation_method: CalculationMethod.GEOMETRIC_DECAY,
              round_to: 2,
            }}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="program_id"
                  label={
                    <Space>
                      Chương trình Affiliate
                      <QuestionCircleOutlined title="Chọn chương trình áp dụng rule này. Ngân sách sẽ được lấy từ commission_value của chương trình." />
                    </Space>
                  }
                  rules={[{ required: true, message: 'Vui lòng chọn chương trình' }]}
                >
                  <Select
                    placeholder="Chọn chương trình affiliate"
                    onChange={handleProgramChange}
                  >
                    {affiliatePrograms.map((program) => (
                      <Option key={program.id} value={program.id.toString()}>
                        {program.name} (Budget: {parseFloat(program.commission_value.toString())}%)
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item noStyle shouldUpdate>
                  {({ getFieldValue }) => {
                    const programId = getFieldValue('program_id');
                    const currentProgram = programId ? affiliatePrograms.find(p => p.id.toString() === programId) : null;
                    const commissionValue = currentProgram ? parseFloat(currentProgram.commission_value.toString()) : 0;
                    
                    console.log('Budget field debug:', {
                      programId,
                      currentProgram,
                      commission_value_raw: currentProgram?.commission_value,
                      commissionValue,
                      affiliatePrograms: affiliatePrograms.length
                    });
                    
                    const isInvalidBudget = currentProgram && (
                      !currentProgram.commission_value || 
                      isNaN(commissionValue) || 
                      commissionValue < 0.01 || 
                      commissionValue > 100
                    );
                    
                    return (
                      <Form.Item
                        key={`budget-${programId}`} // Force re-render when program changes
                        name="manual_budget"
                        label={
                          <Space>
                            Ngân sách (%) {isInvalidBudget ? '- Nhập thủ công' : '- Từ chương trình'}
                            <QuestionCircleOutlined title={
                              isInvalidBudget
                                ? "Ngân sách chương trình không hợp lệ, vui lòng nhập thủ công (0.01% - 100%)"
                                : "Ngân sách được lấy tự động từ chương trình affiliate đã chọn"
                            } />
                          </Space>
                        }
                        rules={isInvalidBudget ? [
                          { required: true, message: 'Vui lòng nhập ngân sách' },
                          { type: 'number', min: 0.01, max: 100, message: 'Ngân sách từ 0.01% đến 100%' }
                        ] : []}
                      >
                        {isInvalidBudget ? (
                          <InputNumber
                            style={{ width: '100%' }}
                            placeholder="Nhập ngân sách từ 0.01 đến 100"
                            min={0.01}
                            max={100}
                            step={0.01}
                            addonAfter="%"
                          />
                        ) : (
                          <Input
                            value={currentProgram ? `${commissionValue}% (Debug: ${currentProgram.commission_value})` : 'Chưa chọn chương trình'}
                            disabled
                            style={{ 
                              backgroundColor: currentProgram ? '#f6ffed' : '#f5f5f5',
                              borderColor: currentProgram ? '#b7eb8f' : '#d9d9d9',
                              color: currentProgram ? '#52c41a' : '#999'
                            }}
                          />
                        )}
                      </Form.Item>
                    );
                  }}
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="num_levels"
                  label={
                    <Space>
                      Số cấp
                      <QuestionCircleOutlined title="Số cấp affiliate tối đa (1-10 cấp)" />
                    </Space>
                  }
                  rules={[
                    { required: true, message: 'Vui lòng nhập số cấp' },
                    { type: 'number', min: 1, max: 10, message: 'Số cấp từ 1 đến 10' },
                  ]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder="5"
                    min={1}
                    max={10}
                  />
                </Form.Item>
              </Col>

              <Col span={8}>
                <Form.Item
                  name="calculation_method"
                  label={
                    <Space>
                      Phương pháp tính toán
                      <QuestionCircleOutlined title="Chọn thuật toán để phân bổ hoa hồng qua các cấp" />
                    </Space>
                  }
                  rules={[{ required: true, message: 'Vui lòng chọn phương pháp tính toán' }]}
                >
                  <Select
                    placeholder="Chọn phương pháp tính toán"
                    onChange={handleMethodChange}
                  >
                    <Option value={CalculationMethod.GEOMETRIC_DECAY}>
                      Geometric Decay - Suy giảm hình học
                    </Option>
                    <Option value={CalculationMethod.FIBONACCI_RATIO}>
                      Fibonacci Ratio - Tỷ lệ Fibonacci
                    </Option>
                    <Option value={CalculationMethod.WEIGHTED_CUSTOM}>
                      Weighted Custom - Trọng số tùy chỉnh
                    </Option>
                  </Select>
                </Form.Item>
              </Col>

              <Col span={8}>
                <Form.Item
                  name="round_to"
                  label={
                    <Space>
                      Làm tròn
                      <QuestionCircleOutlined title="Số chữ số thập phân cho kết quả (0-4)" />
                    </Space>
                  }
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder="2"
                    min={0}
                    max={4}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              {renderMethodSpecificFields()}
            </Row>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="cap_order"
                  label={
                    <Space>
                      Giới hạn/Đơn hàng
                      <QuestionCircleOutlined title="Giới hạn hoa hồng tối đa cho mỗi đơn hàng (để trống = không giới hạn)" />
                    </Space>
                  }
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder="Không giới hạn"
                    min={0}
                  />
                </Form.Item>
              </Col>

              <Col span={8}>
                <Form.Item
                  name="cap_user"
                  label={
                    <Space>
                      Giới hạn/Người dùng
                      <QuestionCircleOutlined title="Giới hạn hoa hồng tối đa cho mỗi user (để trống = không giới hạn)" />
                    </Space>
                  }
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder="Không giới hạn"
                    min={0}
                  />
                </Form.Item>
              </Col>

              <Col span={8}>
                <Form.Item
                  name="time_limit_days"
                  label={
                    <Space>
                      Giới hạn thời gian (ngày)
                      <QuestionCircleOutlined title="Thời gian hiệu lực của rule tính bằng ngày (để trống = không giới hạn)" />
                    </Space>
                  }
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder="Không giới hạn"
                    min={1}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={24}>
                <Form.Item>
                  <Space>
                    <Button
                      type="default"
                      onClick={handlePreview}
                      loading={previewLoading}
                      icon={<CalculatorOutlined />}
                      size="large"
                    >
                      Xem trước
                    </Button>
                    
                    <Button
                      type="primary"
                      onClick={handleCreate}
                      loading={loading}
                      icon={<PlusOutlined />}
                      size="large"
                      disabled={!showPreview || !previewResult}
                    >
                      Tạo Rule
                    </Button>
                  </Space>
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Panel>
      </Collapse>

      {/* Preview Results */}
      {showPreview && previewResult && (
        <>
          <Divider />
          <Title level={4}>Kết quả Preview</Title>

          {/* Warnings */}
          {previewResult.warnings && previewResult.warnings.length > 0 && (
            <Alert
              message="Cảnh báo"
              description={
                <ul>
                  {previewResult.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              }
              type="warning"
              icon={<WarningOutlined />}
              style={{ marginBottom: 16 }}
            />
          )}

          {/* Suggestions */}
          {previewResult.suggestions && previewResult.suggestions.length > 0 && (
            <Alert
              message="Gợi ý"
              description={
                <ul>
                  {previewResult.suggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              }
              type="info"
              icon={<BulbOutlined />}
              style={{ marginBottom: 16 }}
            />
          )}

          {/* Summary */}
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={8}>
              <Card size="small">
                <Text type="secondary">Tổng ngân sách</Text>
                <div>
                  <Text strong style={{ fontSize: '18px', color: '#1890ff' }}>
                    {previewResult.total.toFixed(2)}%
                  </Text>
                </div>
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small">
                <Text type="secondary">Phương pháp</Text>
                <div>
                  <Tag color="green">{previewResult.method}</Tag>
                </div>
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small">
                <Text type="secondary">Số cấp</Text>
                <div>
                  <Text strong style={{ fontSize: '18px' }}>
                    {previewResult.levels.length}
                  </Text>
                </div>
              </Card>
            </Col>
          </Row>

          {/* Results Table */}
          <Table
            dataSource={previewResult.levels}
            columns={previewColumns}
            rowKey="level"
            pagination={false}
            size="small"
            bordered
          />
        </>
      )}
    </Card>
  );
};

export default CreateRuleCardWithPreview;
