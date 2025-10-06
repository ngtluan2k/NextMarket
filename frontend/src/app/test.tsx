// src/components/TestWallet.tsx
import React, { useEffect, useState } from 'react';
import { fetchMyWallet } from '../service/wallet.service'; // import service FE

type Wallet = {
  id: number;
  balance: number;
  currency: string;
  updated_at: string;
};

export default function TestWallet() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadWallet = async () => {
      setLoading(true);
      try {
        const data = await fetchMyWallet();
        setWallet(data);
      } catch (err: any) {
        setError(err.message || 'Lỗi không xác định');
      } finally {
        setLoading(false);
      }
    };

    loadWallet();
  }, []);

  if (loading) return <p>Đang tải ví...</p>;
  if (error) return <p className="text-red-500">Lỗi: {error}</p>;

  return (
    <div className="p-4 rounded border border-slate-200">
      <h2 className="text-lg font-semibold mb-2">Ví của tôi</h2>
      {wallet ? (
        <div className="space-y-1">
          <p><strong>ID:</strong> {wallet.id}</p>
          <p><strong>Số dư:</strong> {wallet.balance} {wallet.currency}</p>
          <p><strong>Cập nhật:</strong> {new Date(wallet.updated_at).toLocaleString('vi-VN')}</p>
        </div>
      ) : (
        <p>Không tìm thấy ví</p>
      )}
    </div>
  );
}
