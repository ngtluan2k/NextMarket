import {
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  FormInstance,
  Input,
  Popconfirm,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import { CommissionRule, deleteRule } from '../../../../service/afiliate/affiliate-rules.service';
import { AffiliateProgram } from '../../../../service/afiliate/affiliate-programs.service';
import { MessageInstance } from 'antd/es/message/interface';
import { useMemo } from 'react';

const { Text } = Typography;

interface AffiliateRuleListProps {
  form : FormInstance;
  rules: CommissionRule[];
  filteredGroupedRules: Record<string, CommissionRule[]>;
  affiliatePrograms: AffiliateProgram[];
  viewMode: string;
  searchText: string;
  selectedProgramId?: number | null;
  loading: boolean;
  msg: MessageInstance;
  setLoading: (value: boolean) => void;
  setViewMode: React.Dispatch<React.SetStateAction<"table" | "grouped">>;
  setSearchText: (value: string) => void;
  setSelectedProgramId: (value: number | null) => void;
  handleCreateDefaultRules: (value: number) => void;
  handleEditRule: (value: any) => void;
  handleCopyRule: (value: any) => void;
  fetchRules: () => Promise<void>;
}


const AffiliateRuleList = ({
  form,
  rules,
  filteredGroupedRules,
  affiliatePrograms,
  viewMode,
  searchText,
  selectedProgramId,
  loading,
  msg,
  setLoading,
  setViewMode,
  setSearchText,
  setSelectedProgramId,
  handleCreateDefaultRules,
  handleEditRule,
  handleCopyRule,
  fetchRules
}: AffiliateRuleListProps) => {
  
  
  // Transform rules to flat structure for table display
  const flattenedRules = useMemo(() => {
    console.log('🔍 [AffiliateRuleList] Processing rules for flattening:', rules.length);
    const flattened: any[] = [];
    
    rules.forEach((rule, ruleIndex) => {
      console.log(`📋 [Rule ${ruleIndex}] Processing rule:`, {
        id: rule.id,
        name: rule.name,
        calculated_rates: rule.calculated_rates,
        calculated_rates_length: rule.calculated_rates?.length || 0
      });
      
      // Check if calculated_rates exists and is an array
      if (!rule.calculated_rates || !Array.isArray(rule.calculated_rates)) {
        console.warn(`⚠️ [Rule ${ruleIndex}] No calculated_rates or not an array:`, rule.calculated_rates);
        // Create a fallback entry for rules without calculated_rates
        flattened.push({
          ...rule,
          level: 'N/A',
          rate_percent: 'N/A',
          weight: 'N/A',
          unique_key: `${rule.id}-fallback`,
          _hasError: true
        });
        return;
      }
      
      // Process each calculated rate
      rule.calculated_rates.forEach((rate, rateIndex) => {
        console.log(`  📊 [Rate ${rateIndex}] Processing rate:`, rate);
        
        const flattenedItem = {
          ...rule,
          level: rate.level,
          rate_percent: rate.rate,
          weight: rate.weight,
          unique_key: `${rule.id}-${rate.level}`,
          _rateIndex: rateIndex
        };
        
        console.log(`  ✅ [Rate ${rateIndex}] Flattened item:`, flattenedItem);
        flattened.push(flattenedItem);
      });
    });
    
    console.log('📊 [AffiliateRuleList] Final flattened rules:', flattened.length, flattened);
    return flattened;
  }, [rules]);

  const columns = useMemo(
    () => [
      {
        title: 'Rule Name',
        dataIndex: 'name',
        key: 'name',
        width: 200,
        sorter: (a: any, b: any) => a.name.localeCompare(b.name),
      },
      {
        title: 'ID',
        dataIndex: 'id',
        key: 'id',
        width: 120,
        render: (id: string) => (
          <Text code style={{ fontSize: '11px' }}>
            {id.substring(0, 8)}...
          </Text>
        ),
      },
      {
        title: 'Chương trình',
        dataIndex: 'program_id',
        key: 'program_id',
        width: 150,
        filters: [
          { text: 'Tất cả chương trình', value: null },
          ...affiliatePrograms.map((p) => ({ text: p.name, value: p.id.toString() })),
        ],
        onFilter: (value: any, record: any) => {
          if (value === null) return record.program_id === null;
          return record.program_id === value;
        },
        render: (v: string | null) => {
          if (!v) return <Badge status="default" text="Tất cả" />;
          const program = affiliatePrograms.find((p) => p.id.toString() === v);
          return program ? (
            <Badge
              status={program.status === 'active' ? 'success' : 'error'}
              text={`${program.name} (ID: ${v})`}
            />
          ) : (
            <Badge status="warning" text={`ID: ${v}`} />
          );
        },
      },
      {
        title: 'Cấp',
        dataIndex: 'level',
        key: 'level',
        width: 80,
        sorter: (a: any, b: any) => a.level - b.level,
        render: (level: number) => (
          <Badge
            count={level}
            style={{ backgroundColor: level === 0 ? '#52c41a' : '#1890ff' }}
          />
        ),
      },
      {
        title: 'Phần trăm %',
        dataIndex: 'rate_percent',
        key: 'rate_percent',
        width: 100,
        sorter: (a: any, b: any) => {
          const aRate = typeof a.rate_percent === 'string' ? parseFloat(a.rate_percent) : a.rate_percent;
          const bRate = typeof b.rate_percent === 'string' ? parseFloat(b.rate_percent) : b.rate_percent;
          return (isNaN(aRate) ? 0 : aRate) - (isNaN(bRate) ? 0 : bRate);
        },
        render: (rate: string | number, record: any) => {
          console.log('📊 [Rate Column] Rendering rate:', { rate, record_id: record.id, record_level: record.level });
          
          // Handle error cases
          if (record._hasError || rate === 'N/A') {
            return (
              <Tag color="red">
                Lỗi dữ liệu
              </Tag>
            );
          }
          
          // Handle normal cases
          const numRate = typeof rate === 'string' ? parseFloat(rate) : rate;
          if (isNaN(numRate)) {
            console.warn('⚠️ [Rate Column] Invalid rate value:', rate);
            return (
              <Tag color="orange">
                Không hợp lệ
              </Tag>
            );
          }
          
          return (
            <Text strong style={{ color: numRate > 0 ? '#52c41a' : '#999' }}>
              {numRate.toFixed(2)}%
            </Text>
          );
        },
      },
      {
        title: 'Trạng thái',
        key: 'status',
        width: 120,
        render: (_: any, record: any) => {
          return (
            <div>
              <Badge
                status={record.is_active ? 'success' : 'error'}
                text={record.is_active ? 'Hoạt động' : 'Tạm dừng'}
              />
              {record.time_limit_days && (
                <div style={{ fontSize: '12px', color: '#666' }}>
                  Giới hạn: {record.time_limit_days} ngày
                </div>
              )}
            </div>
          );
        },
      },
      {
        title: 'Giới hạn',
        key: 'caps',
        width: 150,
        render: (_: any, record: any) => {
          const orderCap = record.cap_order;
          const userCap = record.cap_user;

          return (
            <div>
              {orderCap && (
                <div style={{ fontSize: '12px' }}>
                  <Text type="secondary">Order:</Text>{' '}
                  {orderCap.toLocaleString()}
                </div>
              )}
              {userCap && (
                <div style={{ fontSize: '12px' }}>
                  <Text type="secondary">User:</Text> {userCap.toLocaleString()}
                </div>
              )}
              {!orderCap && !userCap && (
                <Text type="secondary">Không giới hạn</Text>
              )}
            </div>
          );
        },
      },
      {
        title: 'Hành động',
        key: 'actions',
        width: 200,
        render: (_: any, record: any) => (
          <Space size="small">
            <Tooltip title="Chỉnh sửa">
              <Button
                type="primary"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEditRule(record)}
              />
            </Tooltip>
            <Tooltip title="Copy để tạo mới">
              <Button
                size="small"
                icon={<CopyOutlined />}
                onClick={() => handleCopyRule(record)}
              />
            </Tooltip>
            <Popconfirm
              title="Xác nhận xóa"
              description="Bạn có chắc chắn muốn xóa rule này?"
              icon={<ExclamationCircleOutlined style={{ color: 'red' }} />}
              onConfirm={async () => {
                setLoading(true);
                try {
                  await deleteRule(record.id);
                  msg.success('Đã xoá');
                  fetchRules();
                } catch (e: any) {
                  msg.error(e?.message || 'Xoá thất bại');
                } finally {
                  setLoading(false);
                }
              }}
            >
              <Tooltip title="Xóa">
                <Button danger size="small" icon={<DeleteOutlined />} />
              </Tooltip>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [affiliatePrograms, handleEditRule, handleCopyRule, fetchRules, msg]
  );
  
  
  return (
    <Card>
      <Card
        size="small"
        style={{ marginBottom: 16, background: '#fafafa' }}
        title={
          <Space>
            <Text strong>Bộ lọc và Tìm kiếm</Text>
            <Badge
              count={Object.keys(filteredGroupedRules).reduce(
                (sum, key) => sum + filteredGroupedRules[key].length,
                0
              )}
            />
          </Space>
        }
        extra={
          <Space>
            <Button
              size="small"
              type={viewMode === 'grouped' ? 'primary' : 'default'}
              onClick={() => setViewMode('grouped')}
            >
              Nhóm theo Program
            </Button>
            <Button
              size="small"
              type={viewMode === 'table' ? 'primary' : 'default'}
              onClick={() => setViewMode('table')}
            >
              Bảng đơn giản
            </Button>
          </Space>
        }
      >
        <Row gutter={16}>
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="🔍 Tìm kiếm theo level, rate, hoặc ID..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              prefix={<SearchOutlined />}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Select
              placeholder="Lọc theo Program"
              value={selectedProgramId}
              onChange={setSelectedProgramId}
              allowClear
              style={{ width: '100%' }}
            >
              <Select.Option value={-1}>
                📍 Tất cả chương trình (Default)
              </Select.Option>
              {affiliatePrograms.map((program) => (
                <Select.Option key={program.id} value={program.id}>
                  {program.status === 'active' ? '🟢' : '🔴'} {program.name}{' '}
                  (ID: {program.id})
                </Select.Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Button
              onClick={() => {
                setSearchText('');
                setSelectedProgramId(null);
              }}
              icon={<ReloadOutlined />}
            >
              Reset bộ lọc
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Grouped View */}
      {viewMode === 'grouped' ? (
        <div>
          {Object.keys(filteredGroupedRules).length === 0 ? (
            <Alert
              message="Không tìm thấy rules nào"
              description="Hãy thử thay đổi bộ lọc hoặc tạo rules mới"
              type="info"
              showIcon
            />
          ) : (
            Object.keys(filteredGroupedRules).map((key) => {
              const programId =
                key === 'default'
                  ? null
                  : parseInt(key.replace('program-', ''));
              const program = programId
                ? affiliatePrograms.find((p) => p.id === programId)
                : null;
              const rulesInGroup = filteredGroupedRules[key];

              return (
                <Card
                  key={key}
                  title={
                    <Space>
                      {program ? (
                        <Badge
                          status={
                            program.status === 'active' ? 'success' : 'error'
                          }
                          text={
                            <Text strong>
                              {program.name} (ID: {program.id})
                            </Text>
                          }
                        />
                      ) : (
                        <Badge
                          status="default"
                          text={
                            <Text strong>📍 Tất cả chương trình (Default)</Text>
                          }
                        />
                      )}
                      <Badge
                        count={rulesInGroup.length}
                        style={{ backgroundColor: '#1890ff' }}
                      />
                    </Space>
                  }
                  style={{ marginBottom: 16 }}
                  extra={
                    <Space>
                      <Button
                        size="small"
                        icon={<PlusOutlined />}
                        onClick={() => {
                          form.setFieldsValue({
                            program_id: programId,
                          });
                        }}
                      >
                        Thêm rule cho chương trình này
                      </Button>
                      {program && (
                        <Button
                          size="small"
                          type="primary"
                          icon={<SettingOutlined />}
                          onClick={() => handleCreateDefaultRules(program.id)}
                        >
                          Tạo rules mặc định
                        </Button>
                      )}
                    </Space>
                  }
                >
                  <Table
                    rowKey={(r: any) => String(r.id)}
                    dataSource={rulesInGroup}
                    columns={[
                      {
                        title: 'Rule Name',
                        dataIndex: 'name',
                        width: 200,
                        render: (name: string) => (
                          <Text strong>{name}</Text>
                        ),
                      },
                      {
                        title: 'Method',
                        dataIndex: 'calculation_method',
                        width: 120,
                        render: (method: string) => (
                          <Tag color="blue">{method}</Tag>
                        ),
                      },
                      {
                        title: 'Levels & Rates',
                        width: 200,
                        render: (_: any, record: CommissionRule) => (
                          <div>
                            {record.calculated_rates.map((rate, idx) => (
                              <div key={idx} style={{ fontSize: '12px', marginBottom: '2px' }}>
                                <Badge count={rate.level} size="small" style={{ marginRight: '8px' }} />
                                <Text strong style={{ color: '#52c41a' }}>
                                  {rate.rate.toFixed(2)}%
                                </Text>
                              </div>
                            ))}
                          </div>
                        ),
                      },
                      {
                        title: 'Caps',
                        width: 120,
                        render: (_: any, record: CommissionRule) => {
                          const orderCap = record.cap_order;
                          const userCap = record.cap_user;
                          return (
                            <div>
                              {orderCap && (
                                <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>
                                  Order: {orderCap.toLocaleString()}
                                </Text>
                              )}
                              {userCap && (
                                <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>
                                  User: {userCap.toLocaleString()}
                                </Text>
                              )}
                              {!orderCap && !userCap && (
                                <Text type="secondary">Không giới hạn</Text>
                              )}
                            </div>
                          );
                        },
                      },
                      {
                        title: 'Hành động',
                        width: 150,
                        render: (_: any, record: CommissionRule) => (
                          <Space size="small">
                            <Button
                              type="primary"
                              size="small"
                              icon={<EditOutlined />}
                              onClick={() => handleEditRule(record)}
                            />
                            <Button
                              size="small"
                              icon={<CopyOutlined />}
                              onClick={() => handleCopyRule(record)}
                            />
                            <Popconfirm
                              title="Xóa rule này?"
                              onConfirm={async () => {
                                setLoading(true);
                                try {
                                  await deleteRule(record.id);
                                  msg.success('Đã xoá');
                                  fetchRules();
                                } catch (e: any) {
                                  msg.error(e?.message || 'Xoá thất bại');
                                } finally {
                                  setLoading(false);
                                }
                              }}
                            >
                              <Button
                                danger
                                size="small"
                                icon={<DeleteOutlined />}
                              />
                            </Popconfirm>
                          </Space>
                        ),
                      },
                    ]}
                    pagination={false}
                    size="small"
                  />
                </Card>
              );
            })
          )}
        </div>
      ) : (
        <Table
          rowKey={(r) => (r as any).unique_key}
          loading={loading}
          dataSource={flattenedRules}
          columns={columns as any}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} levels`,
          }}
          scroll={{ x: 1200 }}
        />
      )}
    </Card>
  );
};

export default AffiliateRuleList;
