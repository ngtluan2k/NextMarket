import React, { useState, useEffect } from 'react';
import { Card, List, Tag, Button, DatePicker, Input, Empty, Spin, Pagination } from 'antd';
import { 
  WalletOutlined,
  SearchOutlined,
  FilterOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  DollarOutlined
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';
import { fetchMyWalletTransactions } from '../../../../service/wallet.service';
import { WalletTransaction } from '../../../types/wallet';

dayjs.extend(relativeTime);
dayjs.locale('vi');

const { RangePicker } = DatePicker;

interface WalletTransactionHistoryProps {
  className?: string;
}

export const WalletTransactionHistory: React.FC<WalletTransactionHistoryProps> = ({ className = '' }) => {
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([null, null]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadTransactions(currentPage);
  }, [currentPage]);

  useEffect(() => {
    filterTransactions();
  }, [transactions, searchText, dateRange]);

  const loadTransactions = async (page: number) => {
    try {
      setLoading(true);
      const response = await fetchMyWalletTransactions(page, pageSize);
      setTransactions(response.transactions);
      setTotal(response.total);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTransactions = () => {
    let filtered = [...transactions];

    // Filter by search text
    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(t => 
        t.type.toLowerCase().includes(search) ||
        t.reference?.toLowerCase().includes(search) ||
        t.description?.toLowerCase().includes(search)
      );
    }

    // Filter by date range
    if (dateRange[0] && dateRange[1]) {
      filtered = filtered.filter(t => {
        const txDate = dayjs(t.created_at);
        return txDate.isAfter(dateRange[0]) && txDate.isBefore(dateRange[1]?.add(1, 'day'));
      });
    }

    setFilteredTransactions(filtered);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const getTransactionIcon = (amount: number) => {
    return amount >= 0 ? (
      <ArrowUpOutlined style={{ color: '#52c41a' }} />
    ) : (
      <ArrowDownOutlined style={{ color: '#ff4d4f' }} />
    );
  };

  const getTransactionColor = (amount: number) => {
    return amount >= 0 ? 'success' : 'error';
  };

  const getTypeDisplay = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'affiliate_commission': 'Hoa hồng Affiliate',
      'Hủy hoa hồng': 'Hoàn trả hoa hồng',
      'review_reward': 'Thưởng đánh giá',
      'withdrawal': 'Rút tiền',
      'deposit': 'Nạp tiền',
      'refund': 'Hoàn tiền',
      'purchase': 'Mua hàng',
    };
    return typeMap[type] || type;
  };

  const getReferenceDisplay = (reference?: string) => {
    if (!reference) return null;
    
    if (reference.startsWith('commission:')) {
      return `Hoa hồng #${reference.split(':')[1]}`;
    }
    if (reference.startsWith('commission_reversal:')) {
      return `Hoàn trả #${reference.split(':')[1]}`;
    }
    if (reference.startsWith('review:')) {
      return `Đánh giá #${reference.split(':')[1]}`;
    }
    return reference;
  };

  return (
    <Card 
      className={className}
      title={
        <div className="flex items-center gap-2">
          <WalletOutlined className="text-lg" />
          <span>Lịch sử Giao dịch Ví</span>
        </div>
      }
    >
      {/* Search and Filter */}
      <div className="mb-4 space-y-2">
        <Input
          placeholder="Tìm kiếm giao dịch..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
        />
        <RangePicker
          style={{ width: '100%' }}
          placeholder={['Từ ngày', 'Đến ngày']}
          format="DD/MM/YYYY"
          value={dateRange}
          onChange={(dates) => setDateRange(dates as [Dayjs | null, Dayjs | null])}
          suffixIcon={<FilterOutlined />}
        />
      </div>

      {/* Transactions List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Spin size="large" />
        </div>
      ) : filteredTransactions.length === 0 ? (
        <Empty
          description={
            searchText || dateRange[0] || dateRange[1]
              ? "Không tìm thấy giao dịch phù hợp"
              : "Chưa có giao dịch nào"
          }
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <>
          <List
            dataSource={filteredTransactions}
            renderItem={(transaction) => (
              <List.Item
                className="hover:bg-gray-50 transition-colors"
              >
                <List.Item.Meta
                  avatar={
                    <div className="text-2xl">
                      {getTransactionIcon(transaction.amount)}
                    </div>
                  }
                  title={
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">
                        {getTypeDisplay(transaction.type)}
                      </span>
                      <Tag color={getTransactionColor(transaction.amount)}>
                        {formatCurrency(transaction.amount)}
                      </Tag>
                    </div>
                  }
                  description={
                    <div className="space-y-1">
                      {getReferenceDisplay(transaction.reference) && (
                        <div className="text-sm text-gray-600">
                          {getReferenceDisplay(transaction.reference)}
                        </div>
                      )}
                      {transaction.description && (
                        <div className="text-sm text-gray-500">
                          {transaction.description}
                        </div>
                      )}
                      <div className="text-xs text-gray-400">
                        {dayjs(transaction.created_at).fromNow()} • {dayjs(transaction.created_at).format('DD/MM/YYYY HH:mm')}
                      </div>
                    </div>
                  }
                />
              </List.Item>
            )}
          />

          {/* Pagination */}
          {total > pageSize && (
            <div className="mt-4 flex justify-center">
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={total}
                onChange={(page) => setCurrentPage(page)}
                showSizeChanger={false}
                showTotal={(total, range) => `${range[0]}-${range[1]} của ${total} giao dịch`}
              />
            </div>
          )}
        </>
      )}

      {/* Summary */}
      {filteredTransactions.length > 0 && (
        <div className="mt-4 pt-4 border-t text-sm text-gray-500">
          Hiển thị {filteredTransactions.length} giao dịch
        </div>
      )}
    </Card>
  );
};
