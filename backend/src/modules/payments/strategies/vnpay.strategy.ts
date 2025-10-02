import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus } from '../payment.entity';
import { PaymentStrategy } from './payment-strategy.interface';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import * as querystring from 'querystring';
import * as crypto from 'crypto';

@Injectable()
export class VnpayStrategy implements PaymentStrategy {
  private readonly logger = new Logger(VnpayStrategy.name);

  constructor(
    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,
  ) {}

  async createPayment(order: any, paymentMethod: any) {
    if (order.status === 1) throw new Error('Đơn hàng đã thanh toán');

    const payment = this.paymentRepo.create({
      order,
      paymentMethod,
      amount: order.totalAmount,
      status: 0,
      provider: 'vnpay',
    });

    const savedPayment = await this.paymentRepo.save(payment);

    const redirectUrl = await this.buildVnPayUrl(savedPayment, paymentMethod.config || {});

    return { payment: savedPayment, redirectUrl, paymentUuid: savedPayment.uuid, orderUuid: order.uuid, };
  }

  public async handleCallback(payload: any, rawQuery?: string): Promise<any> {
    this.logger.debug('VNPay callback payload: ' + JSON.stringify(payload));

    if (!this.verifySignatureFromQuery(payload, rawQuery)) {
      this.logger.error('Invalid VNPay signature');
      throw new Error('Invalid signature');
    }

    const payment = await this.findPaymentByTxnRef(payload.vnp_TxnRef);
    if (!payment) throw new Error(`Payment not found for TxnRef: ${payload.vnp_TxnRef}`);

    payment.status = payload.vnp_ResponseCode === '00' ? PaymentStatus.Completed : PaymentStatus.Failed;
    payment.transactionId = payload.vnp_TransactionNo;
    payment.rawPayload = JSON.stringify(payload);

    await this.paymentRepo.save(payment);

    return {
      paymentUuid: payment.uuid,
      status: payment.status,
      responseCode: payload.vnp_ResponseCode,
      message: this.getResponseMessage(payload.vnp_ResponseCode),
    };
  }

  public verifySignature(payload: any): boolean {
    try {
      const vnp_HashSecret = process.env.VNPAY_SECRET_KEY!;
      const vnp_SecureHash = payload.vnp_SecureHash;
      if (!vnp_SecureHash) return false;

      // Xử lý params - chuyển array về string
      const params: Record<string, string> = {};
      Object.keys(payload).forEach((key) => {
        if (key !== 'vnp_SecureHash' && key !== 'vnp_SecureHashType') {
          let value = Array.isArray(payload[key]) ? payload[key][0] : payload[key];
          value = String(value);
          params[key] = value;
        }
      });

      const sortedParams = this.sortObject(params);
      const signData = this.buildSignData(sortedParams);
      
      console.log('signData =', signData);
      console.log('VNPay vnp_SecureHash =', vnp_SecureHash);
      
      const hmac = crypto.createHmac('sha512', vnp_HashSecret);
      const computedSignature = hmac.update(signData, 'utf-8').digest('hex');
      
      console.log('computedSignature =', computedSignature);

      return computedSignature.toLowerCase() === String(vnp_SecureHash).toLowerCase();
    } catch (err) {
      this.logger.error(`Signature verification error: ${err instanceof Error ? err.message : String(err)}`);
      return false;
    }
  }

  public verifySignatureFromQuery(payload: any, rawQuery?: string): boolean {
    try {
      const vnp_HashSecret = process.env.VNPAY_SECRET_KEY!;
      const vnp_SecureHash = payload.vnp_SecureHash;
      if (!vnp_SecureHash) return false;

      let signData = '';

      if (rawQuery) {
        // Xử lý raw query string mà không decode
        const params = new URLSearchParams('?' + rawQuery);
        
        // Loại bỏ vnp_SecureHash và vnp_SecureHashType
        params.delete('vnp_SecureHash');
        params.delete('vnp_SecureHashType');
        
        // Tạo object từ params (giữ nguyên encoding)
        const paramsObject: Record<string, string> = {};
        
        // Parse manual để giữ nguyên encoding
        const paramPairs = rawQuery.split('&');
        for (const pair of paramPairs) {
          const [key, value] = pair.split('=');
          if (key && key !== 'vnp_SecureHash' && key !== 'vnp_SecureHashType') {
            paramsObject[key] = value || '';
          }
        }
        
        // Sắp xếp và tạo sign data
        const sortedParams = this.sortObject(paramsObject);
        signData = this.buildSignData(sortedParams);
        
        console.log('Method 1 - Raw encoding signData =', signData);
        
        const hmac1 = crypto.createHmac('sha512', vnp_HashSecret);
        const computedSignature1 = hmac1.update(signData, 'utf-8').digest('hex');
        console.log('Method 1 computedSignature =', computedSignature1);
        
        if (computedSignature1.toLowerCase() === String(vnp_SecureHash).toLowerCase()) {
          return true;
        }
        
        // Thử cách 2: decode URL encoding
        const decodedParamsObject: Record<string, string> = {};
        for (const [key, value] of Object.entries(paramsObject)) {
          try {
            decodedParamsObject[key] = decodeURIComponent(value);
          } catch (e) {
            decodedParamsObject[key] = value;
          }
        }
        
        const sortedDecodedParams = this.sortObject(decodedParamsObject);
        const signData2 = this.buildSignData(sortedDecodedParams);
        
        console.log('Method 2 - Decoded signData =', signData2);
        
        const hmac2 = crypto.createHmac('sha512', vnp_HashSecret);
        const computedSignature2 = hmac2.update(signData2, 'utf-8').digest('hex');
        console.log('Method 2 computedSignature =', computedSignature2);
        
        return computedSignature2.toLowerCase() === String(vnp_SecureHash).toLowerCase();
        
      } else {
        // Fallback - xử lý từ payload object
        const params: Record<string, string> = {};
        Object.keys(payload).forEach((key) => {
          if (key !== 'vnp_SecureHash' && key !== 'vnp_SecureHashType') {
            let value = Array.isArray(payload[key]) ? payload[key][0] : payload[key];
            value = String(value);
            params[key] = value;
          }
        });

        const sortedParams = this.sortObject(params);
        signData = this.buildSignData(sortedParams);
      }
      
      console.log('Final signData =', signData);
      console.log('VNPay vnp_SecureHash =', vnp_SecureHash);
      
      const hmac = crypto.createHmac('sha512', vnp_HashSecret);
      const computedSignature = hmac.update(signData, 'utf-8').digest('hex');
      
      console.log('Final computedSignature =', computedSignature);

      return computedSignature.toLowerCase() === String(vnp_SecureHash).toLowerCase();
    } catch (err) {
      this.logger.error(`Signature verification error: ${err instanceof Error ? err.message : String(err)}`);
      return false;
    }
  }

  private async findPaymentByTxnRef(txnRef: string): Promise<Payment | null> {
    const normalizedTxnRef = Array.isArray(txnRef) ? txnRef[0] : String(txnRef);
    const normalized = normalizedTxnRef.replace(/-/g, '');
    return await this.paymentRepo.findOne({
      where: [{ uuid: normalized }, { uuid: this.formatToUuid(normalized) || '' }],
      relations: ['order'],
    });
  }

  private formatToUuid(txnRef: string): string | null {
    if (txnRef.length === 32) {
      return `${txnRef.substring(0, 8)}-${txnRef.substring(8, 12)}-${txnRef.substring(12, 16)}-${txnRef.substring(16, 20)}-${txnRef.substring(20, 32)}`;
    }
    return null;
  }

  private async buildVnPayUrl(payment: Payment, config: any): Promise<string> {
    const vnp_TmnCode = config.terminalId || process.env.VNPAY_TERMINAL_ID || 'FXUT2OHD';
    const vnp_HashSecret = config.secretKey || process.env.VNPAY_SECRET_KEY || 'O57JG2LMK8FD14E6I2DYFI20UCS84H4Q';
    const vnp_Url = config.baseUrl || process.env.VNPAY_BASE_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
    const vnp_ReturnUrl = config.returnUrl || process.env.VNPAY_RETURN_URL || 'http://localhost:3000/payments/webhook/vnpay/callback';
    const vnp_TxnRef = payment.uuid.replace(/-/g, '');
    const amountInCents = Math.round(payment.amount! * 100);

    const now = new Date();
    const createDate = this.formatDate(now);
    const expireDate = this.formatDate(new Date(now.getTime() + 15 * 60 * 1000));

    const vnp_Params: any = {
      vnp_Version: '2.0.0',
      vnp_Command: 'pay',
      vnp_TmnCode,
      vnp_Amount: amountInCents,
      vnp_CreateDate: createDate,
      vnp_ExpireDate: expireDate,
      vnp_CurrCode: 'VND',
      vnp_IpAddr: config.ipAddr || '127.0.0.1',
      vnp_Locale: config.locale || 'vn',
      vnp_OrderInfo: `Thanh toan don hang ${payment.order.id}`,
      vnp_OrderType: 'other',
      vnp_ReturnUrl,
      vnp_TxnRef,
    };

    const sortedParams = this.sortObject(vnp_Params);
    const signData = this.buildSignData(sortedParams);
    const hmac = crypto.createHmac('sha512', vnp_HashSecret);
    sortedParams.vnp_SecureHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    return vnp_Url + '?' + querystring.stringify(sortedParams);
  }

  private buildSignData(params: Record<string, any>): string {
    return Object.keys(params)
      .sort()
      .map(k => `${k}=${params[k]}`)
      .join('&');
  }

  private sortObject(obj: any): any {
    const sorted: any = {};
    Object.keys(obj)
      .sort()
      .forEach(k => { 
        if (obj[k] !== undefined && obj[k] !== null && obj[k] !== '') {
          sorted[k] = obj[k];
        }
      });
    return sorted;
  }

  private formatDate(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}${pad(date.getMonth()+1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
  }

  private getResponseMessage(responseCode: string): string {
    const messages: Record<string,string> = {
      '00': 'Giao dịch thành công',
      '01': 'Giao dịch đã tồn tại',
      '04': 'Số tiền không hợp lệ',
      '05': 'Ngân hàng từ chối giao dịch',
      '24': 'Khách hàng hủy giao dịch',
    };
    return messages[responseCode] || 'Lỗi không xác định';
  }
}