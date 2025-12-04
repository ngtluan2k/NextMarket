
import { registerAs } from '@nestjs/config';

export default registerAs('ghn', () => ({
  env: process.env.GHN_ENV || 'dev',
  url: process.env.GHN_ENV === 'production'
    ? process.env.GHN_API_URL
    : process.env.GHN_API_URL_DEV,
  token: process.env.GHN_ENV === 'production'
    ? process.env.GHN_API_TOKEN
    : process.env.GHN_API_TOKEN_DEV,
  shopId: Number(process.env.GHN_SHOP_ID),
  fromDistrictId: Number(process.env.GHN_FROM_DISTRICT_ID),
}));