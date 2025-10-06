import { useEffect, useState } from "react";
import { fetchProductReviews, Review } from "../../service/product_review";

export function useProductReviews(productId: number, pageSize = 5) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const totalPages = Math.ceil(total / pageSize);

  const loadReviews = async (pageToLoad: number) => {
    if (loading) return;
    setLoading(true);
    try {
      // API phải trả về object { reviews: Review[], total: number }
      const { reviews: newReviews, total: totalReviews } = await fetchProductReviews(
        productId,
        pageToLoad,
        pageSize
      );
      setReviews(newReviews); // replace reviews cũ
      setPage(pageToLoad);
      setTotal(totalReviews);
      setHasMore(pageToLoad < Math.ceil(totalReviews / pageSize));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // load page 1 khi productId thay đổi
  useEffect(() => {
    loadReviews(1);
  }, [productId]);

  return { reviews, loading, page, totalPages, loadReviews, hasMore };
}
