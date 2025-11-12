'use client';

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Input, 
  Button, 
  Table, 
  Tag, 
  Image, 
  Space, 
  Pagination, 
  Spin, 
  message, 
  Modal,
  Select,
  Form,
  Tooltip,
  QRCode,
  Alert,
  Typography
} from 'antd';
import { Search, Plus, Link, Package, Store, Tag as TagIcon } from 'lucide-react';
import { 
  searchProducts, 
} from '../../../../../../service/afiliate/affiliate-links.service';
import { 
  createAffiliateLink
} from '../../../../../../service/afiliate/affiliate-users.service';
import { CreateLinkRequest, ProductSearchResponse, ProductSearchResult } from '../../../../../types/affiliate-links';
import { getAllAffiliatePrograms } from '../../../../../../service/afiliate/affiliate.service';

const { Search: SearchInput } = Input;
const { Option } = Select;

interface AffiliateProgram {
  id: number;
  name: string;
  commission_value: number;
  status: string;
}

const ProductSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ProductSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(12);
  const [createLinkModal, setCreateLinkModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductSearchResult | null>(null);
  const [programs, setPrograms] = useState<AffiliateProgram[]>([]);
  const [form] = Form.useForm();
  
  // QR sharing state
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [createdLink, setCreatedLink] = useState<string>('');
  const [createdProduct, setCreatedProduct] = useState<ProductSearchResult | null>(null);

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      const data = await getAllAffiliatePrograms();
      setPrograms(data);
    } catch (error) {
      console.error('Failed to fetch programs:', error);
    }
  };

  const handleSearch = async (query: string, page = 1) => {
    if (!query.trim()) return;

    try {
      setLoading(true);
      const data = await searchProducts(query, page, pageSize);
      setSearchResults(data);
      setCurrentPage(page);
    } catch (error) {
      console.error('Search failed:', error);
      message.error('Tìm kiếm thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    if (searchQuery.trim()) {
      handleSearch(searchQuery, page);
    }
  };

  const openCreateLinkModal = (product: ProductSearchResult) => {
    setSelectedProduct(product);
    setCreateLinkModal(true);
    form.resetFields();
  };

  const handleCreateLink = async (values: any) => {
    if (!selectedProduct) return;

    try {
      const payload: CreateLinkRequest = {
        productId: selectedProduct.id,
        variantId: values.variantId,
        programId: values.programId,
      };

      const result = await createAffiliateLink(payload);
      message.success('Tạo liên kết affiliate thành công!');
      
      // Show QR sharing modal
      setCreatedLink(result.affiliate_links);
      setCreatedProduct(selectedProduct);
      setCreateLinkModal(false);
      setShareModalVisible(true);
      
      form.resetFields();
    } catch (error: any) {
      console.error('Failed to create affiliate link:', error);
      
      // Don't show additional error message if it's rate limit (already handled in service)
      if (error.message !== 'RATE_LIMIT_EXCEEDED') {
        message.error('Tạo liên kết thất bại');
      }
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      message.success('Đã sao chép liên kết!');
    } catch (error) {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      message.success('Đã sao chép liên kết!');
    }
  };

  const columns = [
    {
      title: 'Sản phẩm',
      key: 'product',
      render: (record: ProductSearchResult) => {
        // Get the best image to display
        const primaryImage = record.media?.find(m => m.is_primary)?.url;
        const firstImage = record.media?.[0]?.url;
        const displayImage = primaryImage || firstImage || record.image || '/placeholder.svg';
        
        return (
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Image
                src={displayImage}
                alt={record.name}
                width={60}
                height={60}
                className="rounded-md object-cover"
                fallback="/placeholder.svg"
              />
              {record.media && record.media.length > 1 && (
                <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {record.media.length}
                </div>
              )}
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 mb-1 line-clamp-2">
                {record.name}
              </h4>
              <p className="text-sm text-gray-500 line-clamp-1">
                {record.description}
              </p>
              <div className="flex items-center space-x-2 mt-1">
                <Tag icon={<Store className="h-3 w-3" />} color="blue">
                  {record.store.name}
                </Tag>
                {record.brand && (
                  <Tag icon={<TagIcon className="h-3 w-3" />} color="green">
                    {record.brand.name}
                  </Tag>
                )}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      title: 'Giá',
      key: 'price',
      width: 120,
      render: (record: ProductSearchResult) => (
        <div>
          <p className="font-bold text-lg text-gray-900">
            VND {record.base_price?.toLocaleString() || 'N/A'}
          </p>
          {record.variants.length > 0 && (
            <p className="text-sm text-gray-500">
              {record.variants.length} biến thể
            </p>
          )}
        </div>
      ),
    },
    {
      title: 'Danh mục',
      key: 'categories',
      width: 150,
      render: (record: ProductSearchResult) => (
        <div className="space-y-1">
          {record.categories.slice(0, 2).map((cat, index) => (
            <Tag key={index} color="purple">
              {cat.name}
            </Tag>
          ))}
          {record.categories.length > 2 && (
            <Tag color="default">
              +{record.categories.length - 2}
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 120,
      render: (record: ProductSearchResult) => (
        <Button
          type="primary"
          icon={<Link className="h-4 w-4" />}
          onClick={() => openCreateLinkModal(record)}
          size="small"
        >
          Tạo liên kết
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <Card className="border-gray-200 shadow-sm">
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Tìm kiếm sản phẩm
            </h2>
            <p className="text-gray-600">
              Tìm kiếm sản phẩm để tạo liên kết affiliate và bắt đầu kiếm hoa hồng
            </p>
          </div>
          
          <SearchInput
            placeholder="Nhập tên sản phẩm, thương hiệu hoặc từ khóa..."
            size="large"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onSearch={(value) => handleSearch(value, 1)}
            enterButton={
              <Button type="primary" icon={<Search className="h-4 w-4" />}>
                Tìm kiếm
              </Button>
            }
          />
        </div>
      </Card>

      {/* Search Results */}
      {searchResults && (
        <Card className="border-gray-200 shadow-sm">
          <div className="mb-4 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Kết quả tìm kiếm
              </h3>
              <p className="text-sm text-gray-600">
                Tìm thấy {searchResults.pagination.total} sản phẩm cho "{searchQuery}"
              </p>
            </div>
          </div>

          <Table
            columns={columns}
            dataSource={searchResults.products}
            rowKey="id"
            loading={loading}
            pagination={false}
            scroll={{ x: 800 }}
            locale={{
              emptyText: (
                <div className="py-8 text-center">
                  <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Không tìm thấy sản phẩm nào</p>
                  <p className="text-sm text-gray-400">
                    Thử tìm kiếm với từ khóa khác
                  </p>
                </div>
              ),
            }}
          />

          {searchResults.pagination.total > pageSize && (
            <div className="mt-4 flex justify-center">
              <Pagination
                current={currentPage}
                total={searchResults.pagination.total}
                pageSize={pageSize}
                onChange={handlePageChange}
                showSizeChanger={false}
                showQuickJumper
                showTotal={(total, range) =>
                  `${range[0]}-${range[1]} của ${total} sản phẩm`
                }
              />
            </div>
          )}
        </Card>
      )}

      {/* Create Link Modal */}
      <Modal
        title="Tạo liên kết affiliate"
        open={createLinkModal}
        onCancel={() => setCreateLinkModal(false)}
        footer={null}
        width={600}
      >
        {selectedProduct && (
          <div className="space-y-4">
            {/* Product Info */}
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="relative">
                <Image
                  src={selectedProduct.media?.find(m => m.is_primary)?.url || 
                       selectedProduct.media?.[0]?.url || 
                       selectedProduct.image || 
                       '/placeholder.svg'}
                  alt={selectedProduct.name}
                  width={50}
                  height={50}
                  className="rounded-md object-cover"
                  fallback="/placeholder.svg"
                />
                {selectedProduct.media && selectedProduct.media.length > 1 && (
                  <Tooltip title={`${selectedProduct.media.length} hình ảnh`}>
                    <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                      {selectedProduct.media.length}
                    </div>
                  </Tooltip>
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{selectedProduct.name}</h4>
                <p className="text-sm text-gray-500">
                  VND {selectedProduct.base_price?.toLocaleString()}
                </p>
                {selectedProduct.media && selectedProduct.media.length > 1 && (
                  <p className="text-xs text-blue-600">
                    {selectedProduct.media.length} hình ảnh có sẵn
                  </p>
                )}
              </div>
            </div>

            {/* Create Link Form */}
            <Form
              form={form}
              layout="vertical"
              onFinish={handleCreateLink}
            >
              <Form.Item
                label="Chương trình affiliate"
                name="programId"
                rules={[{ required: true, message: 'Vui lòng chọn chương trình' }]}
              >
                <Select placeholder="Chọn chương trình">
                  {programs.map((program) => (
                    <Option key={program.id} value={program.id}>
                      {program.name} ({program.commission_value}%)
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              {selectedProduct.variants.length > 0 && (
                <Form.Item
                  label="Biến thể sản phẩm"
                  name="variantId"
                >
                  <Select placeholder="Chọn biến thể (tùy chọn)">
                    {selectedProduct.variants.map((variant) => (
                      <Option key={variant.id} value={variant.id}>
                        {variant.name} - VND {variant.price?.toLocaleString()}
                        {variant.stock && ` (Còn ${variant.stock})`}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              )}

              <div className="flex justify-end space-x-2">
                <Button onClick={() => setCreateLinkModal(false)}>
                  Hủy
                </Button>
                <Button type="primary" htmlType="submit" icon={<Plus className="h-4 w-4" />}>
                  Tạo liên kết
                </Button>
              </div>
            </Form>
          </div>
        )}
      </Modal>

      {/* Empty State */}
      {!searchResults && (
        <Card className="border-gray-200 shadow-sm">
          <div className="py-16 text-center">
            <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Bắt đầu tìm kiếm sản phẩm
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Sử dụng thanh tìm kiếm ở trên để tìm sản phẩm bạn muốn tạo liên kết affiliate.
              Bạn có thể tìm theo tên sản phẩm, thương hiệu hoặc từ khóa.
            </p>
          </div>
        </Card>
      )}

      {/* QR Sharing Modal */}
      <Modal
        title="🎉 Liên kết affiliate đã tạo thành công!"
        open={shareModalVisible}
        onCancel={() => setShareModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setShareModalVisible(false)}>
            Đóng
          </Button>,
          <Button 
            key="copy" 
            type="primary" 
            onClick={() => copyToClipboard(createdLink)}
          >
            Sao chép liên kết
          </Button>
        ]}
        width={600}
      >
        {createdProduct && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: '20px' }}>
              <Typography.Title level={4}>
                {createdProduct.name}
              </Typography.Title>
              <Typography.Text type="secondary">
                ID: {createdProduct.id} | Thương hiệu: {(createdProduct as any).brand || 'N/A'}
              </Typography.Text>
            </div>
            
            {/* QR Code */}
            <div style={{ marginBottom: '20px' }}>
              <QRCode
                value={createdLink}
                size={200}
                style={{ margin: '0 auto' }}
              />
            </div>
            
            {/* Link Input */}
            <div style={{ marginBottom: '10px' }}>
              <Typography.Text strong>Liên kết affiliate của bạn:</Typography.Text>
            </div>
            <Input.TextArea
              value={createdLink}
              readOnly
              rows={3}
              style={{ 
                fontFamily: 'monospace', 
                fontSize: '12px',
                marginBottom: '10px'
              }}
            />
            
            <Alert
              message="Cách chia sẻ liên kết"
              description={
                <div>
                  <p>• <strong>QR Code:</strong> Chụp ảnh màn hình hoặc lưu QR code để chia sẻ trực tiếp</p>
                  <p>• <strong>Liên kết:</strong> Sao chép và chia sẻ qua tin nhắn, email, mạng xã hội</p>
                  <p>• <strong>Hoa hồng:</strong> Bạn sẽ nhận được hoa hồng khi có người mua qua liên kết này</p>
                </div>
              }
              type="success"
              showIcon
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ProductSearch;
