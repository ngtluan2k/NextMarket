import { IsString, IsInt, IsEnum, IsDecimal, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAffiliateProgramDto {
  @ApiProperty()
  @IsString()
  name?: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  cookie_days?: number;

  @ApiProperty({ enum: ['percentage', 'fixed'] })
  @IsEnum(['percentage', 'fixed'])
  commission_type?: 'percentage' | 'fixed';

  @ApiProperty()
  @IsInt() 
  commission_value?: number;

  @ApiProperty({ enum: ['active', 'inactive'] })
  @IsEnum(['active', 'inactive'])
  status?: 'active' | 'inactive';
}