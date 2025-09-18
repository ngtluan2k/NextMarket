export type Product = {
  id?: string;
  name?: string;
  slug?: string;
  author?: string;
  images?: string[];
  price?: number;
  listPrice?: number;
  rating?: number;
  reviewsCount?: number;
  sellerName?: string;
  media?: { url: string; is_primary?: boolean }[]; // hoặc kiểu phù hợp với dữ liệu media của bạn
};

export type CardItem = {
  id?: string;
  name?: string;
  image?: string;
  price?: number;
  listPrice?: number;
  rating?: number;
};
