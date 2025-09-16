export class CreateProductMediaDto {
  productId!: number;
  media_type!: string;
  url!: string;
  is_primary!: boolean;
  sort_order?: number;
}
