import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Table,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  message,
  Space,
  Tag,
  Typography,
  Row,
  Col,
  Statistic,
  Tooltip,
  Divider,
} from 'antd';
import {
  PlusOutlined,
  CopyOutlined,
  ShareAltOutlined,
  TeamOutlined,
  CalendarOutlined,
  ShopOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  createGroupAffiliateLink,
  getMyGroupAffiliateLinks,
} from '../../../../../../service/afiliate/affiliate-links.service';
import { getActiveAffiliatePrograms } from '../../../../../../service/afiliate/affiliate-programs.service';
import { storeService, Store } from '../../../../../../service/store.service';
import {
  CreateGroupAffiliateLinkRequest,
  MyGroupLink,
  Program,
} from '../../../../../types/affiliate-links';

const { Title, Text } = Typography;
const { Option } = Select;

const GroupAffiliateLinks: React.FC = () => {
  const [groupLinks, setGroupLinks] = useState<MyGroupLink[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [groupLinksRes, programsRes, storesRes] = await Promise.all([
        getMyGroupAffiliateLinks(),
        getActiveAffiliatePrograms(),
        storeService.getAllStores(),
      ]);
      
      setGroupLinks(groupLinksRes.group_links);
      setPrograms(programsRes || []);
      setStores(storesRes);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      message.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroupLink = async (values: any) => {
    try {
      const payload: CreateGroupAffiliateLinkRequest = {
        storeId: values.storeId,
        programId: values.programId,
        groupName: values.groupName,
        targetMemberCount: values.targetMemberCount,
        expiresAt: values.expiresAt ? values.expiresAt.toISOString() : undefined,
      };

      await createGroupAffiliateLink(payload);
      setModalVisible(false);
      form.resetFields();
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Failed to create group affiliate link:', error);
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text).then(() => {
      message.success(`${type} đã được sao chép!`);
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'green';
      case 'locked': return 'orange';
      case 'completed': return 'blue';
      case 'cancelled': return 'red';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open': return 'Đang mở';
      case 'locked': return 'Đã khóa';
      case 'completed': return 'Hoàn thành';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  const columns = [
    {
      title: 'Tên nhóm',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: MyGroupLink) => (
        <div>
          <Text strong>{text}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.store_name}
          </Text>
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      ),
    },
    {
      title: 'Mã tham gia',
      dataIndex: 'join_code',
      key: 'join_code',
      render: (code: string) => (
        <Space>
          <Text code>{code}</Text>
          <Button
            type="text"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => copyToClipboard(code, 'Mã tham gia')}
          />
        </Space>
      ),
    },
    {
      title: 'Mục tiêu thành viên',
      dataIndex: 'target_member_count',
      key: 'target_member_count',
      render: (count: number) => (
        <Space>
          <TeamOutlined />
          <Text>{count} người</Text>
        </Space>
      ),
    },
    {
      title: 'Hết hạn',
      dataIndex: 'expires_at',
      key: 'expires_at',
      render: (date: string) => (
        date ? (
          <Space>
            <CalendarOutlined />
            <Text>{dayjs(date).format('DD/MM/YYYY HH:mm')}</Text>
          </Space>
        ) : (
          <Text type="secondary">Không giới hạn</Text>
        )
      ),
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (_, record: MyGroupLink) => (
        <Space>
          <Tooltip title="Sao chép link mời">
            <Button
              type="text"
              size="small"
              icon={<LinkOutlined />}
              onClick={() => copyToClipboard(record.invite_link, 'Link mời')}
            />
          </Tooltip>
          <Tooltip title="Chia sẻ">
            <Button
              type="text"
              size="small"
              icon={<ShareAltOutlined />}
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: `Tham gia nhóm: ${record.name}`,
                    text: `Tham gia nhóm mua hàng của tôi với mã: ${record.join_code}`,
                    url: record.invite_link,
                  });
                } else {
                  copyToClipboard(record.invite_link, 'Link chia sẻ');
                }
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const stats = {
    total: groupLinks.length,
    open: groupLinks.filter(g => g.status === 'open').length,
    completed: groupLinks.filter(g => g.status === 'completed').length,
    active: groupLinks.filter(g => ['open', 'locked'].includes(g.status)).length,
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={3}>
          <TeamOutlined /> Nhóm Affiliate
        </Title>
        <Text type="secondary">
          Tạo và quản lý các nhóm mua hàng với affiliate tracking
        </Text>
      </div>

      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Tổng nhóm"
              value={stats.total}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Đang hoạt động"
              value={stats.active}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Đang mở"
              value={stats.open}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Hoàn thành"
              value={stats.completed}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Content */}
      <Card
        title="Danh sách nhóm affiliate"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModalVisible(true)}
          >
            Tạo nhóm mới
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={groupLinks}
          rowKey="group_id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `Tổng ${total} nhóm`,
          }}
        />
      </Card>

      {/* Create Group Modal */}
      <Modal
        title="Tạo nhóm affiliate mới"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateGroupLink}
          initialValues={{
            targetMemberCount: 5,
          }}
        >
          <Form.Item
            name="storeId"
            label="Cửa hàng"
            rules={[{ required: true, message: 'Vui lòng chọn cửa hàng' }]}
          >
            <Select placeholder="Chọn cửa hàng">
              {stores.map(store => (
                <Option key={store.id} value={store.id}>
                  <Space>
                    <ShopOutlined />
                    {store.name}
                  </Space>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="programId"
            label="Chương trình affiliate (tùy chọn)"
          >
            <Select placeholder="Chọn chương trình affiliate" allowClear>
              {programs.map(program => (
                <Option key={program.id} value={program.id}>
                  {program.name} ({program.status}%)
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="groupName"
            label="Tên nhóm"
            rules={[{ required: true, message: 'Vui lòng nhập tên nhóm' }]}
          >
            <Input placeholder="Nhập tên nhóm mua hàng" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="targetMemberCount"
                label="Mục tiêu thành viên"
                rules={[{ required: true, message: 'Vui lòng nhập số thành viên' }]}
              >
                <InputNumber
                  min={2}
                  max={50}
                  placeholder="Số thành viên"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="expiresAt"
                label="Thời hạn (tùy chọn)"
              >
                <DatePicker
                  showTime
                  placeholder="Chọn thời hạn"
                  style={{ width: '100%' }}
                  disabledDate={(current) => current && current < dayjs().endOf('day')}
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                Hủy
              </Button>
              <Button type="primary" htmlType="submit">
                Tạo nhóm
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default GroupAffiliateLinks;
