import React, { useState, useEffect } from 'react';
import {
  createProductReview,
  updateProductReview,
} from '../../../service/product_review';

type ReviewModalProps = {
  open: boolean;
  onClose: () => void;
  orderId: number;
  productId: number;
  reviewId?: number; // nếu có thì modal dùng để update
  existingRating?: number;
  existingComment?: string;
  onSubmitted?: () => void;
};

const ReviewModal: React.FC<ReviewModalProps> = ({
  open,
  onClose,
  orderId,
  productId,
  reviewId,
  existingRating = 5,
  existingComment = '',
  onSubmitted,
}) => {
  const [rating, setRating] = useState<number>(existingRating);
  const [comment, setComment] = useState<string>(existingComment);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    setRating(existingRating);
    setComment(existingComment);
  }, [existingRating, existingComment, open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let data;
      if (reviewId) {
        // Update review
        data = await updateProductReview(reviewId, { rating, comment }, files);
      } else {
        // Create review
        data = await createProductReview(
          { orderId, productId, rating, comment },
          files
        );
      }
      setResult(data);
      onClose();
      if (onSubmitted) onSubmitted();
    } catch (err: any) {
      setResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
        <h2 className="text-lg font-semibold mb-4">
          {reviewId ? 'Cập nhật đánh giá' : 'Đánh giá sản phẩm'}
        </h2>
        <form onSubmit={handleSubmit}>
          <label className="block mb-2 text-sm font-medium">Rating</label>
          <select
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            className="w-full border rounded-md p-2 mb-4"
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {'⭐'.repeat(n)}
              </option>
            ))}
          </select>

          <label className="block mb-2 text-sm font-medium">Comment</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full border rounded-md p-2 mb-4"
            rows={3}
          />

          <label className="block mb-2 text-sm font-medium">Ảnh</label>
          <input
            type="file"
            multiple
            onChange={(e) => setFiles(Array.from(e.target.files || []))}
            className="mb-4"
          />

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-100"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? 'Đang gửi...' : reviewId ? 'Cập nhật' : 'Gửi đánh giá'}
            </button>
          </div>
        </form>

        {result && (
          <pre className="mt-4 text-xs bg-gray-100 p-2 rounded">
            {JSON.stringify(result, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
};

export default ReviewModal;
