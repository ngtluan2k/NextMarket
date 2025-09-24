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
  media?: { url: string; is_primary?: boolean }[];
  store?: { name: string; slug: string };
};

export type CardItem = {
  id?: string;
  name?: string;
  image?: string;
  price?: number;
  listPrice?: number;
  rating?: number;
};
