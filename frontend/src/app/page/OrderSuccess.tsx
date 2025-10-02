import { useLocation, useNavigate } from "react-router-dom";
import { Typography, Card, Button, Result } from "antd";

const { Text } = Typography;

const OrderSuccess: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as {
    orderCode: string;
    total: number;
    paymentMethodLabel: string;
    etaLabel?: string;
    items: any[];
    status: string; // "success" | "0" | "1"
  };

  console.log(state.status)
  if (!state) {
    return (
      <Result
        status="error"
        title="Không tìm thấy thông tin đơn hàng"
        extra={[
          <Button key="home" onClick={() => navigate("/")}>
            Về trang chủ
          </Button>,
        ]}
      />
    );
  }

const isSuccess = String(state.status) === "success" || String(state.status) === "0";


  return (
    <Result
      status={isSuccess ? "success" : "error"}
      title={isSuccess ? "🎉 Đặt hàng thành công!" : "❌ Thanh toán thất bại"}
      subTitle={
        <>
          <Text>Mã đơn hàng: {state.orderCode}</Text>
          <br />
          <Text>Tổng tiền: {state.total.toLocaleString()}đ</Text>
          <br />
          <Text>Phương thức: {state.paymentMethodLabel}</Text>
          {state.etaLabel && (
            <>
              <br />
              <Text>Thời gian giao dự kiến: {state.etaLabel}</Text>
            </>
          )}
        </>
      }
      extra={[
        <Button key="home" type="primary" onClick={() => navigate("/")}>
          Về trang chủ
        </Button>,
        <Button key="orders" onClick={() => navigate("/user/orders")}>
          Xem đơn hàng của tôi
        </Button>,
      ]}
    />
  );
};
export default OrderSuccess
