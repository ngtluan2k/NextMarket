import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Form,
  Space,
  message,
  Tabs,
  Badge,
} from 'antd';
import { SettingOutlined } from '@ant-design/icons';
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
import CreateRuleCardWithPreview from '../../../components/admin/affiliate_admin_components/affiliate-rule/CreateRuleCardWithPreview';
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
    console.log('🔄 [AffiliateRulesManager] Starting to fetch rules...');
    setLoading(true);
    try {
      const data = await listRules();
      console.log('✅ [AffiliateRulesManager] Rules fetched successfully:', data?.length || 0, 'rules');
      console.log('📊 [AffiliateRulesManager] Sample rule structure:', data?.[0]);
      setRules(data || []);
    } catch (e: any) {
      console.error('❌ [AffiliateRulesManager] Error fetching rules:', e);
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
