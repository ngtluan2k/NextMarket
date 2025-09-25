import { Controller, Get, Req, BadRequestException, Logger, Post } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { VnpayStrategy } from './strategies/vnpay.strategy';
import * as Express from 'express';
import * as querystring from 'querystring';
import * as url from 'url';

@Controller('payments/webhook')
export class PaymentsWebhookController {
  private readonly logger = new Logger(PaymentsWebhookController.name);

  constructor(
    private paymentsService: PaymentsService,
    private vnpayStrategy: VnpayStrategy,
  ) {}

  @Get('vnpay/callback')
  async vnpayCallback(@Req() req: Express.Request) {
    try {
      // Lấy raw query string (không decode tự động)
      const rawQuery = req.url.split('?')[1] || '';
      const params = querystring.parse(rawQuery, '&', '=', { decodeURIComponent: (str) => str });

      this.logger.debug('VNPay GET callback received: ' + JSON.stringify(params));

      // Xử lý callback với VNPay strategy
      const result = await this.vnpayStrategy.handleCallback(params);

      // Lấy transaction ID
      const providerTransactionId = Array.isArray(params.vnp_TransactionNo)
        ? params.vnp_TransactionNo[0]
        : (params.vnp_TransactionNo as string) || '';

      // Xử lý callback qua service
      return this.paymentsService.handleProviderCallback({
        paymentUuid: result.paymentUuid,
        providerTransactionId,
        success: params.vnp_ResponseCode === '00',
        rawPayload: params,
      });
    } catch (err) {
      this.logger.error(err instanceof Error ? err.message : String(err));
      throw new BadRequestException(err instanceof Error ? err.message : 'Invalid callback');
    }
  }

  @Post('provider')
  async providerNotify(@Req() req: Express.Request) {
    const body = req.body;
    this.logger.debug('Provider POST callback received: ' + JSON.stringify(body));

    if (body.vnp_TxnRef) {
      if (!this.vnpayStrategy.verifySignature(body)) {
        throw new BadRequestException('Invalid VNPay signature');
      }

      // Ép kiểu providerTransactionId về string
      const providerTransactionId = Array.isArray(body.vnp_TransactionNo)
        ? body.vnp_TransactionNo[0]
        : body.vnp_TransactionNo || '';

      return this.paymentsService.handleProviderCallback({
        paymentUuid: body.vnp_TxnRef,
        providerTransactionId,
        success: body.vnp_ResponseCode === '00',
        rawPayload: body,
      });
    }

    throw new BadRequestException('Unknown payment provider');
  }
}