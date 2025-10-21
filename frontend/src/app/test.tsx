// import React, { useEffect, useState } from 'react';
// import {
//   Card,
//   Form,
//   InputNumber,
//   Upload,
//   Button,
//   message,
//   Checkbox,
//   Row,
//   Col,
//   Typography,
//   Divider,
//   Space,
//   Input,
// } from 'antd';
// import { UploadOutlined } from '@ant-design/icons';
// import {
//   getCampaignStoreDetail,
//   publishCampaign,
//   CampaignStoreDetail,
// } from '../service/campaign.service';

// const { Title, Text } = Typography;

// export default function PublishCampaignForm() {
//   const [campaignId, setCampaignId] = useState<number>(10);
//   const [banners, setBanners] = useState<File[]>([]);
//   const [storeProducts, setStoreProducts] = useState<any[]>([]);
//   const [selectedProducts, setSelectedProducts] = useState<
//     { productId: number; variantId?: number }[]
//   >([]);
//   const [vouchers, setVouchers] = useState([{ voucher_id: 1, type: 'system' }]);
//   const [loading, setLoading] = useState(false);
//   const [result, setResult] = useState<string>('');

//   useEffect(() => {
//     const fetchStoreProducts = async () => {
//       try {
//         const data = await getCampaignStoreDetail(campaignId, 21);
//         console.log('📦 Campaign store products:', data);
//         // Nếu data trả về là mảng như bạn log
//         setStoreProducts(data.products || []);

//       } catch (err) {
//         console.error(err);
//         message.error('Không thể tải sản phẩm từ store');
//       }
//     };
//     fetchStoreProducts();
//   }, [campaignId]);

//   const handleBannerChange = (info: any) => {
//     const files = info.fileList
//       .map((f: any) => f.originFileObj)
//       .filter(Boolean);
//     setBanners(files);
//   };

//   const handleProductToggle = (
//     productId: number,
//     variantId?: number,
//     checked?: boolean
//   ) => {
//     if (checked) {
//       setSelectedProducts((prev) => [...prev, { productId, variantId }]);
//     } else {
//       setSelectedProducts((prev) =>
//         prev.filter(
//           (p) => !(p.productId === productId && p.variantId === variantId)
//         )
//       );
//     }
//   };

//   const handleSubmit = async () => {
//     try {
//       setLoading(true);
//       const payload = {
//         campaignId,
//         images: banners.map((file) => ({ file })),
//         sections: [
//           { type: 'banner', title: 'Main Banner', position: 0 },
//           { type: 'products', items: selectedProducts },
//         ],
//         vouchers,
//       };
//       const res = await publishCampaign(payload);
//       setResult(JSON.stringify(res, null, 2));
//       message.success('Publish thành công!');
//     } catch (err) {
//       console.error(err);
//       message.error('Publish thất bại!');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <Card style={{ margin: 24 }}>
//       <Title level={3}>Publish Campaign</Title>

//       <Form layout="vertical" onFinish={handleSubmit}>
//         <Form.Item label="Campaign ID">
//           <InputNumber
//             min={1}
//             value={campaignId}
//             onChange={(val) => setCampaignId(val || 1)}
//           />
//         </Form.Item>

//         <Divider />

//         <Form.Item label="Upload Banners">
//           <Upload
//             multiple
//             beforeUpload={() => false}
//             onChange={handleBannerChange}
//             accept="image/*"
//           >
//             <Button icon={<UploadOutlined />}>Chọn ảnh</Button>
//           </Upload>
//         </Form.Item>

//         <Divider />

//         <Form.Item label="Chọn Vouchers (JSON)">
//           <Input.TextArea
//             rows={4}
//             value={JSON.stringify(vouchers, null, 2)}
//             onChange={(e) => {
//               try {
//                 setVouchers(JSON.parse(e.target.value));
//               } catch {
//                 message.warning('JSON không hợp lệ');
//               }
//             }}
//           />
//         </Form.Item>

//         <Divider />

//         <Title level={4}>Chọn sản phẩm & biến thể</Title>
//         {storeProducts.length === 0 ? (
//           <Text type="secondary">Không có sản phẩm nào trong store.</Text>
//         ) : (
//           storeProducts.map((item) => {
//             const prod = item.product; // ✅ Lấy product từ object

//             return (
//               <Card key={prod.id} size="small" style={{ marginBottom: 16 }}>
//                 <Title level={5}>{prod.name}</Title>
//                 <Space direction="vertical">
//                   {prod.variants && prod.variants.length > 0 ? (
//                     <Row gutter={[8, 8]}>
//                       {prod.variants.map((v: any) => (
//                         <Col key={v.id} span={8}>
//                           <Checkbox
//                             onChange={(e) =>
//                               handleProductToggle(
//                                 prod.id,
//                                 v.id,
//                                 e.target.checked
//                               )
//                             }
//                           >
//                             {v.variant_name} — {v.price}₫
//                           </Checkbox>
//                         </Col>
//                       ))}
//                     </Row>
//                   ) : (
//                     <Checkbox
//                       onChange={(e) =>
//                         handleProductToggle(
//                           prod.id,
//                           undefined,
//                           e.target.checked
//                         )
//                       }
//                     >
//                       {prod.name} — {prod.base_price}₫
//                     </Checkbox>
//                   )}
//                 </Space>
//               </Card>
//             );
//           })
//         )}

//         <Divider />

//         <Form.Item>
//           <Button type="primary" htmlType="submit" loading={loading}>
//             Publish
//           </Button>
//         </Form.Item>
//       </Form>

//       {result && (
//         <>
//           <Divider />
//           <Title level={5}>Kết quả:</Title>
//           <pre style={{ background: '#f5f5f5', padding: 12 }}>{result}</pre>
//         </>
//       )}
//     </Card>
//   );
// }
