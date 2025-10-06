import React, { useState } from "react";
import { createProductReview } from "../../../service/product_review";

type ReviewModalProps = {
  open: boolean;
  onClose: () => void;
  orderId: number;
  productId: number;
  onSubmitted?: () => void;
};

const ReviewModal: React.FC<ReviewModalProps> = ({ open, onClose, orderId, productId, onSubmitted, }) => {
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>("");
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  if (!open) return null;

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
    console.log("Submitting review:", {
    orderId,
    productId,
    rating,
    comment,
    files,
  });
  try {
    const data = await createProductReview(
      {
        orderId,
        productId,
        rating,
        comment,
      },
      files
    );
    setResult(data);
    onClose(); // đóng modal sau khi submit thành công
    if (onSubmitted) onSubmitted(); // gọi callback đúng cách
  } catch (err: any) {
    setResult({ error: err.message });
  } finally {
    setLoading(false);
  }
};



  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
        <h2 className="text-lg font-semibold mb-4">Đánh giá sản phẩm</h2>
        <form onSubmit={handleSubmit}>
          {/* Rating */}
          <label className="block mb-2 text-sm font-medium">Rating</label>
          <select
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            className="w-full border rounded-md p-2 mb-4"
          >
            <option value={1}>⭐</option>
            <option value={2}>⭐⭐</option>
            <option value={3}>⭐⭐⭐</option>
            <option value={4}>⭐⭐⭐⭐</option>
            <option value={5}>⭐⭐⭐⭐⭐</option>
          </select>

          {/* Comment */}
          <label className="block mb-2 text-sm font-medium">Comment</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full border rounded-md p-2 mb-4"
            rows={3}
          />

          {/* Media */}
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
              {loading ? "Đang gửi..." : "Gửi đánh giá"}
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
