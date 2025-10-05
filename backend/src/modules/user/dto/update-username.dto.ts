// update-username.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateUsernameDto {
  @ApiProperty({ description: 'New username' })
  @IsNotEmpty()
  @IsString()
  username!: string;
}
