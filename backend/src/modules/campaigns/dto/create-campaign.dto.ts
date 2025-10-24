export class CreateCampaignDto {
  name!: string;
  description?: string;
  startsAt!: Date;
  endsAt!: Date;
  bannerUrl?: string;
  publish?: string;
  backgroundColor?: string;
}
