import { IsString, IsNumber } from 'class-validator';

export class CreateAffiliateLinkDto {
  @IsNumber()
  programId!: number;

  @IsNumber()
  userId!: number;

  @IsString()
  code!: string;
}