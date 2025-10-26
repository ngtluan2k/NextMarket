import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  Tree,
} from 'antd';
import {
  fetchDescendants,
  fetchAncestors,
  fetchAffiliateTreeWithCommissions,
} from '../../../service/affiliate-tree.service';
import dayjs from 'dayjs';
import {
  listRules,
  createRule,
  updateRule,
  deleteRule,
  CommissionRule,
} from '../../../service/affiliate-rules.service';
import AffiliateTree from './AffiliateTree';

const { RangePicker } = DatePicker;

export default function AffiliateRulesManager() {
  const [loading, setLoading] = useState(false);
  const [rules, setRules] = useState<CommissionRule[]>([]);
  const [msg, ctx] = message.useMessage();

  const [form] = Form.useForm();

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

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

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

  const columns = useMemo(
    () => [
      { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
      {
        title: 'Program',
        dataIndex: 'program_id',
        key: 'program_id',
        width: 100,
        render: (v: number | null) => v ?? '—',
      },
      { title: 'Level', dataIndex: 'level', key: 'level', width: 80 },
      {
        title: 'Rate %',
        dataIndex: 'rate_percent',
        key: 'rate_percent',
        width: 100,
      },
      {
        title: 'Từ',
        dataIndex: 'active_from',
        key: 'active_from',
        render: (v: string | null) => (v ? dayjs(v).format('YYYY-MM-DD') : '—'),
      },
      {
        title: 'Đến',
        dataIndex: 'active_to',
        key: 'active_to',
        render: (v: string | null) => (v ? dayjs(v).format('YYYY-MM-DD') : '—'),
      },
      {
        title: 'Cap/Order',
        dataIndex: 'cap_per_order',
        key: 'cap_per_order',
        render: (v: string | null) => v ?? '—',
      },
      {
        title: 'Cap/User',
        dataIndex: 'cap_per_user',
        key: 'cap_per_user',
        render: (v: string | null) => v ?? '—',
      },
      {
        title: 'Hành động',
        key: 'actions',
        render: (_: any, record: CommissionRule) => (
          <Space>
            <Button
              onClick={async () => {
                const rate =
                  typeof record.rate_percent === 'string'
                    ? parseFloat(record.rate_percent)
                    : record.rate_percent;
                const initial = {
                  program_id: record.program_id ?? undefined,
                  level: record.level,
                  rate_percent: rate,
                  range: [
                    record.active_from ? dayjs(record.active_from) : null,
                    record.active_to ? dayjs(record.active_to) : null,
                  ].filter(Boolean),
                  cap_per_order: record.cap_per_order
                    ? parseFloat(record.cap_per_order)
                    : undefined,
                  cap_per_user: record.cap_per_user
                    ? parseFloat(record.cap_per_user)
                    : undefined,
                } as any;
                form.setFieldsValue(initial);
              }}
            >
              Sửa nhanh (điền vào form)
            </Button>
            <Button
              danger
              onClick={async () => {
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
              Xoá
            </Button>
          </Space>
        ),
      },
    ],
    [fetchRules, form, msg]
  );

  // Tree tab với commission info
  const [treeUserId, setTreeUserId] = useState<string>('');
  const [treeData, setTreeData] = useState<any[]>([]);
  const [commissionData, setCommissionData] = useState<any>(null);
  const [showCommissions, setShowCommissions] = useState<boolean>(true);
  
  const loadTree = useCallback(async () => {
    if (!treeUserId.trim()) {
      setTreeData([]);
      setCommissionData(null);
      return;
    }
    try {
      const uid = Number(treeUserId);
      
      if (showCommissions) {
        // Sử dụng API mới với commission info
        const response = await fetchAffiliateTreeWithCommissions(uid, 10);
        const data = response.data;
        
        // Xây dựng tree data với commission info
        const buildTreeNodes = (nodes: any[], levelOffset: number = 0) => {
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
            key: `${node.userId}-${idx}`,
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
      } else {
        // Sử dụng API cũ
        const [descendants, ancestors] = await Promise.all([
          fetchDescendants(uid, 1),
          fetchAncestors(uid, 10),
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
            title: `User ${uid} (Level 0)`,
            key: `u-${uid}`,
            children: [
              { title: 'Cấp trên', key: `ancestors-${uid}`, children: ancestorNodes },
              {
                title: 'Cấp dưới (F1)',
                key: `descendants-${uid}`,
                children: descendantNodes,
              },
            ],
          },
        ]);
        setCommissionData(null);
      }
    } catch (e: any) {
      message.error(e?.message || 'Tải cây thất bại');
    }
  }, [treeUserId, showCommissions]);

  return (
    <div style={{ padding: 16 }}>
      {ctx}
      <Card
        title="Quản trị Affiliate Rules"
        style={{ marginBottom: 16 }}
        extra={
          <Button onClick={fetchRules} loading={loading}>
            Refresh
          </Button>
        }
      >
        <Form form={form} layout="inline" onFinish={onCreate}>
          <Form.Item label="Program" name="program_id">
            <InputNumber min={0} placeholder="program_id (tùy chọn)" />
          </Form.Item>
          <Form.Item
            label="Level"
            name="level"
            rules={[{ required: true, message: 'Bắt buộc' }]}
          >
            <InputNumber min={0} />
          </Form.Item>
          <Form.Item
            label="Rate %"
            name="rate_percent"
            rules={[{ required: true, message: 'Bắt buộc' }]}
          >
            <InputNumber min={0} />
          </Form.Item>
          <Form.Item label="Thời gian" name="range">
            <RangePicker />
          </Form.Item>
          <Form.Item label="Cap/Order" name="cap_per_order">
            <InputNumber min={0} />
          </Form.Item>
          <Form.Item label="Cap/User" name="cap_per_user">
            <InputNumber min={0} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Lưu
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Tabs
        items={[
          {
            key: 'rules',
            label: 'Rules',
            children: (
              <Card>
                <Table
                  rowKey={(r) => String((r as any).id)}
                  loading={loading}
                  dataSource={rules as any}
                  columns={columns as any}
                  pagination={{ pageSize: 10 }}
                />
              </Card>
            ),
          },
          {
            key: 'tree',
            label: 'Affiliate Tree',
            children: (
              <Card>
                <Space style={{ marginBottom: 12 }}>
                  <Input placeholder="Nhập userId" value={treeUserId} onChange={(e) => setTreeUserId(e.target.value)} style={{ width: 200 }} />
                  <Button onClick={loadTree}>Xem cây</Button>
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
                />
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
}
