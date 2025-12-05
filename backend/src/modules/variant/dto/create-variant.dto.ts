export class CreateVariantDto {
  productId!: number;
  sku!: string;
  variant_name!: string;
  price!: number;
  stock!: number;
  barcode?: string;
  weight?: number;
}
