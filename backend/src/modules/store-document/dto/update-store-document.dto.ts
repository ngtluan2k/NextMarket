import { PartialType } from '@nestjs/swagger';
import { CreateStoreDocumentDto } from './create-store-document.dto';
import { IsBoolean, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateStoreDocumentDto extends PartialType(
  CreateStoreDocumentDto
) {
  @ApiProperty({
    description: 'Whether document is verified',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  verified?: boolean;

  @ApiProperty({
    description: 'Verification date',
    example: '2023-12-01T10:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  verified_at?: string;
}
