import { useEffect, useState, useCallback } from 'react';
import { orderService } from '../../service/order.service';
import { storeService } from '../../service/store.service';
import { message } from 'antd';
import { Sale, ProductItem, Payment } from '../types/order';

interface UseStoreOrdersParams {
  status?: string;
  paymentStatus?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

interface PaginationState {
  current: number;
  pageSize: number;
  total: number;
}

export function useMyStoreOrders(params: UseStoreOrdersParams = {}) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storeId, setStoreId] = useState<number | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const { status, paymentStatus, startDate, endDate, search } = params;

  // Lấy storeId khi component mount
  useEffect(() => {
    const fetchStore = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Vui lòng đăng nhập.');
          return;
        }

        const store = await storeService.getMyStore();
        if (store?.id) {
          setStoreId(store.id);
        } else {
          setError('Không tìm thấy cửa hàng của bạn.');
        }
      } catch (err: any) {
        console.error('❌ Lỗi khi lấy store:', err);
        setError(err.message || 'Không thể lấy thông tin cửa hàng.');
      }
    };

    fetchStore();
  }, []);
  useEffect(() => {
    setPagination((prev) => ({ ...prev, current: 1 }));
  }, [status, paymentStatus, startDate, endDate, search]);

  // Hàm load danh sách đơn hàng với pagination
  const fetchSales = useCallback(async () => {
    if (!storeId) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Vui lòng đăng nhập.');

      // Build query params
      const queryParams: any = {
        page: pagination.current,
        limit: pagination.pageSize,
      };

      // Chỉ thêm params nếu có giá trị và không phải 'all'
      if (status && status !== 'all') {
        queryParams.status = status;
      }
      if (paymentStatus && paymentStatus !== 'all') {
        queryParams.paymentStatus = paymentStatus;
      }
      if (startDate) {
        queryParams.fromDate = startDate;
      }
      if (endDate) {
        queryParams.toDate = endDate;
      }
      if (search && search.trim()) {
        queryParams.search = search.trim();
      }

      console.log('🔍 Fetching orders with params:', queryParams);

      const response = await orderService.getOrdersByStore(
        storeId,
        queryParams
      );

      console.log('📦 Response:', response);

      // Xử lý dữ liệu trả về từ API
      let orders: Sale[] = [];
      let total = 0;
      let currentPage = pagination.current;
      let pageSize = pagination.pageSize;

      // Backend trả về { data, total, page, limit }
      if (response && typeof response === 'object') {
        if (Array.isArray(response.data)) {
          orders = response.data;
          total = response.total || 0;
          currentPage = response.page || pagination.current;
          pageSize = response.limit || pagination.pageSize;
        } else if (Array.isArray(response)) {
          // Fallback nếu backend trả về array trực tiếp
          orders = response;
          total = response.length;
        }
      }

      // Ánh xạ dữ liệu
      const mappedOrders = orders.map((order) => ({
        ...order,
        orderNumber:
          order.orderNumber || `ORD-${String(order.id).padStart(3, '0')}`,
      }));

      console.log('✅ Mapped orders:', mappedOrders.length, 'Total:', total);

      setSales(mappedOrders);
      console.log('Updated sales state with', mappedOrders.length, 'orders.');
      setPagination((prev) => ({
        ...prev,
        total,
        current: currentPage,
        pageSize,
      }));
    } catch (err: any) {
      console.error('❌ Lỗi khi tải đơn hàng:', err);
      setError(err.message || 'Không thể tải danh sách đơn hàng.');
      setSales([]);
      setPagination((prev) => ({ ...prev, total: 0 }));
    } finally {
      setLoading(false);
    }
  }, [
    storeId,
    status,
    paymentStatus,
    startDate,
    endDate,
    search,
    pagination.current,
    pagination.pageSize,
  ]);
  // Fetch khi storeId hoặc params thay đổi
  useEffect(() => {
    if (storeId) {
      fetchSales();
    }
  }, [fetchSales]);

  // Handler cho Table onChange
const handleTableChange = useCallback(
  (newPagination: any) => {
    setPagination((prev) => ({
      ...prev,
      current: newPagination.current,
      pageSize: newPagination.pageSize,
    }));
  },
  []
);

  // Hàm tạo đơn hàng mới
  const createOrder = useCallback(
    async (orderData: Partial<Sale>) => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Vui lòng đăng nhập.');

        if (!storeId) throw new Error('Không tìm thấy cửa hàng của bạn.');

        const response = await orderService.createOrderAdmin(orderData);

        // Refresh lại danh sách
        await fetchSales();

        return response;
      } catch (err: any) {
        console.error('❌ Lỗi khi tạo đơn hàng:', err);
        throw new Error(err.message || 'Không thể tạo đơn hàng.');
      }
    },
    [storeId, fetchSales]
  );

  // Hàm cập nhật đơn hàng
  const updateOrder = useCallback(
    async (orderId: number, orderData: Partial<Sale>) => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Vui lòng đăng nhập.');

        const response = await orderService.updateOrderAdmin(
          orderId,
          orderData
        );

        // Refresh lại danh sách
        await fetchSales();

        return response;
      } catch (err: any) {
        console.error('❌ Lỗi khi cập nhật đơn hàng:', err);
        throw new Error(err.message || 'Không thể cập nhật đơn hàng.');
      }
    },
    [fetchSales]
  );

  // Hàm xóa đơn hàng
  const deleteOrder = useCallback(
    async (orderId: number) => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Vui lòng đăng nhập.');

        await orderService.deleteOrderAdmin(orderId);

        // Refresh lại danh sách
        await fetchSales();
      } catch (err: any) {
        console.error('❌ Lỗi khi xóa đơn hàng:', err);
        throw new Error(err.message || 'Không thể xóa đơn hàng.');
      }
    },
    [fetchSales]
  );

  // Hàm thay đổi trạng thái
  const changeOrderStatus = useCallback(
    async (storeId: number, orderId: number, status: string, note?: string) => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Vui lòng đăng nhập.');

        const response = await orderService.changeStatusByStore(
          storeId,
          orderId,
          status,
          note
        );

        // Cập nhật local state ngay lập tức để UI phản hồi nhanh
        setSales((prev) =>
          prev.map((sale) =>
            sale.id === orderId
              ? { ...sale, status, notes: note || sale.notes }
              : sale
          )
        );

        return response;
      } catch (err: any) {
        console.error('❌ Lỗi khi thay đổi trạng thái:', err);
        throw new Error(err.message || 'Không thể thay đổi trạng thái.');
      }
    },
    []
  );

  return {
    sales,
    loading,
    error,
    pagination,
    storeId,
    fetchSales,
    handleTableChange,
    createOrder,
    updateOrder,
    deleteOrder,
    changeOrderStatus,
  };
}
