import { useState, useCallback } from 'react';
import { 
  Card, 
  Form, 
  InputNumber, 
  Button, 
  Table, 
  Tag, 
  Statistic, 
  Row, 
  Col, 
  message, 
  Select, 
  Spin, 
  Alert,
  Typography,
  Space,
  Tooltip,
  Progress,
  Divider,
  Badge,
} from 'antd';
import { 
  DollarOutlined, 
  PercentageOutlined, 
  BugOutlined,
  CalculatorOutlined,
  ReloadOutlined,
  EyeOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { previewCommission, PreviewCommissionResponse, listRules } from '../../../service/affiliate-rules.service';
import { AffiliateProgram } from '../../../service/affiliate-programs.service';

const { Text } = Typography;

interface Props {
  affiliatePrograms: AffiliateProgram[];
}

export default function CommissionPreview({ affiliatePrograms }: Props) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewCommissionResponse | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastCalculation, setLastCalculation] = useState<Date | null>(null);

  const handlePreview = useCallback(async (values: any) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 Preview request:', values);
      
      const result = await previewCommission({
        amount: values.amount,
        maxLevels: values.maxLevels,
        programId: values.programId || null,
      });
      
      console.log('📊 Preview result:', result);
      setPreviewData(result);
      setLastCalculation(new Date());
      message.success('Tính toán thành công!');
    } catch (error: any) {
      console.error('❌ Preview error:', error);
      const errorMessage = error.message || 'Lỗi không xác định';
      setError(errorMessage);
      message.error('Lỗi khi tính toán: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDebugRules = useCallback(async () => {
    try {
      const rules = await listRules();
      console.log('🔍 All rules:', rules);
      setDebugInfo(rules);
      
      // Check if there are rules for the selected program
      const selectedProgramId = form.getFieldValue('programId');
      const relevantRules = rules.filter(rule => 
        rule.program_id === selectedProgramId || rule.program_id === null
      );
      
      console.log(`📊 Rules for program ${selectedProgramId}:`, relevantRules);
      
      if (relevantRules.length === 0) {
        message.warning('Không tìm thấy rules nào cho chương trình này! Hãy tạo rules trước.');
      } else {
        message.success(`Tìm thấy ${rules.length} rules tổng cộng, ${relevantRules.length} rules cho chương trình này`);
      }
    } catch (error: any) {
      console.error('❌ Debug error:', error);
      message.error('Lỗi khi debug: ' + error.message);
    }
  }, [form]);

  const quickCalculate = useCallback((amount: number, maxLevels: number = 5) => {
    form.setFieldsValue({ amount, maxLevels });
    handlePreview({ amount, maxLevels, programId: null });
  }, [form, handlePreview]);

  const columns = [
    {
      title: 'Cấp',
      dataIndex: 'level',
      key: 'level',
      width: 80,
      render: (level: number) => (
        <Badge 
          count={level} 
          style={{ 
            backgroundColor: level === 0 ? '#52c41a' : '#1890ff',
            fontSize: '12px'
          }} 
        />
      ),
    },
    {
      title: 'Tỷ lệ %',
      dataIndex: 'ratePercent',
      key: 'ratePercent',
      width: 100,
      render: (rate: number, record: any) => (
        <div>
          <Text strong style={{ color: record.applied ? '#52c41a' : '#999' }}>
            {rate}%
          </Text>
          {record.applied && (
            <Progress 
              percent={rate} 
              size="small" 
              showInfo={false}
              strokeColor="#52c41a"
            />
          )}
        </div>
      ),
    },
    {
      title: 'Số tiền gốc',
      dataIndex: 'baseAmount',
      key: 'baseAmount',
      width: 150,
      render: (amount: number) => (
        <Text code>{amount.toLocaleString('vi-VN')}đ</Text>
      ),
    },
    {
      title: 'Hoa hồng dự kiến',
      dataIndex: 'commissionAmount',
      key: 'commissionAmount',
      width: 150,
      render: (amount: number, record: any) => (
        <div>
          <Text 
            strong 
            style={{ 
              color: record.applied ? '#52c41a' : '#999',
              fontSize: '16px'
            }}
          >
            {amount.toLocaleString('vi-VN')}đ
          </Text>
          {record.applied && amount > 0 && (
            <div style={{ fontSize: '10px', color: '#666' }}>
              {((amount / record.baseAmount) * 100).toFixed(2)}% của đơn hàng
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Giới hạn/Đơn',
      dataIndex: 'capPerOrder',
      key: 'capPerOrder',
      width: 120,
      render: (cap: number | null, record: any) => {
        if (!cap) return <Text type="secondary">Không giới hạn</Text>;
        const isCapped = record.commissionAmount >= cap;
        return (
          <Tooltip title={isCapped ? 'Đã áp dụng giới hạn' : 'Chưa đạt giới hạn'}>
            <Text 
              code 
              style={{ color: isCapped ? '#ff4d4f' : '#52c41a' }}
            >
              {cap.toLocaleString('vi-VN')}đ
            </Text>
          </Tooltip>
        );
      },
    },
    {
      title: 'Trạng thái',
      key: 'applied',
      width: 120,
      render: (_: any, record: any) => (
        <Tag 
          color={record.applied ? 'success' : 'default'}
          icon={record.applied ? <EyeOutlined /> : <WarningOutlined />}
        >
          {record.applied ? 'Áp dụng' : 'Không áp dụng'}
        </Tag>
      ),
    },
  ];

  return (
    <div>
      {/* Error Alert */}
      {error && (
        <Alert
          message="Lỗi tính toán"
          description={error}
          type="error"
          showIcon
          closable
          onClose={() => setError(null)}
          style={{ marginBottom: 16 }}
        />
      )}

      {/* No Rules Warning */}
      {previewData && previewData.totalCommission === 0 && previewData.totalPercentage === 0 && (
        <Alert
          message="Không có hoa hồng được tính toán"
          description={
            <div>
              <p>Hệ thống không tìm thấy rules hoa hồng nào cho chương trình này. Để có hoa hồng:</p>
              <ol style={{ margin: '8px 0', paddingLeft: '20px' }}>
                <li>Chuyển sang tab <strong>"Danh sách Rules"</strong></li>
                <li>Nhấn <strong>"Tạo hàng loạt"</strong> để tạo rules tự động</li>
                <li>Hoặc tạo từng rule riêng lẻ trong form "Tạo Rule Mới"</li>
              </ol>
              <p style={{ margin: '8px 0 0 0' }}>
                <strong>Gợi ý:</strong> Tạo rules với tỷ lệ 10% cho level 0, giảm dần 1-2% cho mỗi cấp tiếp theo.
              </p>
            </div>
          }
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Card
        title={
          <Space>
            <CalculatorOutlined />
            <span>Xem trước Hoa hồng Dự kiến</span>
            {lastCalculation && (
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Cập nhật lần cuối: {lastCalculation.toLocaleTimeString()}
              </Text>
            )}
          </Space>
        }
        style={{ marginBottom: 16 }}
        extra={
          <Space>
            <Button onClick={handleDebugRules} icon={<BugOutlined />}>
              Debug Rules
            </Button>
            <Button onClick={() => form.resetFields()} icon={<ReloadOutlined />}>
              Reset
            </Button>
          </Space>
        }
      >
        <Alert
          message="Mục đích sử dụng"
          description="Tính toán thuần túy hoa hồng dự kiến cho từng cấp affiliate dựa trên số tiền và quy tắc hiện tại. Không cần kết nối với user trong database - chỉ tính toán dựa trên level và rules. Đây là công cụ để user có thể dự đoán thu nhập từ affiliate."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        {/* Quick Calculate Buttons */}
        <div style={{ marginBottom: 16 }}>
          <Text strong style={{ marginRight: 12 }}>Tính nhanh:</Text>
          <Space wrap>
            <Button size="small" onClick={() => quickCalculate(100000, 3)}>
              100K - 3 cấp
            </Button>
            <Button size="small" onClick={() => quickCalculate(500000, 5)}>
              500K - 5 cấp
            </Button>
            <Button size="small" onClick={() => quickCalculate(1000000, 7)}>
              1M - 7 cấp
            </Button>
            <Button size="small" onClick={() => quickCalculate(5000000, 10)}>
              5M - 10 cấp
            </Button>
          </Space>
        </div>

        <Form form={form} layout="vertical" onFinish={handlePreview}>
          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item
                label="Số tiền (VND)"
                name="amount"
                rules={[{ required: true, message: 'Vui lòng nhập số tiền' }]}
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  placeholder="Ví dụ: 100000"
                  prefix="₫"
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={4}>
              <Form.Item
                label="Số cấp"
                name="maxLevels"
                initialValue={5}
                rules={[{ required: true, message: 'Vui lòng nhập số cấp' }]}
              >
                <InputNumber min={0} max={20} style={{ width: '100%' }} />
              </Form.Item>
            </Col>

            <Col xs={24} sm={8}>
              <Form.Item label="Chương trình" name="programId">
                <Select
                  allowClear
                  style={{ width: '100%' }}
                  placeholder="Chọn chương trình (tùy chọn)"
                  options={[
                    { value: null, label: 'Tất cả' },
                    ...affiliatePrograms.map(program => ({
                      value: program.id,
                      label: `${program.name} (ID: ${program.id})`,
                    })),
                  ]}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={4}>
              <Form.Item label=" " style={{ marginTop: 30 }}>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading} 
                  icon={<CalculatorOutlined />}
                  style={{ width: '100%' }}
                >
                  Tính toán
                </Button>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      {debugInfo && (
        <Card title="Debug: Rules trong Database" style={{ marginBottom: 16 }}>
          <div style={{ maxHeight: 300, overflow: 'auto' }}>
            <pre style={{ fontSize: '12px', backgroundColor: '#f5f5f5', padding: '12px', borderRadius: '4px' }}>
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        </Card>
      )}

      {previewData && (
        <Spin spinning={loading}>
          <Card 
            title={
              <Space>
                <DollarOutlined />
                <span>Kết quả tính toán hoa hồng dự kiến</span>
                <Badge 
                  count={`${previewData.summary.levelsWithCommission}/${previewData.byLevel.length} cấp`} 
                  style={{ backgroundColor: '#52c41a' }} 
                />
              </Space>
            } 
            style={{ marginBottom: 16 }}
          >
            <Row gutter={16}>
              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title="Tổng hoa hồng"
                  value={previewData.totalCommission}
                  formatter={(value) => `${Number(value).toLocaleString('vi-VN')}đ`}
                  valueStyle={{ color: '#52c41a', fontSize: '20px' }}
                  prefix={<DollarOutlined />}
                />
                <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
                  {((previewData.totalCommission / previewData.inputAmount) * 100).toFixed(2)}% của đơn hàng
                </div>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title="Tổng tỷ lệ"
                  value={previewData.totalPercentage}
                  suffix="%"
                  valueStyle={{ color: '#1890ff' }}
                  prefix={<PercentageOutlined />}
                />
                <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
                  Tổng tỷ lệ tất cả cấp
                </div>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title="Cấp có hoa hồng"
                  value={previewData.summary.levelsWithCommission}
                  suffix={`/${previewData.byLevel.length}`}
                  valueStyle={{ color: '#722ed1' }}
                />
                <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
                  {((previewData.summary.levelsWithCommission / previewData.byLevel.length) * 100).toFixed(0)}% cấp có hoa hồng
                </div>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title="Tỷ lệ trung bình"
                  value={previewData.summary.averageRate.toFixed(2)}
                  suffix="%"
                  valueStyle={{ color: '#fa8c16' }}
                  prefix={<PercentageOutlined />}
                />
                <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
                  Trung bình mỗi cấp
                </div>
              </Col>
            </Row>
            
            <Divider />
            
            <Row gutter={16}>
              <Col xs={24} sm={8}>
                <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#f6ffed', borderRadius: '8px' }}>
                  <Text strong style={{ fontSize: '16px', color: '#52c41a' }}>
                    Số tiền gốc
                  </Text>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '8px' }}>
                    {previewData.inputAmount.toLocaleString('vi-VN')}đ
                  </div>
                </div>
              </Col>
              <Col xs={24} sm={8}>
                <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#e6f7ff', borderRadius: '8px' }}>
                  <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>
                    Tổng hoa hồng
                  </Text>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '8px' }}>
                    {previewData.totalCommission.toLocaleString('vi-VN')}đ
                  </div>
                </div>
              </Col>
              <Col xs={24} sm={8}>
                <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#fff7e6', borderRadius: '8px' }}>
                  <Text strong style={{ fontSize: '16px', color: '#fa8c16' }}>
                    Tỷ lệ hoa hồng
                  </Text>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '8px' }}>
                    {previewData.totalPercentage}%
                  </div>
                </div>
              </Col>
            </Row>
          </Card>

          <Card 
            title={
              <Space>
                <EyeOutlined />
                <span>Chi tiết hoa hồng dự kiến theo từng cấp</span>
              </Space>
            }
            extra={
              <Text type="secondary">
                Hiển thị {previewData.byLevel.length} cấp affiliate
              </Text>
            }
          >
            <Table
              columns={columns}
              dataSource={previewData.byLevel.map((item, index) => ({ ...item, key: index }))}
              pagination={false}
              scroll={{ x: 800 }}
              size="small"
              summary={(pageData) => {
                const totalCommission = pageData.reduce((sum, record) => sum + record.commissionAmount, 0);
                const totalPercentage = pageData.reduce((sum, record) => sum + record.ratePercent, 0);
                return (
                  <Table.Summary fixed>
                    <Table.Summary.Row style={{ backgroundColor: '#fafafa' }}>
                      <Table.Summary.Cell index={0}>
                        <Text strong style={{ fontSize: '14px' }}>Tổng cộng</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1}>
                        <Text strong style={{ fontSize: '14px', color: '#1890ff' }}>
                          {totalPercentage}%
                        </Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={2}>
                        <Text strong style={{ fontSize: '14px' }}>
                          {previewData.inputAmount.toLocaleString('vi-VN')}đ
                        </Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={3}>
                        <Text strong style={{ color: '#52c41a', fontSize: '16px' }}>
                          {totalCommission.toLocaleString('vi-VN')}đ
                        </Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={4}>
                        <Text type="secondary">-</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={5}>
                        <Badge 
                          count={`${previewData.summary.levelsWithCommission} cấp`} 
                          style={{ backgroundColor: '#52c41a' }} 
                        />
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  </Table.Summary>
                );
              }}
            />
          </Card>
        </Spin>
      )}
    </div>
  );
}
