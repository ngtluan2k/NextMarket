import { Transform } from 'class-transformer';
import { IsOptional, IsInt, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiPropertyOptional({ description: 'ID danh mục cha', type: Number, nullable: true })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === null || value === '' || value === undefined) return null;
    return Number(value);
  })
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
