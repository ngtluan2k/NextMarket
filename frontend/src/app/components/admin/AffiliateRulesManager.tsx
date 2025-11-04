import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Card,
  Form,
  InputNumber,
  DatePicker,
  Select,
  Button,
  Table,
  Space,
  message,
  Tabs,
  Input,
  Row,
  Col,
  Tooltip,
  Modal,
  Popconfirm,
  Badge,
  Alert,
  Typography,
  Collapse,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SettingOutlined,
  InfoCircleOutlined,
  CopyOutlined,
  ExclamationCircleOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import {
  fetchDescendants,
  fetchAncestors,
  fetchAffiliateTreeWithCommissions,
} from '../../../service/affiliate-tree.service';
import dayjs from 'dayjs';
import {
  listRules,
  createRule,
  deleteRule,
  updateRule,
  createDefaultRulesForProgram,
  CommissionRule,
} from '../../../service/affiliate-rules.service';
import { getAllAffiliatePrograms, AffiliateProgram } from '../../../service/affiliate-programs.service';
import { findUserIdByEmail, getUserById, User } from '../../../service/user-helper.service';
import AffiliateTree from './AffiliateTree';
import UserInfoCard from './UserInfoCard';
import CommissionPreview from './CommissionPreview';

const { RangePicker } = DatePicker;
const { Text } = Typography;
const { Panel } = Collapse;

export default function AffiliateRulesManager() {
  const [loading, setLoading] = useState(false);
  const [rules, setRules] = useState<CommissionRule[]>([]);
  const [affiliatePrograms, setAffiliatePrograms] = useState<AffiliateProgram[]>([]);
  const [msg, ctx] = message.useMessage();
  const [editingRule, setEditingRule] = useState<CommissionRule | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [bulkCreateVisible, setBulkCreateVisible] = useState(false);
  
  // New UI states
  const [selectedProgramId, setSelectedProgramId] = useState<number | null>(null);
  const [searchText, setSearchText] = useState('');
  const [viewMode, setViewMode] = useState<'grouped' | 'table'>('grouped');

  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [bulkForm] = Form.useForm();

  // Grouped rules by program
  const groupedRules = useMemo(() => {
    const grouped: Record<string, CommissionRule[]> = {};
    
    // Add default group for rules without program_id
    grouped['default'] = [];
    
    rules.forEach(rule => {
      const key = rule.program_id ? `program-${rule.program_id}` : 'default';
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(rule);
    });
    
    // Sort rules within each group by level
    Object.keys(grouped).forEach(key => {
      grouped[key].sort((a, b) => a.level - b.level);
    });
    
    return grouped;
  }, [rules]);

  // Filtered and grouped rules based on search and program selection
  const filteredGroupedRules = useMemo(() => {
    const filtered = { ...groupedRules };
    
    // Apply program filter
    if (selectedProgramId !== null) {
      if (selectedProgramId === -1) {
        // Show only default rules
        Object.keys(filtered).forEach(key => {
          if (key.startsWith('program-')) {
            delete filtered[key];
          }
        });
      } else {
        // Show only selected program
        Object.keys(filtered).forEach(key => {
          if (key !== `program-${selectedProgramId}` && key !== 'default') {
            delete filtered[key];
          }
        });
      }
    }
    
    // Apply search filter
    if (searchText.trim()) {
      const search = searchText.toLowerCase();
      Object.keys(filtered).forEach(key => {
        filtered[key] = filtered[key].filter(rule => {
          const rate = typeof rule.rate_percent === 'string' ? rule.rate_percent : String(rule.rate_percent);
          return (
            String(rule.level).includes(search) ||
            rate.includes(search) ||
            String(rule.id).includes(search)
          );
        });
      });
    }
    
    // Remove empty groups
    Object.keys(filtered).forEach(key => {
      if (filtered[key].length === 0) {
        delete filtered[key];
      }
    });
    
    return filtered;
  }, [groupedRules, selectedProgramId, searchText]);

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listRules();
      setRules(data || []);
    } catch (e: any) {
      msg.error(e?.message || 'Tải danh sách rule thất bại');
    } finally {
      setLoading(false);
    }
  }, [msg]);

  const fetchAffiliatePrograms = useCallback(async () => {
    try {
      console.log('🔄 Loading affiliate programs...');
      const programs = await getAllAffiliatePrograms();
      setAffiliatePrograms(programs || []);
      console.log(`✅ Loaded ${programs.length} affiliate programs`);
    } catch (e: any) {
      console.error('❌ Error loading affiliate programs:', e);
      msg.error(e?.message || 'Tải danh sách chương trình affiliate thất bại');
    }
  }, [msg]);

  const handleCreateDefaultRules = useCallback(async (programId: number) => {
    setLoading(true);
    try {
      const result = await createDefaultRulesForProgram(programId);
      msg.success(result.message || 'Đã tạo các rule mặc định thành công');
      fetchRules();
    } catch (e: any) {
      msg.error(e?.message || 'Tạo rule mặc định thất bại');
    } finally {
      setLoading(false);
    }
  }, [msg, fetchRules]);

  useEffect(() => {
    fetchRules();
    fetchAffiliatePrograms();
  }, [fetchRules, fetchAffiliatePrograms]);

  const onCreate = useCallback(
    async (values: any) => {
      setLoading(true);
      try {
        const payload: any = {
          program_id: values.program_id ?? null,
          level: values.level,
          rate_percent: values.rate_percent,
          active_from: values.range?.[0] ? values.range[0].toISOString() : null,
          active_to: values.range?.[1] ? values.range[1].toISOString() : null,
          cap_per_order: values.cap_per_order ?? null,
          cap_per_user: values.cap_per_user ?? null,
        };
        await createRule(payload);
        msg.success('Tạo rule thành công');
        form.resetFields();
        fetchRules();
      } catch (e: any) {
        msg.error(e?.message || 'Tạo rule thất bại');
      } finally {
        setLoading(false);
      }
    },
    [fetchRules, form, msg]
  );

  const onEdit = useCallback(
    async (values: any) => {
      if (!editingRule) return;
      
      setLoading(true);
      try {
        const payload: any = {
          program_id: values.program_id ?? null,
          level: values.level,
          rate_percent: values.rate_percent,
          active_from: values.range?.[0] ? values.range[0].toISOString() : null,
          active_to: values.range?.[1] ? values.range[1].toISOString() : null,
          cap_per_order: values.cap_per_order ?? null,
          cap_per_user: values.cap_per_user ?? null,
        };
        await updateRule(editingRule.id, payload);
        msg.success('Cập nhật rule thành công');
        editForm.resetFields();
        setEditingRule(null);
        setIsModalVisible(false);
        fetchRules();
      } catch (e: any) {
        msg.error(e?.message || 'Cập nhật rule thất bại');
      } finally {
        setLoading(false);
      }
    },
    [editingRule, fetchRules, editForm, msg]
  );

  const onBulkCreate = useCallback(
    async (values: any) => {
      setLoading(true);
      try {
        const { program_id, baseRate, maxLevels, rateDecrease, range, cap_per_order, cap_per_user } = values;
        
        const promises = [];
        for (let level = 0; level <= maxLevels; level++) {
          const rate = Math.max(0, baseRate - (level * rateDecrease));
          if (rate > 0) {
            const payload = {
              program_id: program_id ?? null,
              level,
              rate_percent: rate,
              active_from: range?.[0] ? range[0].toISOString() : null,
              active_to: range?.[1] ? range[1].toISOString() : null,
              cap_per_order: cap_per_order ?? null,
              cap_per_user: cap_per_user ?? null,
            };
            promises.push(createRule(payload));
          }
        }
        
        await Promise.all(promises);
        msg.success(`Tạo thành công ${promises.length} rules`);
        bulkForm.resetFields();
        setBulkCreateVisible(false);
        fetchRules();
      } catch (e: any) {
        msg.error(e?.message || 'Tạo bulk rules thất bại');
      } finally {
        setLoading(false);
      }
    },
    [fetchRules, bulkForm, msg]
  );

  const handleEditRule = useCallback((rule: CommissionRule) => {
    setEditingRule(rule);
    const rate = typeof rule.rate_percent === 'string' ? parseFloat(rule.rate_percent) : rule.rate_percent;
    editForm.setFieldsValue({
      program_id: rule.program_id ?? undefined,
      level: rule.level,
      rate_percent: rate,
      range: [
        rule.active_from ? dayjs(rule.active_from) : null,
        rule.active_to ? dayjs(rule.active_to) : null,
      ].filter(Boolean),
      cap_per_order: rule.cap_per_order ? parseFloat(rule.cap_per_order) : undefined,
      cap_per_user: rule.cap_per_user ? parseFloat(rule.cap_per_user) : undefined,
    });
    setIsModalVisible(true);
  }, [editForm]);

  const handleCopyRule = useCallback((rule: CommissionRule) => {
    const rate = typeof rule.rate_percent === 'string' ? parseFloat(rule.rate_percent) : rule.rate_percent;
    form.setFieldsValue({
      program_id: rule.program_id ?? undefined,
      level: rule.level,
      rate_percent: rate,
      range: [
        rule.active_from ? dayjs(rule.active_from) : null,
        rule.active_to ? rule.active_to ? dayjs(rule.active_to) : null : null,
      ].filter(Boolean),
      cap_per_order: rule.cap_per_order ? parseFloat(rule.cap_per_order) : undefined,
      cap_per_user: rule.cap_per_user ? parseFloat(rule.cap_per_user) : undefined,
    });
    msg.success('Đã copy thông tin rule vào form tạo mới');
  }, [form, msg]);

  const columns = useMemo(
    () => [
      { 
        title: 'ID', 
        dataIndex: 'id', 
        key: 'id', 
        width: 80,
        sorter: (a: CommissionRule, b: CommissionRule) => a.id - b.id,
      },
      {
        title: 'Chương trình',
        dataIndex: 'program_id',
        key: 'program_id',
        width: 150,
        filters: [
          { text: 'Tất cả chương trình', value: null },
          ...affiliatePrograms.map(p => ({ text: p.name, value: p.id }))
        ],
        onFilter: (value: any, record: CommissionRule) => {
          if (value === null) return record.program_id === null;
          return record.program_id === value;
        },
        render: (v: number | null) => {
          if (!v) return <Badge status="default" text="Tất cả" />;
          const program = affiliatePrograms.find(p => p.id === v);
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
        sorter: (a: CommissionRule, b: CommissionRule) => a.level - b.level,
        render: (level: number) => (
          <Badge count={level} style={{ backgroundColor: level === 0 ? '#52c41a' : '#1890ff' }} />
        ),
      },
      {
        title: 'Phần trăm %',
        dataIndex: 'rate_percent',
        key: 'rate_percent',
        width: 100,
        sorter: (a: CommissionRule, b: CommissionRule) => {
          const aRate = typeof a.rate_percent === 'string' ? parseFloat(a.rate_percent) : a.rate_percent;
          const bRate = typeof b.rate_percent === 'string' ? parseFloat(b.rate_percent) : b.rate_percent;
          return aRate - bRate;
        },
        render: (rate: string | number) => {
          const numRate = typeof rate === 'string' ? parseFloat(rate) : rate;
          return (
            <Text strong style={{ color: numRate > 0 ? '#52c41a' : '#999' }}>
              {numRate}%
            </Text>
          );
        },
      },
      {
        title: 'Thời gian hiệu lực',
        key: 'active_period',
        width: 200,
        render: (_: any, record: CommissionRule) => {
          const from = record.active_from ? dayjs(record.active_from).format('DD/MM/YYYY') : 'Không giới hạn';
          const to = record.active_to ? dayjs(record.active_to).format('DD/MM/YYYY') : 'Không giới hạn';
          const now = dayjs();
          const isActive = (!record.active_from || dayjs(record.active_from).isBefore(now)) &&
                         (!record.active_to || dayjs(record.active_to).isAfter(now));
          
          return (
            <div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                Từ: {from}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                Đến: {to}
              </div>
              <Badge 
                status={isActive ? 'success' : 'error'} 
                text={isActive ? 'Đang hiệu lực' : 'Hết hiệu lực'} 
              />
            </div>
          );
        },
      },
      {
        title: 'Giới hạn',
        key: 'caps',
        width: 150,
        render: (_: any, record: CommissionRule) => {
          const orderCap = record.cap_per_order ? parseFloat(record.cap_per_order) : null;
          const userCap = record.cap_per_user ? parseFloat(record.cap_per_user) : null;
          
          return (
            <div>
              {orderCap && (
                <div style={{ fontSize: '12px' }}>
                  <Text type="secondary">Order:</Text> {orderCap.toLocaleString()}đ
                </div>
              )}
              {userCap && (
                <div style={{ fontSize: '12px' }}>
                  <Text type="secondary">User:</Text> {userCap.toLocaleString()}đ
                </div>
              )}
              {!orderCap && !userCap && <Text type="secondary">Không giới hạn</Text>}
            </div>
          );
        },
      },
      {
        title: 'Hành động',
        key: 'actions',
        width: 200,
        render: (_: any, record: CommissionRule) => (
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
                <Button 
                  danger 
                  size="small" 
                  icon={<DeleteOutlined />}
                />
              </Tooltip>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [affiliatePrograms, handleEditRule, handleCopyRule, fetchRules, msg]
  );

  // Tree tab với commission info
  const [treeUserEmail, setTreeUserEmail] = useState<string>('');
  const [treeData, setTreeData] = useState<any[]>([]);
  const [commissionData, setCommissionData] = useState<any>(null);
  const [showCommissions, setShowCommissions] = useState<boolean>(true);
  const [treeLoading, setTreeLoading] = useState<boolean>(false);
  
  // User info card state
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedUserCommission, setSelectedUserCommission] = useState<any>(null);
  const [userInfoLoading, setUserInfoLoading] = useState<boolean>(false);
  

  // Handle user selection from tree
  const handleUserSelect = useCallback(async (userId: number, commissionInfo?: any) => {
    console.log(`🔍 User selected: ${userId}`, commissionInfo);
    
    setUserInfoLoading(true);
    try {
      // Luôn gọi API để lấy thông tin profile đầy đủ
      const user = await getUserById(userId);
      setSelectedUser(user);
      setSelectedUserCommission(commissionInfo);
      console.log(`✅ Loaded user info:`, user);
    } catch (error: any) {
      console.error(`❌ Error loading user info:`, error);
      msg.error(error?.message || 'Không thể tải thông tin user');
      // Reset selected user nếu có lỗi
      setSelectedUser(null);
      setSelectedUserCommission(null);
    } finally {
      setUserInfoLoading(false);
    }
  }, [msg]);

  // Update loadTree to use handleUserSelect
  const loadTreeWithUserSelect = useCallback(async () => {
    if (!treeUserEmail.trim()) {
      setTreeData([]);
      setCommissionData(null);
      return;
    }
    
    setTreeLoading(true);
    try {
      console.log(`🔍 Converting email to user ID: ${treeUserEmail}`);
      
      // Tìm user_id từ email
      const userId = await findUserIdByEmail(treeUserEmail.trim());
      console.log(`✅ Found user ID: ${userId} for email: ${treeUserEmail}`);
      
      if (showCommissions) {
        console.log(`🔄 Loading affiliate tree with commissions for user ID: ${userId}`);
        const response = await fetchAffiliateTreeWithCommissions(userId, 10);
        const data = response.data;
        console.log(`✅ Loaded tree data:`, data);
        
        const buildTreeNodes = (nodes: any[], levelOffset = 0) => {
          return nodes.map((node, idx) => ({
            title: (
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium">
                    {node.user ? `${node.user.username || node.user.email}` : `User ${node.userId}`}
                  </span>
                  <span className="text-gray-500 ml-2">(Level {node.level})</span>
                </div>
                {showCommissions && (
                  <div className="text-xs text-gray-600">
                    <div className="flex items-center gap-2">
                      <span className="text-green-600 font-medium">
                        {node.commission.totalEarned.toLocaleString()}đ
                      </span>
                      <span className="text-yellow-600">
                        {node.commission.totalPending.toLocaleString()}đ
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ),
            key: `${node.userId}-${idx}`, // userId-index format để dễ parse
            children: []
          }));
        };

        const ancestorNodes = buildTreeNodes(data.ancestors, -1);
        const descendantNodes = buildTreeNodes(data.descendants, 1);
        
        setTreeData([
          {
            title: (
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-blue-600">
                    {data.rootUser.user ? `${data.rootUser.user.username || data.rootUser.user.email}` : `User ${data.rootUser.userId}`}
                  </span>
                  <span className="text-gray-500 ml-2">(Root - Level {data.rootUser.level})</span>
                </div>
                {showCommissions && (
                  <div className="text-xs text-gray-600">
                    <div className="flex items-center gap-2">
                      <span className="text-green-600 font-bold">
                        {data.rootUser.commission.totalEarned.toLocaleString()}đ
                      </span>
                      <span className="text-yellow-600">
                        {data.rootUser.commission.totalPending.toLocaleString()}đ
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ),
            key: `root-${data.rootUser.userId}`,
            children: [
              { 
                title: `Cấp trên (${data.ancestors.length} người)`, 
                key: `ancestors-${data.rootUser.userId}`, 
                children: ancestorNodes 
              },
              {
                title: `Cấp dưới (${data.descendants.length} người)`,
                key: `descendants-${data.rootUser.userId}`,
                children: descendantNodes,
              },
            ],
          },
        ]);
        
        setCommissionData(data);
        
        // Tự động load thông tin user root khi tìm kiếm
        if (data.rootUser) {
          handleUserSelect(data.rootUser.userId, data.rootUser.commission);
        }
      } else {
        console.log(`🔄 Loading basic affiliate tree for user ID: ${userId}`);
        // Sử dụng API cũ
        const [descendants, ancestors] = await Promise.all([
          fetchDescendants(userId, 1),
          fetchAncestors(userId, 10),
        ]);
        const ancestorNodes = (ancestors?.data || []).map((id: number, idx: number) => ({
          title: `Cấp trên ${idx + 1}: User ${id}`,
          key: `up-${id}-${idx}`,
        }));
        const descendantNodes = (descendants?.data || []).map((n: any) => ({
          title: `Cấp dưới: User ${n.userId} (${n.email})`,
          key: `down-${n.userId}`,
        }));
        setTreeData([
          {
            title: `User ${userId} (Level 0)`,
            key: `u-${userId}`,
            children: [
              { title: 'Cấp trên', key: `ancestors-${userId}`, children: ancestorNodes },
              {
                title: 'Cấp dưới (F1)',
                key: `descendants-${userId}`,
                children: descendantNodes,
              },
            ],
          },
        ]);
        setCommissionData(null);
        console.log(`✅ Loaded basic tree data for user ID: ${userId}`);
      }
    } catch (e: any) {
      console.error(`❌ Error loading affiliate tree:`, e);
      message.error(e?.message || 'Tải cây thất bại');
    } finally {
      setTreeLoading(false);
    }
  }, [treeUserEmail, showCommissions, handleUserSelect]);

  return (
    <div style={{ padding: 16 }}>
      {ctx}
      
      {/* Overview explanation */}
      <Alert
        message="Hướng dẫn sử dụng hệ thống Affiliate"
        description={
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <div style={{ marginBottom: 8 }}>
                <Text strong>
                  <span role="img" aria-label="crystal ball">🔮</span> Xem trước Hoa hồng Dự kiến
                </Text>
              </div>
              <Text type="secondary">
                Tính toán thuần túy hoa hồng dự kiến cho từng cấp dựa trên số tiền và quy tắc hiện tại. 
                <Text strong>Không cần kết nối database</Text> - chỉ tính toán dựa trên level và rules.
                <Text strong>Dành cho user</Text> để dự đoán thu nhập từ affiliate.
              </Text>
            </Col>
            <Col xs={24} md={12}>
              <div style={{ marginBottom: 8 }}>
                <Text strong>
                  <span role="img" aria-label="tree">🌳</span> Cây Affiliate & Hoa hồng Thực tế
                </Text>
              </div>
              <Text type="secondary">
                Hiển thị hoa hồng thực tế đã được tính toán và phân bổ cho từng cấp affiliate. 
                <Text strong>Cần kết nối với user trong database</Text> để hiển thị thông tin thực tế.
                <Text strong>Dành cho admin</Text> để theo dõi hiệu suất và thu nhập thực tế của hệ thống.
              </Text>
            </Col>
          </Row>
        }
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      {/* Rules Management Card */}
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
                const activePrograms = affiliatePrograms.filter(p => p.status === 'active');
                if (activePrograms.length === 0) {
                  msg.warning('Không có chương trình affiliate nào đang hoạt động');
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
                        options={activePrograms.map(program => ({
                          value: program.id,
                          label: `${program.name} (ID: ${program.id})`
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
            <Button onClick={fetchRules} loading={loading} icon={<ReloadOutlined />}>
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
                        ...affiliatePrograms.map(program => ({
                          value: program.id,
                          label: `${program.name} (ID: ${program.id})`,
                        }))
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
                    <InputNumber min={0} style={{ width: '100%' }} placeholder="Không giới hạn" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Form.Item 
                    label="Cap/User" 
                    name="cap_per_user"
                    tooltip="Giới hạn hoa hồng tối đa cho mỗi user"
                  >
                    <InputNumber min={0} style={{ width: '100%' }} placeholder="Không giới hạn" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={12}>
                  <Form.Item style={{ marginTop: 32 }}>
                    <Button type="primary" htmlType="submit" loading={loading} icon={<PlusOutlined />}>
                      Tạo Rule
                    </Button>
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </Panel>
        </Collapse>
      </Card>

      <Tabs
        items={[
          {
            key: 'preview',
            label: (
              <Space>
                <InfoCircleOutlined />
                <span>Xem trước Hoa hồng Dự kiến</span>
              </Space>
            ),
            children: (
              <CommissionPreview affiliatePrograms={affiliatePrograms} />
            ),
          },
          {
            key: 'rules',
            label: (
              <Space>
                <SettingOutlined />
                <span>Danh sách Rules</span>
                <Badge count={rules.length} style={{ backgroundColor: '#1890ff' }} />
              </Space>
            ),
            children: (
              <Card>
                {/* Filter and View Controls */}
                <Card 
                  size="small" 
                  style={{ marginBottom: 16, background: '#fafafa' }}
                  title={
                    <Space>
                      <Text strong>Bộ lọc và Tìm kiếm</Text>
                      <Badge count={Object.keys(filteredGroupedRules).reduce((sum, key) => sum + filteredGroupedRules[key].length, 0)} />
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
                        <Select.Option value={-1}>📍 Tất cả chương trình (Default)</Select.Option>
                        {affiliatePrograms.map(program => (
                          <Select.Option key={program.id} value={program.id}>
                            {program.status === 'active' ? '🟢' : '🔴'} {program.name} (ID: {program.id})
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
                      Object.keys(filteredGroupedRules).map(key => {
                        const programId = key === 'default' ? null : parseInt(key.replace('program-', ''));
                        const program = programId ? affiliatePrograms.find(p => p.id === programId) : null;
                        const rulesInGroup = filteredGroupedRules[key];
                        
                        return (
                          <Card
                            key={key}
                            title={
                              <Space>
                                {program ? (
                                  <Badge 
                                    status={program.status === 'active' ? 'success' : 'error'} 
                                    text={
                                      <Text strong>
                                        {program.name} (ID: {program.id})
                                      </Text>
                                    } 
                                  />
                                ) : (
                                  <Badge status="default" text={<Text strong>📍 Tất cả chương trình (Default)</Text>} />
                                )}
                                <Badge count={rulesInGroup.length} style={{ backgroundColor: '#1890ff' }} />
                              </Space>
                            }
                            style={{ marginBottom: 16 }}
                            extra={
                              <Space>
                                <Button 
                                  size="small"
                                  icon={<PlusOutlined />}
                                  onClick={() => {
                                    form.setFieldsValue({ program_id: programId });
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
                                  title: 'Level', 
                                  dataIndex: 'level', 
                                  width: 80,
                                  render: (level: number) => (
                                    <Badge count={level} style={{ backgroundColor: level === 0 ? '#52c41a' : '#1890ff' }} />
                                  ),
                                },
                                {
                                  title: 'Rate %',
                                  dataIndex: 'rate_percent',
                                  width: 100,
                                  render: (rate: string | number) => {
                                    const numRate = typeof rate === 'string' ? parseFloat(rate) : rate;
                                    return <Text strong style={{ color: numRate > 0 ? '#52c41a' : '#999' }}>{numRate}%</Text>;
                                  },
                                },
                                {
                                  title: 'Caps',
                                  width: 150,
                                  render: (_: any, record: CommissionRule) => {
                                    const orderCap = record.cap_per_order ? parseFloat(record.cap_per_order) : null;
                                    const userCap = record.cap_per_user ? parseFloat(record.cap_per_user) : null;
                                    return (
                                      <div>
                                        {orderCap && <Text type="secondary" style={{ fontSize: '12px' }}>Order: {orderCap.toLocaleString()}đ</Text>}
                                        {userCap && <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>User: {userCap.toLocaleString()}đ</Text>}
                                        {!orderCap && !userCap && <Text type="secondary">Không giới hạn</Text>}
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
                                        <Button danger size="small" icon={<DeleteOutlined />} />
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
                    rowKey={(r) => String((r as any).id)}
                    loading={loading}
                    dataSource={rules as any}
                    columns={columns as any}
                    pagination={{ 
                      pageSize: 10,
                      showSizeChanger: true,
                      showQuickJumper: true,
                      showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} rules`,
                    }}
                    scroll={{ x: 1200 }}
                  />
                )}
              </Card>
            ),
          },
          {
            key: 'tree',
            label: (
              <Space>
                <span role="img" aria-label="tree">🌳</span>
                <span>Cây Affiliate & Hoa hồng Thực tế</span>
              </Space>
            ),
            children: (
              <div style={{ display: 'flex', gap: '16px' }}>
                {/* Left side - Tree */}
                <div style={{ flex: 1 }}>
                  <Card>
                    <Space style={{ marginBottom: 12 }}>
                      <Input 
                        placeholder="Nhập email người dùng" 
                        value={treeUserEmail} 
                        onChange={(e) => setTreeUserEmail(e.target.value)} 
                        style={{ width: 300 }} 
                      />
                      <Button onClick={loadTreeWithUserSelect} loading={treeLoading}>
                        Xem cây affiliate
                      </Button>
                      <Button 
                        type={showCommissions ? "primary" : "default"}
                        onClick={() => setShowCommissions(!showCommissions)}
                      >
                        {showCommissions ? "Ẩn Commission" : "Hiện Commission"}
                      </Button>
                    </Space>
                    <AffiliateTree 
                      treeData={treeData} 
                      defaultExpandAll={true}
                      showCommissions={showCommissions}
                      commissionData={commissionData}
                      onUserSelect={handleUserSelect}
                    />
                  </Card>
                </div>
                
                {/* Right side - User Info Card */}
                <div style={{ width: '350px' }}>
                  <UserInfoCard 
                    user={selectedUser}
                    commissionInfo={selectedUserCommission}
                    loading={userInfoLoading}
                  />
                </div>
              </div>
            ),
          },
        ]}
      />

      {/* Edit Rule Modal */}
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
                    ...affiliatePrograms.map(program => ({
                      value: program.id,
                      label: `${program.name} (ID: ${program.id})`,
                    }))
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
                <InputNumber min={0} style={{ width: '100%' }} placeholder="Không giới hạn" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={6}>
              <Form.Item label="Cap/User" name="cap_per_user">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="Không giới hạn" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item style={{ marginTop: 24, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setIsModalVisible(false);
                setEditingRule(null);
                editForm.resetFields();
              }}>
                Hủy
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Cập nhật
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Bulk Create Modal */}
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
                    ...affiliatePrograms.map(program => ({
                      value: program.id,
                      label: `${program.name} (ID: ${program.id})`,
                    }))
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
                <InputNumber min={0} style={{ width: '100%' }} placeholder="Không giới hạn" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={6}>
              <Form.Item label="Cap/User" name="cap_per_user">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="Không giới hạn" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item style={{ marginTop: 24, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setBulkCreateVisible(false);
                bulkForm.resetFields();
              }}>
                Hủy
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Tạo Hàng Loạt
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

