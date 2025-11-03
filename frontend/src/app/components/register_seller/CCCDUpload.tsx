import React, { useState, useEffect } from 'react';
import { IdCard, Image as ImageIcon } from 'lucide-react';

type Side = 'front' | 'back';

interface Props {
  onFileSelected?: (side: Side, file: File | null) => void;
  frontFile?: File | null;
  backFile?: File | null;
  className?: string;
  /** 'compact' = chiều cao thumbnail thấp + padding nhỏ */
  variant?: 'normal' | 'compact';
}

export const CCCDUpload: React.FC<Props> = ({
  onFileSelected,
  frontFile: propFrontFile,
  backFile: propBackFile,
  className,
  variant = 'normal',
}) => {
  const [frontFile, setFrontFile] = useState<File | null>(propFrontFile || null);
  const [backFile, setBackFile] = useState<File | null>(propBackFile || null);
  const [frontUrl, setFrontUrl] = useState<string | null>(null);
  const [backUrl, setBackUrl] = useState<string | null>(null);

  useEffect(() => {
    setFrontFile(propFrontFile || null);
  }, [propFrontFile]);

  useEffect(() => {
    setBackFile(propBackFile || null);
  }, [propBackFile]);

  // preview URLs + cleanup
  useEffect(() => {
    if (!frontFile) {
      setFrontUrl(null);
      return;
    }
    const url = URL.createObjectURL(frontFile);
    setFrontUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [frontFile]);

  useEffect(() => {
    if (!backFile) {
      setBackUrl(null);
      return;
    }
    const url = URL.createObjectURL(backFile);
    setBackUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [backFile]);

  const boxBase =
    'rounded-xl border-2 border-dashed border-slate-200 bg-slate-50';
  const box = `${boxBase} ${variant === 'compact' ? 'p-2' : 'p-3'}`;
  const uploadBtn =
    `mt-1.5 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 ` +
    `${variant === 'compact' ? 'py-1 text-[12px]' : 'py-1.5 text-xs'} text-slate-700 hover:bg-slate-50`;
  const imgClass =
    `mt-2 w-full rounded-lg border border-slate-100 object-contain ` +
    `${variant === 'compact' ? 'max-h-28' : 'max-h-44'}`;

  return (
    <div className={className}>
      <div className="mb-2 flex items-center gap-2 text-slate-800">
        <IdCard className="h-5 w-5 text-sky-600" />
        <h6 className="text-xs font-semibold">Ảnh CCCD</h6>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {/* Front */}
        <div className={box}>
          <div className="mb-1 flex items-center gap-2 text-slate-700">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-semibold">Mặt trước</span>
          </div>

          <label className={uploadBtn}>
            <ImageIcon className="h-4 w-4" />
            <span>Tải ảnh</span>
            <input
              type="file"
              accept="image/png, image/jpeg"
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                setFrontFile(f);
                onFileSelected?.('front', f);
              }}
              className="hidden"
            />
          </label>

          {frontUrl && (
            <img
              src={frontUrl}
              alt="CCCD front preview"
              className={imgClass}
            />
          )}
        </div>

        {/* Back */}
        <div className={box}>
          <div className="mb-1 flex items-center gap-2 text-slate-700">
            <span className="inline-block h-2 w-2 rounded-full bg-rose-500" />
            <span className="text-xs font-semibold">Mặt sau</span>
          </div>

          <label className={uploadBtn}>
            <ImageIcon className="h-4 w-4" />
            <span>Tải ảnh</span>
            <input
              type="file"
              accept="image/png, image/jpeg"
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                setBackFile(f);
                onFileSelected?.('back', f);
              }}
              className="hidden"
            />
          </label>

          {backUrl && (
            <img
              src={backUrl}
              alt="CCCD back preview"
              className={imgClass}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CCCDUpload;
