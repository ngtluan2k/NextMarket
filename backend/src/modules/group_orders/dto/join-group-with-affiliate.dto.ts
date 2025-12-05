import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class JoinGroupWithAffiliateDto {
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

  @ApiProperty({
    description: 'Mã affiliate để tracking commission (ví dụ: AFF123)',
    example: 'AFF123'
  })
  @IsNotEmpty()
  @IsString()
  affiliateCode!: string;
}
