// // src/components/store/StoreCampaignList.tsx
// import React, { useEffect, useState } from 'react';
// import { Card, Row, Col, Button, Tag, message, Space, Input, Spin } from 'antd';
// import { SearchOutlined } from '@ant-design/icons';
// import dayjs from 'dayjs';
// import { getPendingCampaigns, Campaign } from '../../../../service/campaign.service';
// import { storeService } from '../../../../service/store.service';
// import { useNavigate } from 'react-router-dom';

// const { Search } = Input;

// const StoreCampaignList: React.FC = () => {
//   const [store, setStore] = useState<any>(null);
//   const [campaigns, setCampaigns] = useState<Campaign[]>([]);
//   const [filteredCampaigns, setFilteredCampaigns] = useState<Campaign[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [searchText, setSearchText] = useState('');
//   const [registeredIds, setRegisteredIds] = useState<number[]>([]);
//   const navigate = useNavigate();

//   useEffect(() => {
//     (async () => {
//       try {
//         const storeRes = await storeService.getMyStore();
//         if (!storeRes) throw new Error('Không tìm thấy cửa hàng');
//         setStore(storeRes);

//         // Lấy tất cả campaign có thể tham gia
//         const data = await getPendingCampaigns();

//         // ✅ Chỉ lấy campaign đang "active"
//         const activeCampaigns = data.filter((c: Campaign) => c.status === 'active');

//         // ✅ Lấy danh sách campaign mà store này đã được approved
//         const registered = activeCampaigns
//           .filter((c: Campaign) =>
//             c.stores?.some(
//               (s) => s.store?.id === storeRes.id && s.status === 'approved'
//             )
//           )
//           .map((c: Campaign) => c.id);

//         setRegisteredIds(registered);
//         setCampaigns(activeCampaigns);
//         setFilteredCampaigns(activeCampaigns);
//       } catch (err) {
//         console.error(err);
//         message.error('Không tải được danh sách chiến dịch');
//       } finally {
//         setLoading(false);
//       }
//     })();
//   }, []);

//   const handleSearch = (value: string) => {
//     const s = value.toLowerCase();
//     setSearchText(value);
//     setFilteredCampaigns(
//       campaigns.filter(
//         (c) =>
//           c.name.toLowerCase().includes(s) ||
//           (c.description && c.description.toLowerCase().includes(s))
//       )
//     );
//   };

//   const renderStatusTag = (status: string) => {
//     switch (status) {
//       case 'pending':
//         return <Tag color="blue">Sắp diễn ra</Tag>;
//       case 'active':
//         return <Tag color="green">Đang diễn ra</Tag>;
//       case 'ended':
//         return <Tag color="red">Kết thúc</Tag>;
//       default:
//         return <Tag color="default">Khác</Tag>;
//     }
//   };

//   const handleAction = (campaign: Campaign) => {
//     if (registeredIds.includes(campaign.id)) {
//       navigate(`/store/campaigns/${campaign.id}`); // → Chi tiết
//     } else {
//       navigate(`/store/campaigns/${campaign.id}/register`); // → Trang đăng ký sản phẩm
//     }
//   };

//   if (loading) return <Spin tip="Đang tải chiến dịch..." style={{ display: 'flex', justifyContent: 'center', marginTop: 50 }} />;

//   return (
//     <div style={{ padding: 20 }}>
//       <Space style={{ marginBottom: 20 }}>
//         <Search
//           placeholder="Tìm kiếm chiến dịch..."
//           allowClear
//           onSearch={handleSearch}
//           value={searchText}
//           onChange={(e) => handleSearch(e.target.value)}
//           prefix={<SearchOutlined />}
//           style={{ width: 300 }}
//         />
//       </Space>

//       <Row gutter={[16, 16]}>
//         {filteredCampaigns.length === 0 ? (
//           <p>Không có chiến dịch nào phù hợp.</p>
//         ) : (
//           filteredCampaigns.map((c) => (
//             <Col xs={24} sm={12} md={8} lg={6} key={c.id}>
//               <Card
//                 title={c.name}
//                 extra={renderStatusTag(c.status)}
//                 bordered
//                 hoverable
//               >
//                 <p>{c.description || 'Không có mô tả'}</p>
//                 <p>
//                   <strong>Bắt đầu:</strong> {dayjs(c.starts_at).format('DD/MM/YYYY')}
//                 </p>
//                 <p>
//                   <strong>Kết thúc:</strong> {dayjs(c.ends_at).format('DD/MM/YYYY')}
//                 </p>
//                 <Button
//                   type={registeredIds.includes(c.id) ? 'default' : 'primary'}
//                   block
//                   onClick={() => handleAction(c)}
//                 >
//                   {registeredIds.includes(c.id)
//                     ? 'Xem chi tiết'
//                     : 'Đăng ký tham gia'}
//                 </Button>
//               </Card>
//             </Col>
//           ))
//         )}
//       </Row>
//     </div>
//   );
// };

// export default StoreCampaignList;
