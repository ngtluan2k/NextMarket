'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Table,
  Card,
  Tag,
  Button,
  Pagination,
  Spin,
  Image,
  Tooltip,
  message,
} from 'antd';
import {
  Eye,
  Package,
  Calendar,
  RefreshCw,
  Coins,
  CoinsIcon,
} from 'lucide-react';
import {
  getCommissionHistory,
  getCommissionSummary,
} from '../../../../../../service/afiliate/affiliate-links.service';
import {
  CommissionHistory,
  CommissionHistoryItem,
  CommissionSummary,
} from '../../../../../types/affiliate-links';

const AffiliateTransaction = () => {
  const [commissionData, setCommissionData] =
    useState<CommissionHistory | null>(null);
  const [commissionSummary, setCommissionSummary] =
    useState<CommissionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchTimeRef = useRef<number>(0);

  const fetchCommissions = useCallback(
    async (page: number, isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const data = await getCommissionHistory(page, pageSize);
        setCommissionData(data);

        const sumdata = await getCommissionSummary();

        setCommissionSummary(sumdata);

        console.log(`summary data: `, sumdata);

        lastFetchTimeRef.current = Date.now();

        if (isRefresh) {
          message.success(' Dữ liệu đã cập nhật');
        }
      } catch (error) {
        console.error('Failed to fetch commission history:', error);
        if (isRefresh) {
          message.error(' Cập nhật thất bại');
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [pageSize]
  );

  const handleRefresh = useCallback(() => {
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTimeRef.current;

    if (timeSinceLastFetch < 2000) {
      message.warning(' Vui lòng chờ trước khi cập nhật lại');
      return;
    }

    fetchCommissions(currentPage, true);
  }, [currentPage, fetchCommissions]);

  useEffect(() => {
    fetchCommissions(currentPage);

    const handleCommissionUpdate = () => {
      console.log('Commission update - refreshing transaction list...');

      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }

      refreshTimeoutRef.current = setTimeout(() => {
        fetchCommissions(currentPage, false);
      }, 1000);
    };

    window.addEventListener('commission-earned', handleCommissionUpdate);
    window.addEventListener('commission-paid', handleCommissionUpdate);
    window.addEventListener('commission-reversed', handleCommissionUpdate);

    return () => {
      window.removeEventListener('commission-earned', handleCommissionUpdate);
      window.removeEventListener('commission-paid', handleCommissionUpdate);
      window.removeEventListener('commission-reversed', handleCommissionUpdate);

      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [currentPage, fetchCommissions]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const columns = [
    {
      title: 'Sản phẩm',
      key: 'product',
      render: (record: CommissionHistoryItem) => (
        <div className="flex items-center space-x-3">
          <Image
            src={record.product.image || '/placeholder.svg'}
            alt={record.product.name}
            width={40}
            height={40}
            className="rounded-md object-cover"
            fallback="/placeholder.svg"
          />
          <div>
            <p className="font-medium text-gray-900 truncate max-w-[200px]">
              {record.product.name}
            </p>
            <p className="text-sm text-gray-500">ID: {record.product.id}</p>
          </div>
        </div>
      ),
    },
    {
      title: 'Đơn hàng',
      key: 'order',
      render: (record: CommissionHistoryItem) => (
        <div>
          <p className="font-medium text-gray-900">
            #{record.order.order_number}
          </p>
          <p className="text-sm text-gray-500">
            Tổng: VND {record.order.total_amount}
          </p>
        </div>
      ),
    },
    {
      title: 'Hoa hồng',
      key: 'commission',
      render: (record: CommissionHistoryItem) => (
        <div>
          <p className="font-bold text-green-600">
            VND {record.amount.toFixed(2)}
          </p>
          <p className="text-sm text-gray-500">
            {record.rate_percent}% - Cấp {record.level}
          </p>
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'PAID' ? 'green' : 'orange'}>
          {status === 'PAID' ? 'Đã trả' : 'Đang chờ'}
        </Tag>
      ),
    },
    {
      title: 'Ngày tạo',
      key: 'created_at',
      render: (record: CommissionHistoryItem) => (
        <div>
          <p className="text-sm text-gray-900">
            {new Date(record.created_at).toLocaleDateString('vi-VN')}
          </p>
          <p className="text-xs text-gray-500">
            {new Date(record.created_at).toLocaleTimeString('vi-VN')}
          </p>
        </div>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (record: CommissionHistoryItem) => (
        <div className="flex space-x-2">
          <Tooltip title="Xem chi tiết đơn hàng">
            <Button
              type="text"
              size="small"
              icon={<Eye className="h-4 w-4" />}
              onClick={() => {
                console.log('View order:', record.order.id);
              }}
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  if (loading && !commissionData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-gray-200 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Coins className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Hoa hồng tích lũy</p>
              <p className="text-lg font-bold text-gray-900">
                {commissionSummary?.totalEarned} coins
              </p>
            </div>
          </div>
        </Card>

        <Card className="border-gray-200 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Tổng đơn hàng</p>
              <p className="text-lg font-bold text-gray-900">
                {commissionSummary?.totalOrders} đơn
              </p>
            </div>
          </div>
        </Card>

        <Card className="border-gray-200 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CoinsIcon className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Đã thanh toán</p>
              <p className="text-lg font-bold text-green-600">
                {commissionSummary?.totalPaid} coins
              </p>
            </div>
          </div>
        </Card>

        <Card className="border-gray-200 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Calendar className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Đang chờ</p>
              <p className="text-lg font-bold text-orange-600">
                {commissionSummary?.totalPending} coins
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="border-gray-200 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Giao dịch gần đây
            </h3>
            <p className="text-sm text-gray-600">
              Theo dõi tất cả hoa hồng từ các đơn hàng thành công
            </p>
          </div>
          <Tooltip title="Cập nhật dữ liệu mới nhất">
            <Button
              type="primary"
              ghost
              icon={
                <RefreshCw
                  className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
                />
              }
              onClick={handleRefresh}
              loading={refreshing}
              disabled={refreshing}
            >
              Cập nhật
            </Button>
          </Tooltip>
        </div>

        <Table
          columns={columns}
          dataSource={commissionData?.commissions || []}
          rowKey="id"
          loading={loading}
          pagination={false}
          scroll={{ x: 800 }}
          locale={{
            emptyText: (
              <div className="py-8 text-center">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Chưa có hoa hồng nào</p>
                <p className="text-sm text-gray-400">
                  Hoa hồng sẽ xuất hiện khi có đơn hàng thành công từ liên kết
                  của bạn
                </p>
              </div>
            ),
          }}
        />

        {commissionData && commissionData.pagination.total > pageSize && (
          <div className="mt-4 flex justify-center">
            <Pagination
              current={currentPage}
              total={commissionData.pagination.total}
              pageSize={pageSize}
              onChange={handlePageChange}
              showSizeChanger={false}
              showQuickJumper
              showTotal={(total, range) =>
                `${range[0]}-${range[1]} của ${total} giao dịch`
              }
            />
          </div>
        )}
      </Card>
    </div>
  );
};

export default AffiliateTransaction;
