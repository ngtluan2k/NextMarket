import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, Form, Button, Space, message, Tabs, Input, Badge } from 'antd';
import { SettingOutlined, InfoCircleOutlined } from '@ant-design/icons';
import {
  fetchDescendants,
  fetchAncestors,
  fetchAffiliateTreeWithCommissions,
} from '../../../../service/afiliate/affiliate-tree.service';
import dayjs from 'dayjs';
import {
  listRules,
  createRule,
  updateRule,
  createDefaultRulesForProgram,
  CommissionRule,
  getAllCalculateMethod,
  CalculateMethod,
} from '../../../../service/afiliate/affiliate-rules.service';
import {
  getAllAffiliatePrograms,
  AffiliateProgram,
} from '../../../../service/afiliate/affiliate-programs.service';
import {
  findUserIdByEmail,
  getUserById,
  User,
} from '../../../../service/user-helper.service';
import AffiliateTree from './AffiliateTree';
import UserInfoCard from '../../../components/admin/affiliate_admin_components/affiliate-tree/UserInfoCard';
import CommissionPreview from '../../../components/admin/CommissionPreview';
import CreateRuleCard from '../../../components/admin/affiliate_admin_components/affiliate-rule/CreateRuleCard';
import ModalBulkCreateRules from './ModalBulkCreateRules';
import ModalEditRules from './ModalEditRules';
import AffiliateRuleList from './AffiliateRuleList';

export default function AffiliateRulesManager() {
  const [loading, setLoading] = useState(false);
  const [rules, setRules] = useState<CommissionRule[]>([]);
  const [affiliatePrograms, setAffiliatePrograms] = useState<
    AffiliateProgram[]
  >([]);
  const [msg, ctx] = message.useMessage();
  const [editingRule, setEditingRule] = useState<CommissionRule | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [bulkCreateVisible, setBulkCreateVisible] = useState(false);

  // New UI states
  const [selectedProgramId, setSelectedProgramId] = useState<number | null>(
    null
  );
  const [searchText, setSearchText] = useState('');
  const [viewMode, setViewMode] = useState<'grouped' | 'table'>('grouped');

  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [bulkForm] = Form.useForm();

  const [method, setMethod] = useState<CalculateMethod[]>([]);

  useEffect(() => {
    async function fetchMethods() {
      const calMed = await getAllCalculateMethod();
      console.log('all calculate method : ' + JSON.stringify(calMed));
      setMethod(calMed);
    }

    fetchMethods();
  }, []);

  // Grouped rules by program
  const groupedRules = useMemo(() => {
    const grouped: Record<string, CommissionRule[]> = {};

    // Add default group for rules without program_id
    grouped['default'] = [];

    rules.forEach((rule) => {
      const key = rule.program_id ? `program-${rule.program_id}` : 'default';
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(rule);
    });

    // Sort rules within each group by level
    Object.keys(grouped).forEach((key) => {
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
        Object.keys(filtered).forEach((key) => {
          if (key.startsWith('program-')) {
            delete filtered[key];
          }
        });
      } else {
        // Show only selected program
        Object.keys(filtered).forEach((key) => {
          if (key !== `program-${selectedProgramId}` && key !== 'default') {
            delete filtered[key];
          }
        });
      }
    }

    // Apply search filter
    if (searchText.trim()) {
      const search = searchText.toLowerCase();
      Object.keys(filtered).forEach((key) => {
        filtered[key] = filtered[key].filter((rule) => {
          const rate =
            typeof rule.rate_percent === 'string'
              ? rule.rate_percent
              : String(rule.rate_percent);
          return (
            String(rule.level).includes(search) ||
            rate.includes(search) ||
            String(rule.id).includes(search)
          );
        });
      });
    }

    // Remove empty groups
    Object.keys(filtered).forEach((key) => {
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

  const handleCreateDefaultRules = useCallback(
    async (programId: number) => {
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
    },
    [msg, fetchRules]
  );

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
        const {
          program_id,
          baseRate,
          maxLevels,
          rateDecrease,
          range,
          cap_per_order,
          cap_per_user,
        } = values;

        const promises = [];
        for (let level = 0; level <= maxLevels; level++) {
          const rate = Math.max(0, baseRate - level * rateDecrease);
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

  const handleEditRule = useCallback(
    (rule: CommissionRule) => {
      setEditingRule(rule);
      const rate =
        typeof rule.rate_percent === 'string'
          ? parseFloat(rule.rate_percent)
          : rule.rate_percent;
      editForm.setFieldsValue({
        program_id: rule.program_id ?? undefined,
        level: rule.level,
        rate_percent: rate,
        range: [
          rule.active_from ? dayjs(rule.active_from) : null,
          rule.active_to ? dayjs(rule.active_to) : null,
        ].filter(Boolean),
        cap_per_order: rule.cap_per_order
          ? parseFloat(rule.cap_per_order)
          : undefined,
        cap_per_user: rule.cap_per_user
          ? parseFloat(rule.cap_per_user)
          : undefined,
      });
      setIsModalVisible(true);
    },
    [editForm]
  );

  const handleCopyRule = useCallback(
    (rule: CommissionRule) => {
      const rate =
        typeof rule.rate_percent === 'string'
          ? parseFloat(rule.rate_percent)
          : rule.rate_percent;
      form.setFieldsValue({
        program_id: rule.program_id ?? undefined,
        level: rule.level,
        rate_percent: rate,
        range: [
          rule.active_from ? dayjs(rule.active_from) : null,
          rule.active_to
            ? rule.active_to
              ? dayjs(rule.active_to)
              : null
            : null,
        ].filter(Boolean),
        cap_per_order: rule.cap_per_order
          ? parseFloat(rule.cap_per_order)
          : undefined,
        cap_per_user: rule.cap_per_user
          ? parseFloat(rule.cap_per_user)
          : undefined,
      });
      msg.success('Đã copy thông tin rule vào form tạo mới');
    },
    [form, msg]
  );

  // Tree tab với commission info
  const [treeUserEmail, setTreeUserEmail] = useState<string>('');
  const [treeData, setTreeData] = useState<any[]>([]);
  const [commissionData, setCommissionData] = useState<any>(null);
  const [showCommissions, setShowCommissions] = useState<boolean>(true);
  const [treeLoading, setTreeLoading] = useState<boolean>(false);

  // User info card state
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedUserCommission, setSelectedUserCommission] =
    useState<any>(null);
  const [userInfoLoading, setUserInfoLoading] = useState<boolean>(false);

  // Handle user selection from tree
  const handleUserSelect = useCallback(
    async (userId: number, commissionInfo?: any) => {
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
    },
    [msg]
  );

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
        console.log(
          `🔄 Loading affiliate tree with commissions for user ID: ${userId}`
        );
        const response = await fetchAffiliateTreeWithCommissions(userId, 10);
        const data = response.data;
        console.log(`✅ Loaded tree data:`, data);

        const buildTreeNodes = (nodes: any[], levelOffset = 0) => {
          return nodes.map((node, idx) => ({
            title: (
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium">
                    {node.user
                      ? `${node.user.username || node.user.email}`
                      : `User ${node.userId}`}
                  </span>
                  <span className="text-gray-500 ml-2">
                    (Level {node.level})
                  </span>
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
            children: [],
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
                    {data.rootUser.user
                      ? `${
                          data.rootUser.user.username ||
                          data.rootUser.user.email
                        }`
                      : `User ${data.rootUser.userId}`}
                  </span>
                  <span className="text-gray-500 ml-2">
                    (Root - Level {data.rootUser.level})
                  </span>
                </div>
                {showCommissions && (
                  <div className="text-xs text-gray-600">
                    <div className="flex items-center gap-2">
                      <span className="text-green-600 font-bold">
                        {data.rootUser.commission.totalEarned.toLocaleString()}đ
                      </span>
                      <span className="text-yellow-600">
                        {data.rootUser.commission.totalPending.toLocaleString()}
                        đ
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
                children: ancestorNodes,
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
        const ancestorNodes = (ancestors?.data || []).map(
          (id: number, idx: number) => ({
            title: `Cấp trên ${idx + 1}: User ${id}`,
            key: `up-${id}-${idx}`,
          })
        );
        const descendantNodes = (descendants?.data || []).map((n: any) => ({
          title: `Cấp dưới: User ${n.userId} (${n.email})`,
          key: `down-${n.userId}`,
        }));
        setTreeData([
          {
            title: `User ${userId} (Level 0)`,
            key: `u-${userId}`,
            children: [
              {
                title: 'Cấp trên',
                key: `ancestors-${userId}`,
                children: ancestorNodes,
              },
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

      <CreateRuleCard
        rules={rules}
        setBulkCreateVisible={setBulkCreateVisible}
        affiliatePrograms={affiliatePrograms}
        handleCreateDefaultRules={handleCreateDefaultRules}
        fetchRules={fetchRules}
        loading={loading}
        form={form}
        msg={msg}
        onCreate={onCreate}
        method={method}
      />

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
                <Badge
                  count={rules.length}
                  style={{ backgroundColor: '#1890ff' }}
                />
              </Space>
            ),
            children: (
              <AffiliateRuleList
                form={form}
                rules={rules}
                filteredGroupedRules={filteredGroupedRules}
                affiliatePrograms={affiliatePrograms}
                viewMode={viewMode}
                searchText={searchText}
                loading={loading}
                msg={msg}
                setLoading={setLoading}
                setViewMode={setViewMode}
                setSearchText={setSearchText}
                setSelectedProgramId={setSelectedProgramId}
                handleCreateDefaultRules={handleCreateDefaultRules}
                handleEditRule={handleEditRule}
                handleCopyRule={handleCopyRule}
                fetchRules={fetchRules}
              />
            ),
          },
          {
            key: 'tree',
            label: (
              <Space>
                <span role="img" aria-label="tree">
                  🌳
                </span>
                <span>Cây Affiliate & Hoa hồng Thực tế</span>
              </Space>
            ),
            children: (
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <Card>
                    <Space style={{ marginBottom: 12 }}>
                      <Input
                        placeholder="Nhập email người dùng"
                        value={treeUserEmail}
                        onChange={(e) => setTreeUserEmail(e.target.value)}
                        style={{ width: 300 }}
                      />
                      <Button
                        onClick={loadTreeWithUserSelect}
                        loading={treeLoading}
                      >
                        Xem cây affiliate
                      </Button>
                      <Button
                        type={showCommissions ? 'primary' : 'default'}
                        onClick={() => setShowCommissions(!showCommissions)}
                      >
                        {showCommissions ? 'Ẩn Commission' : 'Hiện Commission'}
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

      <ModalEditRules
        isModalVisible={isModalVisible}
        setIsModalVisible={setIsModalVisible}
        setEditingRule={setEditingRule}
        editForm={editForm}
        onEdit={onEdit}
        affiliatePrograms={affiliatePrograms}
        loading={loading}
      />
      {/* Bulk Create Modal */}
      <ModalBulkCreateRules
        bulkCreateVisible={bulkCreateVisible}
        setBulkCreateVisible={setBulkCreateVisible}
        bulkForm={bulkForm}
        onBulkCreate={onBulkCreate}
        affiliatePrograms={affiliatePrograms}
        loading={loading}
      />
    </div>
  );
}
