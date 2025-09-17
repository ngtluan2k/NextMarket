import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoreDocumentController } from './store-document.controller';
import { StoreDocumentService } from './store-document.service';
import { StoreDocument } from './store-document.entity';
import { StoreInformation } from '../store-information/store-information.entity';
import { Store } from '../store/store.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StoreDocument,
      StoreInformation,
      Store,
    ])
  ],
  controllers: [StoreDocumentController],
  providers: [StoreDocumentService],
  exports: [StoreDocumentService],
})
export class StoreDocumentModule {}
