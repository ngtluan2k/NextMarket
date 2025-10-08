import { IsString, Length } from 'class-validator';

export class CreateAffiliatePlatformDto {
  @IsString()
  @Length(1, 50)
  code!: string;

  @IsString()
  @Length(1, 100)
  name!: string;
}
