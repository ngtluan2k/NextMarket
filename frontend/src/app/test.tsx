// import React, { useEffect, useState } from 'react';
// import { Table, Button, Form, Input, DatePicker, Upload, message } from 'antd';
// import { UploadOutlined } from '@ant-design/icons';
// import dayjs from 'dayjs';
// import { getAllCampaigns, createCampaign } from '../service/campaign.service';

// const { TextArea } = Input;

// export default function CampaignManager() {
//   const [campaigns, setCampaigns] = useState<any[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [banner, setBanner] = useState<File | null>(null);
//   const [form] = Form.useForm();

//   const fetchCampaigns = async () => {
//     setLoading(true);
//     try {
//       const data = await getAllCampaigns();
//       setCampaigns(data);
//     } catch (err: any) {
//       console.error(err);
//       message.error('Lỗi lấy danh sách campaign');
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchCampaigns();
//   }, []);

//   const handleSubmit = async (publish: boolean) => {
//     try {
//       const values = await form.validateFields();
//       const formData = new FormData();
//       formData.append('name', values.name);
//       formData.append('description', values.description || '');
//       formData.append('startsAt', values.startsAt.toISOString());
//       formData.append('endsAt', values.endsAt.toISOString());
//       formData.append('publish', publish ? 'true' : 'false');
//       if (banner) formData.append('banner', banner);

//       await createCampaign(formData);
//       message.success(publish ? 'Đăng campaign thành công!' : 'Lưu nháp thành công!');
//       form.resetFields();
//       setBanner(null);
//       fetchCampaigns();
//     } catch (err: any) {
//       console.error(err);
//       message.error('Lỗi tạo campaign');
//     }
//   };

//   const columns = [
//     { title: 'Tên', dataIndex: 'name', key: 'name' },
//     { title: 'Mô tả', dataIndex: 'description', key: 'description' },
//     {
//       title: 'Bắt đầu',
//       dataIndex: 'startsAt',
//       key: 'startsAt',
//       render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
//     },
//     {
//       title: 'Kết thúc',
//       dataIndex: 'endsAt',
//       key: 'endsAt',
//       render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
//     },
//     {
//       title: 'Trạng thái',
//       dataIndex: 'publish',
//       key: 'publish',
//       render: (publish: boolean) => (publish ? 'Đang chạy' : 'Nháp'),
//     },
//   ];

//   return (
//     <div style={{ maxWidth: 800, margin: '20px auto' }}>
//       <h2>Quản lý Campaign</h2>

//       <Form form={form} layout="vertical" style={{ marginBottom: 30 }}>
//         <Form.Item
//           label="Tên Campaign"
//           name="name"
//           rules={[{ required: true, message: 'Vui lòng nhập tên campaign' }]}
//         >
//           <Input placeholder="Nhập tên campaign" />
//         </Form.Item>

//         <Form.Item label="Mô tả" name="description">
//           <TextArea rows={3} placeholder="Mô tả (không bắt buộc)" />
//         </Form.Item>

//         <Form.Item
//           label="Bắt đầu"
//           name="startsAt"
//           rules={[{ required: true, message: 'Vui lòng chọn ngày bắt đầu' }]}
//         >
//           <DatePicker showTime style={{ width: '100%' }} />
//         </Form.Item>

//         <Form.Item
//           label="Kết thúc"
//           name="endsAt"
//           rules={[{ required: true, message: 'Vui lòng chọn ngày kết thúc' }]}
//         >
//           <DatePicker showTime style={{ width: '100%' }} />
//         </Form.Item>

//         <Form.Item label="Banner">
//           <Upload
//             beforeUpload={file => {
//               setBanner(file);
//               return false;
//             }}
//             onRemove={() => setBanner(null)}
//             maxCount={1}
//             listType="picture"
//           >
//             <Button icon={<UploadOutlined />}>Chọn ảnh banner</Button>
//           </Upload>
//         </Form.Item>

//         <Form.Item>
//           <Button type="default" onClick={() => handleSubmit(false)}>
//             Lưu nháp
//           </Button>
//           <Button type="primary" onClick={() => handleSubmit(true)} style={{ marginLeft: 10 }}>
//             Đăng Campaign
//           </Button>
//         </Form.Item>
//       </Form>

//       <Table
//         dataSource={campaigns}
//         columns={columns}
//         rowKey="uuid"
//         loading={loading}
//         bordered
//       />
//     </div>
//   );
// }
