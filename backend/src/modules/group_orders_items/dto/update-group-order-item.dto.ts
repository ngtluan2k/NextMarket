import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpdateGroupOrderItemDto {
  @IsOptional()
  @IsInt()
  @Min(1, { message: 'Số lượng tối thiểu là 1' })
  quantity?: number;
  
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Ghi chú không được vượt quá 255 ký tự' })
  note?: string;
}
