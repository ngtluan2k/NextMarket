export type BestSellerProduct = {
    id: string | number;
    name: string;
    imageUrl: string;
    price: number;
    originalPrice?: number;
    discountPercent?: number;
    rating?: number;
    sold?: number;
    official?: boolean;
    fastShipNote?: string;
  };
  
  export async function getStoreBestSellers(slug: string, limit = 3) {
    const res = await fetch(`/api/stores/${encodeURIComponent(slug)}/best-sellers?limit=${limit}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as BestSellerProduct[];
  }
  