export const TIKI_RED = '#ff424e';

export const vnd = (n?: number) =>
  (n ?? 0).toLocaleString('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  });

export const PRODUCT_DETAIL_LAYOUT = {
  container: 1440, // bề rộng tổng
  leftWidth: 420, // KHUNG TRÁI
  rightWidth: 400, // KHUNG PHẢI
  galleryHeight: 400, // chiều cao ảnh chính
  thumbHeight: 62, // chiều cao thumbnail
  buyBoxMinHeight: 480,
  buyBoxStickyTop: 24, // px
};
