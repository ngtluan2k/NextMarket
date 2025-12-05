// dto/affiliate-root-response.dto.ts

import { Exclude, Expose, Type } from 'class-transformer';

class UserResponseDto {
  @Expose()
  id!: number;

  @Expose()
  email!: string;

  @Expose()
  name!: string;

  // thêm các field khác từ User nếu cần
}

export class AffiliateRootResponseDto {
  @Expose()
  id!: number;

  @Expose()
  uuid!: string;

  @Expose()
  userId!: number;

  @Expose()
  isActive!: boolean;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;

  @Expose()
  @Type(() => UserResponseDto)
  user!: UserResponseDto;
}