import { PartialType } from '@nestjs/swagger';
import { CreateWalletTransactionDto } from './create-wallet_transaction.dto';

export class UpdateWalletTransactionDto extends PartialType(
  CreateWalletTransactionDto
) {}
