import { PublishCampaignDto } from './campaign-publish.dto';

export class UpdateCampaignDto extends PublishCampaignDto {
  name!: string;
  description?: string;
  startsAt!: Date;
  endsAt!: Date;
  bannerUrl?: string;
  backgroundColor?: string;
  status!: string;
  removedImages?: number[];

}
