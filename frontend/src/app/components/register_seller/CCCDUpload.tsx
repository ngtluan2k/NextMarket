import React, { useMemo, useState } from 'react';

type Side = 'front' | 'back';

interface Props {
  storeId?: number;
  token: string;
  onUploaded?: (side: Side, url: string) => void;
  className?: string;
}

export const CCCDUpload: React.FC<Props> = ({ storeId, token, onUploaded, className }) => {
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [uploadingSide, setUploadingSide] = useState<Side | null>(null);
  const [frontUrl, setFrontUrl] = useState<string>('');
  const [backUrl, setBackUrl] = useState<string>('');
  const [error, setError] = useState<string>('');

  const canUploadFront = useMemo(() => !!frontFile && !uploadingSide, [frontFile, uploadingSide]);
  const canUploadBack = useMemo(() => !!backFile && !uploadingSide, [backFile, uploadingSide]);

  const doUpload = async (side: Side, file: File) => {
  setError('');
  setUploadingSide(side);
  try {
    const form = new FormData();
    form.append('file', file);

    const authToken = token || localStorage.getItem('token') || '';

    let url = '';

    if (storeId) {
      // Có storeId: dùng flow cũ (ghi DB)
      const endpoint =
        side === 'front'
          ? `http://localhost:3000/store-identification/store/${storeId}/upload-front`
          : `http://localhost:3000/store-identification/store/${storeId}/upload-back`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Upload thất bại');

      url =
        side === 'front'
          ? data?.img_front || data?.data?.img_front
          : data?.img_back || data?.data?.img_back;

      if (!url) throw new Error('Không nhận được URL ảnh từ server');
    } else {
      // Chưa có storeId: upload tạm (y như Giấy phép)
      form.append('side', side);
      const res = await fetch('http://localhost:3000/store-identification/upload-image', {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Upload thất bại');

      url = data?.file_url;
      if (!url) throw new Error('Không nhận được URL ảnh từ server');
    }

    if (side === 'front') setFrontUrl(url);
    else setBackUrl(url);

    onUploaded?.(side, url);
  } catch (e: any) {
    setError(e?.message || 'Upload thất bại');
  } finally {
    setUploadingSide(null);
  }
};

  return (
    <div className={className}>
      <h6>📷 Ảnh CCCD</h6>

      <div className="row g-3">
        {/* Mặt trước */}
        <div className="col-md-6">
          <div className="border rounded p-3 bg-light">
            <div className="mb-2 fw-bold">🟢 Mặt trước</div>
            <input
              type="file"
              accept="image/png, image/jpeg"
              onChange={(e) => setFrontFile(e.target.files?.[0] || null)}
              className="form-control mb-2"
            />
            {frontFile && (
              <img
                src={URL.createObjectURL(frontFile)}
                alt="CCCD front preview"
                style={{ maxWidth: '100%', maxHeight: 180 }}
                className="mb-2"
              />
            )}
            {frontUrl && (
              <div className="small text-success mb-2">Đã upload: {frontUrl}</div>
            )}
            <button
              type="button"
              className="btn btn-success btn-sm"
              onClick={() => frontFile && doUpload('front', frontFile)}
              disabled={!canUploadFront}
            >
              {uploadingSide === 'front' ? 'Đang upload...' : '📤 Upload mặt trước'}
            </button>
          </div>
        </div>

        {/* Mặt sau */}
        <div className="col-md-6">
          <div className="border rounded p-3 bg-light">
            <div className="mb-2 fw-bold">🔴 Mặt sau</div>
            <input
              type="file"
              accept="image/png, image/jpeg"
              onChange={(e) => setBackFile(e.target.files?.[0] || null)}
              className="form-control mb-2"
            />
            {backFile && (
              <img
                src={URL.createObjectURL(backFile)}
                alt="CCCD back preview"
                style={{ maxWidth: '100%', maxHeight: 180 }}
                className="mb-2"
              />
            )}
            {backUrl && (
              <div className="small text-success mb-2">Đã upload: {backUrl}</div>
            )}
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={() => backFile && doUpload('back', backFile)}
              disabled={!canUploadBack}
            >
              {uploadingSide === 'back' ? 'Đang upload...' : '📤 Upload mặt sau'}
            </button>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger mt-3">{error}</div>}
    </div>
  );
};

export default CCCDUpload;