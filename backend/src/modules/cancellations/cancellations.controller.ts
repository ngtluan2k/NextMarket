import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { CancellationsService } from './cancellations.service';
import { CreateCancellationDto } from './dto/create-cancellation.dto';
import { UpdateCancellationDto } from './dto/update-cancellation.dto';

@Controller('cancellations')
export class CancellationsController {
  constructor(private readonly cancellationsService: CancellationsService) {}

  @Post()
  create(@Body() createCancellationDto: CreateCancellationDto) {
    return this.cancellationsService.create(createCancellationDto);
  }

  @Get()
  findAll() {
    return this.cancellationsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cancellationsService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCancellationDto: UpdateCancellationDto
  ) {
    return this.cancellationsService.update(+id, updateCancellationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cancellationsService.remove(+id);
  }
}
