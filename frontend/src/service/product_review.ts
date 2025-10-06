// services/review.service.ts
export type Review = {
  id: string | number;
  rating: number;     // 1..5
  title?: string;
  body?: string;
  images?: string[];
  author?: {
    name: string;
    avatarUrl?: string;
  };
  createdAt: string;
};

/* ===================== Types ===================== */
export interface CreateProductReviewDto {
  orderId: number;
  productId: number;
  rating: number;
  comment?: string;
}

export interface UpdateProductReviewDto {
  rating?: number;
  comment?: string;
}

export interface ReviewMedia {
  file: File;
  type?: "image" | "video"; // optional, backend tự detect
}

/* ===================== API Calls ===================== */

// Lấy danh sách reviews theo productId (phân trang)
export async function fetchProductReviews(productId: number, page = 1, pageSize = 5) {
  const res = await fetch(
    `http://localhost:3000/product-reviews/${productId}/reviews?page=${page}&pageSize=${pageSize}`
  );
  if (!res.ok) throw new Error("Failed to fetch reviews");
  return res.json();
}


// Tạo review mới cho product
export async function createProductReview(
  dto: CreateProductReviewDto,
  mediaFiles?: File[]
) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No access token found");

  const formData = new FormData();
  formData.append("orderId", String(dto.orderId));
  formData.append("productId", String(dto.productId));
  formData.append("rating", String(dto.rating));
  if (dto.comment) formData.append("comment", dto.comment);

  if (mediaFiles && mediaFiles.length > 0) {
    mediaFiles.forEach((file) => {
      formData.append("media", file);
    });
  }

  const res = await fetch("http://localhost:3000/product-reviews", {
    method: "POST",
    headers: {
            Authorization: `Bearer ${token}`,
          },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to create review");
  }

  return res.json();
}

export async function updateProductReview(
  reviewId: number,
  dto: UpdateProductReviewDto,
  mediaFiles?: File[]
) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No access token found");

  const formData = new FormData();
  if (dto.rating !== undefined) formData.append("rating", String(dto.rating));
  if (dto.comment !== undefined) formData.append("comment", dto.comment);

  if (mediaFiles && mediaFiles.length > 0) {
    mediaFiles.forEach((file) => formData.append("media", file));
  }

  const res = await fetch(`http://localhost:3000/product-reviews/${reviewId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to update review");
  }

  return res.json();
}
