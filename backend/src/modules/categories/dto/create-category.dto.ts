import { IsNotEmpty, IsOptional, IsString, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiPropertyOptional({ description: 'ID danh mục cha' })
  @IsOptional()
  @IsInt()
  parent_id?: number;

  @ApiProperty({ description: 'Tên danh mục' })
  @IsNotEmpty()
  @IsString()
  name!: string;



  @ApiPropertyOptional({ description: 'Mô tả' })
  @IsOptional()
  @IsString()
  description?: string;
}
