import { Module } from '@nestjs/common';
import { CancellationsService } from './cancellations.service';
import { CancellationsController } from './cancellations.controller';

@Module({
  controllers: [CancellationsController],
  providers: [CancellationsService],
})
export class CancellationsModule {}
