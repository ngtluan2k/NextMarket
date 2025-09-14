import { IsNotEmpty, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateStoreInformationEmailDto {
  @ApiProperty({ description: 'Email thông tin' })
  @IsNotEmpty()
  @IsEmail()
  email!: string;
}