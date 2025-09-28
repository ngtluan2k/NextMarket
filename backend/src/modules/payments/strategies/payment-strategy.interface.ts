import { Order } from '../../orders/order.entity';

export interface PaymentStrategy {
  createPayment(order: Order, paymentMethod: any, dto: any): Promise<any>;
  handleCallback(payload: any): Promise<any>;
}
