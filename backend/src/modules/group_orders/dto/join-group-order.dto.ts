// backend/src/modules/group_orders/dto/join-group-order.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class JoinGroupOrderDto {
  @ApiProperty({ description: 'ID user tham gia group' })
  @IsNotEmpty()
  @IsInt()
  userId!: number;

  @ApiPropertyOptional({
    description: 'Mã tham gia (nếu yêu cầu xác thực bằng join_code)',
  })
  @IsOptional()
  @IsString()
  joinCode?: string;
}
