'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Card,
  Statistic,
  Row,
  Col,
  Tag,
  message,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  DollarOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { Line } from '@ant-design/plots';

import type {
  AffiliateProgram,
  AffiliateProgramFormData,
  CreateAffiliateProgramDto,
} from '../../types/affiliate';
import {
  updateAffiliateProgram,
  createAffiliateProgram,
  deleteAffiliateProgram,
  getAllAffiliatePrograms,
} from '../../../service/affiliate.service';
import AffiliateProgramDetail from './AffiliateProgramDetail';

const AffiliateProgramDashboard = () => {
  const [programs, setPrograms] = useState<AffiliateProgram[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<AffiliateProgram | null>(
    null
  );
  const [form] = Form.useForm();
  const [chartData, setChartData] = useState<any[]>([]);
  const [viewingProgramId, setViewingProgramId] = useState<number | null>(null);
  const [isDetailVisible, setIsDetailVisible] = useState(false);

  const fetchPrograms = async () => {
    setLoading(true);
    try {
      const response = await getAllAffiliatePrograms();
      // console.log('Fetched Programs:', JSON.stringify(response, null, 2));

      if (Array.isArray(response)) {
        setPrograms(response);
        processChartData(response);
      } else if (response && response.data && Array.isArray(response.data)) {
        setPrograms(response.data);
      } else {
        setPrograms([]);
        console.warn('Unexpected response structure:', response);
      }
    } catch (error) {
      console.error('Error fetching programs:', error);
      message.error('Không thể tải dữ liệu chương trình tiếp thị liên kết');
    } finally {
      setLoading(false);
    }
  };

  const processChartData = (programs: AffiliateProgram[]) => {
    const dataForChart = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = date.toLocaleString('default', { month: 'short' });
      const year = date.getFullYear();
      dataForChart.push({
        time: `${month} ${year}`,
        value: 0,
        type: 'Programs Created',
      });
    }

    const monthlyDataMap = new Map(dataForChart.map((d) => [d.time, d]));

    programs.forEach((program) => {
      const date = new Date(program.created_at);
      const month = date.toLocaleString('default', { month: 'short' });
      const year = date.getFullYear();
      const timeKey = `${month} ${year}`;
      if (monthlyDataMap.has(timeKey)) {
        monthlyDataMap.get(timeKey)!.value += 1;
      }
    });

    setChartData(Array.from(monthlyDataMap.values()) as any);
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

  const handleViewDetail = (id: number) => {
    setViewingProgramId(id);
    setIsDetailVisible(true);
  };

  const handleSubmit = async (values: AffiliateProgramFormData) => {
    console.log(values);
    try {
      if (
        !values.name ||
        values.cookie_days == null ||
        values.commission_type == null ||
        values.commission_value == null
      ) {
        message.error('Vui lòng điền đầy đủ các trường bắt buộc.');
        return;
      }

      let response;
      if (editingProgram) {
        const updateDto: Partial<CreateAffiliateProgramDto> = {
          name: values.name,
          cookie_days: values.cookie_days,
          commission_type: values.commission_type,
          commission_value: Number(values.commission_value),
          status: values.status,
        };
        response = await updateAffiliateProgram(editingProgram.id, updateDto);
      } else {
        const createDto: CreateAffiliateProgramDto = {
          name: values.name,
          cookie_days: values.cookie_days,
          commission_type: values.commission_type,
          commission_value: values.commission_value,
          status: values.status,
        };
        response = await createAffiliateProgram(createDto);
      }

      if (response) {
        message.success(
          editingProgram
            ? 'Cập nhật chương trình thành công'
            : 'Tạo chương trình thành công'
        );
        setIsModalOpen(false);
        form.resetFields();
        setEditingProgram(null);
        fetchPrograms();
      } else {
        message.error('Thao tác thất bại');
      }
    } catch (error) {
      message.error('Đã xảy ra lỗi');
      console.error('Error in handleSubmit:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await deleteAffiliateProgram(id);
      if (response) {
        message.success('Xoá chương trình thành công');
        fetchPrograms();
      } else {
        message.error('Không thể xóa chương trình');
      }
    } catch (error) {
      message.error('Đã xảy ra lỗi');
    }
  };

  const openModal = (program?: AffiliateProgram) => {
    if (program) {
      setEditingProgram(program);
      form.setFieldsValue(program);
    } else {
      setEditingProgram(null);
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const columns: ColumnsType<AffiliateProgram> = [
    {
      title: 'Tên',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Số ngày lưu Cookie',
      dataIndex: 'cookie_days',
      key: 'cookie_days',
      render: (days) => days || 'N/A',
    },
    {
      title: 'Loại hoa hồng',
      dataIndex: 'commission_type',
      key: 'commission_type',
      render: (type) =>
        type ? (
          <Tag color={type === 'percentage' ? 'blue' : 'green'}>
            {type === 'percentage' ? 'PHẦN TRĂM' : 'CỐ ĐỊNH'}
          </Tag>
        ) : (
          'N/A'
        ),
    },
    {
      title: 'Giá trị hoa hồng',
      dataIndex: 'commission_value',
      key: 'commission_value',
      render: (value, record) => {
        if (!value) return 'N/A';
        return record.commission_type === 'percentage'
          ? `${value}%`
          : `\$${value}`;
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'active' ? 'success' : 'default'}>
          {status === 'active' ? 'HOẠT ĐỘNG' : 'NGỪNG HOẠT ĐỘNG'}
        </Tag>
      ),
      filters: [
        { text: 'Hoạt động', value: 'active' },
        { text: 'Ngừng hoạt động', value: 'inactive' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => new Date(date).toLocaleDateString('vi-VN'),
      sorter: (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record.id)}
          >
            Chi tiết
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => openModal(record)}
          >
            Chỉnh sửa
          </Button>
          <Popconfirm
            title="Xóa chương trình"
            description="Bạn có chắc chắn muốn xóa chương trình này không?"
            onConfirm={() => handleDelete(record.id)}
            okText="Có"
            cancelText="Không"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const activePrograms = programs.filter((p) => p.status === 'active').length;
  const totalPrograms = programs.length;
  const avgCommission =
    programs.reduce((acc, p) => acc + (p.commission_value || 0), 0) /
      totalPrograms || 0;
  const vnd = (value: number) =>
    new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Quản lý Chương trình Tiếp thị Liên kết
            </h1>
            <p className="mt-1 text-muted-foreground">
              Quản lý các chương trình, hoa hồng và theo dõi tiếp thị liên kết
              của hệ thống Everymart
            </p>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => openModal()}
            size="large"
          >
            Tạo Chương trình
          </Button>
        </div>

        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Tổng số chương trình"
                value={totalPrograms}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Chương trình đang hoạt động"
                value={activePrograms}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Hoa hồng trung bình"
                value={vnd(avgCommission)}
                prefix={<DollarOutlined />}
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
        </Row>

        <Card title="Xu hướng Chuyển đổi" className="mb-6">
          <Line
            data={chartData}
            xField="time"
            yField="value"
            seriesField="type"
            yAxis={{ title: { text: 'Count' } }}
            xAxis={{ title: { text: 'Month' } }}
            height={300}
          />
        </Card>

        <Card title="Các Chương trình Tiếp thị Liên kết">
          <Table
            columns={columns}
            dataSource={programs}
            rowKey="id"
            loading={loading}
            locale={{
              emptyText: loading ? 'Đang tải...' : 'Không có dữ liệu.',
            }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Tổng cộng ${total} chương trình`,
            }}
          />
        </Card>

        <Modal
          title={
            editingProgram ? 'Chỉnh sửa Chương trình' : 'Tạo Chương trình Mới'
          }
          open={isModalOpen}
          onCancel={() => {
            setIsModalOpen(false);
            form.resetFields();
            setEditingProgram(null);
          }}
          footer={null}
          width={600}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              status: 'active',
              commission_type: 'percentage',
            }}
          >
            <Form.Item
              label="Tên Chương trình"
              name="name"
              rules={[
                { required: true, message: 'Vui lòng nhập tên chương trình' },
              ]}
            >
              <Input placeholder="Nhập tên chương trình" />
            </Form.Item>

            <Form.Item
              label="Số ngày lưu Cookie"
              name="cookie_days"
              tooltip="Số ngày cookie liên kết có hiệu lực"
            >
              <InputNumber
                min={1}
                max={365}
                placeholder="Ví dụ: 30"
                className="w-full"
              />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Loại hoa hồng" name="commission_type">
                  <Select placeholder="Chọn loại">
                    <Select.Option value="percentage">Phần trăm</Select.Option>
                    <Select.Option value="fixed">Số tiền cố định</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Giá trị hoa hồng"
                  name="commission_value"
                  tooltip="Phần trăm (ví dụ: 10) hoặc số tiền cố định (ví dụ: 50)"
                >
                  <InputNumber
                    min={0}
                    placeholder="Nhập giá trị"
                    className="w-full"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              label="Trạng thái"
              name="status"
              rules={[{ required: true }]}
            >
              <Select>
                <Select.Option value="active">Hoạt động</Select.Option>
                <Select.Option value="inactive">Ngừng hoạt động</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item className="mb-0">
              <Space className="flex justify-end">
                <Button onClick={() => setIsModalOpen(false)}>Hủy</Button>
                <Button type="primary" htmlType="submit">
                  {editingProgram ? 'Cập nhật' : 'Tạo'}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {viewingProgramId && (
          <AffiliateProgramDetail
            programId={viewingProgramId}
            visible={isDetailVisible}
            onClose={() => setIsDetailVisible(false)}
          />
        )}
      </div>
    </div>
  );
};

export default AffiliateProgramDashboard;
