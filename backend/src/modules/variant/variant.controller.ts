import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { VariantService } from './variant.service';
import { CreateVariantDto } from './dto/create-variant.dto';
import { UpdateVariantDto } from './dto/update-variant.dto';
import { Req } from '@nestjs/common';
@Controller('variant')
export class VariantController {
  constructor(private readonly variantService: VariantService) {}

  @Post()
  async add(@Body() dto: CreateVariantDto, @Req() req: any) {
    const userId = req.user.id;
    return this.variantService.addVariant(dto, userId);
  }
}
