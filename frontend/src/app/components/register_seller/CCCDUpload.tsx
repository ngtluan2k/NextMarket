import React, { useState, useEffect } from 'react';
import { IdCard, Image as ImageIcon } from 'lucide-react';

type Side = 'front' | 'back';

interface Props {
  onFileSelected?: (side: Side, file: File | null) => void;
  frontFile?: File | null;
  backFile?: File | null;
  className?: string;
}

export const CCCDUpload: React.FC<Props> = ({
  onFileSelected,
  frontFile: propFrontFile,
  backFile: propBackFile,
  className,
}) => {
  const [frontFile, setFrontFile] = useState<File | null>(propFrontFile || null);
  const [backFile, setBackFile] = useState<File | null>(propBackFile || null);

  useEffect(() => {
    setFrontFile(propFrontFile || null);
  }, [propFrontFile]);

  useEffect(() => {
    setBackFile(propBackFile || null);
  }, [propBackFile]);

  const box =
    'rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-3 hover:border-sky-300';
  const uploadBtn =
    'mt-1.5 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50';

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

          {frontFile && (
            <img
              src={URL.createObjectURL(frontFile)}
              alt="CCCD front preview"
              className="mt-2 max-h-44 w-full rounded-lg border border-slate-100 object-contain"
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

          {backFile && (
            <img
              src={URL.createObjectURL(backFile)}
              alt="CCCD back preview"
              className="mt-2 max-h-44 w-full rounded-lg border border-slate-100 object-contain"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CCCDUpload;
