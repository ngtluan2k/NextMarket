import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { WalletTransactionService } from './wallet_transaction.service';
import { CreateWalletTransactionDto } from './dto/create-wallet_transaction.dto';
import { UpdateWalletTransactionDto } from './dto/update-wallet_transaction.dto';

@Controller('wallet-transaction')
export class WalletTransactionController {
  constructor(
    private readonly walletTransactionService: WalletTransactionService
  ) {}

  @Post()
  create(@Body() createWalletTransactionDto: CreateWalletTransactionDto) {
    return this.walletTransactionService.create(createWalletTransactionDto);
  }

  @Get()
  findAll() {
    return this.walletTransactionService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.walletTransactionService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateWalletTransactionDto: UpdateWalletTransactionDto
  ) {
    return this.walletTransactionService.update(
      +id,
      updateWalletTransactionDto
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.walletTransactionService.remove(+id);
  }
}
