import axios from 'axios';

const API_URL = 'http://localhost:3000/orders'; // đổi thành baseURL của backend

export const orderService = {
  // Lấy tất cả đơn hàng của user
  async getOrdersByUser(userId: number) {
    try {
      const res = await axios.get(`${API_URL}/user/${userId}`);
      return res.data;
    } catch (error: any) {
      console.error(
        'Lỗi khi lấy đơn hàng:',
        error.response?.data || error.message
      );
      throw error;
    }
  },

  // Lấy chi tiết 1 đơn hàng
  async getOrderDetail(orderId: number) {
    try {
      const res = await axios.get(`${API_URL}/${orderId}`);
      return res.data;
    } catch (error: any) {
      console.error(
        'Lỗi khi lấy chi tiết đơn hàng:',
        error.response?.data || error.message
      );
      throw error;
    }
  },
  //Đổi trạng thái của 1 đơn hàng, khách chỉ có thể hủy
  async changeStatus(
    orderId: number,
    status: string,
    token: string,
    note?: string
  ) {
    try {
      const res = await axios.patch(
        `${API_URL}/${orderId}/status/${status}`,
        { note }, // gửi note nếu có
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return res.data;
    } catch (error: any) {
      console.error(
        'Lỗi khi thay đổi trạng thái đơn hàng:',
        error.response?.data || error.message
      );
      throw error;
    }
  },
  // Lấy tất cả đơn hàng của store
  async getOrdersByStore(storeId: number) {
    try {
      const res = await axios.get(`${API_URL}/store/${storeId}`);
      return res.data;
    } catch (error: any) {
      console.error(
        'Lỗi khi lấy đơn hàng của store:',
        error.response?.data || error.message
      );
      throw error;
    }
  },
};
