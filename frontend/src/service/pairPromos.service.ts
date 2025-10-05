// src/service/pairPromos.service.ts

export type PairCard = {
  id: string | number;
  title: string;
  sponsor?: string;
  ratingText?: string;
  coverUrl?: string;
  href?: string;
};

const MOCK_PAIR_PROMOS: PairCard[] = [
  {
    id: 1,
    title: 'Bánh Trung Thu Phúc Long – Giá tốt, ưu đãi lớn',
    sponsor: 'Tài trợ bởi Tiki Trading',
    ratingText: '5/5',
    coverUrl:
      'https://upload.wikimedia.org/wikipedia/commons/5/56/Phuc_Long_Logo.png',
    href: '#',
  },
  {
    id: 2,
    title: 'NGƯỜI THẦY – Nguyễn Chí Vịnh',
    sponsor: 'Hiệu Sách Tự Do',
    ratingText: '5/5',
    coverUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Freedom_Logo.png/240px-Freedom_Logo.png',
    href: '#',
  },
  {
    id: 3,
    title: 'Top Sách Bán Chạy Tuần này',
    sponsor: 'Alpha Books',
    ratingText: '5/5',
    coverUrl:
      'https://upload.wikimedia.org/wikipedia/commons/3/3a/Book-icon-bible.png',
    href: '#',
  },
  {
    id: 4,
    title: 'Ra mắt sách mới – Giảm đến 40%',
    sponsor: '1980 Books',
    ratingText: '4.9/5',
    coverUrl:
      'https://upload.wikimedia.org/wikipedia/commons/8/87/1980_Books_logo.png',
    href: '#',
  },
];

/** Giả lập gọi API (delay 600ms) */
export function fetchPairPromosAPI(): Promise<PairCard[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(MOCK_PAIR_PROMOS), 600);
  });
}
