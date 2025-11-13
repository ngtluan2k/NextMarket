// customer-from-order.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class CustomerFromOrderDto {
  @ApiProperty({ description: 'ID của khách hàng', example: 2 })
  id?: number;

  @ApiProperty({ description: 'Tên khách hàng', example: 'trung12311' })
  name?: string;

  @ApiProperty({ description: 'Email khách hàng', example: 'trung@example.com' })
  email?: string;

  @ApiProperty({ description: 'Số điện thoại khách hàng', example: '0909123456', required: false })
  phone?: string;

  @ApiProperty({ description: 'Avatar khách hàng', example: '', required: false })
  avatar?: string;

  @ApiProperty({ description: 'Tổng số đơn hàng của khách', example: 10 })
  totalOrders!: number;

  @ApiProperty({ description: 'Tổng chi tiêu của khách hàng', example: 11358000 })
  totalSpent!: number;

  @ApiProperty({ description: 'Trạng thái khách hàng', example: 'active', required: false })
  status?: string;

  @ApiProperty({ description: 'Ngày tham gia', example: '2025-09-05T04:04:40.000Z', required: false })
  joinDate?: Date;

  @ApiProperty({ description: 'Ngày đơn hàng gần nhất', example: '2025-11-13T04:29:41.000Z', required: false })
  lastOrderDate?: Date;
}
