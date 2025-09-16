import { UnauthorizedException } from '@nestjs/common';

export const auth = () => {
  throw new UnauthorizedException('User not authenticated');
};