export class CreateInventoryDto {
  productId!: number;
  variantId!: number;
  location!: string;
  quantity!: number;
  used_quantity?: number;
}

