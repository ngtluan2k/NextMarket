import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Card,
  Form,
  Button,
  Space,
  message,
  Tabs,
  Input,
  Badge,
  Select,
} from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import {
  fetchDescendants,
  fetchAncestors,
  fetchAffiliateTreeWithCommissions,
} from '../../../../service/afiliate/affiliate-tree.service';
import {
  listRules,
  createRule,
  createNewRule,
  updateRule,
  createDefaultRulesForProgram,
  CommissionRule,
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
import CreateRuleCardWithPreview from '../../../components/admin/affiliate_admin_components/affiliate-rule/CreateRuleCardWithPreview';
import ModalBulkCreateRules from './ModalBulkCreateRules';
import ModalEditRules from './ModalEditRules';
import AffiliateRuleList from './AffiliateRuleList';

const { Option } = Select;

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
  const [selectedProgramId, setSelectedProgramId] = useState<number | null>(
    null
  );
  const [searchText, setSearchText] = useState('');
  const [viewMode, setViewMode] = useState<'grouped' | 'table'>('grouped');

  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [bulkForm] = Form.useForm();

  const groupedRules = useMemo(() => {
    const grouped: Record<string, CommissionRule[]> = {};

    grouped['default'] = [];

    rules.forEach((rule) => {
      const key = rule.program_id ? `program-${rule.program_id}` : 'default';
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(rule);
    });

    Object.keys(grouped).forEach((key) => {
      grouped[key].sort((a, b) => a.name.localeCompare(b.name));
    });

    return grouped;
  }, [rules]);

  const filteredGroupedRules = useMemo(() => {
    const filtered = { ...groupedRules };

    if (selectedProgramId !== null) {
      if (selectedProgramId === -1) {
        Object.keys(filtered).forEach((key) => {
          if (key.startsWith('program-')) {
            delete filtered[key];
          }
        });
      } else {
        Object.keys(filtered).forEach((key) => {
          if (key !== `program-${selectedProgramId}` && key !== 'default') {
            delete filtered[key];
          }
        });
      }
    }

    if (searchText.trim()) {
      const search = searchText.toLowerCase();
      Object.keys(filtered).forEach((key) => {
        filtered[key] = filtered[key].filter((rule) => {
          return (
            rule.name.toLowerCase().includes(search) ||
            rule.id.toLowerCase().includes(search) ||
            rule.calculation_method.toLowerCase().includes(search) ||
            rule.calculated_rates.some(
              (rate) =>
                String(rate.level).includes(search) ||
                String(rate.rate).includes(search)
            )
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
      console.log(' Loading affiliate programs...');
      const programs = await getAllAffiliatePrograms();
      setAffiliatePrograms(programs || []);
      console.log(` Loaded ${programs.length} affiliate programs`);
    } catch (e: any) {
      console.error(' Error loading affiliate programs:', e);
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
        // Map the new form structure to the backend API
        const payload: any = {
          program_id: values.program_id || null,
          name: values.name,
          total_budget: values.total_budget,
          num_levels: values.num_levels,
          calculation_method: values.calculation_method,
          decay_rate: values.decay_rate,
          starting_index: values.starting_index,
          weights: values.weights,
          cap_order: values.cap_order,
          cap_user: values.cap_user,
          time_limit_days: values.time_limit_days,
        };

        await createNewRule(payload);
        msg.success('Tạo rule thành công');
        fetchRules();
      } catch (e: any) {
        msg.error(e?.message || 'Tạo rule thất bại');
      } finally {
        setLoading(false);
      }
    },
    [fetchRules, msg]
  );

  const onEdit = useCallback(
    async (values: any) => {
      if (!editingRule) return;

      setLoading(true);
      try {
        const payload: any = {
          program_id: values.program_id ?? null,
          name: values.name,
          total_budget: values.total_budget,
          num_levels: values.num_levels,
          calculation_method: values.calculation_method,
          decay_rate: values.decay_rate,
          starting_index: values.starting_index,
          weights: values.weights,
          cap_order: values.cap_order ?? null,
          cap_user: values.cap_user ?? null,
          time_limit_days: values.time_limit_days ?? null,
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
    (rule: any) => {
      // For the new structure, we'll edit the whole rule
      setEditingRule(rule);
      editForm.setFieldsValue({
        program_id: rule.program_id ?? undefined,
        name: rule.name,
        total_budget: rule.total_budget,
        num_levels: rule.num_levels,
        calculation_method: rule.calculation_method,
        decay_rate: rule.decay_rate,
        starting_index: rule.starting_index,
        weights: rule.weights,
        cap_order: rule.cap_order,
        cap_user: rule.cap_user,
        time_limit_days: rule.time_limit_days,
      });
      setIsModalVisible(true);
    },
    [editForm]
  );

  const handleCopyRule = useCallback(
    (rule: any) => {
      // Copy the rule structure to the create form
      form.setFieldsValue({
        program_id: rule.program_id ?? undefined,
        num_levels: rule.num_levels,
        calculation_method: rule.calculation_method,
        decay_rate: rule.decay_rate,
        starting_index: rule.starting_index,
        weights: rule.weights,
        cap_order: rule.cap_order,
        cap_user: rule.cap_user,
        time_limit_days: rule.time_limit_days,
      });
      msg.success('Đã copy thông tin rule vào form tạo mới');
    },
    [form, msg]
  );


  const [treeUserEmail, setTreeUserEmail] = useState<string>('');
  const [treeData, setTreeData] = useState<any[]>([]);
  const [commissionData, setCommissionData] = useState<any>(null);
  const [showCommissions, setShowCommissions] = useState<boolean>(true);
  const [treeLoading, setTreeLoading] = useState<boolean>(false);


  const [selectedTreeProgramId, setSelectedTreeProgramId] = useState<
    number | null
  >(null);


  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedUserCommission, setSelectedUserCommission] =
    useState<any>(null);
  const [userInfoLoading, setUserInfoLoading] = useState<boolean>(false);

  const handleUserSelect = useCallback(
    async (userId: number, commissionInfo?: any) => {
      console.log(` User selected: ${userId}`, commissionInfo);

      setUserInfoLoading(true);
      try {
        const user = await getUserById(userId);
        setSelectedUser(user);
        setSelectedUserCommission(commissionInfo);
        console.log(`Loaded user info:`, user);
      } catch (error: any) {
        console.error(`Error loading user info:`, error);
        msg.error(error?.message || 'Không thể tải thông tin user');
        setSelectedUser(null);
        setSelectedUserCommission(null);
      } finally {
        setUserInfoLoading(false);
      }
    },
    [msg]
  );

  const loadTreeWithUserSelect = useCallback(async () => {
    if (!treeUserEmail.trim()) {
      setTreeData([]);
      setCommissionData(null);
      return;
    }

    setTreeLoading(true);
    try {
      console.log(`Converting email to user ID: ${treeUserEmail}`);

      const userId = await findUserIdByEmail(treeUserEmail.trim());
      // console.log(`Found user ID: ${userId} for email: ${treeUserEmail}`);

      if (showCommissions) {
        console.log(
          `Loading affiliate tree with commissions for user ID: ${userId}`,
          selectedTreeProgramId
            ? `with program filter: ${selectedTreeProgramId}`
            : 'without program filter'
        );
        const response = await fetchAffiliateTreeWithCommissions(
          userId,
          10,
          selectedTreeProgramId || undefined
        );
        const data = response.data;
        // console.log(`Loaded tree data:`, data);

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
                  {selectedTreeProgramId && node.programParticipation && (
                    <span
                      className={`ml-2 px-2 py-0.5 text-xs rounded ${
                        node.programParticipation.isJoined
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {node.programParticipation.isJoined
                        ? '✓ Joined'
                        : '✗ Not Joined'}
                    </span>
                  )}
                </div>
                {showCommissions && (
                  <div className="text-xs text-gray-600">
                    <div className="flex items-center gap-2">
                      {selectedTreeProgramId && node.programParticipation ? (
                        <div>
                          {node.programParticipation.isJoined && (
                            <>
                              <span className="text-blue-600 font-medium">
                                Rate: {node.programParticipation.rate}%
                              </span>
                              <span className="text-green-600 font-medium">
                                {node.programParticipation.earnedFromProgram.toLocaleString()}
                                đ
                              </span>
                            </>
                          )}
                        </div>
                      ) : (
                        <>
                          <span className="text-green-600 font-medium">
                            {node.commission.totalEarned.toLocaleString()}đ
                          </span>
                          <span className="text-yellow-600">
                            {node.commission.totalPending.toLocaleString()}đ
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ),
            key: `${node.userId}-${idx}`,
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
        if (data.rootUser) {
          handleUserSelect(data.rootUser.userId, data.rootUser.commission);
        }
      } else {
        console.log(` Loading basic affiliate tree for user ID: ${userId}`);

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
        console.log(` Loaded basic tree data for user ID: ${userId}`);
      }
    } catch (e: any) {
      console.error(`Error loading affiliate tree:`, e);
      message.error(e?.message || 'Tải cây thất bại');
    } finally {
      setTreeLoading(false);
    }
  }, [treeUserEmail, showCommissions, selectedTreeProgramId, handleUserSelect]);

  return (
    <div style={{ padding: 16 }}>
      {ctx}

      <CreateRuleCardWithPreview
        affiliatePrograms={affiliatePrograms}
        onCreateRule={onCreate}
        loading={loading}
      />

      <Tabs
        items={[
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
                    <Space
                      direction="vertical"
                      style={{ width: '100%', marginBottom: 12 }}
                    >
                      <Space style={{ width: '100%' }}>
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
                          {showCommissions
                            ? 'Ẩn Commission'
                            : 'Hiện Commission'}
                        </Button>
                      </Space>

                      {/* Program Filter */}
                      <Space style={{ width: '100%' }}>
                        <span style={{ fontWeight: 500 }}>
                          Filter by Program:
                        </span>
                        <Select
                          value={selectedTreeProgramId}
                          onChange={(value) =>
                            setSelectedTreeProgramId(
                              value === undefined ? null : value
                            )
                          }
                          placeholder="Tất cả programs (Summary)"
                          style={{ width: 300 }}
                          allowClear
                        >
                          {affiliatePrograms.map((program) => (
                            <Option key={program.id} value={program.id}>
                              {program.name} (Budget: {program.commission_value}
                              %)
                            </Option>
                          ))}
                        </Select>
                        {selectedTreeProgramId && (
                          <span style={{ fontSize: 12, color: '#666' }}>
                            Hiển thị rates và participation cho program đã chọn
                          </span>
                        )}
                      </Space>
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
