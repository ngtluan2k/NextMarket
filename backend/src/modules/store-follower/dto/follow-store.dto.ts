import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

export class FollowStoreDto {
  @ApiProperty({ description: 'Store ID to follow' })
  @IsInt()
  store_id!: number;
}
