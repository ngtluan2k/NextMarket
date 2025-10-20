// StoreCampaignManager.tsx
import React, { useEffect, useState } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Tag,
  message,
  Select,
  Input,
  Space,
  Spin,
  Modal,
  Checkbox,
  List,
} from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  getPendingCampaigns,
  registerStoreForCampaign, // ✅ dùng service mới
  Campaign,
} from '../../../../service/campaign.service';
import { storeService } from '../../../../service/store.service';
import { productService } from '../../../../service/product.service'; // 👈 cần thêm nếu có API lấy sản phẩm
import { useNavigate } from 'react-router-dom';

interface Props {
  onSelectCampaign?: (id: number) => void;
}


const { Option } = Select;
const { Search } = Input;

const StoreCampaignManager: React.FC<Props> = ({ onSelectCampaign }) => {
  const [store, setStore] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'running' | 'upcoming' | 'expired' | 'draft' | null
  >(null);
  const [registeredCampaignIds, setRegisteredCampaignIds] = useState<number[]>(
    []
  );
  const [productList, setProductList] = useState<any[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(
    null
  );

  // 🟢 Lấy store của user
  const fetchStore = async () => {
    try {
      const res = await storeService.getMyStore();

      if (!res) {
        message.error('Bạn chưa có cửa hàng');
        return;
      }

      setStore(res);

      const level = res.storeLevels?.[0]?.level;
      if (level === 'premium') {
        fetchCampaigns(res.id);
        fetchProducts(res.id);
      }
    } catch (err) {
      console.error(err);
      message.error('Không lấy được thông tin cửa hàng');
    }
  };

  // 🟢 Lấy danh sách campaign
  const fetchCampaigns = async (storeId: number) => {
    setLoading(true);
    try {
      const data = await getPendingCampaigns();
      const registeredIds = data
        .filter((c: Campaign) =>
          c.stores?.some(
            (s) => s.store?.id === storeId && s.status === 'approved'
          )
        )
        .map((c: Campaign) => c.id);

      setRegisteredCampaignIds(registeredIds);
      setCampaigns(data);
    } catch (err) {
      console.error(err);
      message.error('Lỗi lấy danh sách campaign');
    } finally {
      setLoading(false);
    }
  };

  // 🟢 Lấy danh sách sản phẩm của cửa hàng
  const fetchProducts = async (storeId: number) => {
    try {
      const res = await productService.getStoreProducts(storeId);
      setProductList(res || []);
    } catch (err) {
      console.error(err);
      message.error('Không lấy được danh sách sản phẩm');
    }
  };

  useEffect(() => {
    fetchStore();
  }, []);

  useEffect(() => {
    handleFilter();
  }, [campaigns, searchText, statusFilter]);

  const handleFilter = () => {
    let data = [...campaigns];
    if (searchText.trim()) {
      const s = searchText.toLowerCase();
      data = data.filter(
        (c) =>
          c.name.toLowerCase().includes(s) ||
          (c.description && c.description.toLowerCase().includes(s))
      );
    }
    setFilteredCampaigns(data);
  };

  const renderStatusTag = (status: string) => {
    switch (status) {
      case 'pending':
        return <Tag color="blue">Sắp diễn ra</Tag>;
      case 'active':
        return <Tag color="green">Đang diễn ra</Tag>;
      case 'ended':
        return <Tag color="red">Hết hạn</Tag>;
      default:
        return <Tag color="default">N/A</Tag>;
    }
  };

  // 🟢 Khi bấm “Đăng ký” → mở modal chọn sản phẩm
  const openRegisterModal = (campaignId: number) => {
    setSelectedCampaignId(campaignId);
    setSelectedProducts([]); // reset
    setModalVisible(true);
  };

  // 🟢 Xác nhận đăng ký
  const handleRegister = async () => {
    if (!selectedCampaignId) return;
    if (selectedProducts.length === 0) {
      message.warning('Vui lòng chọn ít nhất 1 sản phẩm');
      return;
    }

    try {
      // ✅ Lấy danh sách items đúng format backend
      const items = selectedProducts.map((id) => {
        const p = productList.find((prod) => prod.id === id);
        return {
          productId: id,
          variantId: p?.variantId, // nếu có variantId
        };
      });

      await registerStoreForCampaign(selectedCampaignId, items);
      message.success('Đăng ký campaign thành công!');
      setRegisteredCampaignIds((prev) => [...prev, selectedCampaignId]);
      setModalVisible(false);
    } catch (err: any) {
      console.error(err);
      message.error(err.response?.data?.message || 'Đăng ký thất bại');
    }
  };

  // 🟡 Loading store
  if (!store) return <Spin tip="Đang tải thông tin cửa hàng..." />;

  // 🔴 Nếu không phải premium → chặn luôn
  const level = store?.storeLevels?.[0]?.level;
  if (level !== 'premium') {
    return (
      <div
        style={{
          padding: 40,
          textAlign: 'center',
          background: '#fff',
          borderRadius: 8,
        }}
      >
        <h2 style={{ fontWeight: 600 }}>
          Cửa hàng của bạn hiện là gói:{' '}
          <Tag color="default">{level || 'basic'}</Tag>
        </h2>
        <p style={{ fontSize: 16 }}>
          Chỉ cửa hàng <Tag color="gold">Premium</Tag> mới có thể tham gia chiến
          dịch quảng cáo.
        </p>
        <Button type="primary" size="large">
          Nâng cấp lên Premium
        </Button>
      </div>
    );
  }

  // 🟢 Nếu là premium → hiển thị campaign list
  return (
    <div style={{ padding: 20 }}>
      {/* Search & Filter */}
      <Space style={{ marginBottom: 20 }}>
        <Search
          placeholder="Tìm kiếm tên/mô tả..."
          allowClear
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 250 }}
          prefix={<SearchOutlined />}
        />
        <Select
          placeholder="Lọc trạng thái"
          allowClear
          style={{ width: 180 }}
          value={statusFilter}
          onChange={(val) => setStatusFilter(val)}
        >
          <Option value="running">Đang diễn ra</Option>
          <Option value="upcoming">Sắp diễn ra</Option>
          <Option value="expired">Hết hạn</Option>
          <Option value="draft">Nháp</Option>
        </Select>
      </Space>

      {/* Campaign Cards */}
      <Row gutter={[16, 16]}>
        {filteredCampaigns.map((c) => (
          <Col xs={24} sm={12} md={8} lg={6} key={c.id}>
            <Card
              hoverable
              title={c.name}
              extra={renderStatusTag(c.status)}
              bordered
                onClick={() => onSelectCampaign?.(c.id)}
// ← cả card click được
              style={{ cursor: 'pointer' }}
            >
              <p>{c.description || 'Không có mô tả'}</p>
              <p>Bắt đầu: {dayjs(c.starts_at).format('DD/MM/YYYY HH:mm')}</p>
              <p>Kết thúc: {dayjs(c.ends_at).format('DD/MM/YYYY HH:mm')}</p>
<Button
  type={registeredCampaignIds.includes(c.id) ? 'default' : 'primary'}
  disabled={registeredCampaignIds.includes(c.id)}
  onClick={(e) => {
    e.stopPropagation();
    onSelectCampaign?.(c.id);
  }}
>
  {registeredCampaignIds.includes(c.id) ? 'Đã đăng ký' : 'Đăng ký'}
</Button>

            </Card>
          </Col>
        ))}
      </Row>

      {/* 🟢 Modal chọn sản phẩm */}
      <Modal
        title="Chọn sản phẩm tham gia chiến dịch"
        open={modalVisible}
        onOk={handleRegister}
        onCancel={() => setModalVisible(false)}
        okText="Xác nhận đăng ký"
      >
        <List
          dataSource={productList}
          renderItem={(p) => (
            <List.Item>
              <Checkbox
                checked={selectedProducts.includes(p.id)}
                onChange={(e) => {
                  if (e.target.checked)
                    setSelectedProducts((prev) => [...prev, p.id]);
                  else
                    setSelectedProducts((prev) =>
                      prev.filter((id) => id !== p.id)
                    );
                }}
              >
                {p.name}
              </Checkbox>
            </List.Item>
          )}
        />
      </Modal>
    </div>
  );
};

export default StoreCampaignManager;
