import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';

export class CalculateShippingDto {
  @ApiProperty({ example: 1444, description: 'ID quận gửi hàng' })
  @IsNotEmpty()
  @IsNumber()
  from_district_id!: number;

  @ApiProperty({ example: 1452, description: 'ID quận nhận hàng' })
  @IsNotEmpty()
  @IsNumber()
  to_district_id!: number;

  @ApiProperty({ example: 1000, description: 'Trọng lượng (gram)' })
  @IsNumber()
  @Min(1)
  weight: number = 1000;

  @ApiProperty({ example: 2, description: 'Loại dịch vụ (1: Nhanh, 2: Thường)', required: false })
  @IsOptional()
  @IsNumber()
  service_type_id: number = 2;

  @ApiProperty({ example: 500000, description: 'Giá trị hàng hoá', required: false })
  @IsOptional()
  @IsNumber()
  insurance_value: number = 500000;

  @ApiProperty({ example: 20, description: 'Chiều dài (cm)', required: false })
  @IsOptional()
  @IsNumber()
  length: number = 20;

  @ApiProperty({ example: 15, description: 'Chiều rộng (cm)', required: false })
  @IsOptional()
  @IsNumber()
  width: number = 15;

  @ApiProperty({ example: 10, description: 'Chiều cao (cm)', required: false })
  @IsOptional()
  @IsNumber()
  height: number = 10;
}

export class GetDistrictsDto {
  @ApiProperty({ example: 201, description: 'ID tỉnh/thành' })
  @IsNotEmpty()
  @IsNumber()
  province_id!: number;
}

export class GetWardsDto {
  @ApiProperty({ example: 1444, description: 'ID quận/huyện' })
  @IsNotEmpty()
  @IsNumber()
  district_id!: number;
}