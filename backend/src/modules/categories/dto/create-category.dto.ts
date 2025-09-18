import { IsNotEmpty, IsOptional, IsString, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiPropertyOptional({
    description: 'ID danh mục cha',
    type: Number,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  parent_id?: number | null;

  @ApiProperty({ description: 'Tên danh mục' })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiPropertyOptional({ description: 'Mô tả' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Hình ảnh' })
  @IsOptional()
  @IsString()
  image?: string;
}
