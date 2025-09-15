export class CreatePricingRuleDto {
  productId!: number;
  type!: string; // ví dụ: 'bulk_discount', 'flash_sale',...
  min_quantity!: number;
  price!: number;
  cycle?: string; // ví dụ: 'daily', 'weekly', ...
  starts_at!: Date;
  ends_at!: Date;
}
