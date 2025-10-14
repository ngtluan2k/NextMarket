import React, { useEffect, useMemo, useState } from 'react';
import { X, Star, Upload, Trash2, Loader2 } from 'lucide-react';
import { createProductReview, updateProductReview } from '../../../service/product_review';

type Props = {
  open: boolean;
  onClose: () => void;
  orderId: number;
  productId: number;
  reviewId?: number;
  existingRating?: number;
  existingComment?: string;
  onSubmitted?: () => void;
};

type FileWithPreview = { file: File; url: string };

const MAX_FILES = 6;
const MAX_SIZE_MB = 5;
const MAX_COMMENT = 1000;

const RATING_LABEL: Record<number, string> = {
  1: 'Tệ',
  2: 'Chưa tốt',
  3: 'Bình thường',
  4: 'Hài lòng',
  5: 'Tuyệt vời',
};

export default function ReviewModal({
  open,
  onClose,
  orderId,
  productId,
  reviewId,
  existingRating = 5,
  existingComment = '',
  onSubmitted,
}: Props) {
  const [rating, setRating] = useState(existingRating);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState(existingComment);
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setRating(existingRating);
    setHoverRating(null);
    setComment(existingComment);
    setFiles([]);
    setErrorMsg(null);
  }, [open, existingRating, existingComment]);

  useEffect(() => {
    return () => files.forEach((f) => URL.revokeObjectURL(f.url));
  }, [files]);

  if (!open) return null;

  const acceptFiles = (list: FileList | File[]) => {
    const arr = Array.from(list);
    const remain = MAX_FILES - files.length;
    const picked = arr.slice(0, remain);

    const oversized = picked.find((f) => f.size > MAX_SIZE_MB * 1024 * 1024);
    if (oversized) {
      setErrorMsg(`Mỗi ảnh tối đa ${MAX_SIZE_MB}MB. "${oversized.name}" quá lớn.`);
      return;
    }
    const nonImage = picked.find((f) => !f.type.startsWith('image/'));
    if (nonImage) {
      setErrorMsg(`Chỉ nhận tệp ảnh. "${nonImage.name}" không phải ảnh.`);
      return;
    }

    const withPreview = picked.map((file) => ({ file, url: URL.createObjectURL(file) }));
    setFiles((prev) => [...prev, ...withPreview]);
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    if (e.target.files) acceptFiles(e.target.files);
  };

  const onDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setErrorMsg(null);
    if (e.dataTransfer.files) acceptFiles(e.dataTransfer.files);
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => {
      const clone = [...prev];
      const [rm] = clone.splice(idx, 1);
      if (rm) URL.revokeObjectURL(rm.url);
      return clone;
    });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setErrorMsg(null);
    try {
      if (reviewId) {
        await updateProductReview(reviewId, { rating, comment }, files.map((f) => f.file));
      } else {
        await createProductReview({ orderId, productId, rating, comment }, files.map((f) => f.file));
      }
      onClose();
      onSubmitted?.();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const stars = useMemo(() => [1, 2, 3, 4, 5], []);
  const showRating = hoverRating ?? rating;

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 overflow-y-auto" onClick={onClose}>
      <div
        className="min-h-full px-3 py-6 grid place-items-center"
        onClick={(e) => e.stopPropagation()}
        aria-modal
        role="dialog"
      >
        {/* NHỎ HƠN: 640px thay vì 860px, font nhỏ toàn modal */}
        <div className="mx-auto w-[min(92vw,640px)] rounded-2xl overflow-hidden bg-white shadow-xl ring-1 ring-black/5 text-[13px]">
          {/* Header compact */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
            <h2 className="text-[15px] font-semibold">
              {reviewId ? 'Cập nhật đánh giá' : 'Đánh giá sản phẩm'}
            </h2>
            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              aria-label="Đóng"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body compact */}
          <form onSubmit={onSubmit} className="flex flex-col">
            <div className="px-4 py-3">
              {/* Rating nhỏ hơn */}
              <div>
                <label className="block text-xs font-medium text-slate-700">Chọn số sao</label>
                <div className="mt-1.5 flex items-center gap-1">
                  {stars.map((s) => {
                    const active = s <= showRating;
                    return (
                      <button
                        type="button"
                        key={s}
                        onMouseEnter={() => setHoverRating(s)}
                        onMouseLeave={() => setHoverRating(null)}
                        onClick={() => setRating(s)}
                        className="rounded-full p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60"
                        aria-label={`Chọn ${s} sao`}
                      >
                        <Star
                          className={`h-5 w-5 ${
                            active
                              ? 'fill-amber-400 stroke-amber-400'
                              : 'stroke-slate-300 text-slate-300'
                          }`}
                        />
                      </button>
                    );
                  })}
                  <span className="ml-2 text-xs text-slate-600">{RATING_LABEL[showRating]}</span>
                </div>
              </div>

              {/* Comment nhỏ hơn */}
              <div className="mt-4">
                <div className="mb-1 flex items-center justify-between">
                  <label className="block text-xs font-medium text-slate-700">
                    Nhận xét (tuỳ chọn)
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {comment.length}/{MAX_COMMENT}
                  </span>
                </div>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value.slice(0, MAX_COMMENT))}
                  rows={3}
                  placeholder="Chia sẻ cảm nhận của bạn về sản phẩm…"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-[13px] outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
                />
              </div>

              {/* Upload compact */}
              <div className="mt-4">
                <label className="block text-xs font-medium text-slate-700">Hình ảnh</label>

                <label
                  onDrop={onDrop}
                  onDragOver={(e) => e.preventDefault()}
                  className="mt-2 grid cursor-pointer place-items-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/70 px-3 py-5 text-center hover:border-sky-400 hover:bg-sky-50/60"
                >
                  <input type="file" multiple accept="image/*" hidden onChange={onInputChange} />
                  <div className="flex flex-col items-center gap-1.5">
                    <Upload className="h-5 w-5 text-slate-400" />
                    <div className="text-[13px] text-slate-600">
                      Kéo & thả ảnh vào đây hoặc{' '}
                      <span className="font-medium text-sky-600 underline">chọn tệp</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Tối đa {MAX_FILES} ảnh, mỗi ảnh ≤ {MAX_SIZE_MB}MB
                    </div>
                  </div>
                </label>

                {/* Thumbnail nhỏ hơn + nhiều cột hơn để đỡ cao */}
                {files.length > 0 && (
                  <div className="mt-3">
                    <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6">
                      {files.map((f, idx) => (
                        <div
                          key={idx}
                          className="group relative overflow-hidden rounded-lg ring-1 ring-slate-200"
                        >
                          <img
                            src={f.url}
                            alt={`Ảnh ${idx + 1}`}
                            className="h-16 w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeFile(idx)}
                            className="absolute right-1 top-1 hidden rounded-full bg-black/60 p-1 text-white group-hover:block"
                            aria-label="Xoá ảnh"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {errorMsg && (
                  <div className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-[13px] text-rose-700 ring-1 ring-rose-100">
                    {errorMsg}
                  </div>
                )}
              </div>
            </div>

            {/* Footer compact */}
            <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-white px-4 py-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-[13px] hover:bg-slate-50"
                disabled={loading}
              >
                Huỷ
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-[13px] font-medium text-white hover:bg-sky-700 disabled:opacity-60"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {reviewId ? 'Cập nhật' : 'Gửi đánh giá'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
