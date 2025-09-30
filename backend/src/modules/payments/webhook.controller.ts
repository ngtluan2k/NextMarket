import {
  Controller,
  Get,
  Req,
  BadRequestException,
  Logger,
  Post,
  Res,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { VnpayStrategy } from './strategies/vnpay.strategy';
import * as Express from 'express';
import * as querystring from 'querystring';

@Controller('payments/webhook')
export class PaymentsWebhookController {
  private readonly logger = new Logger(PaymentsWebhookController.name);

  constructor(
    private paymentsService: PaymentsService,
    private vnpayStrategy: VnpayStrategy,
  ) {}

  @Get('vnpay/callback')
  async vnpayCallback(
    @Req() req: Express.Request,
    @Res() res: Express.Response,
  ) {
    try {
      const rawQuery = req.url.split('?')[1] || '';
      const params = querystring.parse(rawQuery);
      this.logger.debug(
        'VNPay GET callback received: ' + JSON.stringify(params),
      );

      const result = await this.vnpayStrategy.handleCallback(params, rawQuery);

      const providerTransactionId = Array.isArray(params.vnp_TransactionNo)
        ? params.vnp_TransactionNo[0]
        : (params.vnp_TransactionNo as string) || '';

      await this.paymentsService.handleProviderCallback({
        paymentUuid: result.paymentUuid,
        providerTransactionId,
        success: params.vnp_ResponseCode === '00',
        rawPayload: params,
      });

      // FE domain (sửa lại cho đúng, ví dụ React chạy ở port 4200)
      const feBaseUrl = process.env.FRONTEND_URL || 'http://localhost:4200';

      const redirectUrl = `${feBaseUrl}/order-success?paymentUuid=${
        result.paymentUuid
      }&responseCode=${params.vnp_ResponseCode}&message=${encodeURIComponent(
        result.message,
      )}`;

      return res.redirect(redirectUrl);
    } catch (err) {
      this.logger.error(err instanceof Error ? err.message : String(err));

      const feBaseUrl = process.env.FRONTEND_URL || 'http://localhost:4200';

      const redirectUrl = `${feBaseUrl}/order-success?responseCode=error&message=${encodeURIComponent(
        err instanceof Error ? err.message : 'Invalid callback',
      )}`;

      return res.redirect(redirectUrl);
    }
  }

  @Post('provider')
  async providerNotify(@Req() req: Express.Request) {
    const body = req.body;
    this.logger.debug(
      'Provider POST callback received: ' + JSON.stringify(body),
    );

    if (body.vnp_TxnRef) {
      if (!this.vnpayStrategy.verifySignature(body)) {
        throw new BadRequestException('Invalid VNPay signature');
      }

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
